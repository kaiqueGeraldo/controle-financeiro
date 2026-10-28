param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
public static class Cf034OwnedProcess {
  [StructLayout(LayoutKind.Sequential)] struct BasicLimits { public long A,B; public uint Flags; public UIntPtr Min,Max; public uint Active; public UIntPtr Affinity; public uint Priority,Scheduling; }
  [StructLayout(LayoutKind.Sequential)] struct IoCounters { public ulong A,B,C,D,E,F; }
  [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits { public BasicLimits Basic; public IoCounters Io; public UIntPtr Process,Job,PeakProcess,PeakJob; }
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int kind,ref ExtendedLimits info,uint length);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr OpenJobObject(uint access,bool inherit,string name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CloseHandle(IntPtr handle);
  [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool TerminateProcess(IntPtr process,uint code);
  public static bool OwnerAlive(int pid,string ticks) {
    try { using(var p=Process.GetProcessById(pid)) return p.StartTime.ToUniversalTime().Ticks.ToString()==ticks && !p.HasExited; }
    catch(ArgumentException){return false;}
  }
  public static void RequireClosed(int pid,string ticks,string name) {
    if(OwnerAlive(pid,ticks))throw new InvalidOperationException("Previous owner still alive: "+name);
    var clock=Stopwatch.StartNew();
    while(true) {
      var h=OpenJobObject(4,false,name);
      if(h==IntPtr.Zero){if(Marshal.GetLastWin32Error()==2)return;throw new InvalidOperationException("Cannot verify prior job: "+name);}
      CloseHandle(h); // Never keep the last handle alive or terminate another job.
      if(clock.ElapsedMilliseconds>=10000)throw new InvalidOperationException("Previous owned job not closed: "+name);
      System.Threading.Thread.Sleep(25);
    }
  }
  // Keep the only job handle in this supervisor. Children inherit job membership,
  // not this handle. Kernel closes it on normal/forced supervisor termination.
  static IntPtr job;
  static bool namedJob;
  static System.Threading.Mutex executionMutex;
  static void Finish(int code) {
    if(!namedJob){Environment.Exit(code);return;}
    // This disposable guardian has no durable state to finalize. Managed
    // shutdown stalls after completed drain in Windows PowerShell/.NET.
    // Terminate only ourselves, preserving the child's exit code. Kernel closes
    // our sole job handle; callers STILL require job disappearance separately.
    // Never close the job handle manually while the guardian is its member.
    if(!TerminateProcess(GetCurrentProcess(),unchecked((uint)code)))
      throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
  }
  static string Quote(string value) {
    var b=new StringBuilder("\""); int slashes=0;
    foreach(char c in value) { if(c=='\\'){slashes++;continue;} if(c=='\"'){b.Append('\\',slashes*2+1);b.Append(c);}else{b.Append('\\',slashes);b.Append(c);}slashes=0; }
    b.Append('\\',slashes*2);b.Append('"');return b.ToString();
  }
  public static void Run(string executable,string[] args,string cwd,string jobName,int ownerPid,string ownerTicks,string mutexName,Action beforeChild) {
    // PowerShell converts a null argument bound to string into String.Empty.
    // Preserve the original unnamed-job path used by shared CI callers.
    if(String.IsNullOrEmpty(jobName))jobName=null;
    namedJob=jobName!=null;
    job=CreateJobObject(IntPtr.Zero,jobName);
    int createError=Marshal.GetLastWin32Error();
    if(jobName!=null && createError==183){CloseHandle(job);job=IntPtr.Zero;throw new InvalidOperationException("Owned job name collision");}
    var limits=new ExtendedLimits();limits.Basic.Flags=0x2000; // KILL_ON_JOB_CLOSE
    if(job==IntPtr.Zero || !SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(typeof(ExtendedLimits))) || !AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle)) throw new InvalidOperationException("Cannot establish owned Windows job");
    if(jobName!=null) {
      // Job exists BEFORE any owner check. A guardian that boots after owner
      // death cannot launch work, even if a later run already saw job absence.
      if(!String.IsNullOrEmpty(mutexName)) {
        executionMutex=new System.Threading.Mutex(false,mutexName);
        bool acquired;try{acquired=executionMutex.WaitOne(0);}catch(System.Threading.AbandonedMutexException){acquired=true;}
        if(!acquired)throw new InvalidOperationException("Execution already supervised");
      }
      if(!OwnerAlive(ownerPid,ownerTicks))Finish(130);
      beforeChild();
      if(!OwnerAlive(ownerPid,ownerTicks))Finish(130);
    }
    var start=new ProcessStartInfo(executable);start.WorkingDirectory=cwd;start.UseShellExecute=false;start.CreateNoWindow=true;
    start.RedirectStandardInput=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
    var joined=new StringBuilder();foreach(string arg in args){if(joined.Length>0)joined.Append(' ');joined.Append(Quote(arg));}start.Arguments=joined.ToString();
    var process=new Process();process.StartInfo=start;
    var exited=new TaskCompletionSource<bool>();process.EnableRaisingEvents=true;process.Exited+=(s,e)=>exited.TrySetResult(true);
    // Cancellation/owner death closes the runner's private stdin pipe. No PID kill.
    // .NET Framework's synchronized Console reader may implement Async by
    // blocking the caller; run the private-pipe read on its own worker.
    var cancel=Task.Run(()=>Console.In.ReadToEnd());
    if(cancel.IsCompleted)Finish(130);
    if(!process.Start())throw new InvalidOperationException("Cannot start owned command");
    process.StandardInput.Close();
    var output=process.StandardOutput.BaseStream.CopyToAsync(Console.OpenStandardOutput());
    var error=process.StandardError.BaseStream.CopyToAsync(Console.OpenStandardError());
    if(Task.WaitAny(exited.Task,cancel)==1)Finish(130);
    process.WaitForExit();
    if(jobName!=null) {
      // A dead root cannot keep its descendants alive by inheriting stdout.
      // Quiescence is confirmed separately through disappearance of the job.
      if(Task.WaitAny(Task.WhenAll(output,error),cancel,Task.Delay(1000))==1)Finish(130);
      Finish(process.ExitCode);
    }
    if(Task.WaitAny(Task.WhenAll(output,error),cancel)==1)Environment.Exit(130);
    Environment.Exit(process.ExitCode);
  }
}
"@
$config = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Configuration)) | ConvertFrom-Json
if ($config.ownership) {
  $owned=$config.ownership
  $verify=[Action]{
    # Command guardians have their own job and exact owner, but share the
    # already-held execution lock. Future recovery checks both receipt kinds.
    $receipts=@();if($owned.kind -ne 'command'){$receipts=@(Get-ChildItem -LiteralPath $owned.registry | Where-Object {$_.Name -match '^(run|command)-.*\.json$'})}
    foreach($file in $receipts) {
      $envelope=Get-Content -Raw -LiteralPath $file.FullName | ConvertFrom-Json
      $bytes=[Convert]::FromBase64String($envelope.payload)
      $algorithm=[Security.Cryptography.SHA256]::Create()
      try{$digest=([BitConverter]::ToString($algorithm.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()}finally{$algorithm.Dispose()}
      if($envelope.version -ne 1 -or $digest -ne $envelope.sha256){throw 'Invalid owned execution checksum'}
      $prior=[Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
      if($prior.version -ne 1 -or $prior.root -ne $owned.root -or $prior.runId -notmatch '^[a-f0-9-]{36}$' -or $prior.jobName -ne ($owned.jobPrefix+$prior.runId) -or !$prior.owner.ticks) {throw 'Invalid owned execution record'}
      # Local job names are visible only inside one Windows session. Absence in
      # another session cannot certify the previous tree has stopped.
      if($null -eq $prior.owner.session -or [int]$prior.owner.session -ne [Diagnostics.Process]::GetCurrentProcess().SessionId){throw 'Previous Windows session ownership cannot be verified'}
      if($prior.runId -ne $owned.runId){[Cf034OwnedProcess]::RequireClosed([int]$prior.owner.pid,[string]$prior.owner.ticks,[string]$prior.jobName)}
    }
    # Diagnostic identity only; the immutable run record was committed before spawn.
    $guardian=[ordered]@{pid=$PID;ticks=([Diagnostics.Process]::GetCurrentProcess().StartTime.ToUniversalTime().Ticks.ToString());runId=$owned.runId;jobName=$owned.jobName}
    [IO.File]::WriteAllText((Join-Path $owned.registry ('guardian-'+$owned.runId+'.json')),($guardian | ConvertTo-Json -Compress))
  }
  [Cf034OwnedProcess]::Run($config.executable,[string[]]$config.args,$config.cwd,$owned.jobName,[int]$owned.owner.pid,[string]$owned.owner.ticks,$owned.mutexName,$verify)
} else {
  [Cf034OwnedProcess]::Run($config.executable,[string[]]$config.args,$config.cwd,$null,0,$null,$null,$null)
}

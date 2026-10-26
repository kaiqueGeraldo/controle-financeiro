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
  // Keep the only job handle in this supervisor. Children inherit job membership,
  // not this handle. Kernel closes it on normal/forced supervisor termination.
  static IntPtr job;
  static string Quote(string value) {
    var b=new StringBuilder("\""); int slashes=0;
    foreach(char c in value) { if(c=='\\'){slashes++;continue;} if(c=='\"'){b.Append('\\',slashes*2+1);b.Append(c);}else{b.Append('\\',slashes);b.Append(c);}slashes=0; }
    b.Append('\\',slashes*2);b.Append('"');return b.ToString();
  }
  public static void Run(string executable,string[] args,string cwd) {
    job=CreateJobObject(IntPtr.Zero,null);
    var limits=new ExtendedLimits();limits.Basic.Flags=0x2000; // KILL_ON_JOB_CLOSE
    if(job==IntPtr.Zero || !SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(typeof(ExtendedLimits))) || !AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle)) throw new InvalidOperationException("Cannot establish owned Windows job");
    var start=new ProcessStartInfo(executable);start.WorkingDirectory=cwd;start.UseShellExecute=false;start.CreateNoWindow=true;
    start.RedirectStandardInput=true;start.RedirectStandardOutput=true;start.RedirectStandardError=true;
    var joined=new StringBuilder();foreach(string arg in args){if(joined.Length>0)joined.Append(' ');joined.Append(Quote(arg));}start.Arguments=joined.ToString();
    var process=new Process();process.StartInfo=start;
    var exited=new TaskCompletionSource<bool>();process.EnableRaisingEvents=true;process.Exited+=(s,e)=>exited.TrySetResult(true);
    // Cancellation/owner death closes the runner's private stdin pipe. No PID kill.
    // .NET Framework's synchronized Console reader may implement Async by
    // blocking the caller; run the private-pipe read on its own worker.
    var cancel=Task.Run(()=>Console.In.ReadToEnd());
    if(cancel.IsCompleted)Environment.Exit(130);
    if(!process.Start())throw new InvalidOperationException("Cannot start owned command");
    process.StandardInput.Close();
    var output=process.StandardOutput.BaseStream.CopyToAsync(Console.OpenStandardOutput());
    var error=process.StandardError.BaseStream.CopyToAsync(Console.OpenStandardError());
    if(Task.WaitAny(exited.Task,cancel)==1)Environment.Exit(130);
    process.WaitForExit();
    if(Task.WaitAny(Task.WhenAll(output,error),cancel)==1)Environment.Exit(130);
    Environment.Exit(process.ExitCode);
  }
}
"@
$config = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Configuration)) | ConvertFrom-Json
[Cf034OwnedProcess]::Run($config.executable, [string[]]$config.args, $config.cwd)

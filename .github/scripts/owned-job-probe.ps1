param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @"
using System;using System.Diagnostics;using System.Runtime.InteropServices;
public static class CfOwnedJobProbe {
 [StructLayout(LayoutKind.Sequential)] struct Accounting {public long A,B,C,D;public uint Faults,Total,Active,Terminated;}
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr OpenJobObject(uint access,bool inherit,string name);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool QueryInformationJobObject(IntPtr job,int kind,out Accounting info,uint length,IntPtr returned);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool IsProcessInJob(IntPtr process,IntPtr job,out bool result);
 [DllImport("kernel32.dll",EntryPoint="QueryInformationJobObject",SetLastError=true)]static extern bool QueryIds(IntPtr job,int kind,IntPtr info,uint length,IntPtr returned);
 public static string[] Members(string name) {
  var h=OpenJobObject(4,false,name);if(h==IntPtr.Zero)throw new InvalidOperationException("Owned job disappeared");var b=Marshal.AllocHGlobal(8192);
  try {if(!QueryIds(h,3,b,8192,IntPtr.Zero))throw new InvalidOperationException("Cannot enumerate owned job");int count=Marshal.ReadInt32(b,4);var rows=new System.Collections.Generic.List<string>();for(int i=0;i<count;i++){int id=(int)Marshal.ReadIntPtr(b,8+i*IntPtr.Size);try{using(var p=Process.GetProcessById(id))rows.Add(id+":"+p.StartTime.ToUniversalTime().Ticks+":"+p.ProcessName);}catch(ArgumentException){}}return rows.ToArray();}
  finally{Marshal.FreeHGlobal(b);CloseHandle(h);}
 }
 public static string StartTicks(int pid){using(var p=Process.GetProcessById(pid))return p.StartTime.ToUniversalTime().Ticks.ToString();}
 public static int Active(string name,int workerPid) {
  var h=OpenJobObject(4,false,name);
  if(h==IntPtr.Zero){if(Marshal.GetLastWin32Error()==2)return -1;throw new InvalidOperationException("Cannot query owned job");}
  try {
   if(workerPid>0){using(var p=Process.GetProcessById(workerPid)){bool member;if(!IsProcessInJob(p.Handle,h,out member)||!member)throw new InvalidOperationException("Worker is not in the declared job");}}
   Accounting a;if(!QueryInformationJobObject(h,1,out a,(uint)Marshal.SizeOf(typeof(Accounting)),IntPtr.Zero))throw new InvalidOperationException("Job accounting unavailable");
   return (int)a.Active;
  }finally{CloseHandle(h);}
 }
}
"@
$config=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Configuration)) | ConvertFrom-Json
if($config.mode -eq 'identity') {
 [ordered]@{pid=[int]$config.pid;ticks=[CfOwnedJobProbe]::StartTicks([int]$config.pid)} | ConvertTo-Json -Compress
 exit 0
}
if($config.jobName -notmatch '^Local\\CF034-CP-[a-f0-9]{24}-[a-f0-9-]{36}$'){throw 'Invalid private job identity'}
$clock=[Diagnostics.Stopwatch]::StartNew()
while($true) {
 $active=[CfOwnedJobProbe]::Active($config.jobName, $(if($config.mode -in @('current','register')){[int]$config.workerPid}else{0}))
 $members=@();if($active -ge 0){$members=@([CfOwnedJobProbe]::Members($config.jobName))}
 if($config.mode -eq 'register') {
  if($active -lt 1){throw 'Initial job roster unavailable'}
  [ordered]@{jobName=$config.jobName;members=$members;worker=[ordered]@{pid=[int]$config.workerPid;ticks=[CfOwnedJobProbe]::StartTicks([int]$config.workerPid)};membershipVerified=$true} | ConvertTo-Json -Depth 5 -Compress
  exit 0
 }
 $extra=@($members | Where-Object {$_ -notin $config.baseline})
 if($config.mode -eq 'current' -and $active -ge 1 -and $extra.Count -eq 0){[ordered]@{jobName=$config.jobName;members=$members;membershipVerified=$true;noCommandDescendants=$true} | ConvertTo-Json -Depth 5 -Compress;exit 0}
 if($config.mode -eq 'closed' -and $active -eq -1){[ordered]@{jobName=$config.jobName;absent=$true} | ConvertTo-Json -Compress;exit 0}
 if($config.mode -eq 'current' -and $active -eq -1){throw 'Declared worker job is absent'}
 if($clock.ElapsedMilliseconds -ge 10000){throw "Owned execution not quiescent: $($config.jobName), active=$active, extra=$($extra -join ',')"}
 Start-Sleep -Milliseconds 25
}

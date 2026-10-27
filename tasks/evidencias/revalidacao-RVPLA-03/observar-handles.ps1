param([Parameter(Mandatory=$true)][string]$Configuration)
$ErrorActionPreference='Stop'
Add-Type @"
using System;using System.Runtime.InteropServices;
public static class ReviewJob {
 [StructLayout(LayoutKind.Sequential)]struct Accounting {public long A,B,C,D;public uint Faults,Total,Active,Terminated;}
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern IntPtr OpenJobObject(uint rights,bool inherit,string name);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool IsProcessInJob(IntPtr p,IntPtr job,out bool member);
 [DllImport("kernel32.dll")]public static extern bool CloseHandle(IntPtr p);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool QueryInformationJobObject(IntPtr job,int kind,out Accounting info,uint length,IntPtr returned);
 public static int Active(IntPtr job){Accounting a;if(!QueryInformationJobObject(job,1,out a,(uint)Marshal.SizeOf(typeof(Accounting)),IntPtr.Zero))throw new Exception("Retained handle query failed");return (int)a.Active;}
}
"@
$config=Get-Content -LiteralPath $Configuration -Raw | ConvertFrom-Json
$job=[IntPtr]::Zero;$processes=@();$rows=@()
try {
 if($config.jobName){$job=[ReviewJob]::OpenJobObject(4,$false,$config.jobName);if($job -eq [IntPtr]::Zero){throw 'Own job identity unavailable'}}
 foreach($item in $config.processes){
  $process=[Diagnostics.Process]::GetProcessById([int]$item.pid);$handle=$process.Handle
  if($process.StartTime.ToUniversalTime().Ticks.ToString() -ne $item.ticks){throw 'Birth identity mismatch before observation'}
  $member=$false;if($job -ne [IntPtr]::Zero){if(![ReviewJob]::IsProcessInJob($handle,$job,[ref]$member)){throw 'Membership query failed'};if($member -ne [bool]$item.member){throw 'Unexpected job membership'}}
  $processes+=,@{process=$process;label=$item.label;member=$member;owned=[bool]$item.member};$rows+=,@{pid=$item.pid;ticks=$item.ticks;label=$item.label;member=$member}
 }
 if(!$config.holdJob -and $job -ne [IntPtr]::Zero){[void][ReviewJob]::CloseHandle($job);$job=[IntPtr]::Zero}
 [Console]::Out.WriteLine((@{ready=$true;identities=$rows;jobHandleRetained=[bool]$config.holdJob}|ConvertTo-Json -Depth 5 -Compress));[Console]::Out.Flush()
 while($null -ne ($command=[Console]::In.ReadLine())){
  if($command -eq 'release'){if($job -ne [IntPtr]::Zero){[void][ReviewJob]::CloseHandle($job);$job=[IntPtr]::Zero};[Console]::Out.WriteLine('{"released":true}')}
  elseif($command -eq 'job'){if($job -eq [IntPtr]::Zero){throw 'No retained own job handle'};[Console]::Out.WriteLine((@{retained=$true;active=[ReviewJob]::Active($job)}|ConvertTo-Json -Compress))}
  elseif($command -eq 'state'){$states=@($processes|ForEach-Object{@{label=$_.label;signaled=$_.process.WaitForExit(0)}});[Console]::Out.WriteLine((@{states=$states}|ConvertTo-Json -Depth 5 -Compress))}
  elseif($command -eq 'wait'){$states=@($processes|ForEach-Object{@{label=$_.label;signaled=$_.process.WaitForExit($(if($_.owned){20000}else{0}))}});[Console]::Out.WriteLine((@{states=$states}|ConvertTo-Json -Depth 5 -Compress))}
  else{throw 'Unknown review command'}
  [Console]::Out.Flush()
 }
}finally{if($job -ne [IntPtr]::Zero){[void][ReviewJob]::CloseHandle($job)};foreach($item in $processes){$item.process.Dispose()}}

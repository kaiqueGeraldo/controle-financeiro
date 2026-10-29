param([Parameter(Mandatory=$true)][string]$Ready)
$ErrorActionPreference='Stop'
Add-Type @"
using System;using System.Runtime.InteropServices;
public static class ReviewPeek {
 [StructLayout(LayoutKind.Sequential)]struct Accounting {public long A,B,C,D;public uint Faults,Total,Active,Terminated;}
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr OpenJobObject(uint access,bool inherit,string name);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr h);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool QueryInformationJobObject(IntPtr job,int kind,out Accounting info,uint size,IntPtr returned);
 public static long[] Query(string name){var h=OpenJobObject(4,false,name);if(h==IntPtr.Zero){if(Marshal.GetLastWin32Error()==2)return new long[]{-1,-1};throw new Exception("Job query unavailable");}try{Accounting a;if(!QueryInformationJobObject(h,1,out a,(uint)Marshal.SizeOf(typeof(Accounting)),IntPtr.Zero))throw new Exception("Accounting unavailable");return new long[]{a.Total,a.Active};}finally{CloseHandle(h);}}
}
"@
[IO.File]::WriteAllText($Ready,'ready')
while($null -ne ($line=[Console]::In.ReadLine())){
 $config=$line|ConvertFrom-Json
 $jobs=@(foreach($name in $config.jobs){try{$value=[ReviewPeek]::Query($name);@{name=$name;absent=($value[1] -eq -1);total=$value[0];active=$value[1]}}catch{@{name=$name;unknown=$true;error='Job query unavailable'}}})
 $processes=@(foreach($identity in $config.processes){try{$p=[Diagnostics.Process]::GetProcessById([int]$identity.pid);$handle=$p.Handle;$same=$p.StartTime.ToUniversalTime().Ticks.ToString() -eq $identity.ticks;@{pid=$identity.pid;identityMatches=$same;signaled=$p.WaitForExit(0)};$p.Dispose()}catch{@{pid=$identity.pid;exitedOrUnqueryable=$true}}})
 [Console]::Out.WriteLine((@{at=[DateTimeOffset]::UtcNow.ToString('o');jobs=$jobs;processes=$processes;terminationIssued=$false}|ConvertTo-Json -Depth 6 -Compress));[Console]::Out.Flush()
}

param([Parameter(Mandatory=$true)][int]$OwnedPid,[Parameter(Mandatory=$true)][string]$ExpectedTicks)
$ErrorActionPreference='Stop'
Add-Type @"
using System;using System.Runtime.InteropServices;
public static class StopFixtureIdentity {
 [DllImport("kernel32.dll",SetLastError=true)]static extern IntPtr OpenProcess(uint access,bool inherit,int pid);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool GetProcessTimes(IntPtr h,out long c,out long e,out long k,out long u);
 [DllImport("kernel32.dll",SetLastError=true)]static extern bool TerminateProcess(IntPtr h,uint code);
 [DllImport("kernel32.dll")]static extern uint WaitForSingleObject(IntPtr h,uint ms);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr h);
 public static void Stop(int pid,string ticks){var h=OpenProcess(0x00101001,false,pid);if(h==IntPtr.Zero){if(Marshal.GetLastWin32Error()==87)return;throw new InvalidOperationException("Identity handle unavailable");}
 try{long c,e,k,u;if(!GetProcessTimes(h,out c,out e,out k,out u)||DateTime.FromFileTimeUtc(c).Ticks.ToString()!=ticks)throw new InvalidOperationException("Process birth identity mismatch; no termination");if(WaitForSingleObject(h,0)==0)return;if(!TerminateProcess(h,130)||WaitForSingleObject(h,5000)!=0)throw new InvalidOperationException("Owned fixture termination not confirmed");}finally{CloseHandle(h);}}
}
"@
[StopFixtureIdentity]::Stop($OwnedPid,$ExpectedTicks)

param([Parameter(Mandatory=$true)][string]$ConfigurationPath)
$ErrorActionPreference='Stop'
Add-Type @"
using System;using System.Diagnostics;using System.Runtime.InteropServices;
public static class Rvpla04Audit {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr OpenJobObject(uint access,bool inherit,string name);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr h);
 public static bool Absent(string name){var h=OpenJobObject(4,false,name);if(h!=IntPtr.Zero){CloseHandle(h);return false;}if(Marshal.GetLastWin32Error()==2)return true;throw new InvalidOperationException("Cannot inspect owned job");}
 public static bool OwnerAlive(int id,string ticks){try{using(var p=Process.GetProcessById(id))return p.StartTime.ToUniversalTime().Ticks.ToString()==ticks&&!p.HasExited;}catch(ArgumentException){return false;}}
}
"@
$records=Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
$session=[Diagnostics.Process]::GetCurrentProcess().SessionId
$rows=@(foreach($record in $records){
 if($record.jobName -notmatch '^Local\\CF034-CP-[a-f0-9]{24}-[a-f0-9-]{36}$'){throw 'Invalid private job identity'}
 $ownerAlive=[Rvpla04Audit]::OwnerAlive([int]$record.owner.pid,[string]$record.owner.ticks)
 if($ownerAlive){throw "Recorded owner still alive: $($record.jobName)"}
 if($null -eq $record.owner.session -or [int]$record.owner.session -ne $session){[ordered]@{jobName=$record.jobName;absenceCertified=$false;sessionUnknownOrDifferent=$true;ownerAlive=$false};continue}
 if(![Rvpla04Audit]::Absent($record.jobName)){throw "Owned job still present: $($record.jobName)"}
 [ordered]@{jobName=$record.jobName;absenceCertified=$true;ownerAlive=$false;kind=$record.kind}
})
[ordered]@{session=$session;jobs=$rows;terminationIssued=$false} | ConvertTo-Json -Depth 5 -Compress

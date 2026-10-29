param([Parameter(Mandatory=$true)][string]$ConfigurationPath)
$ErrorActionPreference='Stop'
Add-Type @"
using System;using System.Runtime.InteropServices;
public static class AuditOwnedJob {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern IntPtr OpenJobObject(uint access,bool inherit,string name);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr h);
 public static bool Absent(string name){var h=OpenJobObject(4,false,name);if(h!=IntPtr.Zero){CloseHandle(h);return false;}if(Marshal.GetLastWin32Error()==2)return true;throw new InvalidOperationException("Cannot inspect owned job");}
}
"@
$records=Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
$session=[Diagnostics.Process]::GetCurrentProcess().SessionId
$rows=@(foreach($record in $records){
 if($record.jobName -notmatch '^Local\\CF034-CP-[a-f0-9]{24}-[a-f0-9-]{36}$'){throw 'Invalid private job identity'}
 if($null -ne $record.owner.session -and [int]$record.owner.session -ne $session){[ordered]@{jobName=$record.jobName;differentSession=$true;absenceCertified=$false};continue}
 $absent=[AuditOwnedJob]::Absent($record.jobName)
 if(!$absent){throw "Owned job still present: $($record.jobName)"}
 [ordered]@{jobName=$record.jobName;absentInCurrentSession=$true;absenceCertified=($null -ne $record.owner.session);legacySessionUnknown=($null -eq $record.owner.session)}
})
[ordered]@{session=$session;jobs=$rows;terminationIssued=$false} | ConvertTo-Json -Depth 5 -Compress

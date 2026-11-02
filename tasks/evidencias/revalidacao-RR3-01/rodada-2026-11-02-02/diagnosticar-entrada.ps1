param([Parameter(Mandatory=$true)][string]$Runtime)
$ErrorActionPreference='Stop'
$owner=Join-Path $Runtime 'candidate-live/browsers/IndependentRR3LiveProbe'
$trace=Join-Path $owner 'artifacts/independent-rr3-live.probe-86c74-t-reject-invisible-painting-review-sao-paulo/trace.zip'
$archive=[System.IO.Compression.ZipFile]::OpenRead($trace)
$rows=@()
try{
 foreach($entry in $archive.Entries | Where-Object FullName -match '\.network$'){
  $reader=[IO.StreamReader]::new($entry.Open())
  try{$lines=$reader.ReadToEnd() -split "`n"}finally{$reader.Dispose()}
  foreach($line in $lines){
   if(-not $line.Trim()){continue}
   $s=($line | ConvertFrom-Json).snapshot
   if($s.request.url -match '/api/|/auth|127.0.0.1:3107/$'){
    $headers=@($s.response.headers | Where-Object name -match '^(location|x-action-redirect|x-nextjs-redirect)$' | Select-Object name,value)
    $rows+=[ordered]@{method=$s.request.method;path=([Uri]$s.request.url).AbsolutePath;status=$s.response.status;time=$s.time;started=$s.startedDateTime;failed=$s._failureText;navigationHeaders=$headers}
   }
  }
 }
}finally{$archive.Dispose()}
$result=[ordered]@{at=(Get-Date).ToUniversalTime().ToString('o');traceSha256=(Get-FileHash -LiteralPath $trace -Algorithm SHA256).Hash.ToLower();helperObservationsCreated=(Test-Path -LiteralPath (Join-Path $owner 'live-geometry.json'));failure='registerSyntheticUser: toHaveURL(//$/) remained /auth?modo=cadastro at 15000ms';scope='precondition before first textGeometry call; not evidence of painting failure';network=$rows;noRetryOrTimeoutChange=$true;rootCause='not established by this limited trace examination'}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $Runtime 'auth-entry.json') -Encoding utf8
$result | ConvertTo-Json -Depth 8 -Compress

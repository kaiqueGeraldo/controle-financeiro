param([Parameter(Mandatory=$true)][string]$TracePath,[Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $TracePath))
try {
    $records=@()
    foreach($entry in $zip.Entries | Where-Object FullName -Like '*.network') {
        $reader=[IO.StreamReader]::new($entry.Open())
        try {
            foreach($line in $reader.ReadToEnd().Split("`n")) {
                if(!$line.Trim()){continue}
                $record=$line | ConvertFrom-Json
                if($record.type -eq 'resource-snapshot'){$records+=$record.snapshot}
            }
        } finally {$reader.Dispose()}
    }
    $login=$records | Where-Object {([Uri]$_.request.url).AbsolutePath -eq '/api/auth/login'} | Select-Object -First 1
    if(!$login.response.content._file){throw 'Login response body not captured; do not infer expiration'}
    $reader=[IO.StreamReader]::new($zip.GetEntry($login.response.content._file).Open())
    try {
        $body=$reader.ReadToEnd() | ConvertFrom-Json
        $encoded=$body.token.Split('.')[1].Replace('-','+').Replace('_','/')
        while($encoded.Length%4){$encoded+='='}
        $claims=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded)) | ConvertFrom-Json
        $expiry=[DateTimeOffset]::FromUnixTimeSeconds($claims.exp).ToString('o')
    } finally {$reader.Dispose()}
    $timeline=@($records | Where-Object {([Uri]$_.request.url).AbsolutePath -in @('/','/auth','/api/auth/register','/api/auth/login','/api/auth/user')} | ForEach-Object {
        [ordered]@{path=([Uri]$_.request.url).AbsolutePath;method=$_.request.method;status=$_.response.status;started=$_.startedDateTime;dateHeader=($_.response.headers|Where-Object name -IEQ 'date'|Select-Object -ExpandProperty value);location=($_.response.headers|Where-Object name -IEQ 'location'|Select-Object -ExpandProperty value);cookies=@($_.response.cookies|Select-Object name,expires,httpOnly,secure,sameSite)}
    })
    $result=[ordered]@{traceSha256=(Get-FileHash -LiteralPath $TracePath -Algorithm SHA256).Hash.ToLower();tokenExpiryUtc=$expiry;timeline=$timeline;limit='Derived metadata only; token, credentials and response body remain private'}
    if(Test-Path -LiteralPath $OutputPath){throw 'Never overwrite derived evidence'}
    $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding utf8
} finally {$zip.Dispose()}

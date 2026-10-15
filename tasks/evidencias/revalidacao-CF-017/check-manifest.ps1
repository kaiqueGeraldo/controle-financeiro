param([string]$Root = '.')
$ErrorActionPreference='Stop'
$v1=Get-Content "$Root/controle-financeiro-backend/src/main/resources/db/migration/V1__baseline_pre_temporal.sql"
$manifest=Get-Content "$Root/controle-financeiro-backend/src/main/resources/db/verification/legacy-v1.inventory"
$columns=@{}; $constraints=@(); $indexes=@(); $tables=@(); $table=$null
foreach($line in $v1) {
 if($line -match '^CREATE TABLE (\w+) \(') {$table=$Matches[1]; $tables+= $table; continue}
 if($line -match '^\);') {$table=$null; continue}
 if($line -match '^CREATE INDEX \w+ ON (\w+) (.*);$') {$indexes+=($Matches[1]+' '+$Matches[2]);continue}
 if(!$table -or $line -notmatch '^    (.*?)[,]?$') {continue}
 $definition=$Matches[1].TrimEnd(',')
 if($definition -match '^CONSTRAINT \w+ (.*)$') {$constraints+=($table+' '+$Matches[1]);continue}
 if($definition -notmatch '^(\w+) (.*)$') {throw "Unknown DDL: $definition"}
 $name=$Matches[1]; $rest=$Matches[2]; $notnull=$rest.Contains(' NOT NULL'); $default=$null
 if($rest -match ' DEFAULT (.*)$') {$default=$Matches[1]}
 $type=($rest -replace ' NOT NULL','' -replace ' DEFAULT .*','' -replace '^varchar','character varying')
 $columns["$table.$name"]=@($type,$notnull,$default)
}
$seen=0
foreach($line in $manifest) {
 $parts=$line -split "`t",3
 if($parts[0] -ne 'column') {continue}
 $seen++; $expected=$columns[$parts[1]]; $actual=ConvertFrom-Json $parts[2]
 if(!$expected -or $expected[0] -cne $actual[0] -or $expected[1] -ne $actual[1] -or $expected[2] -cne $actual[2]) {throw "Column mismatch: $line"}
}
if($seen -ne $columns.Count -or $seen -ne 158) {throw 'Missing columns'}
$actualConstraints=@($manifest | Where-Object {$_ -like "constraint`t*"} | ForEach-Object {$p=$_ -split "`t",3; $d=ConvertFrom-Json $p[2];$p[1]+' '+$d[1]})
# PostgreSQL removes spaces after commas within constraint column lists.
$expectedConstraints=@($constraints | ForEach-Object {$_ -replace ', ',',' -replace 'REFERENCES (\w+) \(', 'REFERENCES $1('})
$actualConstraints=@($actualConstraints | ForEach-Object {$_ -replace ', ',','})
if(Compare-Object ($expectedConstraints|Sort-Object) ($actualConstraints|Sort-Object)) {throw 'Constraints mismatch'}
$actualTables=@($manifest | Where-Object {$_ -like "relation`t*"} | ForEach-Object {($_ -split "`t")[1]})
if(Compare-Object ($tables|Sort-Object) ($actualTables|Sort-Object)) {throw 'Tables mismatch'}
$actualIndexes=@($manifest | Where-Object {$_ -like "plain-index`t*"} | ForEach-Object {$p=$_ -split "`t",3;$d=ConvertFrom-Json $p[2];$p[1]+($d[0] -replace '^ USING btree','')})
if(Compare-Object ($indexes|Sort-Object) ($actualIndexes|Sort-Object)) {throw 'Indexes mismatch'}
"PASS direct V1 DDL -> manifest: $($tables.Count) tables, $seen columns (type/null/default), $($constraints.Count) constraints, $($indexes.Count) explicit indexes"

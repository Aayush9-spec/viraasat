$ErrorActionPreference = 'Stop'
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 17 or later is required.' }
$signingKeystore = (Read-Host 'Full path to your private keystore').Trim('"')
if (-not (Test-Path -LiteralPath $signingKeystore -PathType Leaf)) { throw 'Keystore file not found.' }
$signingAlias = Read-Host 'Key alias (leave blank if the keystore has only one key)'
$signingOutput = Join-Path $PSScriptRoot 'viraasat-signed.apk'
$signingTool = Join-Path $PSScriptRoot 'apksigner.jar'
$signingArguments = @('-jar', $signingTool, 'sign', '--ks', $signingKeystore,
  '--v1-signing-enabled', 'false', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true',
  '--out', $signingOutput)
if ($signingAlias) { $signingArguments += @('--ks-key-alias', $signingAlias) }
$signingArguments += (Join-Path $PSScriptRoot 'viraasat-unsigned.apk')
Write-Host 'Enter your passwords only at the Java signing prompts. They stay on this computer.'
& java @signingArguments
if ($LASTEXITCODE -ne 0) { throw 'Signing failed; no release was published.' }
& java -jar $signingTool verify --verbose --print-certs $signingOutput
if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed.' }
Write-Host 'Return only viraasat-signed.apk for verification and publication. Keep your keystore and passwords private.'

$ErrorActionPreference = 'Stop'
$launchPath = Join-Path $PSScriptRoot 'launch-japan-market.ps1'
if (-not (Test-Path -LiteralPath $launchPath)) { throw 'Launcher script is missing.' }
$protocolKey = 'HKCU:\Software\Classes\innogroup-collector'
New-Item -Path $protocolKey -Force | Out-Null
Set-Item -LiteralPath $protocolKey -Value 'URL:InnoGroup Collector'
New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
New-Item -Path "$protocolKey\shell\open\command" -Force | Out-Null
# No URL argument is passed to the shell. This protocol can only launch this fixed program.
$command = 'powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $launchPath + '"'
Set-Item -LiteralPath "$protocolKey\shell\open\command" -Value $command
Write-Host 'Installed. Use the launch button in Admin. Keep this program folder in its current location.'

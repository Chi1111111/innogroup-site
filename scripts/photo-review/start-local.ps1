# Starts one hidden local processor. The Python OS lock prevents duplicate workers.
$ErrorActionPreference = 'Stop'
$photoWorkspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$photoConfig = Join-Path $photoWorkspace 'private-config/japan-photo-review.json'
if (-not (Test-Path -LiteralPath $photoConfig)) { throw 'Photo configuration is missing. Configure private-config/japan-photo-review.json first.' }
$photoPython = (Get-Command python -ErrorAction Stop).Source
$photoWorker = Join-Path $PSScriptRoot 'cloud_worker.py'
$photoLogs = Join-Path $photoWorkspace 'private-config'
$photoLogId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$photoArguments = '"{0}" work --config "{1}" --limit 0 --max-seconds 0 --interval 1.5 --daemon' -f $photoWorker, $photoConfig
$photoProcess = Start-Process -FilePath $photoPython -ArgumentList $photoArguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $photoLogs "photo-local-$photoLogId.log") -RedirectStandardError (Join-Path $photoLogs "photo-local-$photoLogId.error.log") -PassThru
Write-Output "Local photo worker launched (PID $($photoProcess.Id)). Use Admin / Photos to pause or allow processing."

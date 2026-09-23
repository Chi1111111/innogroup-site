# The task must remain running for the lifetime of Python so Task Scheduler
# can detect exits. Logs contain diagnostics only, never downloaded photos.
param([Parameter(Mandatory=$true)][string]$PythonPath)
$ErrorActionPreference = 'Stop'
$photoWorkspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$photoLogs = Join-Path $photoWorkspace 'private-config'
$photoConfig = Join-Path $photoLogs 'japan-photo-review.json'
$photoLogId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
try {
    if (-not (Test-Path -LiteralPath $photoConfig)) { throw 'Photo configuration missing.' }
    $photoWorker = Join-Path $PSScriptRoot 'cloud_worker.py'
    # A scheduler host can exit while Python remains alive. Adopt that worker
    # instead of repeatedly starting a second process that fails the OS lock.
    $photoExisting = @(Get-CimInstance Win32_Process -Filter "name = 'python.exe'" | Where-Object {
        $_.CommandLine -and $_.CommandLine.Contains($photoWorker) -and $_.CommandLine -match '\swork\s'
    })
    if ($photoExisting.Count -gt 0) {
        foreach ($photoExistingWorker in $photoExisting) {
            Wait-Process -Id $photoExistingWorker.ProcessId -ErrorAction SilentlyContinue
        }
        exit 1
    }
    $photoArguments = '-u "{0}" work --config "{1}" --limit 0 --max-seconds 0 --interval 1.5 --daemon' -f $photoWorker, $photoConfig
    $photoProcess = Start-Process -FilePath $PythonPath -ArgumentList $photoArguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $photoLogs "photo-local-$photoLogId.log") -RedirectStandardError (Join-Path $photoLogs "photo-local-$photoLogId.error.log") -PassThru -Wait
    Add-Content -LiteralPath (Join-Path $photoLogs 'photo-task.log') -Value "$(Get-Date -Format o) Worker exited: $($photoProcess.ExitCode). Task Scheduler will restart it."
} catch {
    Add-Content -LiteralPath (Join-Path $photoLogs 'photo-task.log') -Value "$(Get-Date -Format o) Launcher failed: $($_.Exception.Message)"
}
# A daemon exiting, even cleanly, must be restarted. Admin pause keeps it alive.
exit 1

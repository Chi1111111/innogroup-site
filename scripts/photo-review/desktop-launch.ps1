# Desktop entry point. Existing workers are reused; the Python lock is the final guard.
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
try {
    $photoWorkerPath = Join-Path $PSScriptRoot 'cloud_worker.py'
    $photoRunning = @(Get-CimInstance Win32_Process -Filter "name = 'python.exe'" | Where-Object {
        $_.CommandLine -and $_.CommandLine.Contains($photoWorkerPath) -and $_.CommandLine -match '\swork\s'
    })
    if ($photoRunning.Count -eq 0) {
        & (Join-Path $PSScriptRoot 'start-local.ps1')
    } else {
        Write-Output "Photo processing is already running (PID $($photoRunning[0].ProcessId))."
    }
    if (-not $NoBrowser) {
        # Open the interactive progress/review page requested by the user.
        Start-Process 'https://www.innogroup.co.nz/admin/photos'
    }
} catch {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("Unable to start photo processing: $($_.Exception.Message)", 'INNO Photo Processing') | Out-Null
    exit 1
}

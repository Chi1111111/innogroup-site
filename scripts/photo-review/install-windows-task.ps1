$ErrorActionPreference = 'Stop'
$photoTaskName = 'INNO Photo Worker'
$photoPython = (Get-Command python -ErrorAction Stop).Source
$photoUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$photoRunner = Join-Path $PSScriptRoot 'windows-task-run.ps1'
$photoShell = Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
$photoAction = New-ScheduledTaskAction -Execute $photoShell -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -PythonPath "{1}"' -f $photoRunner, $photoPython) -WorkingDirectory $PSScriptRoot
$photoLogon = New-ScheduledTaskTrigger -AtLogOn -User $photoUser
# Also recover if the task exhausts failure retries or was stopped externally.
# IgnoreNew prevents recurring triggers from interrupting a healthy worker.
$photoRecovery = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$photoSettings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$photoPrincipal = New-ScheduledTaskPrincipal -UserId $photoUser -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $photoTaskName -Action $photoAction -Trigger @($photoLogon,$photoRecovery) -Settings $photoSettings -Principal $photoPrincipal -Description 'INNO photo processing. Login startup, failure restart, no browser or Codex required. Pause processing from Admin Photos; disable this task to uninstall unattended startup.' -Force | Out-Null
Start-ScheduledTask -TaskName $photoTaskName
Write-Output 'Installed and started INNO Photo Worker. Login is required; browser and Codex are not.'

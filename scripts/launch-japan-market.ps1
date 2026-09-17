$ErrorActionPreference = 'Stop'
$probe = New-Object System.Net.Sockets.TcpClient
try {
  $connect = $probe.ConnectAsync('127.0.0.1',17831)
  if ($connect.Wait(600) -and $probe.Connected) { exit 0 }
} catch { } finally { $probe.Dispose() }
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$servicePath = Join-Path $PSScriptRoot 'japan-market-local-service.mjs'
# Visible console is intentional: the user needs the pairing code and collector logs.
Start-Process -FilePath $nodePath -ArgumentList ('"' + $servicePath + '"') -WorkingDirectory (Split-Path $PSScriptRoot -Parent)

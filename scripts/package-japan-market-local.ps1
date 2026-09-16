$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$stagePath = Join-Path $repoRoot 'tmp/local-runner-package'
$files = @('scripts/japan-market-local-service.mjs', 'scripts/sync-japancars-japan-market.mjs', 'scripts/lib/japancars.mjs', 'scripts/lib/japan-market-cloud.mjs', 'scripts/lib/japan-market-resume.mjs', 'scripts/lib/japan-market-changes.mjs', 'scripts/lib/japan-market-seen.mjs', 'scripts/lib/japan-market-recovery.mjs', 'scripts/lib/japan-market-rotation.mjs', 'src/data/japanMarketQuality.mjs')
foreach ($file in $files) {
  $destination = Join-Path $stagePath $file
  New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
  Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination $destination
}
'{"name":"inno-local-collector","private":true,"type":"module","engines":{"node":">=24"},"scripts":{"start":"node scripts/japan-market-local-service.mjs","check":"node scripts/sync-japancars-japan-market.mjs --remote --check"},"dependencies":{"cheerio":"1.2.0"}}' | Set-Content -Encoding ascii (Join-Path $stagePath 'package.json')
Copy-Item -LiteralPath (Join-Path $repoRoot 'docs/local-japan-market.md') -Destination (Join-Path $stagePath 'README.md')
"@echo off`r`ncd /d `"%~dp0`"`r`ncall npm start`r`npause" | Set-Content -Encoding ascii (Join-Path $stagePath 'Start.cmd')
$downloads = Join-Path $repoRoot 'public/downloads'
New-Item -ItemType Directory -Force -Path $downloads | Out-Null
Compress-Archive -Path (Join-Path $stagePath '*') -DestinationPath (Join-Path $downloads 'japan-market-local.zip') -Force

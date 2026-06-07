param(
  [int]$CheckSeconds = 30
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$Recover = Join-Path $PSScriptRoot "recover-preview.ps1"
$StateFile = Join-Path $Root "preview-url.txt"

while ($true) {
  $needsRecovery = $false
  try {
    Invoke-WebRequest -Uri "http://127.0.0.1:3000/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
    $url = if (Test-Path $StateFile) { Get-Content $StateFile -Raw } else { "" }
    if ($url.Trim()) {
      Invoke-WebRequest -Uri "$($url.Trim())/health" -UseBasicParsing -TimeoutSec 10 | Out-Null
    } else {
      $needsRecovery = $true
    }
  } catch {
    $needsRecovery = $true
  }

  if ($needsRecovery) {
    $output = & $Recover -SkipBuild 2>&1
    $output | Out-File -FilePath (Join-Path $Root "preview-watch.log") -Append
    $publicLine = $output | Where-Object { $_ -match "^Public:\s+" } | Select-Object -Last 1
    if ($publicLine) {
      ($publicLine -replace "^Public:\s+", "").Trim() | Set-Content $StateFile
    }
  }

  Start-Sleep -Seconds $CheckSeconds
}

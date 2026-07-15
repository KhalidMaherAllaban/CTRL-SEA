$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$State = Join-Path $Root ".runtime\local-processes.json"

if (-not (Test-Path -LiteralPath $State)) {
    Write-Host "CTRL SEA is not running (no local process state found)."
    exit 0
}

$processes = Get-Content -LiteralPath $State -Raw | ConvertFrom-Json
$ids = @(
    $processes.frontendPid,
    $processes.frontendLauncherPid,
    $processes.backendPid,
    $processes.backendLauncherPid
) | Where-Object { $_ } | Select-Object -Unique

foreach ($processId in $ids) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $State -Force
Write-Host "CTRL SEA local services stopped."

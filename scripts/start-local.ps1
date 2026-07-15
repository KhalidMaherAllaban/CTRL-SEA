param(
    [int]$FrontendPort = 3000,
    [int]$BackendPort = 8000,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "ctrl-sea-frontend"
$Backend = Join-Path $Root "ctrl-sea-backend"
$Runtime = Join-Path $Root ".runtime"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$Next = Join-Path $Frontend "node_modules\next\dist\bin\next"

function Assert-File([string]$Path, [string]$Hint) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "$Path is missing. $Hint" }
}

function Get-Listener([int]$Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Get-AvailablePort([int]$PreferredPort) {
    for ($port = $PreferredPort; $port -lt ($PreferredPort + 100); $port++) {
        if (-not (Get-Listener $port)) { return $port }
    }
    throw "No free TCP port found between $PreferredPort and $($PreferredPort + 99)."
}

function Wait-Healthy([string]$Url, [string]$ExpectedStatus, [int]$Seconds = 120) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        try {
            $response = Invoke-RestMethod $Url -TimeoutSec 4
            if ($response.status -eq $ExpectedStatus) { return }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)
    throw "Service did not report '$ExpectedStatus' at $Url within $Seconds seconds."
}

function Write-StartupFailure([System.Management.Automation.ErrorRecord]$Failure) {
    $message = "[$(Get-Date -Format o)] STARTUP FAILED: $($Failure.Exception.Message)"
    $message | Add-Content -LiteralPath (Join-Path $Runtime "startup-failures.log")
    Write-Host $message -ForegroundColor Red
    foreach ($logName in @("backend.err.log", "backend.log", "frontend.err.log", "frontend.log")) {
        $path = Join-Path $Runtime $logName
        if (Test-Path -LiteralPath $path) {
            Write-Host "`n--- Last lines from $logName ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $path -Tail 30
        }
    }
}

New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
$backendProcess = $null
$frontendProcess = $null

try {
    Assert-File (Join-Path $Frontend ".env.local") "Copy .env.example to .env.local."
    Assert-File (Join-Path $Backend ".env") "Copy .env.example to .env."
    Assert-File $Python "Create the virtual environment and install requirements."
    Assert-File $Next "Run npm install in ctrl-sea-frontend."
    $Node = (Get-Command node.exe -ErrorAction Stop).Source

    $selectedBackendPort = Get-AvailablePort $BackendPort
    $selectedFrontendPort = Get-AvailablePort $FrontendPort
    if ($selectedBackendPort -ne $BackendPort) {
        $owner = (Get-Listener $BackendPort).OwningProcess
        Write-Host "Port $BackendPort is occupied by PID $owner; backend will use $selectedBackendPort." -ForegroundColor Yellow
    }
    if ($selectedFrontendPort -ne $FrontendPort) {
        $owner = (Get-Listener $FrontendPort).OwningProcess
        Write-Host "Port $FrontendPort is occupied by PID $owner; frontend will use $selectedFrontendPort." -ForegroundColor Yellow
    }

    $env:BACKEND_API_URL = "http://127.0.0.1:$selectedBackendPort/api"
    $env:NEXT_PUBLIC_API_URL = "/api"
    "BACKEND_API_URL=$env:BACKEND_API_URL`nNEXT_PUBLIC_API_URL=/api" |
        Set-Content -LiteralPath (Join-Path $Runtime "frontend-runtime.env")

    $buildUrlState = Join-Path $Runtime "frontend-build-backend-url.txt"
    $recordedBuildUrl = if (Test-Path -LiteralPath $buildUrlState) { (Get-Content -LiteralPath $buildUrlState -Raw).Trim() } else { "" }
    $mustBuild = (-not $SkipBuild) -or ($recordedBuildUrl -ne $env:BACKEND_API_URL)
    if ($SkipBuild -and $mustBuild) {
        Write-Host "The frontend proxy target changed; rebuilding to prevent a stale backend port." -ForegroundColor Yellow
    }
    if ($mustBuild) {
        Push-Location $Frontend
        try {
            & npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw "Next.js build failed with exit code $LASTEXITCODE." }
            $env:BACKEND_API_URL | Set-Content -LiteralPath $buildUrlState
        } finally {
            Pop-Location
        }
    }

    $backendOut = Join-Path $Runtime "backend.log"
    $backendErr = Join-Path $Runtime "backend.err.log"
    $frontendOut = Join-Path $Runtime "frontend.log"
    $frontendErr = Join-Path $Runtime "frontend.err.log"
    Remove-Item $backendOut, $backendErr, $frontendOut, $frontendErr -ErrorAction SilentlyContinue

    $backendProcess = Start-Process -FilePath $Python `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", $selectedBackendPort) `
        -WorkingDirectory $Backend -WindowStyle Hidden -RedirectStandardOutput $backendOut `
        -RedirectStandardError $backendErr -PassThru

    Wait-Healthy "http://127.0.0.1:$selectedBackendPort/health" "healthy"

    $quotedNext = '"' + $Next + '"'
    $frontendProcess = Start-Process -FilePath $Node `
        -ArgumentList @($quotedNext, "start", "--hostname", "127.0.0.1", "--port", $selectedFrontendPort) `
        -WorkingDirectory $Frontend -WindowStyle Hidden -RedirectStandardOutput $frontendOut `
        -RedirectStandardError $frontendErr -PassThru

    Wait-Healthy "http://127.0.0.1:$selectedFrontendPort/health" "ok"

    $backendListener = Get-Listener $selectedBackendPort
    $frontendListener = Get-Listener $selectedFrontendPort
    @{
        backendPid = $backendListener.OwningProcess
        frontendPid = $frontendListener.OwningProcess
        backendLauncherPid = $backendProcess.Id
        frontendLauncherPid = $frontendProcess.Id
        backendPort = $selectedBackendPort
        frontendPort = $selectedFrontendPort
        backendApiUrl = $env:BACKEND_API_URL
        startedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Runtime "local-processes.json")

    Write-Host "`nCTRL SEA is healthy and running." -ForegroundColor Green
    Write-Host "Frontend: http://127.0.0.1:$selectedFrontendPort"
    Write-Host "Backend:  http://127.0.0.1:$selectedBackendPort"
    Write-Host "Logs:     $Runtime"
} catch {
    if ($frontendProcess) { Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
    Write-StartupFailure $_
    exit 1
}

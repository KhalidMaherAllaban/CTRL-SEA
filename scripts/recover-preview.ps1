param(
  [int]$FrontendPort = 3000,
  [int]$BackendPort = 8000,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "ctrl-sea-frontend"
$Backend = Join-Path $Root "ctrl-sea-backend"
$Cloudflared = Join-Path $Root ".tools\cloudflared.exe"
$FrontendLog = Join-Path $Frontend "public-start.log"
$FrontendErr = Join-Path $Frontend "public-start.err.log"
$BackendLog = Join-Path $Backend "api.log"
$BackendErr = Join-Path $Backend "api.err.log"
$TunnelLog = Join-Path $Root "frontend-tunnel-current.log"
$TunnelErr = Join-Path $Root "frontend-tunnel-current.err.log"
$NextCli = Join-Path $Frontend "node_modules\.bin\next.cmd"

function Stop-Port([int]$Port) {
  Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -ne 0 } |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Wait-Http([string]$Url, [int]$TimeoutSeconds = 45) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $response
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for $Url"
}

function Wait-PublicTunnelHttp([string]$Url, [int]$TimeoutSeconds = 150) {
  $uri = [Uri]$Url
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $ip = Resolve-DnsName $uri.Host -Server 1.1.1.1 -Type A -ErrorAction Stop |
        Where-Object { $_.IPAddress } |
        Select-Object -First 1 -ExpandProperty IPAddress
      if ($ip) {
        $status = curl.exe --resolve "$($uri.Host):443:$ip" -s -o NUL -w "%{http_code}" $Url
        if ($status -match '^\d{3}$' -and [int]$status -ge 200 -and [int]$status -lt 500) {
          return
        }
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for public tunnel URL $Url"
}

function Start-PreviewProcess(
  [string]$FilePath,
  [string[]]$ArgumentList,
  [string]$WorkingDirectory,
  [string]$StdOutPath,
  [string]$StdErrPath
) {
  function ConvertTo-ProcessArgument([string]$Value) {
    if ($Value -notmatch '[\s"]') {
      return $Value
    }
    return '"' + ($Value -replace '\\(?=\\*")', '$0$0' -replace '"', '\"') + '"'
  }

  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $FilePath
  $startInfo.Arguments = (($ArgumentList | ForEach-Object { ConvertTo-ProcessArgument ([string]$_) }) -join " ")
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($key in @($startInfo.EnvironmentVariables.Keys)) {
    if (-not $seen.Add($key)) {
      $startInfo.EnvironmentVariables.Remove($key)
    }
  }

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $process.StandardOutput.BaseStream.CopyToAsync(([System.IO.File]::Open($StdOutPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite))) | Out-Null
  $process.StandardError.BaseStream.CopyToAsync(([System.IO.File]::Open($StdErrPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite))) | Out-Null
  return $process
}

New-Item -ItemType Directory -Force -Path (Join-Path $Root ".tools") | Out-Null
if (-not (Test-Path $Cloudflared)) {
  Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $Cloudflared
}

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Stop-Port $FrontendPort
Stop-Port $BackendPort
Start-Sleep -Seconds 2

if (-not $SkipBuild) {
  Push-Location $Frontend
  npm run build
  Pop-Location
}

Start-PreviewProcess `
  -FilePath (Join-Path $Backend ".venv\Scripts\python.exe") `
  -ArgumentList @("-m","uvicorn","app.main:app","--host","127.0.0.1","--port",$BackendPort) `
  -WorkingDirectory $Backend `
  -StdOutPath $BackendLog `
  -StdErrPath $BackendErr | Out-Null

Wait-Http "http://127.0.0.1:$BackendPort/health" | Out-Null

Start-PreviewProcess `
  -FilePath "cmd.exe" `
  -ArgumentList @("/c",$NextCli,"start","--hostname","127.0.0.1","--port",$FrontendPort) `
  -WorkingDirectory $Frontend `
  -StdOutPath $FrontendLog `
  -StdErrPath $FrontendErr | Out-Null

Wait-Http "http://127.0.0.1:$FrontendPort/health" | Out-Null

Remove-Item $TunnelLog, $TunnelErr -ErrorAction SilentlyContinue
Start-PreviewProcess `
  -FilePath $Cloudflared `
  -ArgumentList @("tunnel","--url","http://127.0.0.1:$FrontendPort","--no-autoupdate") `
  -WorkingDirectory $Root `
  -StdOutPath $TunnelLog `
  -StdErrPath $TunnelErr | Out-Null

$deadline = (Get-Date).AddSeconds(60)
$publicUrl = $null
do {
  Start-Sleep -Seconds 2
  if (Test-Path $TunnelErr) {
    $content = Get-Content $TunnelErr -Raw
    if ($content) {
      $match = [regex]::Match($content, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
      if ($match.Success) {
        $publicUrl = $match.Value
        break
      }
    }
  }
} while ((Get-Date) -lt $deadline)

if (-not $publicUrl) {
  throw "Cloudflare tunnel started but no public URL was found. Check $TunnelErr"
}

$publicUrl | Set-Content (Join-Path $Root "preview-url.txt")
Wait-PublicTunnelHttp "$publicUrl/health" | Out-Null
Write-Host "Frontend: http://127.0.0.1:$FrontendPort"
Write-Host "Backend:  http://127.0.0.1:$BackendPort"
Write-Host "Public:   $publicUrl"

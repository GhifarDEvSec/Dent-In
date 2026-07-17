<#
.SYNOPSIS
    Loads .env file and starts Dent-in backend.
.USAGE
    .\setup-env.ps1              # Load env + start app
    .\setup-env.ps1 -LoadOnly   # Load env vars only
#>
param(
    [switch]$LoadOnly
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dent-in — Loading Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$loaded = 0
$skipped = 0

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match "^#" -or $line -eq "") { return }
    if ($line -match "^([^#=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        if ($value -eq "" -or $value -like "paste_*") {
            $skipped++
            return
        }
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        $loaded++
        $display = $value
        if ($key -match "KEY|TOKEN|SECRET|PASSWORD") {
            if ($value.Length -gt 8) { $display = $value.Substring(0,4) + "****" + $value.Substring($value.Length-4) }
            else { $display = "****" }
        }
        Write-Host "  SET $key = $display" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Loaded $loaded, skipped $skipped (empty)" -ForegroundColor Yellow
Write-Host ""

$dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL","Process")
if ($dbUrl -and $dbUrl -ne "jdbc:h2:mem:dentaldb") {
    Write-Host "  [OK] Database: PostgreSQL" -ForegroundColor Green
} else {
    Write-Host "  [~]  Database: H2 in-memory" -ForegroundColor Yellow
}

$mtKey = [Environment]::GetEnvironmentVariable("MAPTILER_KEY","Process")
if ($mtKey) { Write-Host "  [OK] Maps: MapTiler connected" -ForegroundColor Green }
else { Write-Host "  [~]  Maps: Disabled (no key)" -ForegroundColor Yellow }

$supaUrl = [Environment]::GetEnvironmentVariable("SUPABASE_URL","Process")
if ($supaUrl) { Write-Host "  [OK] OTP: Supabase connected" -ForegroundColor Green }
else { Write-Host "  [~]  OTP: Console-only mode" -ForegroundColor Yellow }

$hfToken = [Environment]::GetEnvironmentVariable("HF_API_TOKEN","Process")
if ($hfToken) { Write-Host "  [OK] AI: Hugging Face connected" -ForegroundColor Green }
else { Write-Host "  [~]  AI: Simulated mode" -ForegroundColor Yellow }

Write-Host ""

if ($LoadOnly) {
    Write-Host "Done. Run 'mvn spring-boot:run' to start." -ForegroundColor Cyan
    return
}

Write-Host "Starting Dent-in..." -ForegroundColor Cyan
Write-Host "Open http://localhost:8080" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
mvn spring-boot:run

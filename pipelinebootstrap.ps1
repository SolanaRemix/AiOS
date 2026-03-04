#Requires -Version 5.1
<#
.SYNOPSIS
    AIOS Platform Bootstrap Script

.DESCRIPTION
    Bootstraps the AIOS Enterprise SaaS platform for development or production.
    Handles prerequisites, environment setup, database initialization, and service startup.

.PARAMETER Mode
    Execution mode: "dev" | "production" | "docker"
    - dev:        Start all services in development mode with hot reload
    - production: Build and start production containers
    - docker:     Only start Docker services (postgres + redis), skip app services

.PARAMETER SkipDeps
    Skip npm install (use when dependencies are already installed)

.PARAMETER SkipDb
    Skip database setup (Docker Compose services, migrations, seeding)

.EXAMPLE
    .\pipelinebootstrap.ps1
    .\pipelinebootstrap.ps1 -Mode production
    .\pipelinebootstrap.ps1 -Mode dev -SkipDeps
    .\pipelinebootstrap.ps1 -Mode docker -SkipDb
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet("dev", "production", "docker")]
    [string]$Mode = "dev",

    [Parameter()]
    [switch]$SkipDeps,

    [Parameter()]
    [switch]$SkipDb
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# Constants & Configuration
# ─────────────────────────────────────────────────────────────────────────────
$SCRIPT_VERSION   = "1.0.0"
$MIN_NODE_VERSION = 18
$REPO_ROOT        = $PSScriptRoot
$ENV_FILE         = Join-Path $REPO_ROOT ".env"
$ENV_EXAMPLE      = Join-Path $REPO_ROOT ".env.example"
$COMPOSE_FILE     = Join-Path $REPO_ROOT "docker-compose.yml"
$LOG_FILE         = Join-Path $REPO_ROOT "bootstrap.log"

# Timing
$SCRIPT_START = [DateTime]::Now

# ─────────────────────────────────────────────────────────────────────────────
# Color Output Helpers
# ─────────────────────────────────────────────────────────────────────────────
function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host ("═" * 60) -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ("═" * 60) -ForegroundColor DarkCyan
}

function Write-Step {
    param([string]$Text, [int]$Step = 0, [int]$Total = 0)
    $prefix = if ($Step -gt 0) { "[$Step/$Total]" } else { "►" }
    Write-Host "`n$prefix " -ForegroundColor Cyan -NoNewline
    Write-Host $Text -ForegroundColor White
    Add-Content -Path $LOG_FILE -Value "[$(Get-Date -f 'HH:mm:ss')] STEP: $Text"
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✔ " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor Green
    Add-Content -Path $LOG_FILE -Value "[$(Get-Date -f 'HH:mm:ss')] OK: $Text"
}

function Write-Info {
    param([string]$Text)
    Write-Host "  ℹ " -ForegroundColor Blue -NoNewline
    Write-Host $Text -ForegroundColor Gray
}

function Write-Warn {
    param([string]$Text)
    Write-Host "  ⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor Yellow
    Add-Content -Path $LOG_FILE -Value "[$(Get-Date -f 'HH:mm:ss')] WARN: $Text"
}

function Write-Err {
    param([string]$Text)
    Write-Host "`n  ✖ " -ForegroundColor Red -NoNewline
    Write-Host $Text -ForegroundColor Red
    Add-Content -Path $LOG_FILE -Value "[$(Get-Date -f 'HH:mm:ss')] ERROR: $Text"
}

function Write-Divider {
    Write-Host ("─" * 60) -ForegroundColor DarkGray
}

function Invoke-WithSpinner {
    param([string]$Message, [scriptblock]$Action)
    $frames = @("⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏")
    $job = Start-Job -ScriptBlock $Action
    $i = 0
    while ($job.State -eq "Running") {
        Write-Host "`r  $($frames[$i % $frames.Length]) $Message   " -NoNewline -ForegroundColor Cyan
        Start-Sleep -Milliseconds 80
        $i++
    }
    $result = Receive-Job $job -Wait -ErrorAction SilentlyContinue
    $state = $job.State
    Remove-Job $job
    Write-Host "`r" -NoNewline
    if ($state -eq "Completed") {
        Write-Success $Message
        return $result
    } else {
        Write-Err "$Message FAILED"
        return $null
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────────────────────
function Get-CommandVersion {
    param([string]$Command, [string]$Args = "--version")
    try {
        $output = & $Command $Args 2>&1 | Select-Object -First 1
        return ($output -replace '[^\d\.]', '').Trim()
    } catch { return $null }
}

function Test-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-ParsedVersion {
    param([string]$VersionString)
    if ([string]::IsNullOrWhiteSpace($VersionString)) { return 0 }
    $parts = ($VersionString -split '\.')[0] -replace '[^\d]', ''
    if ($parts -match '^\d+$') { return [int]$parts }
    return 0
}

function New-SecureRandomHex {
    param([int]$Bytes = 32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buffer = New-Object byte[] $Bytes
    $rng.GetBytes($buffer)
    $rng.Dispose()
    return [BitConverter]::ToString($buffer).Replace("-","").ToLower()
}

function New-SecureRandomBase64 {
    param([int]$Bytes = 64)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buffer = New-Object byte[] $Bytes
    $rng.GetBytes($buffer)
    $rng.Dispose()
    return [Convert]::ToBase64String($buffer)
}

function Update-EnvValue {
    param([string]$File, [string]$Key, [string]$Value)
    $content = Get-Content $File -Raw
    if ($content -match "(?m)^$Key=") {
        $content = $content -replace "(?m)^$Key=.*$", "$Key=$Value"
    } else {
        $content = $content.TrimEnd() + "`n$Key=$Value`n"
    }
    Set-Content -Path $File -Value $content -NoNewline
}

function Get-EnvValue {
    param([string]$File, [string]$Key)
    $lines = Get-Content $File
    foreach ($line in $lines) {
        if ($line -match "^$Key=(.*)$") { return $Matches[1].Trim('"', "'") }
    }
    return $null
}

function Wait-ServiceReady {
    param(
        [string]$ServiceName,
        [scriptblock]$TestBlock,
        [int]$MaxRetries = 30,
        [int]$DelaySeconds = 3
    )
    Write-Info "Waiting for $ServiceName to be ready..."
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            if (& $TestBlock) {
                Write-Success "$ServiceName is ready"
                return $true
            }
        } catch {}
        if ($i -eq $MaxRetries) {
            Write-Err "$ServiceName did not become ready after $($MaxRetries * $DelaySeconds)s"
            return $false
        }
        Write-Host "  . waiting... ($i/$MaxRetries)" -ForegroundColor DarkGray
        Start-Sleep -Seconds $DelaySeconds
    }
    return $false
}

function Invoke-Command-Safe {
    param([string]$Command, [string]$Args, [string]$WorkDir = $REPO_ROOT)
    $prevDir = Get-Location
    try {
        Set-Location $WorkDir
        $output = Invoke-Expression "$Command $Args" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE`n$output"
        }
        return $output
    } finally {
        Set-Location $prevDir
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Banner
# ─────────────────────────────────────────────────────────────────────────────
function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                               ║" -ForegroundColor Cyan
    Write-Host "  ║    " -ForegroundColor Cyan -NoNewline
    Write-Host "  AIOS Enterprise SaaS Platform  " -ForegroundColor White -NoNewline
    Write-Host "       ║" -ForegroundColor Cyan
    Write-Host "  ║    " -ForegroundColor Cyan -NoNewline
    Write-Host "       Bootstrap Script v$SCRIPT_VERSION       " -ForegroundColor DarkGray -NoNewline
    Write-Host "  ║" -ForegroundColor Cyan
    Write-Host "  ║                                               ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Mode: " -NoNewline -ForegroundColor DarkGray
    $modeColor = switch ($Mode) { "production" { "Red" } "docker" { "Blue" } default { "Green" } }
    Write-Host "  $($Mode.ToUpper())  " -ForegroundColor $modeColor -BackgroundColor DarkGray
    Write-Host ""
    Write-Host "  Log: $LOG_FILE" -ForegroundColor DarkGray
    Write-Host ""

    # Initialize log
    Set-Content -Path $LOG_FILE -Value "AIOS Bootstrap started at $(Get-Date -f 'yyyy-MM-dd HH:mm:ss') | Mode: $Mode"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Prerequisites Check
# ─────────────────────────────────────────────────────────────────────────────
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    $failed = $false

    # Node.js
    Write-Step "Node.js (>= $MIN_NODE_VERSION)"
    if (Test-CommandExists "node") {
        $nodeVer = Get-CommandVersion "node"
        $nodeMajor = Get-ParsedVersion $nodeVer
        if ($nodeMajor -ge $MIN_NODE_VERSION) {
            Write-Success "Node.js $nodeVer ✔"
        } else {
            Write-Err "Node.js $nodeVer found but >= $MIN_NODE_VERSION required"
            Write-Info "Download: https://nodejs.org"
            $failed = $true
        }
    } else {
        Write-Err "Node.js not found"
        Write-Info "Download: https://nodejs.org"
        $failed = $true
    }

    # npm
    Write-Step "npm"
    if (Test-CommandExists "npm") {
        $npmVer = Get-CommandVersion "npm"
        Write-Success "npm $npmVer ✔"
    } else {
        Write-Err "npm not found (install with Node.js)"
        $failed = $true
    }

    # Docker
    Write-Step "Docker"
    if (Test-CommandExists "docker") {
        $dockerVer = Get-CommandVersion "docker"
        Write-Success "Docker $dockerVer ✔"

        # Check Docker daemon
        try {
            docker info *>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker daemon is running ✔"
            } else {
                Write-Err "Docker daemon is not running"
                Write-Info "Start Docker Desktop or run: sudo systemctl start docker"
                $failed = $true
            }
        } catch {
            Write-Err "Cannot connect to Docker daemon"
            $failed = $true
        }
    } else {
        Write-Err "Docker not found"
        Write-Info "Download: https://docs.docker.com/get-docker/"
        $failed = $true
    }

    # Docker Compose
    Write-Step "Docker Compose"
    $composeOk = $false
    if (Test-CommandExists "docker") {
        try {
            docker compose version *>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $composeVer = (docker compose version 2>&1) -replace '[^\d\.]', '' | Select-Object -First 1
                Write-Success "Docker Compose v$composeVer ✔"
                $composeOk = $true
            }
        } catch {}
    }
    if (-not $composeOk) {
        Write-Err "Docker Compose not found (required)"
        $failed = $true
    }

    # Git
    Write-Step "Git"
    if (Test-CommandExists "git") {
        $gitVer = Get-CommandVersion "git"
        Write-Success "Git $gitVer ✔"
    } else {
        Write-Warn "Git not found (optional for this setup)"
    }

    if ($failed) {
        Write-Host "`n"
        Write-Err "One or more prerequisites are missing. Please install them and re-run."
        exit 1
    }

    Write-Success "All prerequisites satisfied!"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Environment Setup
# ─────────────────────────────────────────────────────────────────────────────
function Initialize-Environment {
    Write-Header "Environment Setup"

    # Copy .env.example if .env doesn't exist
    if (-not (Test-Path $ENV_FILE)) {
        Write-Step "Creating .env from .env.example"
        if (Test-Path $ENV_EXAMPLE) {
            Copy-Item $ENV_EXAMPLE $ENV_FILE
            Write-Success ".env created from .env.example"
        } else {
            Write-Err ".env.example not found at $ENV_EXAMPLE"
            exit 1
        }
    } else {
        Write-Info ".env already exists – skipping copy"
    }

    # Generate JWT_SECRET if placeholder
    Write-Step "Checking JWT_SECRET"
    $jwtSecret = Get-EnvValue -File $ENV_FILE -Key "JWT_SECRET"
    if ([string]::IsNullOrWhiteSpace($jwtSecret) -or $jwtSecret -like "*replace*" -or $jwtSecret -like "*your*") {
        $newSecret = New-SecureRandomBase64 -Bytes 64
        Update-EnvValue -File $ENV_FILE -Key "JWT_SECRET" -Value $newSecret
        Write-Success "Generated secure JWT_SECRET ($(($newSecret).Length) chars)"
    } else {
        Write-Info "JWT_SECRET already set"
    }

    # Generate JWT_REFRESH_SECRET if placeholder
    Write-Step "Checking JWT_REFRESH_SECRET"
    $jwtRefresh = Get-EnvValue -File $ENV_FILE -Key "JWT_REFRESH_SECRET"
    if ([string]::IsNullOrWhiteSpace($jwtRefresh) -or $jwtRefresh -like "*replace*" -or $jwtRefresh -like "*your*") {
        $newRefresh = New-SecureRandomBase64 -Bytes 64
        Update-EnvValue -File $ENV_FILE -Key "JWT_REFRESH_SECRET" -Value $newRefresh
        Write-Success "Generated secure JWT_REFRESH_SECRET"
    } else {
        Write-Info "JWT_REFRESH_SECRET already set"
    }

    # Generate ENCRYPTION_KEY if placeholder
    Write-Step "Checking ENCRYPTION_KEY"
    $encKey = Get-EnvValue -File $ENV_FILE -Key "ENCRYPTION_KEY"
    if ([string]::IsNullOrWhiteSpace($encKey) -or $encKey -like "*replace*" -or $encKey -like "*your*") {
        $newEncKey = New-SecureRandomHex -Bytes 32
        Update-EnvValue -File $ENV_FILE -Key "ENCRYPTION_KEY" -Value $newEncKey
        Write-Success "Generated secure ENCRYPTION_KEY (64-char hex)"
    } else {
        Write-Info "ENCRYPTION_KEY already set"
    }

    Write-Success "Environment configured!"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Install Dependencies
# ─────────────────────────────────────────────────────────────────────────────
function Install-Dependencies {
    if ($SkipDeps) {
        Write-Warn "Skipping dependency installation (--SkipDeps)"
        return
    }

    Write-Header "Installing Dependencies"
    Write-Step "Running npm install (this may take a minute...)"

    Set-Location $REPO_ROOT
    npm install --prefer-offline 2>&1 | Tee-Object -Append $LOG_FILE | ForEach-Object {
        if ($_ -match "warn|warning" -and $_ -notmatch "deprecated") {
            Write-Host "  " -NoNewline; Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "error") {
            Write-Host "  " -NoNewline; Write-Host $_ -ForegroundColor Red
        }
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install failed. Check $LOG_FILE for details."
        exit 1
    }

    Write-Success "Dependencies installed!"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Start Database Services
# ─────────────────────────────────────────────────────────────────────────────
function Start-DatabaseServices {
    if ($SkipDb) {
        Write-Warn "Skipping database setup (--SkipDb)"
        return
    }

    Write-Header "Starting Database Services"

    if (-not (Test-Path $COMPOSE_FILE)) {
        Write-Err "docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    }

    # Pull images first
    Write-Step "Pulling Docker images..."
    docker compose -f $COMPOSE_FILE pull postgres redis 2>&1 | Out-Null
    Write-Success "Images pulled"

    # Start postgres and redis
    Write-Step "Starting PostgreSQL and Redis..."
    docker compose -f $COMPOSE_FILE up -d postgres redis 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor DarkGray
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to start database services"
        exit 1
    }

    Write-Success "Database containers started"

    # Wait for PostgreSQL
    $pgReady = Wait-ServiceReady -ServiceName "PostgreSQL" -MaxRetries 30 -DelaySeconds 3 -TestBlock {
        $result = docker compose -f $COMPOSE_FILE exec -T postgres pg_isready 2>&1
        return ($LASTEXITCODE -eq 0)
    }
    if (-not $pgReady) {
        Write-Err "PostgreSQL failed to start. Check docker logs:"
        docker compose -f $COMPOSE_FILE logs postgres
        exit 1
    }

    # Wait for Redis
    $redisPassword = Get-EnvValue -File $ENV_FILE -Key "REDIS_PASSWORD"
    if ([string]::IsNullOrWhiteSpace($redisPassword)) { $redisPassword = "redispassword" }

    $redisReady = Wait-ServiceReady -ServiceName "Redis" -MaxRetries 20 -DelaySeconds 2 -TestBlock {
        $result = docker compose -f $COMPOSE_FILE exec -T redis redis-cli -a $redisPassword ping 2>&1
        return ($result -match "PONG")
    }
    if (-not $redisReady) {
        Write-Warn "Redis might not be fully ready, continuing anyway..."
    }

    Write-Success "Database services are running!"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Run Prisma Migrations
# ─────────────────────────────────────────────────────────────────────────────
function Invoke-DatabaseMigrations {
    if ($SkipDb) { return }

    Write-Header "Running Database Migrations"

    # Generate Prisma client first
    Write-Step "Generating Prisma client..."
    Set-Location $REPO_ROOT
    npm run db:generate 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Prisma generate had issues (may be OK if already generated)"
    } else {
        Write-Success "Prisma client generated"
    }

    # Run migrations
    Write-Step "Applying database migrations..."
    if ($Mode -eq "dev") {
        npm run db:migrate:dev -- --name init 2>&1 | Tee-Object -Append $LOG_FILE | ForEach-Object {
            Write-Host "  $_" -ForegroundColor DarkGray
        }
    } else {
        npm run db:migrate 2>&1 | Tee-Object -Append $LOG_FILE | ForEach-Object {
            Write-Host "  $_" -ForegroundColor DarkGray
        }
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Database migration failed. Check $LOG_FILE"
        Write-Info "Tip: Verify DATABASE_URL in .env points to the running postgres container"
        exit 1
    }

    Write-Success "Migrations applied!"
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 7: Seed Database
# ─────────────────────────────────────────────────────────────────────────────
function Invoke-DatabaseSeed {
    if ($SkipDb) { return }

    Write-Header "Seeding Database"
    Write-Step "Running database seed..."
    Set-Location $REPO_ROOT

    npm run db:seed 2>&1 | Tee-Object -Append $LOG_FILE | ForEach-Object {
        if ($_ -match "Created|Seeded|created") {
            Write-Host "  ✔ $_" -ForegroundColor Green
        } elseif ($_ -match "already exists|skipping") {
            Write-Host "  - $_" -ForegroundColor DarkGray
        } else {
            Write-Host "  $_" -ForegroundColor DarkGray
        }
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Seed may have had issues (some items may already exist)"
    } else {
        Write-Success "Database seeded!"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 8a: Start Development Mode
# ─────────────────────────────────────────────────────────────────────────────
function Start-DevMode {
    Write-Header "Starting Development Services"

    Write-Info "Starting API + Web in development mode with hot reload..."
    Write-Info "Press Ctrl+C to stop all services"
    Write-Divider

    # Check if turbo is available
    if (Test-CommandExists "turbo") {
        Write-Step "Starting with Turborepo..."
        Set-Location $REPO_ROOT
        npx turbo run dev --parallel
    } else {
        Write-Step "Starting services individually..."
        # Start API in background
        $apiJob = Start-Job -ScriptBlock {
            param($root)
            Set-Location $root
            npm run dev --workspace=apps/api
        } -ArgumentList $REPO_ROOT

        Start-Sleep -Seconds 3

        # Start Web in background
        $webJob = Start-Job -ScriptBlock {
            param($root)
            Set-Location $root
            npm run dev --workspace=apps/web
        } -ArgumentList $REPO_ROOT

        Write-Success "Services started (Jobs: API=$($apiJob.Id), Web=$($webJob.Id))"
        Write-Info "Streaming output (Ctrl+C to stop)..."

        try {
            while ($true) {
                Receive-Job $apiJob | ForEach-Object { Write-Host "[API] $_" -ForegroundColor Cyan }
                Receive-Job $webJob | ForEach-Object { Write-Host "[WEB] $_" -ForegroundColor Magenta }
                Start-Sleep -Seconds 1
            }
        } finally {
            Stop-Job $apiJob, $webJob -ErrorAction SilentlyContinue
            Remove-Job $apiJob, $webJob -ErrorAction SilentlyContinue
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 8b: Start Production / Docker Mode
# ─────────────────────────────────────────────────────────────────────────────
function Start-ProductionMode {
    Write-Header "Starting Production Services"

    if ($Mode -eq "production") {
        Write-Step "Building application images..."
        docker compose -f $COMPOSE_FILE build --no-cache --parallel api web 2>&1 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor DarkGray
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Docker build failed"
            exit 1
        }
        Write-Success "Images built"
    }

    Write-Step "Starting all services..."
    docker compose -f $COMPOSE_FILE up -d 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor DarkGray
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to start services"
        exit 1
    }

    Write-Success "All services started!"

    # Health checks
    Write-Step "Running health checks..."
    Start-Sleep -Seconds 10

    $apiReady = Wait-ServiceReady -ServiceName "API" -MaxRetries 20 -DelaySeconds 5 -TestBlock {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 3 -UseBasicParsing
            return ($resp.StatusCode -eq 200)
        } catch { return $false }
    }

    $webReady = Wait-ServiceReady -ServiceName "Web" -MaxRetries 15 -DelaySeconds 5 -TestBlock {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
            return ($resp.StatusCode -eq 200)
        } catch { return $false }
    }

    if (-not $apiReady -or -not $webReady) {
        Write-Warn "Some services may not be fully ready yet. Check logs:"
        Write-Info "docker compose logs -f"
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 8c: Docker-only mode
# ─────────────────────────────────────────────────────────────────────────────
function Start-DockerOnlyMode {
    Write-Header "Docker Services Status"
    docker compose -f $COMPOSE_FILE ps
    Write-Success "Database services are running. Start app services manually."
}

# ─────────────────────────────────────────────────────────────────────────────
# Final Summary
# ─────────────────────────────────────────────────────────────────────────────
function Show-Summary {
    $elapsed = [DateTime]::Now - $SCRIPT_START
    $elapsedStr = "{0:mm\:ss}" -f $elapsed

    Write-Host ""
    Write-Host ("═" * 60) -ForegroundColor Green
    Write-Host "  🚀 AIOS Platform Bootstrap Complete!" -ForegroundColor Green
    Write-Host ("═" * 60) -ForegroundColor Green
    Write-Host ""
    Write-Host "  Time elapsed: " -NoNewline -ForegroundColor DarkGray
    Write-Host $elapsedStr -ForegroundColor White
    Write-Host "  Mode:         " -NoNewline -ForegroundColor DarkGray
    Write-Host $Mode.ToUpper() -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Access URLs:" -ForegroundColor White
    Write-Divider
    Write-Host "  🌐 Web App:    " -NoNewline -ForegroundColor DarkGray
    Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  🔌 API:        " -NoNewline -ForegroundColor DarkGray
    Write-Host "http://localhost:4000" -ForegroundColor Cyan
    Write-Host "  📊 API Health: " -NoNewline -ForegroundColor DarkGray
    Write-Host "http://localhost:4000/health" -ForegroundColor Cyan
    Write-Host "  🗄️  Database:  " -NoNewline -ForegroundColor DarkGray
    Write-Host "postgresql://localhost:5432/aios_dev" -ForegroundColor Cyan
    Write-Host "  📦 Redis:      " -NoNewline -ForegroundColor DarkGray
    Write-Host "redis://localhost:6379" -ForegroundColor Cyan
    Write-Host ""

    # Show admin credentials hint
    $adminEmail = Get-EnvValue -File $ENV_FILE -Key "ADMIN_EMAIL"
    if ($adminEmail) {
        Write-Divider
        Write-Host "  👤 Admin Login:" -ForegroundColor White
        Write-Host "     Email:    $adminEmail" -ForegroundColor DarkGray
        Write-Host "     Password: (see ADMIN_PASSWORD in .env)" -ForegroundColor DarkGray
        Write-Host ""
    }

    Write-Divider
    Write-Host "  📋 Useful Commands:" -ForegroundColor White
    Write-Host "     View logs:    docker compose logs -f" -ForegroundColor DarkGray
    Write-Host "     Stop all:     docker compose down" -ForegroundColor DarkGray
    Write-Host "     DB Studio:    npm run db:studio" -ForegroundColor DarkGray
    Write-Host "     Run tests:    npm test" -ForegroundColor DarkGray
    Write-Host "     Build prod:   .\pipelinebootstrap.ps1 -Mode production" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  📝 Log file:   $LOG_FILE" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host ("═" * 60) -ForegroundColor Green
    Write-Host ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────────────────────────────────────
function Main {
    # Ensure running from repo root
    Set-Location $REPO_ROOT

    Show-Banner
    Test-Prerequisites
    Initialize-Environment
    Install-Dependencies

    if (-not $SkipDb) {
        Start-DatabaseServices
        Invoke-DatabaseMigrations
        Invoke-DatabaseSeed
    }

    switch ($Mode) {
        "dev"        { Start-DevMode }
        "production" { Start-ProductionMode }
        "docker"     { Start-DockerOnlyMode }
    }

    Show-Summary
}

# ─── Run ─────────────────────────────────────────────────────────────────────
try {
    Main
} catch {
    Write-Err "Bootstrap failed: $_"
    Write-Info "Check $LOG_FILE for details"
    Add-Content -Path $LOG_FILE -Value "FATAL: $_`n$($_.ScriptStackTrace)"
    exit 1
}

# ============================================================
# DocuAgent - runner de contenedores DEVELOP (Windows / PowerShell)
#
# Uso:  .\ops\docuagent.ps1 <accion> [args...]
#   accion: up | down | restart | build | logs | ps | clean | prune | env | help
#
# Levanta el stack LOCAL con Cloudflare Tunnel para staging.
# Acceso: https://dev.tu-dominio.dev (tunnel) o http://localhost:3000 (directo)
# Produccion se opera en Ubuntu con: ./ops/docuagent.sh <accion>
# ============================================================

param(
  [string]$Action = "help"
)

$ExtraArgs = @()
if ($args) { $ExtraArgs = $args }

$Root         = Split-Path -Parent $PSScriptRoot
$ComposeBase  = Join-Path $Root "podman-compose.yml"
$ComposeDev   = Join-Path $Root "podman-compose.dev.yml"
$EnvFile      = Join-Path $Root ".env"
$EnvExample   = Join-Path $Root ".env.example"

function Show-Help {
  Write-Host @"

  DocuAgent - runner de contenedores (develop)

  .\ops\docuagent.ps1 <accion> [args]

  Acciones:
    up        Construye y levanta el stack completo (con Cloudflare Tunnel)
    up-local  Levanta sin tunnel (solo http://localhost)
    down      Detiene y elimina los contenedores
    restart   down + up
    build     Solo construye las imagenes
    logs      Sigue los logs (Ctrl-C para salir; args: nombre de servicio)
    ps        Estado de los contenedores
    clean     down + elimina volumenes e imagenes locales
    prune     Limpieza profunda: contenedores + imagenes colgantes + cache
    env       Muestra la configuracion activa
    help      Esta ayuda

  Servicios: backend, frontend, postgres, qdrant, cloudflared
  Ejemplo:   .\ops\docuagent.ps1 logs backend

"@
}

# --- Detectar motor de contenedores ---
$Cmd = $null
if (Get-Command podman -ErrorAction SilentlyContinue) { $Cmd = "podman" }
elseif (Get-Command docker -ErrorAction SilentlyContinue) { $Cmd = "docker" }
else { Write-Host "[ERROR] Ni Podman ni Docker estan instalados."; exit 1 }

# --- Verificar .env ---
if (-not (Test-Path $EnvFile)) {
  if (Test-Path $EnvExample) {
    Write-Host "[aviso] No existe .env. Creando desde .env.example -- rellenalo con tus valores."
    Copy-Item $EnvExample $EnvFile
  } else {
    Write-Host "[ERROR] No existe .env ni .env.example. Crea el archivo .env primero."
    exit 1
  }
}

function Invoke-Compose {
  param([string[]]$ComposeArgs)
  & $Cmd compose -f $ComposeBase -f $ComposeDev --env-file $EnvFile @ComposeArgs
}

function Invoke-ComposeLocal {
  param([string[]]$ComposeArgs)
  & $Cmd compose -f $ComposeBase --env-file $EnvFile @ComposeArgs
}

function Invoke-PruneLight {
  & $Cmd container prune -f *> $null
  & $Cmd image prune -f *> $null
}

# Build servicio por servicio (evita la carrera de buildah en Podman Windows)
function Build-Serial {
  $script:BuildFailed = $false
  $services = & $Cmd compose -f $ComposeBase -f $ComposeDev --env-file $EnvFile config --services 2>$null
  if (-not $services) {
    Write-Host "[build] Construyendo imagenes..."
    Invoke-Compose @("build")
    if ($LASTEXITCODE -ne 0) { $script:BuildFailed = $true }
    return
  }
  foreach ($s in $services) {
    # Saltar servicios sin Containerfile (postgres, qdrant, cloudflared)
    $buildCtx = & $Cmd compose -f $ComposeBase -f $ComposeDev --env-file $EnvFile config 2>$null | Select-String "build:" -Quiet
    Write-Host "[build] $s ..."
    Invoke-Compose @("build", $s)
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[build] '$s' fallo; reintento..."
      Invoke-Compose @("build", $s)
      if ($LASTEXITCODE -ne 0) { $script:BuildFailed = $true }
    }
  }
}

function Assert-TunnelToken {
  $tok = (Select-String -Path $EnvFile -Pattern '^CLOUDFLARE_TUNNEL_TOKEN=(.+)$' -ErrorAction SilentlyContinue)
  if (-not $tok) {
    Write-Host "[ERROR] CLOUDFLARE_TUNNEL_TOKEN vacio en .env"
    Write-Host "        El tunnel necesita el token para exponer el stack a dev.tu-dominio.dev"
    Write-Host "        Usa 'up-local' si quieres levantar sin tunnel (solo localhost)."
    exit 1
  }
}

switch ($Action) {
  "help" { Show-Help }

  "env" {
    Write-Host "Motor:       $Cmd"
    Write-Host "Compose:     $ComposeBase + $ComposeDev"
    Write-Host ".env:        $EnvFile"
    Write-Host ""
    Write-Host "Servicios:"
    Invoke-Compose @("config", "--services")
  }

  "build" {
    Build-Serial
    if ($script:BuildFailed) { Invoke-PruneLight; Write-Host "[ERROR] Fallo el build."; exit 1 }
    Write-Host "[build] Listo."
  }

  "up" {
    Assert-TunnelToken
    Build-Serial
    if ($script:BuildFailed) { Invoke-PruneLight; Write-Host "[ERROR] Fallo el build."; exit 1 }
    Write-Host "[up] Levantando stack con tunnel..."
    Invoke-Compose @("up", "-d")
    Invoke-PruneLight
    Write-Host ""
    Invoke-Compose @("ps")
    Write-Host ""
    Write-Host "Listo."
    Write-Host "  Local:   http://localhost:3000 (frontend) | http://localhost:8000/docs (API)"
    Write-Host "  Tunnel:  https://dev.tu-dominio.dev | https://api-dev.tu-dominio.dev"
  }

  "up-local" {
    Build-Serial
    if ($script:BuildFailed) { Invoke-PruneLight; Write-Host "[ERROR] Fallo el build."; exit 1 }
    Write-Host "[up-local] Levantando stack SIN tunnel..."
    Invoke-ComposeLocal @("up", "-d")
    Invoke-PruneLight
    Write-Host ""
    Invoke-ComposeLocal @("ps")
    Write-Host ""
    Write-Host "Listo."
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  API Docs: http://localhost:8000/docs"
    Write-Host "  Qdrant:   http://localhost:6333/dashboard"
  }

  "down" {
    Invoke-Compose @("down")
  }

  "restart" {
    Invoke-Compose @("down")
    Assert-TunnelToken
    Build-Serial
    if ($script:BuildFailed) { Invoke-PruneLight; Write-Host "[ERROR] Fallo el build."; exit 1 }
    Invoke-Compose @("up", "-d")
    Invoke-PruneLight
    Write-Host "[restart] Listo."
  }

  "logs" {
    Invoke-Compose @("logs", "-f") + $ExtraArgs
  }

  { $_ -in @("ps","status") } {
    Invoke-Compose @("ps")
  }

  "clean" {
    Write-Host "[clean] Bajando contenedores, volumenes e imagenes del proyecto..."
    Invoke-Compose @("down", "-v", "--rmi", "local")
    Invoke-PruneLight
  }

  "prune" {
    Write-Host "[prune] Contenedores salidos + imagenes colgantes + cache de build..."
    & $Cmd container prune -f
    & $Cmd image prune -f
    & $Cmd builder prune -f
  }

  default {
    Write-Host "[ERROR] Accion desconocida: '$Action'"
    Show-Help
    exit 1
  }
}

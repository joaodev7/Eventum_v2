
param(
    [string]$ProjectId
)
$ErrorActionPreference = "Stop"

function Exec-Supabase {
    param([string[]]$Arguments)
    
    if (Get-Command "supabase" -ErrorAction SilentlyContinue) {
        & supabase $Arguments
    } elseif (Get-Command "npx" -ErrorAction SilentlyContinue) {
        & npx supabase $Arguments
    } else {
        Write-Error "Supabase CLI não encontrado. Instale com: npm install -g supabase ou use npx."
        exit 1
    }
}

Write-Host "=== Assistente de Migração Supabase ===" -ForegroundColor Cyan

Write-Host "`n1. Autenticando..." -ForegroundColor Yellow
Exec-Supabase "login"

if (-not $ProjectId) {
    $ProjectId = Read-Host "iogsekvgtizsaniellyg"
    if (-not $ProjectId) { exit }
}

Write-Host "`n2. Vinculando projeto..." -ForegroundColor Yellow
Exec-Supabase "link", "--project-ref", $ProjectId

Write-Host "`n3. Executando migrations..." -ForegroundColor Yellow
Exec-Supabase "db", "push"

Write-Host "`n4. Deploy das funções..." -ForegroundColor Yellow
Exec-Supabase "functions", "deploy"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Migração finalizada! Atualize o .env se necessário." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Read-Host "Pressione Enter para sair..."
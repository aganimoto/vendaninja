# Script PowerShell para fazer deploy do VendaNinja em subdiretório
# Uso: .\deploy-to-subdir.ps1

Write-Host "🚀 Deploy do VendaNinja para subdiretório pdv/" -ForegroundColor Cyan

# Configurações
$REPO_PATH = "..\aganimoto.github.io"
$SUBDIR = "pdv"
$CURRENT_DIR = Get-Location

# Verificar se o repositório existe
if (-Not (Test-Path $REPO_PATH)) {
    Write-Host "❌ Repositório não encontrado em: $REPO_PATH" -ForegroundColor Red
    Write-Host "💡 Clone o repositório primeiro:" -ForegroundColor Yellow
    Write-Host "   git clone https://github.com/aganimoto/aganimoto.github.io.git $REPO_PATH" -ForegroundColor Gray
    exit 1
}

# Criar diretório pdv se não existir
$PDV_PATH = Join-Path $REPO_PATH $SUBDIR
if (-Not (Test-Path $PDV_PATH)) {
    Write-Host "📁 Criando diretório $SUBDIR..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $PDV_PATH -Force | Out-Null
} else {
    Write-Host "📁 Diretório $SUBDIR já existe" -ForegroundColor Yellow
}

# Lista de arquivos e pastas para copiar
$FILES_TO_COPY = @(
    "index.html",
    "landing.html",
    "styles.css",
    "styles-landing.css",
    "script.js",
    "script-db.js",
    "script-charts-coupons.js",
    "script-landing.js",
    "sw.js",
    "manifest.json",
    "README.md",
    "SETUP.md",
    "LICENSE",
    "MELHORIAS.md",
    "DEPLOY_SUBDIR.md",
    "assets",
    "data"
)

Write-Host "📦 Copiando arquivos..." -ForegroundColor Yellow

# Copiar arquivos
foreach ($item in $FILES_TO_COPY) {
    $source = Join-Path $CURRENT_DIR $item
    $dest = Join-Path $PDV_PATH $item
    
    if (Test-Path $source) {
        if (Test-Path $source -PathType Container) {
            # É um diretório
            Write-Host "   Copiando pasta: $item" -ForegroundColor Gray
            Copy-Item -Path $source -Destination $dest -Recurse -Force
        } else {
            # É um arquivo
            Write-Host "   Copiando arquivo: $item" -ForegroundColor Gray
            Copy-Item -Path $source -Destination $dest -Force
        }
    } else {
        Write-Host "   ⚠️  Arquivo não encontrado: $item" -ForegroundColor DarkYellow
    }
}

Write-Host "✅ Arquivos copiados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. cd $REPO_PATH" -ForegroundColor Gray
Write-Host "   2. git add pdv/" -ForegroundColor Gray
Write-Host "   3. git commit -m 'Adiciona VendaNinja PDV em subdiretório'" -ForegroundColor Gray
Write-Host "   4. git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Após o deploy, acesse: https://aganimoto.github.io/pdv/" -ForegroundColor Green


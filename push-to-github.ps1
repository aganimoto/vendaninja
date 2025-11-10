# Script para fazer push do VendaNinja para GitHub
# Execute após criar o repositório em https://github.com/aganimoto/vendaninja

Write-Host "🚀 Fazendo push do VendaNinja para GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o remote está configurado
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "❌ Remote não configurado!" -ForegroundColor Red
    Write-Host "Configurando remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/aganimoto/vendaninja.git
}

Write-Host "📋 Remote configurado: $remote" -ForegroundColor Green
Write-Host ""

# Verificar se há mudanças para commitar
$status = git status --short
if ($status) {
    Write-Host "📦 Há mudanças não commitadas:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    Write-Host "💡 Faça commit das mudanças primeiro:" -ForegroundColor Yellow
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Sua mensagem'" -ForegroundColor Gray
    exit 1
}

# Verificar branch
$branch = git branch --show-current
Write-Host "🌿 Branch atual: $branch" -ForegroundColor Green

# Fazer push
Write-Host ""
Write-Host "📤 Fazendo push para origin/$branch..." -ForegroundColor Cyan
Write-Host ""

try {
    git push -u origin $branch
    Write-Host ""
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Repositório: https://github.com/aganimoto/vendaninja" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   1. Repositório não existe no GitHub" -ForegroundColor Gray
    Write-Host "   2. Crie o repositório em: https://github.com/new" -ForegroundColor Gray
    Write-Host "   3. Nome: vendaninja" -ForegroundColor Gray
    Write-Host "   4. NÃO inicialize com README, .gitignore ou license" -ForegroundColor Gray
    Write-Host ""
}


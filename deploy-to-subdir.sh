#!/bin/bash
# Script bash para fazer deploy do VendaNinja em subdiretório
# Uso: ./deploy-to-subdir.sh

echo "🚀 Deploy do VendaNinja para subdiretório pdv/"

# Configurações
REPO_PATH="../aganimoto.github.io"
SUBDIR="pdv"
CURRENT_DIR=$(pwd)

# Verificar se o repositório existe
if [ ! -d "$REPO_PATH" ]; then
    echo "❌ Repositório não encontrado em: $REPO_PATH"
    echo "💡 Clone o repositório primeiro:"
    echo "   git clone https://github.com/aganimoto/aganimoto.github.io.git $REPO_PATH"
    exit 1
fi

# Criar diretório pdv se não existir
PDV_PATH="$REPO_PATH/$SUBDIR"
if [ ! -d "$PDV_PATH" ]; then
    echo "📁 Criando diretório $SUBDIR..."
    mkdir -p "$PDV_PATH"
else
    echo "📁 Diretório $SUBDIR já existe"
fi

# Lista de arquivos e pastas para copiar
FILES_TO_COPY=(
    "index.html"
    "landing.html"
    "styles.css"
    "styles-landing.css"
    "script.js"
    "script-db.js"
    "script-charts-coupons.js"
    "script-landing.js"
    "sw.js"
    "manifest.json"
    "README.md"
    "SETUP.md"
    "LICENSE"
    "MELHORIAS.md"
    "DEPLOY_SUBDIR.md"
    "assets"
    "data"
)

echo "📦 Copiando arquivos..."

# Copiar arquivos
for item in "${FILES_TO_COPY[@]}"; do
    source="$CURRENT_DIR/$item"
    dest="$PDV_PATH/$item"
    
    if [ -e "$source" ]; then
        if [ -d "$source" ]; then
            # É um diretório
            echo "   Copiando pasta: $item"
            cp -r "$source" "$dest"
        else
            # É um arquivo
            echo "   Copiando arquivo: $item"
            cp "$source" "$dest"
        fi
    else
        echo "   ⚠️  Arquivo não encontrado: $item"
    fi
done

echo "✅ Arquivos copiados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. cd $REPO_PATH"
echo "   2. git add pdv/"
echo "   3. git commit -m 'Adiciona VendaNinja PDV em subdiretório'"
echo "   4. git push origin main"
echo ""
echo "🌐 Após o deploy, acesse: https://aganimoto.github.io/pdv/"

# Tornar executável
chmod +x deploy-to-subdir.sh


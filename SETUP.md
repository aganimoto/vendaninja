# Guia de Configuração - VendaNinja

Este guia fornece instruções detalhadas para configurar e utilizar o sistema VendaNinja em diferentes ambientes.

## 📋 Índice

- [Requisitos do Sistema](#requisitos-do-sistema)
- [Instalação Local](#instalação-local)
- [Configuração Inicial](#configuração-inicial)
- [Deploy em Produção](#deploy-em-produção)
- [Configuração PWA](#configuração-pwa)
- [Personalização](#personalização)
- [Solução de Problemas](#solução-de-problemas)

## 🖥 Requisitos do Sistema

### Navegador

- **Chrome/Edge**: Versão 80 ou superior (recomendado)
- **Firefox**: Versão 75 ou superior
- **Safari**: Versão 13 ou superior (iOS 13+)
- **Opera**: Versão 67 ou superior

### Servidor Web

Para desenvolvimento local, você precisa de um servidor HTTP simples:

- Python 3 (recomendado para simplicidade)
- Node.js com http-server
- PHP 5.4+
- Qualquer servidor HTTP estático

### Recursos

- **Armazenamento**: ~5MB de espaço (dados locais)
- **Memória**: Mínimo 100MB RAM
- **Conexão**: Internet apenas para carregamento inicial

## 🚀 Instalação Local

### Método 1: Python (Recomendado)

```bash
# Navegue até a pasta do projeto
cd vendaninja

# Inicie o servidor HTTP
python -m http.server 8000

# Ou com Python 2
python -m SimpleHTTPServer 8000
```

Acesse: `http://localhost:8000`

### Método 2: Node.js

```bash
# Instale o http-server globalmente (opcional)
npm install -g http-server

# Ou use npx (sem instalação)
npx http-server -p 8000

# Com opções adicionais
npx http-server -p 8000 -c-1 --cors
```

### Método 3: PHP

```bash
# Navegue até a pasta do projeto
cd vendaninja

# Inicie o servidor PHP
php -S localhost:8000
```

### Método 4: Servidor Desenvolvimento (Node.js)

Se você tem Node.js instalado, pode usar ferramentas como:

```bash
# Live Server (VS Code Extension)
# Ou
npm install -g live-server
live-server --port=8000
```

## ⚙️ Configuração Inicial

### 1. Primeiro Acesso

1. Abra o sistema no navegador
2. O sistema carregará produtos de exemplo automaticamente
3. Configure o nome do negócio nas Configurações (⚙️)

### 2. Configurações Básicas

Acesse **Configurações** e configure:

- **Nome do Negócio**: Nome que aparecerá nos cupons
- **Moeda**: Símbolo da moeda (padrão: R$)
- **Taxa de Imposto**: Percentual de imposto (opcional)
- **Tipo de Armazenamento**: LocalStorage (padrão) ou IndexedDB

### 3. Adicionar Produtos

1. Clique no botão flutuante **📦** (canto inferior direito)
2. Clique em **+ Adicionar Produto**
3. Preencha os campos:
   - **Nome**: Nome do produto
   - **Preço**: Preço de venda
   - **Código**: Código de barras ou ISBN
   - **Categoria**: Categoria do produto
   - **Custo**: Custo do produto (opcional, para cálculo de lucro)
   - **Estoque**: Quantidade em estoque (opcional)
   - **Botão Rápido**: Marque para aparecer nos botões rápidos
4. Clique em **Salvar**

### 4. Configurar Produtos Rápidos

Para produtos aparecerem nos botões rápidos:

1. Edite o produto
2. Marque a opção **"Botão Rápido"**
3. Salve

### 5. Criar Cupons

1. Clique no botão **🏷️** (Promoções e Cupons)
2. Vá para a aba **Cupons**
3. Clique em **+ Adicionar Cupom**
4. Preencha:
   - **Nome**: Nome do cupom
   - **Código**: Código único (ex: DESCONTO10)
   - **Tipo**: Percentual ou Valor Fixo
   - **Valor**: Valor do desconto
   - **Valor Mínimo**: Valor mínimo de compra (opcional)
   - **Data Início/Fim**: Período de validade
   - **Usos Máximos**: Limite de usos (0 = ilimitado)
5. Clique em **Salvar**

## 🌐 Deploy em Produção

### GitHub Pages

#### Opção 1: Deploy na Raiz do Repositório

1. **Crie um repositório no GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/vendaninja.git
   git push -u origin main
   ```

2. **Ative o GitHub Pages**:
   - Vá em **Settings** > **Pages**
   - Em **Source**, selecione **main** branch
   - Em **Folder**, selecione **/ (root)**
   - Clique em **Save**

3. **Aguarde alguns minutos** e acesse:
   ```
   https://seu-usuario.github.io/vendaninja/
   ```

#### Opção 2: Deploy em Subdiretório

Para fazer deploy em um subdiretório (ex: `pdv/` em `aganimoto.github.io`):

1. **Siga o guia detalhado**: Consulte [DEPLOY_SUBDIR.md](DEPLOY_SUBDIR.md)

2. **Resumo rápido**:
   - Crie a pasta `pdv/` no repositório `aganimoto.github.io`
   - Copie todos os arquivos do VendaNinja para `pdv/`
   - Commit e push
   - Acesse: `https://aganimoto.github.io/pdv/`

3. **Scripts de deploy**:
   - Windows: Execute `deploy-to-subdir.ps1`
   - Linux/Mac: Execute `deploy-to-subdir.sh`

O sistema está configurado para funcionar automaticamente em subdiretórios usando caminhos relativos.

#### Configuração Custom Domain (Opcional)

1. Adicione um arquivo `CNAME` na raiz:
   ```
   seu-dominio.com
   ```
2. Configure DNS no seu provedor
3. Ative HTTPS no GitHub Pages

### Netlify

1. **Arraste e solte** a pasta do projeto no [Netlify Drop](https://app.netlify.com/drop)
2. Ou **conecte o repositório GitHub**:
   - Vá em **Add new site** > **Import an existing project**
   - Conecte o repositório
   - Deploy automático

### Vercel

1. **Instale o Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. Ou **conecte via GitHub** no dashboard do Vercel

### Servidor Próprio

1. **Upload dos arquivos** via FTP/SFTP
2. **Configure servidor web** (Apache/Nginx)
3. **Configure HTTPS** (obrigatório para PWA)
4. **Teste o funcionamento**

## 📱 Configuração PWA

### Verificação do Manifest

O arquivo `manifest.json` já está configurado. Verifique:

- ✅ `start_url` aponta para `./`
- ✅ `scope` está definido
- ✅ Ícones estão no caminho correto
- ✅ `theme_color` está definido

### Verificação do Service Worker

O arquivo `sw.js` está configurado. Verifique:

- ✅ Service Worker está registrado no `index.html`
- ✅ Cache name está atualizado
- ✅ Arquivos estão sendo cacheados

### Teste de PWA

1. **Chrome DevTools**:
   - Abra DevTools (F12)
   - Vá em **Application** > **Service Workers**
   - Verifique se está registrado
   - Vá em **Manifest** e verifique

2. **Lighthouse**:
   - Abra DevTools (F12)
   - Vá em **Lighthouse**
   - Execute audit de PWA
   - Score deve ser acima de 90

### Instalação

- **Desktop Chrome/Edge**: Ícone de instalação na barra de endereços
- **Mobile Chrome**: Menu > "Adicionar à tela inicial"
- **iOS Safari**: Compartilhar > "Adicionar à Tela de Início"
- **Android Chrome**: Prompt automático ou menu

## 🎨 Personalização

### Alterar Cores do Tema

Edite `styles.css` e modifique as variáveis CSS:

```css
:root {
    --accent: #2563eb;        /* Cor principal */
    --accent-hover: #1d4ed8;  /* Cor hover */
    --success: #10b981;       /* Cor de sucesso */
    --danger: #ef4444;        /* Cor de erro */
    --warning: #f59e0b;       /* Cor de aviso */
}
```

### Alterar Logo

1. Substitua `assets/logo-ninja.svg` pelo seu logo
2. Mantenha o mesmo nome ou atualize no HTML

### Alterar Ícone PWA

1. Crie ícones nos tamanhos:
   - 192x192 pixels
   - 512x512 pixels
2. Salve em `assets/icon-192.png` e `assets/icon-512.png`
3. Atualize `manifest.json` se necessário

### Alterar Som de Feedback

1. Substitua `assets/shuriken.mp3` pelo seu som
2. Mantenha o formato MP3
3. Mantenha o mesmo nome ou atualize no HTML

## 🔧 Configurações Avançadas

### IndexedDB vs LocalStorage

Por padrão, o sistema usa LocalStorage. Para usar IndexedDB:

1. Vá em **Configurações**
2. Altere **Tipo de Armazenamento** para **IndexedDB**
3. Os dados serão migrados automaticamente

**Vantagens do IndexedDB**:
- Maior capacidade de armazenamento
- Melhor performance para grandes volumes
- Suporte a transações

**Vantagens do LocalStorage**:
- Mais simples
- Melhor compatibilidade
- Mais fácil de debugar

### Backup Automático

O sistema não possui backup automático por padrão. Recomendações:

1. **Backup Manual Regular**: Exporte dados periodicamente
2. **Script de Backup**: Crie um script para backup automático
3. **Sincronização**: Use serviços de sincronização de arquivos

### Impressão de Cupons

O sistema gera cupons otimizados para impressoras térmicas:

- **58mm**: Padrão para impressoras térmicas pequenas
- **80mm**: Padrão para impressoras térmicas grandes

**Configuração de Impressão**:
1. Finalize a venda
2. Pressione **Ctrl+P** (ou Cmd+P no Mac)
3. Configure:
   - **Margens**: Mínimas
   - **Cabeçalhos/Rodapés**: Desabilitados
   - **Tamanho**: A4 ou Personalizado
4. Imprima

## 🐛 Solução de Problemas

### Service Worker não registra

**Problema**: Service Worker não está sendo registrado

**Soluções**:
1. Verifique se está usando HTTPS ou localhost
2. Limpe o cache do navegador
3. Verifique o console para erros
4. Verifique se o arquivo `sw.js` está acessível

### Dados não persistem

**Problema**: Dados são perdidos ao fechar o navegador

**Soluções**:
1. Verifique se o navegador permite localStorage
2. Verifique o console para erros
3. Tente usar IndexedDB nas configurações
4. Verifique se não está em modo anônimo/privado

### Gráficos não aparecem

**Problema**: Dashboard não mostra gráficos

**Soluções**:
1. Verifique conexão com internet (primeira carga)
2. Verifique se Chart.js está carregando (console)
3. Limpe o cache do navegador
4. Verifique se há erros no console
5. Verifique se há vendas para o período selecionado

### PWA não instala

**Problema**: Opção de instalação não aparece

**Soluções**:
1. Verifique se está em HTTPS (obrigatório)
2. Verifique se o manifest.json está acessível
3. Verifique se os ícones estão no lugar correto
4. Verifique o console para erros
5. Use Lighthouse para diagnosticar

### Performance lenta

**Problema**: Sistema está lento com muitos dados

**Soluções**:
1. Use IndexedDB em vez de LocalStorage
2. Limpe dados antigos periodicamente
3. Faça backup e restaure apenas dados recentes
4. Verifique o número de produtos/vendas

### Erro ao importar backup

**Problema**: Erro ao restaurar backup

**Soluções**:
1. Verifique se o arquivo JSON está válido
2. Verifique se o arquivo não está corrompido
3. Tente importar em partes menores
4. Verifique o console para erros específicos

## 📊 Monitoramento e Manutenção

### Limpeza de Dados

Para limpar dados antigos:

1. Exporte um backup completo
2. Delete vendas antigas manualmente
3. Ou restaure apenas dados recentes

### Atualização do Sistema

Para atualizar o sistema:

1. Faça backup completo dos dados
2. Atualize os arquivos
3. Limpe o cache do navegador
4. Recarregue a página
5. Service Worker atualizará automaticamente

### Verificação de Integridade

Verifique periodicamente:

- ✅ Service Worker está ativo
- ✅ Dados estão sendo salvos
- ✅ Backup funciona corretamente
- ✅ PWA está instalável
- ✅ Gráficos estão funcionando

## 🔐 Segurança

### Boas Práticas

1. **HTTPS**: Sempre use HTTPS em produção
2. **Backup Regular**: Faça backups periódicos
3. **Dados Locais**: Dados ficam apenas no navegador
4. **Não Compartilhe**: Não compartilhe backups publicamente

### Privacidade

- Todos os dados ficam no navegador local
- Nenhum dado é enviado para servidores
- Backups são arquivos locais
- Service Worker cacheia apenas recursos do sistema

## 📞 Suporte

### Recursos

- **Documentação**: Este arquivo e README.md
- **Issues**: GitHub Issues para reportar bugs
- **Roadmap**: MELHORIAS.md para ver melhorias planejadas

### Reportar Problemas

Ao reportar problemas, inclua:

1. Navegador e versão
2. Sistema operacional
3. Passos para reproduzir
4. Mensagens de erro (console)
5. Screenshots (se aplicável)

---

**VendaNinja © 2025 | Open Source com ninjutsu brasileiro** 🇧🇷

*Para mais informações, consulte o [README.md](README.md)*

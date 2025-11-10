# VendaNinja - Sistema de Ponto de Venda Offline

![VendaNinja](https://img.shields.io/badge/VendaNinja-PDV%20Offline-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

Sistema de Ponto de Venda (PDV) completo, 100% client-side, desenvolvido para pequenos negócios brasileiros. Funciona completamente offline após o carregamento inicial, utilizando tecnologias web modernas como PWA (Progressive Web App), Service Workers e armazenamento local.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Licença](#licença)

## 🚀 Características

### Funcionalidades Principais

- **Gestão de Produtos**: Cadastro completo com código de barras, categorias, estoque e custos
- **Vendas Rápidas**: Botões de acesso rápido para produtos mais vendidos
- **Carrinho de Compras**: Gerenciamento completo com descontos por item
- **Sistema de Cupons**: Aplicação de cupons de desconto com validação
- **Múltiplas Formas de Pagamento**: Dinheiro, Pix, Cartão de Crédito e Débito
- **Gestão de Caixa**: Abertura e fechamento de caixa com controle de valores
- **Relatórios Detalhados**: Análise de vendas por período e forma de pagamento
- **Dashboard com Gráficos**: Visualizações interativas de vendas, produtos e tendências
- **Histórico de Vendas**: Consulta completa de todas as vendas realizadas
- **Geração de Cupom Fiscal**: Impressão de cupons não fiscais (58mm/80mm)
- **Backup e Restore**: Exportação e importação de dados em JSON
- **Tema Claro/Escuro**: Alternância entre modos de visualização
- **Responsivo**: Interface adaptável para desktop, tablet e mobile

### Tecnologias Web Modernas

- **Progressive Web App (PWA)**: Instalável em dispositivos móveis e desktop
- **Service Worker**: Cache inteligente para funcionamento offline
- **LocalStorage/IndexedDB**: Armazenamento local persistente
- **Chart.js**: Gráficos interativos para análise de dados
- **Vanilla JavaScript**: Sem dependências de frameworks
- **CSS3 Moderno**: Variáveis CSS, Grid, Flexbox, Media Queries

## 🛠 Tecnologias

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Estilização moderna com variáveis, Grid e Flexbox
- **JavaScript ES6+**: Lógica de negócio e manipulação do DOM
- **Chart.js 4.4.1**: Biblioteca para visualização de dados
- **Service Worker API**: Cache e funcionamento offline
- **Web App Manifest**: Configuração PWA
- **LocalStorage API**: Armazenamento de dados local
- **IndexedDB API**: Armazenamento avançado (opcional)

## 📦 Requisitos

- Navegador web moderno (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Servidor web (para desenvolvimento local) ou GitHub Pages (para deploy)
- Conexão com internet apenas para carregamento inicial (após isso, funciona offline)

## 🚀 Instalação e Configuração

### Desenvolvimento Local

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/vendaninja.git
   cd vendaninja
   ```

2. **Servidor HTTP Local**:

   **Opção 1: Python 3**
   ```bash
   python -m http.server 8000
   ```

   **Opção 2: Node.js (http-server)**
   ```bash
   npx http-server -p 8000
   ```

   **Opção 3: PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Acesse no navegador**:
   ```
   http://localhost:8000
   ```

### Deploy em Produção

Veja a seção [Deploy](#deploy) para instruções detalhadas de publicação.

## 📁 Estrutura do Projeto

```
vendaninja/
├── index.html              # Página principal do PDV
├── landing.html            # Página de apresentação e documentação
├── styles.css              # Estilos do PDV
├── styles-landing.css      # Estilos da landing page
├── script.js               # Lógica principal do PDV
├── script-db.js            # Gerenciamento de persistência de dados
├── script-charts-coupons.js # Gráficos e sistema de cupons
├── script-landing.js       # Lógica da landing page
├── sw.js                   # Service Worker para PWA
├── manifest.json           # Manifesto PWA
├── assets/                 # Recursos estáticos
│   ├── shuriken.mp3        # Som de feedback
│   ├── logo-ninja.svg      # Logo do sistema
│   └── icon-192.png        # Ícone PWA
├── data/                   # Dados de exemplo
│   └── sample-products.json # Produtos de exemplo
├── README.md               # Esta documentação
├── SETUP.md                # Guia de configuração detalhado
├── MELHORIAS.md            # Roadmap de melhorias
└── LICENSE                 # Licença MIT
```

## ✨ Funcionalidades Detalhadas

### Gestão de Produtos

- Cadastro completo de produtos com:
  - ID único
  - Nome e descrição
  - Preço de venda
  - Código de barras/ISBN
  - Categoria
  - Custo (opcional, para cálculo de lucro)
  - Estoque (opcional, controle automático)
  - Botão rápido (acesso rápido no PDV)

### Sistema de Vendas

- **Busca Rápida**: Pesquisa por nome ou código com adição ao carrinho
- **Botões Rápidos**: Grid de produtos mais vendidos
- **Carrinho**: 
  - Adicionar/remover produtos
  - Ajustar quantidades
  - Aplicar descontos por item (% ou valor fixo)
  - Aplicar cupons de desconto
  - Cálculo automático de totais

### Sistema de Cupons

- Cadastro de cupons com:
  - Código único
  - Tipo de desconto (percentual ou valor fixo)
  - Validade (data início/fim)
  - Valor mínimo de compra
  - Limite de usos
  - Status ativo/inativo
- Validação automática na aplicação
- Controle de usos

### Gestão de Caixa

- Abertura de caixa com valor inicial
- Rastreamento de vendas em dinheiro
- Fechamento de caixa com:
  - Valor esperado
  - Valor real informado
  - Cálculo de diferença
  - Histórico de sessões

### Relatórios e Dashboard

- **Relatórios**:
  - Filtro por período (hoje, últimos 7 dias, últimos 30 dias, personalizado)
  - Filtro por forma de pagamento
  - Exportação para CSV
  - Análise de vendas, produtos e lucro

- **Dashboard com Gráficos**:
  - Métricas principais (vendas, receita, ticket médio, lucro)
  - Gráfico de vendas ao longo do tempo
  - Top 10 produtos mais vendidos
  - Distribuição por forma de pagamento
  - Vendas por dia da semana

### Backup e Restore

- Exportação de todos os dados em JSON
- Importação para restaurar dados
- Validação de dados na importação
- Backup automático antes de restaurar

## 📖 Uso

### Primeiro Uso

1. Acesse o sistema no navegador
2. Configure o nome do negócio nas Configurações
3. Adicione produtos através do botão de gerenciamento
4. Inicie as vendas!

### Fluxo de Venda

1. **Buscar Produto**: Digite o nome ou código e pressione Enter
2. **Adicionar ao Carrinho**: Produto é adicionado automaticamente
3. **Ajustar Quantidades**: Use os botões +/- no carrinho
4. **Aplicar Cupom (opcional)**: Digite o código do cupom e clique em "Aplicar"
5. **Selecionar Forma de Pagamento**: Escolha entre Dinheiro, Pix, Crédito ou Débito
6. **Informar Valor Recebido** (se dinheiro): O sistema calcula o troco automaticamente
7. **Finalizar Venda**: Clique em "Finalizar Venda"
8. **Imprimir Cupom**: Use a impressão do navegador (Ctrl+P)

### Gestão de Caixa

1. **Abrir Caixa**: Clique no botão 💵 e informe o valor inicial
2. **Realizar Vendas**: O sistema rastreia automaticamente
3. **Fechar Caixa**: No final do dia, clique novamente no botão 💵
4. **Informar Valor Real**: Digite o valor real em caixa
5. **Verificar Diferença**: O sistema mostra a diferença calculada

## 🔧 Desenvolvimento

### Estrutura de Código

- **Modularização**: Código organizado em módulos lógicos
- **Separação de Responsabilidades**: HTML, CSS e JavaScript separados
- **Comentários**: Código documentado em português
- **Padrões ES6+**: Arrow functions, const/let, template literals
- **Tratamento de Erros**: Validações e mensagens de erro claras

### Adicionando Novas Funcionalidades

1. Estrutura HTML em `index.html`
2. Estilos em `styles.css`
3. Lógica JavaScript em `script.js` ou novo arquivo
4. Atualizar Service Worker se necessário
5. Testar em diferentes dispositivos

### Testes

- Testar em diferentes navegadores
- Testar em dispositivos móveis (responsividade)
- Testar funcionamento offline
- Testar PWA (instalação e uso)

## 🚀 Deploy

### GitHub Pages

#### Opção 1: Deploy na Raiz

1. **Fork do repositório** no GitHub
2. **Ativar GitHub Pages**:
   - Vá em Settings > Pages
   - Selecione a branch `main`
   - Selecione a pasta `/ (root)`
   - Salve
3. **Acesse**: `https://seu-usuario.github.io/vendaninja/`

#### Opção 2: Deploy em Subdiretório

Para fazer deploy em um subdiretório (ex: `pdv/`), consulte o guia [DEPLOY_SUBDIR.md](DEPLOY_SUBDIR.md).

**Exemplo**: Se o repositório for `aganimoto.github.io` e você quiser o PDV em `pdv/`:
- Estrutura: `aganimoto.github.io/pdv/`
- URL: `https://aganimoto.github.io/pdv/`

O sistema está configurado para funcionar automaticamente em subdiretórios usando caminhos relativos.

### Outros Serviços

- **Netlify**: Arraste a pasta para o Netlify Drop
- **Vercel**: Conecte o repositório GitHub
- **Servidor Próprio**: Faça upload dos arquivos via FTP/SFTP

### Configuração PWA

O sistema já está configurado como PWA. Para instalação:

- **Desktop**: Ícone na barra de endereços
- **Mobile**: Menu do navegador > "Adicionar à tela inicial"
- **iOS Safari**: Compartilhar > Adicionar à Tela de Início

## 📱 Progressive Web App (PWA)

O VendaNinja é uma PWA completa, oferecendo:

- **Instalabilidade**: Pode ser instalado como aplicativo nativo
- **Funcionamento Offline**: Service Worker cacheia todos os recursos
- **Experiência Nativa**: Interface similar a aplicativos nativos
- **Atualizações Automáticas**: Service Worker atualiza recursos em background
- **Ícone na Tela Inicial**: Ícone personalizado após instalação

## 🔒 Segurança e Privacidade

- **Dados Locais**: Todos os dados são armazenados localmente no navegador
- **Sem Servidor**: Nenhum dado é enviado para servidores externos
- **Backup Local**: Backups são arquivos JSON locais
- **Conexão HTTPS**: Recomendado para PWA (GitHub Pages oferece HTTPS)

## 🐛 Solução de Problemas

### Service Worker não registra

- Verifique se está usando HTTPS ou localhost
- Limpe o cache do navegador
- Verifique o console do navegador (F12)

### Dados não persistem

- Verifique se o navegador permite localStorage
- Verifique o console para erros
- Tente usar IndexedDB nas configurações

### Gráficos não aparecem

- Verifique conexão com internet (primeira carga)
- Verifique se Chart.js está carregando (console)
- Limpe o cache do navegador

### PWA não instala

- Verifique se está em HTTPS
- Verifique se o manifest.json está acessível
- Verifique se os ícones estão no lugar correto

## 📝 Licença

Este projeto está licenciado sob a Licença MIT com Crédito Obrigatório. Veja o arquivo [LICENSE](LICENSE) para detalhes.

### Crédito Obrigatório

Ao utilizar este código para criar outros sistemas, você deve dar crédito ao autor original na documentação do seu projeto:

```
VendaNinja © 2025 Eduardo Pires Tominaga | Open Source com ninjutsu brasileiro 🇧🇷
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: Abra uma issue no GitHub para reportar bugs ou solicitar features
- **Documentação**: Consulte [SETUP.md](SETUP.md) para guia detalhado
- **Melhorias**: Veja [MELHORIAS.md](MELHORIAS.md) para roadmap

## 🗺 Roadmap

Consulte o arquivo [MELHORIAS.md](MELHORIAS.md) para ver as melhorias planejadas e sugestões de desenvolvimento.

---

**VendaNinja © 2025 Eduardo Pires Tominaga | Open Source com ninjutsu brasileiro** 🇧🇷

*Desenvolvido com foco em simplicidade, performance e experiência do usuário para pequenos negócios brasileiros.*

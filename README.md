# 🗄️ DDL Table Deps

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)](https://developer.mozilla.org/docs/Web/JavaScript)

CLI em Node.js para analisar arquivos DDL (estrutura de banco de dados) e gerar **diagramas de relacionamentos** entre tabelas em formato [Mermaid](https://mermaid.js.org/) e **relatórios textuais** para uso rápido no terminal.

---

## 📌 Funcionalidades
✅ Analisa arquivos `.sql` contendo definições de tabelas e chaves estrangeiras.  
✅ Detecta relacionamentos diretos e indiretos (recursivamente).  
✅ Analisa também relações inversas (tabelas que referenciam a informada).  
✅ Gera dois arquivos:
- **`mermaid.md`** → diagrama Mermaid pronto para colar na documentação.
- **`resultado_analise.txt`** → relatório textual com todos os caminhos encontrados.

---

## 📦 Instalação

Clone o repositório:

```bash
git clone https://github.com/seu-usuario/ddl-table-deps.git
cd ddl-table-deps
````
# (Este script não tem dependências externas)

## 🚀 Uso
```bash
node ddl-table-deps.js <arquivo_ddl> <tabela_origem>
```

## 🛠 Tecnologias
- Node.js (>= 14)

## 📄 Licença
Distribuído sob licença MIT. Veja LICENSE para mais informações.

## 🤝 Contribuindo
Contribuições são bem-vindas!
Abra uma issue ou envie um pull request com melhorias e correções.

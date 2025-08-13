// ddl-table-deps.js
const fs = require('fs');
const path = require('path');

function normalizarNome(nome) {
    return nome.replace(/[\[\]`"]/g, '').toUpperCase();
}

// Parser simples para FOREIGN KEYS no DDL
function parseDDL(ddl) {
    const relations = {};

    // ALTER TABLE ... ADD CONSTRAINT
    const fkRegex = /ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+CONSTRAINT\s+[^\s]+\s+FOREIGN\s+KEY\s*\([^\)]+\)\s+REFERENCES\s+([^\s\(]+)/gi;
    let match;
    while ((match = fkRegex.exec(ddl)) !== null) {
        const fromTable = normalizarNome(match[1]);
        const toTable = normalizarNome(match[2]);
        if (!relations[fromTable]) relations[fromTable] = [];
        relations[fromTable].push({ from: fromTable, to: toTable });
    }

    // CREATE TABLE com FOREIGN KEY inline
    const createTableRegex = /CREATE\s+TABLE\s+([^\s\(]+)\s*\(([\s\S]*?)\)\s*;/gi;
    while ((match = createTableRegex.exec(ddl)) !== null) {
        const tableName = normalizarNome(match[1]);
        const tableDef = match[2];
        const inlineFkRegex = /FOREIGN\s+KEY\s*\([^\)]+\)\s+REFERENCES\s+([^\s\(]+)/gi;
        let fkMatch;
        while ((fkMatch = inlineFkRegex.exec(tableDef)) !== null) {
            const toTable = normalizarNome(fkMatch[1]);
            if (!relations[tableName]) relations[tableName] = [];
            relations[tableName].push({ from: tableName, to: toTable });
        }
    }

    return relations;
}

// Busca recursiva (direta ou inversa)
function collectRelations(startTable, relations) {
    const edges = new Set();
    const visited = new Set();

    function dfs(table) {
        if (visited.has(table)) return;
        visited.add(table);

        if (relations[table]) {
            for (const rel of relations[table]) {
                edges.add(`${rel.from}-->${rel.to}`);
                dfs(rel.to);
            }
        }

        for (const [from, deps] of Object.entries(relations)) {
            for (const rel of deps) {
                if (rel.to === table) {
                    edges.add(`${rel.from}-->${rel.to}`);
                    dfs(rel.from);
                }
            }
        }
    }

    dfs(startTable);
    return Array.from(edges);
}

// Caminhos "referenciadas por"
function collectPathsDown(startTable, relations) {
    const paths = [];
    function dfs(current, path) {
        if (relations[current]) {
            for (const rel of relations[current]) {
                const newPath = [...path, rel.to];
                paths.push(newPath);
                dfs(rel.to, newPath);
            }
        }
    }
    dfs(startTable, [startTable]);
    return paths;
}

// Caminhos "que referenciam"
function collectPathsUp(startTable, relations) {
    const paths = [];
    function dfs(current, path) {
        for (const [from, deps] of Object.entries(relations)) {
            for (const rel of deps) {
                if (rel.to === current) {
                    const newPath = [from, ...path];
                    paths.push(newPath);
                    dfs(from, newPath);
                }
            }
        }
    }
    dfs(startTable, [startTable]);
    return paths;
}

// ----------------- Programa principal -----------------
if (process.argv.length < 4) {
    console.error('Uso: node ddl-table-deps.js <arquivo_ddl> <tabela_origem>');
    process.exit(1);
}

const ddlFile = path.resolve(process.argv[2]);
const startTable = normalizarNome(process.argv[3]);

if (!fs.existsSync(ddlFile)) {
    console.error(`Arquivo não encontrado: ${ddlFile}`);
    process.exit(1);
}

const ddlContent = fs.readFileSync(ddlFile, 'utf8');
const relations = parseDDL(ddlContent);
const edges = collectRelations(startTable, relations);

// Gerar mermaid.md
const mermaidContent = [
    '```mermaid',
    'graph TD;',
    ...edges.map(e => `    ${e};`),
    '```'
].join('\n');

fs.writeFileSync('mermaid.md', mermaidContent, 'utf8');

// Gerar resultado_analise.txt
let analise = `Tabela analisada: ${startTable}\n`;

const downPaths = collectPathsDown(startTable, relations);
analise += `-- Tabelas referenciadas por ${startTable} --\n`;
if (downPaths.length === 0) {
    analise += '(Nenhuma)\n';
} else {
    downPaths.forEach(p => {
        analise += p.join(' > ') + '\n';
    });
}

const upPaths = collectPathsUp(startTable, relations);
analise += `-- Tabelas que referenciam ${startTable} --\n`;
if (upPaths.length === 0) {
    analise += '(Nenhuma)\n';
} else {
    upPaths.forEach(p => {
        analise += p.join(' -> ') + '\n';
    });
}

fs.writeFileSync('resultado_analise.txt', analise, 'utf8');

console.log('Análise concluída. Arquivos gerados:');
console.log(' - mermaid.md');
console.log(' - resultado_analise.txt');

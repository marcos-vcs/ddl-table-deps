#!/usr/bin/env node
const fs = require("fs");

if (process.argv.length < 4) {
    console.error("Uso: node ddl-table-deps.js <arquivo_ddl> <tabela_origem>");
    process.exit(1);
}

const [,, ddlFile, tableOrigin] = process.argv;
const ddlContent = fs.readFileSync(ddlFile, "utf-8");

// Regex para capturar tabelas e foreign keys
const tableRegex = /CREATE\s+TABLE\s+(\w+)/gi;
const fkRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(.*?\)\s+REFERENCES\s+(\w+)/gi;

const tables = new Set();
let match;

// Captura todas as tabelas
while ((match = tableRegex.exec(ddlContent)) !== null) {
    tables.add(match[1].toUpperCase());
}

// Mapeia relações
const references = {};     // tabela -> [referências diretas]
const referencedBy = {};   // tabela -> [tabelas que a referenciam]

while ((match = fkRegex.exec(ddlContent)) !== null) {
    const from = match[1].toUpperCase();
    const to = match[2].toUpperCase();
    if (!references[from]) references[from] = [];
    if (!referencedBy[to]) referencedBy[to] = [];
    references[from].push(to);
    referencedBy[to].push(from);
}

// Função recursiva para buscar todos os caminhos (DFS)
function dfsPaths(current, graph, visited = new Set(), path = []) {
    visited.add(current);
    path.push(current);

    const results = [];
    if (graph[current]) {
        for (const next of graph[current]) {
            if (!visited.has(next)) {
                results.push(...dfsPaths(next, graph, new Set(visited), [...path]));
            } else {
                results.push([...path, next]); // loop detectado
            }
        }
    }
    if (!graph[current] || graph[current].length === 0) {
        results.push([...path]); // fim do caminho
    }
    return results;
}

// Gera lista de caminhos formatados
function formatPaths(paths, separator = " > ") {
    const unique = new Set(paths.map(p => p.join(separator)));
    return [...unique].sort();
}

// Busca recursiva para tabelas referenciadas (filhos)
const referencedPaths = dfsPaths(tableOrigin.toUpperCase(), references);

// Busca recursiva para tabelas que referenciam (pais)
const referencingPaths = dfsPaths(tableOrigin.toUpperCase(), referencedBy);

// Gera saída Mermaid
let mermaid = "```mermaid\ngraph TD;\n";
for (const [from, tos] of Object.entries(references)) {
    for (const to of tos) {
        mermaid += `    ${from}-->${to};\n`;
    }
}
mermaid += "```";

// Salva arquivos
fs.writeFileSync("mermaid.md", mermaid);
let report = `Tabela analisada: ${tableOrigin.toUpperCase()}\n`;

report += "-- Tabelas referenciadas por " + tableOrigin.toUpperCase() + " --\n";
report += formatPaths(referencedPaths).join("\n") + "\n";

report += "-- Tabelas que referenciam " + tableOrigin.toUpperCase() + " --\n";
report += formatPaths(referencingPaths, " -> ").join("\n") + "\n";

fs.writeFileSync("resultado_analise.txt", report);

console.log("Arquivos gerados:");
console.log(" - mermaid.md");
console.log(" - resultado_analise.txt");

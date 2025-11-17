import { danger, warn, fail, message } from "danger";

message("🤖 O Bot analisou seu Pull Request. Aqui está o que encontrei:");

// 1. PR sem descrição
if (!danger.github.pr.body || danger.github.pr.body.length < 10) {
  warn("⚠️ A descrição do Pull Request está muito curta. Adicione mais detalhes.");
}

// 2. Detectar sobrecarga suspeita em serviços WCF
const serviceFiles = danger.git.modified_files.filter(f => f.endsWith("Service.cs"));
for (const file of serviceFiles) {
  const content = await danger.github.utils.fileContents(file);

  const methods = content.match(/public .*?\(/g) || [];
  if (methods.length > 1) {
    fail(`🚨 Possível *sobrecarga perigosa* detectada no arquivo **${file}**
Isso pode quebrar o WCF quando múltiplos métodos têm o mesmo nome.`);
  }
}

// 3. Avisar sobre mudanças críticas
const criticalFolders = ["Services", "Domain", "Business", "Repository"];
for (const file of danger.git.modified_files) {
  if (criticalFolders.some(folder => file.includes(folder))) {
    message(`🔎 O arquivo **${file}** está em uma camada crítica. Revisão especial recomendada.`);
  }
}

// 4. Detectar SELECT dentro de loops (padrão comum em MVC 5)
const possibleLoopQuery = /(foreach|for).*?\{[\s\S]*?(SELECT|From|Where)/i;
for (const file of danger.git.modified_files.filter(f => f.endsWith(".cs"))) {
  const content = await danger.github.utils.fileContents(file);

  if (possibleLoopQuery.test(content)) {
    warn(`⚠️ Possível consulta dentro de loop em: **${file}**  
Isso pode causar sérios problemas de performance.`);
  }
}

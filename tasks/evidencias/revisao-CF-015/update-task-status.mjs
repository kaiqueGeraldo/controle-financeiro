import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const rows = [
  ['tasks/01-datas-integracao/CF-009-estado-assincrono.md', 'R01/R02 reproduzem respostas obsoletas no retorno a uma seleção em cache. Cenários anteriores de logout/troca de usuário passam, mas não encerram o contrato de seleção.'],
  ['tasks/02-frontend/CF-010-componentes-comuns.md', 'R10 confirma sobreposição/recorte no tablet; R08 mostra consumidor com foco inadequado; R11 acrescenta quatro avisos de lint. R09 corrigiu seis seletores do harness sem alterar expected.'],
  ['tasks/02-frontend/CF-011-auth-configuracoes.md', 'R07 reproduz sobrescrita de rascunho no refetch do mesmo usuário. Registro e preferências têm evidência parcial integrada; os limites e o estado do roteiro visual constam do parecer.'],
  ['tasks/02-frontend/CF-012-dashboard-contas-extrato.md', 'R02 reproduz gráfico do período abandonado; R10 confirma problemas de geometria no tablet e R12 identifica ação mobile sem nome acessível. F-018 permanece aberto quanto ao escopo do total do extrato.'],
  ['tasks/02-frontend/CF-013-cartoes-planejamento.md', 'R03: pagamento fecha sem reconciliar após 503; R05: erro de leitura vira vazio; R06: POST de planejamento aceita categoria alheia e persiste; R08/R10: foco/layout. O PUT de planejamento saneado foi revalidado; isso não aprova criação ou pagamento.'],
  ['tasks/02-frontend/CF-014-metas-investimentos-habitos-resumo.md', 'R01/R04 reproduzem ano obsoleto e rascunho exibido como salvo sem persistir. P05 revalidado nos três fusos; posição histórica indisponível não encerra os defeitos de estado/nota.'],
  ['tasks/02-frontend/CF-015-revisao-marco-frontend.md', 'Revisão executada e parecer emitido com restrições. Marco não aprovado; achados de produto permanecem abertos. P03 (PUT), P04 e P05 revalidados no escopo dirigido; P01/P02 conservam dependência de adoção CF-017. Nenhuma publicação, banco real ou avanço para CF-016.'],
];
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf015-status-'));
let patch = '';
for (const [file, reason] of rows) {
  const footer = `\n## Parecer independente CF-015 — 14/09/2026\n\n${reason}\n\nEstado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.\n`;
  const base = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
  const change = text => text.replace(/- Estado: [^\r\n]+/, '- Estado: em_revisao').trimEnd() + '\n' + footer;
  const current = fs.readFileSync(path.join(root, file), 'utf8');
  if (current.includes('## Parecer independente CF-015')) throw new Error(`Já atualizado: ${file}`);
  // Preserva o restante do conteúdo preexistente no working tree.
  fs.writeFileSync(path.join(root, file), change(current));
  // Patch de staging independente: somente status/parecer sobre HEAD,
  // sem incorporar as notas de implementação alheias ainda não commitadas.
  fs.writeFileSync(path.join(temp, 'before'), base);
  fs.writeFileSync(path.join(temp, 'after'), change(base));
  const result = spawnSync('git', ['diff', '--no-index', '--no-ext-diff', '--', 'before', 'after'], { cwd: temp, encoding: 'utf8' });
  if (result.status !== 1) throw new Error(result.stderr || 'Diff inesperado');
  patch += result.stdout.replace(/^diff --git .+$/m, `diff --git a/${file} b/${file}`)
    .replace(/^--- .+$/m, `--- a/${file}`).replace(/^\+\+\+ .+$/m, `+++ b/${file}`);
}
fs.writeFileSync(path.join(here, 'tasks-status.patch'), patch);
console.log('Atualizados sete status/pareceres; patch seletivo preparado, staging não alterado.');

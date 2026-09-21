import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const tasks = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entries = {
  '01-datas-integracao/CF-008-erros-e-contratos.md': 'R06: criação, edição e cópia de planejamento validam a propriedade da categoria no backend antes de persistir. Integração com dois usuários e PostgreSQL observa sucesso legítimo, 404 e ausência de persistência parcial.',
  '01-datas-integracao/CF-009-estado-assincrono.md': 'R01/R02: a seleção invalida requisição antiga inclusive no cache hit. Foram ampliados os cenários A→B→A, sucesso/erro tardio, troca de sessão e desmontagem. A reconciliação financeira aguarda os consumidores afetados.',
  '02-frontend/CF-010-componentes-comuns.md': 'R08: modal comum e detalhe de fatura compartilham foco, Tab/Shift+Tab, Escape no topo e retorno em diálogos aninhados. R10 ajusta geometria e sidebar; R11 remove os quatro avisos do double. R09 foi preservado.',
  '02-frontend/CF-011-auth-configuracoes.md': 'R07: perfil conserva rascunho no refetch do mesmo usuário; cancelar/reabrir e troca de identidade têm regressão. Não houve alteração no contrato de autenticação.',
  '02-frontend/CF-012-dashboard-contas-extrato.md': 'R02: gráfico ignora respostas obsoletas, inclusive após cache hit. R10 ajusta grades/controles/valores; R12 nomeia a ação mobile. Dashboard e contas participam da releitura após pagamento e apresentam falha quando não atualizados.',
  '02-frontend/CF-013-cartoes-planejamento.md': 'R03 distingue recusa, confirmação com releitura pendente e resultado desconhecido; recovery não repete POST. A proteção backend contra fechamento repetido/concorrente é localizada e não encerra CF-024. R05 explicita indisponibilidade; R06 protege categorias em todos os writers investigados; R08/R10 tratam foco e geometria.',
  '02-frontend/CF-014-metas-investimentos-habitos-resumo.md': 'R01/R04: resumo e nota respeitam ano/sessão/versão enviada. Refetch e falha preservam rascunho, confirmação tardia não fecha edição posterior e texto confirmado é verificado após HTTP/reload/PostgreSQL. Metadados e contrato temporal foram preservados.',
  '02-frontend/CF-015-revisao-marco-frontend.md': 'Saneamento dos achados R01–R12 executado como preparação de candidato. O relatório por achado, execuções, limites, commits e intervalo exato para revalidação estão no registro abaixo. Esta execução não é revisão independente nem aprovação do marco.'
};
for (const [relative, text] of Object.entries(entries)) {
  const file = path.join(tasks, relative);
  const before = fs.readFileSync(file, 'utf8');
  const title = '## Candidato de saneamento CF-015 — 21/09/2026';
  if (before.includes(title)) throw new Error(`Section already exists: ${relative}`);
  fs.writeFileSync(file, before.trimEnd() + `\n\n${title}\n\n${text}\n\n[Registro do saneamento e evidências](../evidencias/saneamento-CF-015/README.md).\nEstado mantido em_revisao; fechamento depende de nova revisão independente.\nCF-016 não iniciada. P01/P02/CF-017 mantém adoção temporal pendente; testes\nsintéticos não certificam migração ou publicação. O parecer anterior permanece\npreservado como registro histórico.\n`);
}

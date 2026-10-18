# Revalidação independente — 18/10/2026

Candidato eb41301..5e2fae5355ad2c745b955b66d676b6c479edf8e1, branch
codex/cf022-investigacao. HEAD exato; staging vazio; README raiz modificado e
.cf22/.cf22s preexistentes. Hash README confere com o informado pelo usuário.
AGENTS fornecido na conversa; nenhum AGENTS adicional encontrado no repositório.
Política/execução e aceites anteriores continuam aplicáveis; nenhum subagente.

Critérios 1–3 preservados pela matriz da revisão anterior. Verificação do critério4:

| Parcela | Expected independente | Verificação planejada |
|---|---|---|
| RJ: calendário sem distorção | Date fixo antes da navegação; timers/performance/rAF nativos, animação não negativa; reload e contexto novo sem vazamento | Teste Node candidato com helper real e instalação antiga em processos separados; antigo deve falhar por relógios, novo passar |
| RJ: caminho real | UI diário/semanal, SP/Kiritimati, produto04/01/2027, progresso0→1→0, reload e SQL | Uma execução integrada com preparação explícita da compilação antes das jornadas; browser.cjs intacto |
| H24: isolamento | Cada método começa vazio; volume→callback→callback→volume não herda dados; workers usam schema do método | Quatro casos candidatos através de subclasse observadora de conexões/worker e fechamento de contexto/pool/scheduler |
| H24: sensibilidade | Retirar isolamento deve falhar pela herança501, sem mudar produto/10s | Subclasse mutante AFTER_CLASS, dois casos; uma falha de precondição esperada |
| Consumidores reais | Novo contexto não invalida casos originais nem browser | 27 casos originais porque setup mudou para todos; browser usa initializer compartilhado |
| Volume residual | 2→1006→2 somente na fixture específica; não SLA | Conferência de hashes/assertions/logs do candidato e prova independente anterior; não repetir o estresse residual sem lacuna nova |
| Evidências | Falhas preservadas, diffs e assertions sem relaxamento, nenhum produto modificado | Manifestos, análise do timeout residual e compilação fria, sintaxe/lint CJS e compilaçãoJava; sem TS alterado |

Experimentos sequenciais. Sem suites de outros domínios. Runtime novo .cf22r,
sem tocar .cf22/.cf22s/targets antigos; dados exclusivamente Testcontainers com
mocks de email/mercado. Não executar preparadores antigos que sobrescrevem provas.
Não aumentar prazos, suprimir animações ou repetir até verde. Falhas do observador,
se ocorrerem, terão versão inicial/log preservados antes de corrigir somente o probe.

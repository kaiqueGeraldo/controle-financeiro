# Aceite independente do residual RC031-02 — 22/10/2026

**RC031-02 encerrado. CF-031 concluida exclusivamente no escopo local autorizado
pela DEC-ONB-03. RC031-01 permanece encerrado.**

Candidato `9d80d2ec3bdb8fe6399d8f5ab1c58db7558f206b`, base75ede48, commits
d338b0f/9d80d2e, branch `codex/cf031-onboarding-frontend`. Cinco arquivos de
produto alterados pelo saneamento e um arquivo novo de testes. Nenhuma correção
de produto nesta revisão; nenhuma delegação ou troca de modelo/esforço.

| Decisão | Conclusão |
|---|---|
| A — Dois probes residuais | Resolvidos; nove probes intactos passam. Sete já passavam, somente dois eram vermelhos. |
| B — Coerência dos consumidores | Sustentada em validação, duplicatas, comparação canônica, seleção, rótulos, aliases e dados de metas. |
| C — Aceites anteriores | Preservados: RC031-01, contratos financeiros, recuperação/efeito único e demais critérios já sustentados; nenhuma regressão concreta encontrada neste recorte. |
| D — RC031-02 | Encerrado, incluindo o residual. Contraprova causal reintroduz a divergência e falha; controle restaurado passa. |
| E — CF-031 | Aceite independente local, conforme DEC-ONB-03. Não equivale a liberação para uso real. |

160/160 dirigidos,9/9 probes residuais e controles intactos,7/7 probes anteriores,
4/4 controles independentes adicionais; seis testes temporais em três fusos.
Lint, typecheck e build exit0. Contraprova:6 falhas/16 passes entre22 selecionados;
149/149 antes/restaurado,210 arquivos idênticos por hash. Esses conjuntos se
sobrepõem; não somar como casos independentes.

[Contrato e matriz dos consumidores](CONTRATO-MATRIZ.md) ·
[Execuções, seleção, preservação e limites](EXECUCOES.md).

Reprodução histórica confirmada em objetos em memória. O JSON bruto atual não
produz a herança usada no residual; não foram demonstrados ataque remoto,
poluição global ou corrupção do banco. Corrigir a divergência contratual não
altera essa conclusão de exposição.

T01/T02 de carregamento/sessão continuam historicamente inconclusivas e não
bloqueantes por si, com os gatilhos registrados no parecer anterior. Não foram
declaradas resolvidas por associação. Zoom nativo200% em CF-010/015 e adoção real
CF-017/P01/P02 continuam pendentes; nenhum aceite de zoom foi concedido.

CF-032 permanece **proposta e não executada**. CF-021/022/023/024/026 constam
concluídas e, com este aceite de CF-031, as dependências funcionais estão satisfeitas
nesta branch. O lote ainda não está integrado em main (`merge-base --is-ancestor
d338b0f main` retorna1). Prontidão para planejar a próxima execução local, condicionada
à integração/conferência da base escolhida; não é liberação automática nem remoção
de gates. Próximo passo: integrar o lote aprovado sob autorização própria e então
iniciar CF-032 com sua matriz e gates, sem reabrir a revisão geral de CF-031.

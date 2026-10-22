# Revalidação independente RC031-01/02 — 22/10/2026

**CF-031 permanece em_revisao. RC031-01 encerrado; RC031-02 parcialmente saneado, ainda aberto/P2.**

Candidato examinado: `44e8fee154a5023be1e441c42884ab4c62de47e6`, base `e1f5048`,
branch `codex/cf031-onboarding-frontend`. Commits 78ea4be/d5df92b/34be811/44e8fee.
O produto não foi alterado nesta revisão. Modelo/esforço sugeridos no cabeçalho
da tarefa são metadados; não houve troca de modelo nem delegação.

## Decisões separadas

| Recorte | Decisão e fundamento |
|---|---|
| A — RC031-01 | Encerrado. Soma exata dos livres do próprio snapshot, estados de conhecimento e limites preservados; adulterações rejeitadas no parser e navegador após commit real. |
| B — RC031-02 | Aberto/P2 residual. Os dois casos originais foram corrigidos, mas uma identidade herdada ainda pode prevalecer sobre a identidade própria validada e contornar unicidade das partes. [Reprodução e limites](ACHADO-RESIDUAL.md). |
| C — Recuperação | Aprovada no alcance testado: intenção preservada em complete/GET inválidos, replay idêntico e um único efeito; recuperação por GET sem novo comando financeiro. |
| D — Carregamento/sessão | Causa histórica inconclusiva; não bloqueante por si nesta revalidação. [Critérios e reabertura](CONSUMIDORES.md). Não encerrada por passagem verde. |
| E — CF-031 | Manter em_revisao pelo requisito de identidade própria ainda não atendido. Preservados os demais aceites sustentados e a DEC-ONB-03. |

138/138 testes dirigidos; 7/7 probes originais intactos; **7/9 controles adicionais**,
com duas falhas de assertion que expõem o mesmo residual. Integração real 12/12,
12 checkpoints SQL, incluindo quatro cenários mobile com observação de950 visível.
Duas mutações detectadas; controle127/127 antes/restaurado,209 arquivos idênticos.
Lint, typecheck, build e seis regressões temporais aprovados.

Não somar essas contagens como provas independentes:127 é subconjunto de138,
mobile4 é subconjunto de12; os sete probes já incluem quatro controles que eram
verdes. As duas falhas novas são intencionais no sentido de manter o expected
normativo, não de esperar o comportamento incorreto como sucesso.

[Matriz e execuções](MATRIZ.md) · [Consumidores, SQL, visual e limites](CONSUMIDORES.md).
Logs, capturas, relatórios Java e configuração estão nesta pasta. As evidências
históricas permanecem nas pastas anteriores, sem sobrescrita.

CF-032 continua proposta, sem prontidão: CF-021/022/023/024/026 estão concluídas,
mas falta o aceite de CF-031 e a integração das dependências na futura base.
Não foi executada nem teve gates alterados. Zoom nativo200% continua em CF-010/015;
adoção real CF-017/P01/P02 e deploy conservam gates. Não há push, merge ou banco real.

Próximo passo: saneamento delimitado da identidade de referências lidas, com os
dois novos probes como critérios, mantendo os controles JSON e as variantes válidas.
Depois, revalidação dos consumidores atingidos; não reiniciar a auditoria geral.

# Revalidação independente residual RF15 — 13/10/2026

Base efetivamente examinada: `cdf00606bf1ebc11d37ed0de405569632f9e8b8d..a991114d91bca5160338b5a7f1db1b8caa5b39c2`, branch `codex/cf-028-contrato-onboarding`. Base ancestral, candidato era HEAD sem commits posteriores. Staging inicial vazio; única alteração preexistente era README.md da raiz, preservada fora dos commits (SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`). Produto não alterado nesta revisão.

**RF15-02 e RF15-04 encerrados. CF-012 concluída.** Encerrados também os resíduos originais de Escape/semântica/foco de metas e hábitos, retorno do investimento e envio indevido ao editar hábito. RF15-01/03 e CF-011 conservam seus aceites. O fechamento do resíduo original de investimento não concede aceite integral à CF-014: uma execução tardia de A fecha o formulário de B, P2 confirmado no recorte adicional do ciclo visual (vínculo RVR24-02).

| Tarefa | Estado resultante | Fundamento/obstáculo específico |
|---|---|---|
| CF-010 | em_revisao | Zoom nativo 200% não verificado; privacidade e foco compartilhado aceitos nos recortes comprovados |
| CF-011 | concluida, preservada | Nenhuma regressão concreta |
| CF-012 | concluida | Datas, moeda/privacidade, erro/retry, filtro/página/total e evidências comprovados pela combinação de aceites anteriores e RF15-02/03 |
| CF-013 | em_revisao | Temporalidade aceita; RVA-03 continua inconclusivo na recuperação após commit |
| CF-014 | em_revisao | P2 de resposta tardia A→B; ocorrência visual de histórico invisível ainda sem causa estabelecida |
| CF-015 | em_revisao | Zoom, RVA-03 e resíduos específicos CF-014 impedem aceite integral do marco |

Não restam somente verificações faltantes: há um defeito P2 confirmado. A liberação dos componentes necessários à CF-012 não aprova integralmente a CF-010. RJ-022-01/H24-01 e a investigação histórica de descrição de hábito >255 caracteres não foram encerrados por associação.

- [Matriz de critérios e causas](MATRIZ.md)
- [Achado, impacto e encaminhamento restrito](ACHADOS.md)
- [Execuções, falhas intermediárias e comandos](EXECUCOES.md)
- [Inspeção visual e limites](VISUAL.md)
- [Correção do próprio probe e delimitação do contrato](PROBE-LIFECYCLE.md)

Integridade anterior: 160 provas independentes, 267 artefatos do executor e 18 fontes conferidos, sem divergência (`hash-check.json`). Logs/traces novos têm credenciais sintéticas expurgadas; `sanitization.json` registra hashes antes/depois. `EVIDENCE-SHA256.json` descreve bytes publicados locais, excluindo a si próprio; Git pode normalizar finais de linha. Evidências históricas não foram sanitizadas ou reescritas.

Não houve auditoria global, alteração de banco real, implementação de onboarding, push ou deploy. Próximo trabalho: corrigir somente a vinculação dos callbacks ao ciclo visual da operação A/B e comprovar sucesso/falha tardios sem duplicação; zoom apenas com capacidade nativa suportada, RVA-03 apenas com hipótese nova. A ocorrência de opacidade exige observação dirigida do ciclo de animação se reaparecer, sem repetir pagamentos.

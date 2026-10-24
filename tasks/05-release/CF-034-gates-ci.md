# CF-034 — Consolidar gates de CI reproduzíveis

- Estado: pronta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-015](../02-frontend/CF-015-revisao-marco-frontend.md), [CF-026](../03-integridade/CF-026-lint-tipagem-frontend.md), [CF-032](../04-onboarding/CF-032-e2e-financeiro.md), [CF-033](../05-release/CF-033-revisao-adversarial.md)
- Origem: T-011; F-012, F-014, F-017

## Liberação exclusivamente local — 24/10/2026

[DEC-CI-04](../../docs/sdd/decisoes/004-liberacao-local-CF-034.md) aprova expressamente
PROP-CF034-01/A: infraestrutura e provas locais de CI, sem aceite integral ou uso.
Estado pronta somente nesse recorte; CF015 continua em_revisao por zoom nativo200%.
Scripts compartilhados `.github/scripts/` e adaptadores/testes do harness são
extensão delimitada para evitar comandos divergentes entre local e CI.
Implementação local deve terminar em_revisao e passar por revisão independente.
Resultados de runner remoto e pacote publicado não são inferidos de execução local.
CF010/015, CF017/P01/P02 e sucessoras conservam os gates; DEC-ONB-03 não foi ampliada.

## Análise anterior da dependência — 24/10/2026 (sem execução)

[Matriz e PROP-CF034-01 pendente](../evidencias/CF015-zoom-gate-CF034/README.md),
base `e1a01b6` integrada/publicada. CF026/032/033 conservam aceites locais; CF015
continua em_revisao por zoom nativo200%, sem liberação específica desta aresta.
Limitação atual de controle da URL impede captura/input de zoom; não prova
defeito. Estado proposta, dependência e checkboxes preservados. Nenhuma execução
ou implementação CF034 nesta análise. O recorte futuro de CI local aguarda
decisão explícita, sem autoaplicar DEC-ONB-03 ou liberar uso/deploy/banco real.

A inspeção atualiza a premissa histórica abaixo: workflow backend já chama
`verify` sem skipTests; Dockerfile ainda empacota com skipTests. Configuração
lida não comprova execução de suíte/CI ou vínculo entre pacote e revisão testada.

## Problema e resultado esperado

CI atual compila backend com testes ignorados. As suítes precisam impedir regressões no código integrado, com artefatos úteis e execução isolada.

## Escopo e referências

- `.github/workflows/`
- `controle-financeiro-backend/Dockerfile`
- `controle-financeiro-backend/pom.xml`
- `controle-financeiro-frontend/package.json`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Adicionar/ajustar gates progressivos de lint/typecheck/test/build, PostgreSQL e E2E com cache de dependências, nunca de resultado inválido.
2. Remover skipTests do gate backend quando suíte isolada estiver pronta; documentar relação entre imagem e revisão já validada.
3. Configurar triggers para mudanças compartilhadas de testes/config; publicar logs/traces sanitizados e separar smoke crítico de matriz ampliada.

## Aceite e testes adversariais

- [ ] Regressão real numa regra/data faz pipeline falhar e bloqueia avanço; validar configuração numa execução real quando acesso disponível.
- [ ] Checkout limpo roda sem segredos de produção e finaliza processos/banco; teste flaky não fica verde só por retry.
- [ ] Build e pacote publicados correspondem à revisão testada; resultado remoto não executado é declarado pendente.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Remover testes para acelerar pipeline, desabilitar lint ou mudar configurações externas sem identificar projeto.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-034/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


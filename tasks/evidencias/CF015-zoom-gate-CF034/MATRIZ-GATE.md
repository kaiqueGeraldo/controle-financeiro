# Gate CF015 → CF034 — snapshot de 24/10/2026

Base integrada/publicada: `e1a01b6`. Arquivos individuais são canônicos; este
snapshot não concede prontidão nem substitui seus estados.

## Obrigação real e aceites acumulados

O primeiro aceite da [CF010](../../02-frontend/CF-010-componentes-comuns.md)
exige: em 360px, zoom 200% e teclado, ações essenciais alcançáveis e ausência de
sobreposição de texto/valores/botões. A
[SPEC003/AC-UI-001](../../../docs/sdd/specs/003-criterios-oracles.md)
explicita V-LONG, token sem espaços, modal rolável, confirmar/cancelar por
scroll/teclado, foco contido/retorno e acesso ao texto completo. Zoom nativo
continua sendo a parcela faltante; não invalida os outros aceites já obtidos.

[CF015](../../02-frontend/CF-015-revisao-marco-frontend.md) conserva quatro
critérios documentados como atendidos, mas a revisão integral incorpora o aceite
compartilhado da CF010. Os pareceres vigentes mantêm ambas `em_revisao` por zoom,
sem defeito de produto demonstrado. A aprovação futura exige prova e parecer do
conjunto, não só trocar checkboxes. Foco/scroll/privacidade compartilhados têm
[aceite residual próprio](../revalidacao-residual-RF15/README.md); os resíduos de
CF014 foram encerrados no
[parecer de histórico](../revalidacao-CF014-historico-invisivel/README.md);
CF013/RVA03 no [parecer de 16/10](../revalidacao-CF019-RVA03/README.md).
CF011/012 e CF005–009 conservam seus aceites nos recortes registrados. Nenhuma
nova falha os reabre nesta análise.

A [DEC-ONB-03](../../../docs/sdd/decisoes/003-liberacao-local-CF-031.md)
autorizou **CF031 local**, incluindo reavaliação futura com onboarding antes do
uso. Não libera CF034. Suas exigências de prova/escopo continuam na
[matriz de zoom](MATRIZ-ZOOM.md).

## Dependências da CF034 conferidas

| Origem | Aceite e integração disponíveis | Mudanças/limites para o próximo recorte |
|---|---|---|
| CF015 | Marco em revisão; demais aceites acumulados preservados | Falta AC-UI-001 nativo 200% e parecer integral. Sem liberação específica CF034 vigente |
| CF026 | Concluída; [parecer independente de 03/10](../revisao-CF-025-CF-027-RV24/README.md), candidato06c1a51; aresta CF034 explicitamente satisfeita no recorte | Há alterações posteriores no produto/harness; não alegar que a baseline de outubro inicial comprova HEAD atual. CF033 registra lint/tipos/build posteriores; CF034 deve repetir os gates na revisão que executar |
| CF032 | Concluída localmente; [aceite independente](../revalidacao-CF-032/README.md), candidato864a3c7 e parecer integrado bfb6c61 | Jornadas/SQL/reload/isolamento/exportação têm evidências locais; não equivalem a CI Linux limpo. CF033 examinou integração posterior; selecionar e executar explicitamente os testes no futuro CI |
| CF033 | Revisão concluída e CF033-01 encerrado; [parecer independente](../revalidacao-CF033-01/README.md), candidato d059bc9, provas6409e4a/parecer e1a01b6 integrados | Delta de quatro arquivos de produto e provas conferido, sem trabalho posterior no início. Aceite local; desempenho/rollout/produção continuam limitados. `verify -DskipTests` histórico comprova pacote, não nova suíte/CI |

Os commits citados são ancestrais da base integrada, conferidos na leitura dos
intervalos. Ancestralidade sustenta presença, não amplia seus aceites. O lote
CF033 não altera workflow, Dockerfile, POM, package.json nem produto frontend.
Não foi encontrada regressão concreta que exija reabrir a revisão financeira.

## Critério CF034 → capacidade → trabalho e condição

| Critério integral CF034 | Dependência concreta | Evidência disponível | Trabalho tecnicamente independente a executar em tarefa futura | Aceite condicionado |
|---|---|---|---|---|
| 1. Regressão real regra/data faz pipeline falhar e bloquear avanço; execução real quando acesso disponível | Suítes sensíveis CF015/026/032/033; runner e seleção efetiva de testes | Mutações/controles aceitos nos pareceres, YAML e harness atuais inspecionados; nenhuma execução CI nova aqui | Definir smoke/matriz; executar localmente e demonstrar negativo por regra em cópia isolada; configurar dependências dos jobs e logs | Efetividade do pipeline exige prova da configuração executada; zoom continua pendente e não deve ser apresentado como coberto por pipeline. Marco CF034 integral requer gate CF015 ou decisão explícita de recorte |
| 2. Checkout limpo sem segredos de produção; processos/banco finalizados; retry não mascara flaky | Ambiente CF002/003; PG descartável; isolamento e cleanup dos harness CF032/033 | Testcontainers/harness locais históricos e rejeição de URL não local na config E2E; não equivalem a runner limpo | Preparar execução externa isolada, instalação por lockfile, serviços sintéticos, encerramento também em falha, retries0 e relatório de falha inicial | Reprodutibilidade depende da execução real e verificação de cleanup, não só YAML. Uso de banco real continua vedado; falta de zoom não impede tecnicamente este experimento |
| 3. Build/pacote publicados correspondem à revisão testada; remoto não executado declarado | AC-UI-014, identidade SHA/artefato, dependências de jobs e política de publicação | Scripts/workflows lidos; backend verify já sem skip; Dockerfile ainda package com skip; nenhum vínculo novo atestado | Planejar SHA único, pacote/digest e relação com suíte executada; ensaio local de build no mesmo checkout; proposta de promoção separada | Empacotar sem testes não substitui suíte; sem publicação nova autorizada não comprovar artefato publicado/runner remoto. Aceite CI não libera deploy ou dados reais |
| 4. Evidências/limites registrados; sem testes enfraquecidos | Política de testes e revisão independente | Evidências CF026/032/033 e presente bloqueio de ferramenta | Manter matriz por comando/caso/commit, falhas iniciais, artefatos sanitizados e limites; revisar filtros/exclusões e assertions | Registro é parte do aceite; não transforma cenários sem execução em aprovados nem autoriza ignorar zoom |

## Inspeção estática da configuração atual (sem executar CF034)

- `.github/workflows/ci-backend.yml` já executa `./mvnw --batch-mode clean verify`
  com Temurin21. A frase inicial da CF034 sobre CI ignorar testes é histórica.
  **Nenhum clean foi executado nesta tarefa.** Não se remove um skip inexistente.
- `controle-financeiro-backend/Dockerfile` ainda usa `mvn clean package -DskipTests`.
  Futuro CI precisa provar a relação entre esse pacote e a revisão testada; trocar
  Dockerfile por si só não comprova a relação.
- Frontend atual executa `npm ci`, `npm test` e build com Node24/BACKEND_API_URL;
  faltam passos explícitos lint/typecheck/component/E2E no workflow lido.
- Backend filtra push por backend/workflow; pull_request só backend. Mudanças
  compartilhadas de testes/docs/oráculos/config devem ter triggers examinados;
  o filtro de PR não inclui o próprio YAML backend. Frontend contempla seu YAML,
  mas não há gate integrado E2E entre os dois workflows.
- POM declara Java21/enforcer; não há seleção explícita do harness
  `FinancialJourneyPostgresE2E` no workflow. O script CF033 chama essa classe
  nominalmente e depende de caminhos locais/Windows/target. Isso é trabalho de
  portabilidade/seleção a comprovar, **não afirmação de que verify rodou E2E**.
- Cache de dependências está configurado (Maven/npm); não há prova de runner,
  artefatos ou cleanup nova nesta tarefa. Configuração lida não é resultado remoto.

## Efeito do gate

Tecnicamente, lint, tipagem, sensibilidade de testes, isolamento de PostgreSQL e
proveniência de pacote não dependem de ampliar a página. O bloqueio é de
**prontidão formal integral** pela dependência canônica CF015, não impossibilidade
técnica desses ensaios. Sem decisão/liberação específica, CF034 permanece
`proposta`, não iniciada. Este pedido só autoriza a análise/preparação documental.

Impedir todo trabalho local adia ganhos de detecção sem evidência de defeito de
zoom; liberar uso sem essa prova arrisca controles inacessíveis, erro recortado ou
conteúdo ilegível para quem precisa ampliar a página. A proporcionalidade é
separar os ensaios locais da homologação/uso, com gate visível e responsável.
Essa separação está **proposta**, não aprovada, em [PROP-CF034-01](PROPOSTA.md).

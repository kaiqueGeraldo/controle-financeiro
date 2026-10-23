# Execuções, bases e preservação

Runtime novo exclusivo:
`../controle-financeiro-runtimes/CF-032/revisao-20261023-01`.
Preparado com prepare.ps1 do candidato, build padrão Next aprovado; next.config
da cópia define raiz comum para junction, sem alteração de produto. `product-source.json`
compara484 fontes: nenhuma diferença. Não há edição de src produto nesta revisão.

## Resultados novos

| Execução | Seleção/objetivo | Resultado |
|---|---|---|
| run-01 | B,C,E,E2,G,H,K,L; quatro achados + reconciliação, legado, replay e isolamento |4 passaram/4 falharam C/E2/K/L; Maven exit1 pelo agregado Playwright |
| run-02-supplemental | R1 permissões legítimas; R2 nova sessão e seleção sem ticker |R1 passou; R2 falhou só no disponível950≠656, completou navegação por2 UUIDs |
| run-03-reservations | OnboardingReservationsTest, inclusão de E32 exclusão comprovada, múltiplas pendências e parcial |9/9 aprovados em PostgreSQL; integração direta, não E2E |
| run-04-api-time | R3 entrada/resposta/GET/SQL/XLSX |Falhou somente na exportação12:34≠12:34:56; entrada/API/GET/SQL preservam segundos |
| auditoria Decimal/OOXML | audit.py sobre run10 histórico e run01 novo |8 checkpoints por execução,4/3 arquivos lidos; truncagem classificada sem usar helper de produto |
| qualidade | build Next, compilação Java, lint src+cf032, typecheck,6 testes temporais×3 fusos |Aprovados; ver build.log/checks.json/temporal.log |

R1/R2 estão em supplemental.ts e R3 em temporal-api.ts. Foram acrescentados
somente ao journeys.spec.ts da cópia; originais do repositório intactos. R2 usa
assertion soft para preservar a falha e permitir investigação de seleção; não
altera expected nem torna a suíte verde. Nenhuma falha nova de observador exigiu
correção/retry. O resultado vermelho dos cenários conhecidos é evidência, não falha
de ambiente. Não houve aumento de timeout, skip, expectedFailure ou retry.

Exemplo reproduzível (PowerShell na raiz; usar diretório novo inexistente):

```powershell
./controle-financeiro-frontend/tests/cf032/prepare.ps1 -RuntimeRoot <runtime-novo>
# Na pasta frontend da cópia: node node_modules/next/dist/bin/next build
./controle-financeiro-backend/src/test/cf032/run.ps1 -RuntimeRoot <runtime-novo> -Evidence <evidencia-nova> -Grep '(B uso|C relatório|E legado|E2 fonte|G |H dois|K limite|L investimento)'
# Para os probes: acrescentar supplemental.ts/temporal-api.ts ao journeys.spec.ts
# da cópia e selecionar 'R1 controle|R2 nova|R3 horário' com outra evidência.
```

Auditoria: Python padrão `audit.py <diretorio-run> <saida.json>`. Executado com
Python do runtime fornecido pelo aplicativo. Não gera nem modifica XLSX.
Script de auditoria exige presença de B/C, portanto não usar diretamente em run04.

## Ambiente efetivo

Run01: Next127.0.0.1:3142; Spring61030; PostgreSQL16-alpine mapeado52364→5432,
contêiner291c3fe076bc. `active-containers.txt` complementa environment.json;
PID Java60792 consta em maven.log. A tentativa de capturar listeners ativos não
produziu artefato e não é usada como prova. Banco cf_test_59aef96ccd064d06aaff604026926739, schema
cf032_ffc631b5b3f9492a95319ba0282ac8fe,16 migrações bem-sucedidas, ddl validate.
Cada nova execução cria seu banco/schema/namespace; ver environment de cada uma.
JVM UTC após startup São Paulo, Clock de domínio São Paulo e navegador SP;
três fusos temporais também reexecutados em unitários. Não alegar nova execução
E2E T0–2, viewport/temas/zoom completos.

Leitura inicial de Docker/CIM no sandbox recebeu acesso negado; leitura posterior
autorizada pela ferramenta registrou o mapeamento Docker. Não houve rejeição de aprovação
automática nem fallback para banco remoto. Scripts de execução e build externos
foram autorizados pela ferramenta. Sem acesso a banco real ou credenciais remotas.

## Auditoria do histórico

run10 Playwright:13 distintos,9 aprovados/4 falhas. A e F/T0–2 não foram reexecutados:
seus scripts, resultados e dados históricos sustentam o alcance registrado;
nenhuma mudança de produto ocorreu desde a base. Runs01–09 não são novos cenários
independentes. Correções de harness estão descritas em CF-032/README e ACHADOS desta
revisão, inclusive K-result prematuro no run08, refutado pelo próprio Playwright.

40 controles PostgreSQL: XMLs conferidos11+7+9+8+5,0 falhas/erros;
`historical-controls.json`. Executados em HEAD065c609 na cópia controls: fontes de
produto idênticas ao candidato, testes cf032 posteriores não mudam esses controles.
Os9 repetidos nesta revisão são subconjunto dos40, não49 controles distintos.
Seis unitários temporais históricos em3 fusos e os novos não são18 ou36 casos.
Logs históricos de lint/typecheck/build e scripts conferidos; logs vazios isolados
não provam êxito, por isso lint/tipos/build foram novamente executados.

Quatro contraprovas históricas analisadas pelos erros concretos e patches:
owner produz nome alheio na UI; duplicate-credit produz1020 em vez de1010;
export-value produz250.11 em vez de250.10; export-date produz23 em vez de22.
`mutation-observations.json` preserva os erros extraídos. Hash antes=restaurado
em results.json; restored-comparison mostra H verde e C apenas com falha de segundos
original. Mutantes de valor/data são detectados por invariantes adicionais,
não apenas pela falha prévia de C. Manifesto de fontes restauradas sem diferenças.
Não executar mutações novamente: fonte e oracles relevantes intactos, falhas causais
documentadas e nova execução de controle confirma o mesmo baseline. Essa escolha
evita repetir runtimes históricos sem lacuna concreta. Não há mutation score global.

## Preservação e limites

README raiz SHA256 inicial e final:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Arquivo permanece modificado e fora dos commits. Runtimes20261022-01/02/03/controls
preservados, sem execução/limpeza/remoção; somente o novo runtime recebeu escritas.
Manifestos e fontes históricas foram lidos para auditoria, não restaurados.

Sem certificação de desempenho, EXPLAIN/carga, todos interleavings, cache distribuído,
restart completo, zoom200%, todos temas/privacidade ou migração real. IDs de fixtures
são sintéticos; relatórios Surefire sanitizados pelo runner. Artefatos intermediários
e erros preservados. Staging explícito e commits locais separam provas de parecer e
estado; commit de provas25e92c2. O histórico Git identifica o commit posterior de
parecer/estado sem autorreferência no documento. O índice Git exigiu permissão da
ferramenta; a primeira verificação de escopo rejeitou nomes Unicode escapados pelo
Git, antes do commit, e foi refeita com core.quotepath=false sem mudar o staging.
Diff dos scripts/documentação conferido; diff --check amplo acusa espaços finais
dos logs/relatórios gerados, preservados como evidência sem normalização. Não são
falhas de teste nem fonte de produto. Varredura textual não encontrou JWT/senha
sintética/bcrypt. `final-containers.json` e `final-listeners.json` vazios comprovam
Docker sem contêineres e as portas3142/61030/52364 sem listeners no fechamento.

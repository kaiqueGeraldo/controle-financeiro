# Execuções do saneamento RC031

22/10/2026; executor Codex desta conversa, sem reconfiguração pelo modelo/esforço
descrito no cabeçalho da tarefa. Base e1f5048; versões preservadas Node24.18,
Next16.1.6, React19.2.3, Vitest4.1.11, Playwright1.63, Chromium153.0.8010.12,
Java21.0.12.1+1 e PostgreSQL16-alpine descartável. Calendário sintético continua
21/10/2026; não confundir com a data real desta execução.

## Antes de editar produto

`proofs-before-sha256.json` inventaria548 arquivos das provas originais CF031 e
revisão independente. Manifesto SHA256
`76C5A6BEFD53CE13CA497FB6A9775FF680D9D28EA510FF042F86C67B4140E12A`.
`initial.json` registra HEAD, branch e README. Probes originais executados
diretamente da pasta da revisão, sem cópia alterada:

- `probes-before.log`:4 passam/3 falham por AssertionError (um RC031-01 e dois
  RC031-02), exatamente as rejeições esperadas. Não é erro de import/configuração.
- `coherence-before.log`:2 passam/7 falham em9 controles novos, inclusive
  consumidor HTTP/store que aceitava a conclusão adulterada.
- `reservations-before.log`:15 passam/27 falham em42 controles iniciais; reservas
  nulas, herdadas e incoerentes atravessavam antes/depois e consumidor HTTP/store.
- `receipt-browser-probe.mjs` é cópia byte idêntica da prova independente, em
  pasta de mesma profundidade para preservar imports/saídas. Executada ao final
  da seleção mobile original, com backend descartável ainda ativo:4/4 jornadas,
  Java1/1/SQL. `RC031-01-browser.json/png` confirma999999 exibido versus950 no
  servidor depois de commit real. `original-browser-before.log` vazio/exit0.
  Relatórios em `e2e-before-reports`, logs em `e2e-before-maven.log`/`e2e/`.

O único delta anterior à reprodução de navegador foi suporte opcional de config
no harness Java e observadores em pasta de evidências; nenhum produto alterado.

## Depois das correções

- `coherence-after.log`:73/73 (64 contrato/estado anteriores+9 coerência).
- `probes-after.log` e `probes-final.log`:7/7 originais intactos. Não somar as
  duas execuções como14 casos nem contar diagnósticos de timer como novos P2.
- `directed-final.log`:138/138 =75 originais+9 coerência+53 reservas+1 recuperação
  HTTP/estado. O controle de recuperação atravessa complete/GET operação inválidos,
  conserva preparação e compara os dois corpos de retry/replay byte a byte.
- `e2e-after`:12/12, retry0, Java1/1 e12 checkpoints SQL aprovados. Mantém as
  quatro jornadas originais nas três combinações largura/fuso; acrescenta
  assertions dirigidas nos três E01, não três aplicações extras. Respostas
  adulteradas são retornos de GET real após commit; recuperação não envia novo
  prepare/complete. Replay POST idêntico é realmente servido pelo backend.
- `typecheck-final.log`, `lint-final.log` e `build-final.log`:exit0, rota onboarding
  incluída no build. `unit-final.log`:6/6 testes Node existentes.
- `counterproof-results.json`:2/2 mutações detectadas por AssertionError; controle
  antes/restaurado127/127,209 fontes byte idênticos. Remover soma de livres faz
  seis controles falharem; enfraquecer LegacyReservation faz38 falharem/15 passarem.
  Filtro CLI -t seleciona riscos; não há anotação skip/only nem exclusão no fonte.

Complemento restrito `e2e-visible-free`: acrescenta observação explícita de950
visível após cada recuperação e após reload, com scroll e duas pinturas para
captura. **4/4, Java1/1 e quatro checkpoints SQL aprovados**; relatórios em
`e2e-visible-free-reports/`. Não soma quatro jornadas mobile às12 como16 casos distintos.
Produto e assertions anteriores iguais; o motivo da seleção é a prova visual
do valor recuperado, não obter nova passagem verde para explicar timeouts antigos.

SQL: E01 tem3 contas somando1300,16 itens aplicados,1 recibo,1 previsão pendente,
nenhuma transação paga e550 em reservas. Perfil vazio tem1 carteira0/1 recibo e
nenhum item/movimento. Draft e visual cancelado têm1 carteira0 e nenhum recibo,
item aplicado ou movimento. Recibo e950 de caixa livre conservados em GET,
replay e reload. Ver `e2e-after/sql-proof.json`, `*-remediation.json` e relatório
Java copiado para `e2e-after-reports/` antes de qualquer outra execução Maven.

## Falhas intermediárias e limites

Primeiro conjunto novo `directed-after.log`:125/126. O controle positivo JSON
usava parseJson sem opções, retornando LosslessNumber para contractVersion;
o cliente real usa Number para contadores, mantendo dinheiro como string. Falha
ocorreu no header, não na estrutura de reserva. A primeira versão foi preservada
em `reservation-remediation.initial.txt`; controles wire corrigidos usam exatamente
a política de api.ts. Nenhuma assertion enfraquecida. A prova negativa wire
inicial também não conta como detecção causal da reserva, pois parava no header.
`reservations-after.log`, `reservations-final.log` e controles finais substituem
essa lacuna; mutação estrutural demonstra a sensibilidade do candidato final.

Expansão posterior acrescentou controles de discriminador não string, ausência,
variantes CANDIDATES/UNBOUNDED/CLOSED e exclusões aninhadas. São53 casos de reserva
na suíte final; não somar suas versões anteriores42/49 como cenários distintos.
Nenhum timeout/retry foi aumentado, sleep adicionado, prova antiga editada ou
animação desabilitada por este lote. As saídas brutas conservam warnings e espaços.

As duas rodadas antigas11/12 continuam com causa histórica inconclusiva. A nova
12/12 não as apaga; [investigação separada](SESSAO-CARREGAMENTO.md). As três falhas
amplas classificadas na revisão não foram reabertas/reexecutadas: delta de produto
restrito ao parser onboarding, sem alteração do calendário, Modal, UserProvider,
API compartilhada ou parser JSON. Não há alegação de suíte ampla toda verde.

## Reprodução sem sobrescrever provas

Na pasta frontend:

```powershell
node node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts
node node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revisao-CF-031/probes.config.mts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/next/dist/bin/next build
node scripts/test.mjs
```

No backend, usar JDK21 local preservado e Docker descartável:

```powershell
$env:CF031_CHECK_REMEDIATION='1'
$env:CF031_RUN_ORIGINAL_PROBE='0'
./mvnw.cmd --batch-mode '-Dtest=OnboardingFrontendPostgresE2E' '-Dcf031.config=../tasks/evidencias/saneamento-CF-031-RC031/integration.config.ts' '-Dcf031.evidence=../tasks/evidencias/NOVA-PASTA/e2e' test
```

Config importa as jornadas originais; sem env CHECK_REMEDIATION só observa.
RUN_ORIGINAL_PROBE=1 serve exclusivamente à prova pré-correção e exige cópia
em pasta de mesma profundidade com checkpoint `e2e/mobile-360-SP-full...`.
Não executá-la após correção esperando aceitação do defeito ou sobrescrever
arquivos antigos. Contraprovas: copiar `counterproofs.ps1` para pasta nova da
mesma profundidade antes de executar, preservando saídas existentes.

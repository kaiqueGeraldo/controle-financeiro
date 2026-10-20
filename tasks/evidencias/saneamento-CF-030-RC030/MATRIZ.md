# Saneamento dirigido RC030 — critérios anteriores à correção

Base251d6c70492e4ad57dc9ca1313dce17afab62464; branch existente preservada.
Revisão independente76580e1/251d6c7 presente, sem commits posteriores. README
raiz tem o SHA256 informado; staging inicial vazio.83 arquivos de provas/parecer
registrados em independent-before-sha256.json, antes de editar produto.

| Achado | Norma e causa real | Oracle independente / controle |
|---|---|---|
| RC030-01/P2 | SPEC004 FIN03: encargos identificados em todo conjunto elegível antes de principal por competência/parcela/ID. O loop atual consome saldo inteiro da linha mais antiga | Probe original: caixa989, dívida189, principal189/disponível811; observado179/821. Controles abaixo/igual/acima de encargos, múltiplas linhas/faturas, sem encargos, UNKNOWN, quitação, excesso e rollback/replay |
| RC030-02/P2 | SPEC001 §4 e SPEC002: datas civis0001–9999 também derivadas. FinalRules só consulta configuração CREATE; INITIALIZE_EMPTY calcula depois com dados do servidor | Outubro/dezembro9999 válidos se vencimento ainda9999; dezembro9999 com fecha31/vence30 deve400 DATE_INVALID, sem preparação/abertura/recibo. Controles mês curto/bissexto/override/configuração alterada |
| RC030-03/P3 | SPEC001 §§4/5: único contrato aceito é inteiro1. intValue fora da faixa lança JsonNodeException fora do parsing catch |4294967297 deve400 INVALID_FIELD/INVALID_COMMAND, nunca500; prepare e complete reais com extremos de int/long/inteiro amplo, fracionários/textos/null; versão de draft continua separada409/400 |

Reprodução before-original-four:4 casos,4 assertions falharam,0 erros/skips.
O banco descartável confirmou due_date10000-01-30 e COMPLETED; os outros probes
demonstraram principal179 em vez de189 e HTTP500 em vez de400. Não são falhas de
compilação ou ambiente. Nenhuma assertion foi modificada antes dessa execução.

## Escolhas e invariantes

Pagamento continua no serviço compartilhado, mesma transação/locks/owner/recibo.
Planejar duas passagens sobre linhas já ordenadas: encargos conhecidos e depois
saldo residual. UNKNOWN não é principal0; não classificar composição não provada.
Uma distribuição persistida por linha/pagamento, soma igual ao pagamento, sem
alterar bruto/composição original. Evitar SELECT por componente/linha.

Validar ciclo de abertura puro, compartilhado entre CREATE e INITIALIZE_EMPTY,
com configuração capturada do servidor. Repetir na projeção de complete e defender
a escrita pelo mesmo cálculo. Sem fuso, clamp, default ou migração.

Validar capacidade de conversão antes de intValue, sem catch genérico novo.
Os demais aceites, guard de writer real, atomicidade, replay, precisão e V16 são
preservados. Três contraprovas em cópia isolada e controle após restore obrigatórios.

## Observador a reconferir após a proteção de data

O segundo probe RC030-02 pressupõe que prepare sempre retorna uma preparação e
só então consulta o ano. Isso conflita estruturalmente com o primeiro critério,
que exige rejeição já em prepare. Preservar original integral; demonstrar a
consequência real após a correção antes de qualquer adaptação do observador.
Nunca permitir produto inválido para acomodar essa sequência do teste.

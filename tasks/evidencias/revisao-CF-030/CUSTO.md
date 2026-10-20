# Custo, precisão e cobertura financeira

## Medições novas

`baseline-utc/maven.log`, `CF030_COST` e `CF030_LEGACY_COST`, com banco descartável,
JDK21 e queries observadas no DataSource real. Nome UTC identifica a configuração
de lançamento; a aplicação redefine o fuso JVM em startup. Só os probes temporais
próprios comprovam UTC efetivo.

| Grandeza | Pequeno | Limite de seleção |
|---|---:|---:|
| SELECTs prepare, incluindo sessão |25|26|
| SELECTs complete |19|22|
| Prepare |89,4ms|328,5ms|
| Complete máximo |—|4422,4ms|

1140 tempIDs:50 contas/50 investimentos/100 metas/200 reservas/20 cartões/600
parcelas/120 previsões. Request246595 bytes; prepared211024; receipt240563.
Patrimônio74400/reservas200 preservados. A diferença de SELECTs é constante por
tipo utilizado, sem N+1 por parcela/alocação nessa seleção. Escritas são O(itens).
Não se converte a duração4,42s em SLA; executor observou3,55–10,60s. Lock5s limita
espera, não tempo de execução. Guard exclusivo pode fazer outro writer receber409.

1000 fontes existentes:25 SELECTs, prepare282,3ms, prepared624066 bytes; heap
observado227902912→313750216 bytes. Não é pico nem alocação isolada; memória total
não é limitada a32MiB pelo teto do JSON. Limites de bytes/relações foram exercitados
sem truncamento e sem efeitos financeiros.

## Complexidade e limite da alegação

Inventário tem consultas por relação/owner e streaming com fetch256, mas materializa
todo o snapshot em memória. SQL ordena texto JSON; custo de ordenação não é O(1).
Projeção guarda fontes/metas em TreeMap, aliases/pairs em índices; canonicalização
ordena listas/chaves. Escritas e serialização crescem com itens/bytes. Incerteza
UNBOUNDED materializa E incidências fonte–reserva, até N×R; orçamento200000 é
operacional, não autorização para ignorar parte do universo.

Não endosso a alegação irrestrita O(N+R+E) do relatório para todo legado:

- `OnboardingReservationRegistry.java:26` recalcula `baseToken(inventory,payload)`
  dentro do loop de cada investimento legado ainda sem registro. Com L vínculos
  novos e B bytes de inventário, há L hashes/cópias/canonicalizações de B.
- `OnboardingProjection.java:192` percorre toda a lista evidence para cada ref
  de evidência. Sem índice por id, podem existir comparações quadráticas quando
  há muitas reservas confirmadas, mesmo sem E=N×R de bloqueios.
- Há varreduras adicionais de declarations×evidence e allocations×mappingPreview.
  O draft limita os comandos, mas não reduz todo inventário legado a esse limite.

São custos estáticos concretos não abrangidos pelo ensaio de1000 **contas sem
evidências**. Não foram medidos latência ou consumo nesse perfil; não se declara
incidente, regressão de SLA ou novo defeito financeiro por isso. Antes de alegar
escalabilidade desse perfil, medir cenários com muitos vínculos/evidências.
Calcular um baseToken por snapshot e indexar evidências são refatorações localizadas
justificadas pelo trabalho repetido encontrado, a validar preservando hashes e
regras. Não foram implementadas nesta revisão.

## Reconciliação e precisão

E01 verificado em HTTP/serviço, SQL e recuperação:1300 contas+501 investimentos−350
dívida=1451; reservas350 em contas+200 em investimentos=550; previsão80 não altera
caixa nem receita realizada. Não há invest_transactions de abertura nem PURCHASE
fictício; prazo2026-09-30 e origem/custo desconhecidos preservados. Cancel/replay
não duplicam aberturas. Falhas de último item/recibo e depois de todas as escritas
confirmam rollback por conexão independente.

E23/E28/E34 mantêm400 nominal uma vez; E32 soma400 nominal+100 independente=500.
Candidatas com prova obsoleta voltam ao universo, nova fonte não é independência,
fechar uma de duas mantém o outro bloqueio. UNKNOWN/PARTIAL/NOT_APPLICABLE têm
campos distintos; agregado de duas reservas máximas1999999999999.98 permanece
exato e conhecido. Teste próprio de TOTAL máximo/quantidade0.00000001 relê os
valores exatos no PostgreSQL e conserva recibo/replay.

O caso adicional de encargos entre faturas falha apesar de E01 verde (RC030-01).
Cobertura dos exemplos não foi tratada como cobertura completa do domínio.

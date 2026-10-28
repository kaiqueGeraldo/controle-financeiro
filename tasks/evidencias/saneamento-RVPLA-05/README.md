# Saneamento local RVPLA-05/P2 e diagnóstico separado do audit — 27/10/2026

**Prazo saneado localmente, aguardando revisão independente.** As três execuções finais do probe original de20s passaram em16,572 /17,978 /16,990s, sem alterar prazo, assertions ou seleção de resultados. A causa demonstrada foi a cauda de~2,25s do encerramento gerenciado por guardião, posterior ao drain concluído. O término nativo do **próprio** guardião nomeado remove essa cauda, conservando Job, KILL_ON_JOB_CLOSE e confirmação externa de ausência. [Causa e linha do tempo](LATENCIA.md), [plano prévio](PLANO-CAUSAL.md), [dados monotônicos](linhas-do-tempo.json).

O EPERM tem parecer próprio: corrida de rename sobre mailbox aberta demonstrada no harness real, corrigida com slots sequenciais imutáveis. Teste causal com módulo antigo vermelho, restaurado verde; novo audit PG17 passou. O detentor do handle na ocorrência histórica não pode ser identificado retrospectivamente. [Investigação, privilégios e limites](AUDIT-EPERM.md).

Branch `codex/preparacao-local-adocao`. Base inicial completa `9c27881ca0506b0206c59d9e0e9fd1723efa83d9`; revisão anterior `32d445e32c47ca16bd840aaa7b99fe46f919150b` e seu parecer9c27881. Ancestralidade até3a6e95be/badecb55 confirmada. Árvore inicial: somente README raiz alheio modificado, staging vazio. Implementação local:

- `762a085eb241a3b52f64e8fa1a026c878880945c`: correção de latência e drivers.
- `d254822b9dc8835c5311dcd57f5cbfc629b38f81`: correção/contraprova do audit, separada.
- Commit posterior de evidências/estados identificado na entrega. Revisar **9c27881..HEAD da entrega**; os dois únicos helpers existentes alterados são `.github/scripts/owned-process.ps1` e `counterproof-supervision.mjs`.

## Estados separados

| Recorte | Estado entregue |
|---|---|
| A — RVPLA-05/P2 | Saneado localmente, **em revisão**,3/3 no contrato original20s; margem mínima2,022s local |
| B — audit/EPERM | Defeito de canal demonstrado e corrigido localmente; audit limitado passou; atribuição exclusiva do episódio histórico ainda indeterminada |
| C — RVPLA-03/04 | Aceites específicos anteriores preservados no alcance Windows/mesma sessão/criadores cooperativos; novos controles de contenção/quiescência/ordem passaram. Probe completo antigo RVPLA-03 teve falha própria de fixture registrada abaixo; não apresentado como aprovado |
| D — TCP/reuso nativo e startup HQL | Inconclusivos nos recortes anteriores;40s intactos, sem diagnóstico ou aceite novo por associação |
| E — adoção real | Não liberada. CF017/P01/P02 e CF034 integral continuam em_revisao; expanded, zoom200%, configuração, gates reais e demais pendências mantidos |

## Provas, sem somar grupos sobrepostos

| Grupo | Resultado e alcance |
|---|---|
| Reprodução inicial comparável | Base atual8,624s verde; candidato cortado aos20s, close21,158s vermelho. Mesmo original/fixture e inicialização equivalente; não se usaram só números históricos |
| Perfil e contraprova de custo | Drain imediato; cauda gerenciada2,23–2,28s. Troca isolada reduziu para7,77–9,91ms. Reintroduzir Environment.Exit manteve segurança e voltou a falhar no20s; SHA restaurado |
| Três medições finais prefixadas |3/3,16,572–17,978s; amplitude1,406s. Cinco guardiões de comando e15 consultas por B. Todos os resultados mantidos, sem retry |
| Checkpoints/resume e CI local |43/43,0 skips:28 core,10 controles independentes anteriores,5 consumidores CI. Inclui falhas pré-efeito reexecutáveis, sem skip indevido |
| Broker |4/4: normal, interrupção do owner, interrupção do guardião e Job de comando retido. Handles de parent/child/grandchild; processo alheio do mesmo nome e outra execução legítima preservados. Complete só depois de encerramento confirmado |
| Antes do filho |1/1: wrapper antigo encerrado; sinal após resume não pode criar filho |
| Handoff causal RVPLA-04 | Módulos vulneráveis: mesmo oracle vermelho por efeito após complete; corrigido verde, mutant/restoration-pending sem próximo gate; geração seguinte complete após ausência. Cópias restauradas por SHA |
| Inspeção inconclusiva |2/2: identidade e operação falhas bloqueiam restore/complete/avanço; geração nova recupera |
| Identidade/sessão/boot |5/5: inicialização atrasada antes/depois do Job, recibo inválido, PID com nascimento divergente e outra sessão. Não termina processo que só compartilha PID |
| Canal |2/2: concorrência no mesmo root recusada sem parar dono; slot ativo corrompido cancela árvore e conserva mutant; recuperação apenas na geração seguinte. Somente endereço do slot observado adaptado ao protocolo4 |
| Consumidor compartilhado | Caminho sem Job nomeado preservou stdout/código0 e sinalização dos handles após morte do owner. Reuso de sockets sintéticos não certifica o TCP de adoção pendente |
| Audit causal | Sem leitor: rename passa; Node/FileStream segurando handle: mesmo EPERM/-4048. Harness antigo vermelho, slots verdes, revert isolado vermelho/restaurado verde, sem privilégios extras |
| Preflight PG17 real descartável | Uma assertion de mutação esperadamente falha,0 erros/skips; prova causal complete,834 inputs restaurados. Não é suíte financeira aprovada por resultado esperado de falha |
| Resume/audit/identidade reais | Reutilização verificada, audit1 prova/0 novos testes, uma tentativa e checkpoint SHA idêntico; outro observador recusado sem alteração ou tentativa extra |

**Falha intermediária preservada:** `rvpla05-regressions-01/abandonment.log` registrou0≠null na exigência de JVM alheia ainda viva. A fixture Java tem autodesligamento de30s, começou antes da outra execução e terminou normalmente antes dessa observação. Não há `stop-java` emitido antes da assertion; o teste completo parou nessa primeira situação e não executou seus cenários seguintes. Nenhuma tolerância/lifetime/assertion foi ampliada nem houve repetição até passar. Os3 probes originais de prazo, os controles de broker/handles e antes-do-filho sustentam o recorte atual; o grupo completo antigo **não** foi contado como verde. A preservação de processo alheio vivo foi observada independentemente no broker. Para revalidar esse grupo específico, o próximo experimento é uma fixture alheia encerrada por barreira explícita e identidade, com orçamento separado do contrato20s, sem acoplar sua vida ao tempo de várias execuções. Não foi usada uma alteração especulativa do supervisor para apagar a falha.

O primeiro experimento de EPERM também conservou erro do próprio observador Get-Acl; não foi causa demonstrada até a rodada posterior delimitada. Perfis/negativos interrompidos mantêm checkpoints/fontes em suas cópias descartáveis, com Jobs ausentes, sem promover estado e sem reescrever as medições. [Comandos e sequência](COMANDOS.md).

## Produto, preservação e proveniência

Sem diff de backend/frontend/migrations no intervalo; **nenhum pacote novo**. JAR anterior p05 SHA-256 `b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`, inputs produtores `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Não atribuir compilação do JAR a este HEAD. Maven compilou somente a cópia descartável para o teste limitado; Tree/Handoff/classes são diagnósticos locais.

Inventário anterior9.554 e exigência anterior5.854 reconferidos;29 históricos,16 migrations, runtimes/checkpoints/JAR/provas anteriores preservados. Os dois helpers correntes autorizados têm versão inicial em Git9c27881 e nas cópias `rvpla05-before-01`; os demais arquivos protegidos foram comparados por SHA. A fotografia inicial reúne **11.328 arquivos protegidos** e é confrontada pela final. README raiz alheio permanece SHA-256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`, fora dos commits. O manifesto final registra as duas diferenças intencionais, sem ocultá-las como preservação byte idêntica.

[Coleta](resultados.json):17 runtimes novos,1.559 artefatos com hash original/coletado e decodificação/sanitização declaradas;13 binários de diagnóstico apenas inventariados, sem versionar executáveis. Nomes longos compactados sem mover originais. A mailbox propositalmente corrompida e sua cópia textual (dois artefatos) retêm bytes/hash e marcador de JSON inválido, sem certificado. Auditoria de recursos final:158 recibos íntegros inspecionados,157 nomes de Job ausentes;1 recibo proposital de outra sessão **sem certificado**,1 recibo proposital com checksum inválido preservado. Zero processos associados e zero API containers de preparo ativos; auditoria final não emitiu término.

Limites: medições locais, Windows/mesma sessão e processos cooperativos. Não certificam daemon/SQL/WMI universal, Linux nativo, SLA de produção ou runner integral. Testcontainers/Docker Linux neste Windows não aprova supervisor Linux. Sem banco real, Railway/Vercel, CI remota, push, merge ou deploy. Nenhuma tarefa maior encerrada. Próximo passo: **revisão independente dirigida de RVPLA-05, com parecer separado sobre audit**, confrontando negativos e limites acima.

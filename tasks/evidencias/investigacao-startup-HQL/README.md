# Investigação dirigida de startup HQL — 28/10/2026

**Conclusão E: causa dos estouros históricos ainda inconclusiva.** O conjunto
finito terminou sem reproduzir o atraso. Não há causa demonstrada que autorize
correção de produto, revisão unilateral do prazo ou aprovação integral do startup.

Base conferida `c091abb8aa0473e7ad46690e21c8158a4dde234a`, originada de
`codex/diagnostico-tcp-nativo`; branch própria `codex/diagnostico-startup-hql`.
HEAD, ancestralidade, diff e index conferidos; somente README raiz alheio no início.
Diagnóstico/probes no commit `aa4749f3635a3942641239305abd3d8ce48fb7a6`;
evidências/documentação no commit seguinte identificado na entrega. Sem correção
de produto e, portanto, sem commit artificial de correção ou pacote novo.

## Resultado do conjunto previamente delimitado

| Observação única | Retorno de start | Entrada no gate | Readiness desde criação | Tempo no gate40s | Resultado |
|---|---:|---:|---:|---:|---|
| Windows/JAR controle | 0,013s | 0,017s | **18,925s** | 18,907s | Dentro de40s |
| Linux/Docker controle | 0,010s | 0,011s | **13,824s** | 13,813s | Dentro de40s |
| Windows/JAR agent+JFR | 0,045s | 0,045s | **19,652s** | 19,607s | Dentro de40s |
| Linux/Docker agent+JFR | 0,017s | 0,017s | **18,669s** | 18,652s | Dentro de40s |

Um único Maven test: **4 observações diagnósticas, zero falhas/erros/skips**.
Não é nova execução dos17 contratos funcionais. Em cada observação,
`App.awaitStatus` original executou seu prazo/HTTP reais; liveness200, `/accounts`
sem autenticação401 e cleanup confirmado. Sem repetição até passar. O primeiro
par executou o encaminhamento TCP; o segundo, previsto antes da rodada,
completou a lacuna de gravação JFR e identificou a sequência HQL real.

Nas instrumentadas:76 chamadas externas HQL/76 hashes distintos, sem repetição,
somas2,044/1,680s; validação Hibernate externa0,947/0,879s. Consultas e durações
individuais em [resultados.json](resultados.json). Mesmos hashes nas duas
plataformas, ordem diferente. Pausas GC0,396/0,363s; dados não mostram espera
longa de banco ou bloqueio da main nessas duas observações. Isso não explica
retrospectivamente os estouros, cujas pilhas localizam trabalho ativo em HQL de
Spring Data após JPA, sem identidade/duração de cada query naquele momento.

## Evidências e alcance

- [Contrato/observador](CONTRATO.md), [históricos reais](HISTORICO.md) e os
  [XMLs/logs reextraídos por hash](historico-verificado.json), incluindo os3/17.
- [Plano anterior à rodada](PLANO.md), [fases e interpretação](ANALISE.md),
  [execução/proveniência](COMANDOS.md) e [preservação](PRESERVACAO.md).
- [Encaminhamento independente e critério de parada](ENCAMINHAMENTO.md).
- [Complemento TCP e associação das queries](historico-complemento.json),
  [inventário apenas do runtime novo](runtime-files.json) e
  [fotografia final/coleta](preservacao-final.json).

JAR p05 preservado, SHA-256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`;
imagem local `sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
PG17.11 descartável pronto,16 migrations antes de t0; adoption mantém ORMvalidate
dentro da medição. JVMs novas, caches do SO não controlados; sem instalação/build
concorrente às aplicações. Docker sobre Windows compartilha o host e não
certifica supervisor Linux nativo. Quatro amostras não estabelecem percentis/SLO.

| Estado independente | Conclusão desta investigação |
|---|---|
| Startup HQL/40s | E, inconclusivo; novas observações passaram, gate integral continua não aprovado |
| TCP/reuso nativo | Aceite Windows/JAR/PG16/17 preservado, sem reabertura |
| RVPLA-01/03/04/05 e audit/EPERM | Aceites específicos preservados; fontes canônicas intactas |
| Preparação local | Capacidade diagnóstica ampliada; demais aceites/limites anteriores mantidos |
| CF017/P01/P02, CF034 integral | Continuam em_revisao; expanded/zoom/configuração e gates reais pendentes |
| Adoção real/produção | Não liberada; sem banco real, ação de hospedagem, CI remota, push, merge ou deploy |

Auditoria final: zero processos próprios e containers ativos, zero LISTEN nas
portas amostradas;2 tuplas residuais de estado11/TimeWait e owner0 registradas,
sem recurso próprio ativo. Java preexistente PID20288/nascimento anterior
preservado. README raiz conserva o SHA histórico, fora de todos os commits.

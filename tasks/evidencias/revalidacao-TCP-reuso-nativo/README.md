# Revalidação independente TCP/reuso nativo — 28/10/2026

**Correção TCP aceita no alcance Windows nativo/JAR testado.** PG16/JAR e
PG17/JAR passaram **3/3 por invocação**, com os dois métodos originais byte
idênticos. A reversão isolada reproduziu BindException com LISTEN ainda atribuído
ao PID encerrado; o controle restaurado passou. Esta revisão não corrigiu a
implementação nem aprovou startup HQL ou adoção real.

Branch: codex/diagnostico-tcp-nativo. Base:
3b245d9dd23e876700507718767827ea5e9f8a11. Candidato:
b7a2c206459f8f376b7bb7a84580444b2b6b4f15.
HEAD inicial exato, base ancestral e diff conferidos; staging inicial vazio,
somente README raiz alheio modificado. Delta funcional em três arquivos src/test;
produto, frontend, migrations e runner/broker/mailbox não mudaram.
Provas no commit ed978c1d5393b3260ff70c007a3d17e03a9e9a97;
o commit seguinte registra parecer e estados.

| Parecer | Decisão independente |
|---|---|
| A — TCP/reuso | **Aceito/encerrado no mecanismo testado**, Windows/Temurin 21/JAR, PG16/17. Confirmação externa dentro do prazo antes de retornar; bind único na mesma porta e opções preservadas |
| B — atribuição histórica | Mecanismo equivalente reproduzido e compatível com os dois BindException históricos. Tuplas, instantes e famílias dos erros antigos continuam desconhecidos; sem medição retrospectiva |
| C — identidade/alheios | JVM original vinculada a Process/log/porta e identidade capturada nas provas; substituto com outro PID preservado. PID de tupla não é identidade durável nem reserva da porta |
| D — orçamentos/aceites | Prazos de certificação de 10s/5s preservados, sem renovação por consulta. Limpeza do inspetor em erro pode acrescentar até 2s, sem sucesso tardio. RVPLA-01/03/04/05 e EPERM preservados pelos caminhos intocados |
| E — HQL | Separado/inconclusivo, 40s intactos; nenhuma investigação ou aprovação nova. Próximo experimento apenas delimitado |
| F — preparação/adoção | Aceites locais mantidos no alcance próprio. CF017/P01/P02, CF034 integral, expanded/zoom 200%, configuração e gates reais continuam pendentes; adoção/produção não liberadas |

[Linha do tempo](LINHA-DO-TEMPO.md), [orçamentos e limites](ORCAMENTO-E-LIMITES.md),
[matriz](MATRIZ.md), [comandos](COMANDOS.md), [encaminhamento HQL](ENCAMINHAMENTO.md).
[Plano prévio](PLANO.md), [análise independente](analise-independente.json),
[resultados/mapa SHA](resultados.json), [inventário novo](runtime-files.json).

## Validações novas, sem somar sobreposições

| Invocação | Resultado e interpretação |
|---|---|
| corrigido-pg16 | 3/3, zero erros/falhas/skips: dois métodos originais PortLifecycleProbeTest e o teste de listener retido |
| corrigido-pg17 | 3/3, zero erros/falhas/skips; mesmos contratos em PG17 |
| contraprova-bypass-instrumentado-pg17 | Um erro esperado por BindException; processo encerrado e TCP próprio ainda LISTEN. App antigo exato na cópia, restaurado por SHA |
| contraprova-inspecao-pg17 | Um erro esperado por TCP inspection failed, antes do bind/INDEPENDENT_CLEANUP; fonte restaurada |
| corrigido-instrumentado-pg17 | 1/1, zero erros/falhas/skips. Close em 2.176,662ms dentro de 10s; bind único 0,1023ms depois, mesma porta; substituto do PID correto, HTTP antigo recusado e alheio preservado |
| sinteticos-pg17 | Dois métodos diagnósticos: seis cenários cooperativos reusaram; dois términos abruptos registraram BindException. Métodos verdes não convertem binds falhos em sucesso |
| ReviewNativeSocketsTest | Um método, dez casos e onze chamadas ao helper. Três liberações dos endpoints originais e oito bloqueios esperados; porta livre, substituto, IPv6, ESTABLISHED sem LISTEN, respostas inválidas/erro e inspetor lento |

Cada invocação ocorreu uma vez, sequencialmente, sem retry de bind ou seleção do
melhor resultado. O controle corrigido ocorreu depois das restaurações. Mutações
e instrumentação ficaram na cópia descartável, com fontes e hashes antes,
durante e depois. Assertions originais, porta, reuseAddress, exclusividade e
configuração global de rede preservados.

RVPLA-01/03/04/05, EPERM, quiescência/runner e demais aceites locais reaproveitados
por diff e hashes. O probe sintético de retomada em 20s substitui Maven por
fixture e não executa App.close; JS, PowerShell, Jobs e checkpoints não mudaram.
Não se repetiram esses grupos nem suítes financeiras ou CI remota. Erros
históricos de TCP e startup de 40s continuam preservados.

## Preservação e proveniência

Inventário anterior de 30.964 entradas e runtime anterior de 1.479 arquivos
conferidos integralmente; fotografias desta revisão com **32.555 entradas inicial
e final**, 29 arquivos históricos e 16 migrations preservados. Entradas podem
representar o mesmo caminho por formas distintas; não se alega deduplicação
física. Fontes canônicas intactas; alterações temporárias somente nas cópias.

README raiz alheio, fora dos commits, SHA-256:
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
JAR p05 usado nas invocações pertinentes e intacto:
b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b.
Commit produtor dos inputs: 24844b594e4ed8fe906e0fc6eaee32bdd58f31a0.
Sem pacote novo, build atribuído ao HEAD documental ou alegação de
reprodutibilidade binária. Maven compilou classes/testes na cópia descartável.

Exportação do candidato com **836 inputs restaurados**; probes adicionais fora
do manifesto têm fontes e recibos próprios. **107 artefatos** coletados com SHA
original/coletado e decodificação/sanitização declaradas; **1.491 arquivos** novos
inventariados, incluindo binários somente por hash. Nomes longos compactados na
coleta, sem mover originais. Único runtime novo:
../controle-financeiro-runtimes/preparacao-adocao/revalidacao-tcp-20261028-01/.

Auditoria final de leitura: zero processos associados, zero endpoints nas portas
amostradas e zero containers ativos. Java preexistente PID 20288 continuou
presente, com nascimento compatível com a referência anterior. A auditoria não
emitiu terminação; nenhum processo desconhecido foi encerrado.

Sem clean/reset destrutivo, limpeza geral de target, correção de implementação,
banco real, Railway/Vercel, push, merge, CI remota, deploy ou mudança global de
rede. Alcance Windows nativo no ambiente medido, sem promessa universal contra
colisões externas ou SLA de produção. Aplicação Linux em Docker sobre Windows
não certifica supervisor Linux nativo; esse ramo foi preservado por diff.

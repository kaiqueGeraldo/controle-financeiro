# Caminho crítico e alteração residual — 28/10/2026

O contrato mede o processo inteiro de resume B, do `spawned` observado pelo probe original até `close`, com limite20s. Inclui preparação/registro, checagens, restauração, estados, saída do worker/guardião e confirmação externa final. Nenhum marco, assertion,20s ou40s foi alterado. O script inteiro também prepara/interrompe A e compila a fixture; sua duração não é o orçamento de B.

## Antes de escolher a alteração

O HEAD informado `acaa6ed9374f8c9a205d92955f0f4f946b17aa8a` foi confirmado, com apenas README raiz alheio modificado. A rodada original nova `before-01` terminou naturalmente em19.673,8893ms (margem326,1107ms), não uma demonstração de robustez. Não apaga as três falhas válidas do revisor nem seu diagnóstico21,167s. O código já tinha a cauda de guardião reduzida; não foi reotimizada.

| Partição exclusiva de B antes | ms |
|---|---:|
| Inicialização Node/controller e guardião→worker |913,2986 |
|15 consultas externas |10.707,0966 |
| Cinco comandos contidos, da criação ao close |6.860,6760 |
| Comunicação/ponte fora das etapas acima |777,8119 |
| I/O de recibos/checkpoints/fontes fora das etapas acima |174,8781 |
| Fechamento worker/guardião e retorno do controller |36,5907 |
| Parcela não explicada |203,5374 |
| **Total reconciliado** |**19.673,8893** |

A união dos intervalos evita somar I/O/IPC que já está dentro de consulta ou comando. O total do cronômetro de chamadas é10.707,5676ms; a diferença de0,471ms frente à partição vem dos pontos de emissão/cronômetros do observador. Parcela não explicada~1,03%, não distribuída artificialmente. [Dados antes](tempos-antes.json) contêm as janelas e a linha de tempo; JSONL guarda todos os eventos pertinentes. Leituras e validação de checkpoint/inputs, persistência/fsync/rename, restauração e close de canais têm eventos próprios. Isso é tempo de parede, não perfil de CPU.

Perfil nativo separado em cópia: `profile-01` falhou no original20s (corte20.001,4328ms, close forçado21.584,0687ms). Não é término natural nem novo gate aprovado. Marcas em C#/PowerShell acrescentam I/O e alteram o tipo compilado: seu custo não pode ser subtraído para aprovar o prazo nem toda variação ser atribuída ao candidato. Nas13 chamadas completas observadas, startup/spawn somaram5.243,6631ms, Add-Type4.490,7895ms, configuração+consulta+serialização1.303,5575ms e saída245,8744ms. Assim,9.734,4526ms dos11.283,8845ms particionados estavam em iniciar/compilar (~86,3%). O corpo de consulta inclui configuração e serialização; não é medição exclusiva de syscalls. Por chamada: startup354–494ms, compilação302–374ms, corpo59–127ms, saída17–21ms.

Os appends medidos da instrumentação Node em B/controller+worker foram~91ms antes e~47–66ms nas rodadas finais; o probe externo reporta sua própria parcela separada. Estão incluídos nos tempos, sem desconto. No perfil interrompido, métricas de exit ausentes são desconhecidas, não zero. TSV e bytes instrumentados/restaurados ficam identificados por SHA. Não houve nova tentativa para apagar a falha do perfil.

## Custo removido, garantias e trade-offs

verifyEnvironment é chamado duas vezes na retomada sintética. Antes, cada chamada publicava current isolado, depois Docker e CIM em dois Jobs de comando. Cada comando já executava uma nova boundary no broker antes de iniciar e uma consulta closed externa após close. A boundary do primeiro comando repetia o current isolado sem efeito entre eles. O agrupamento executa Docker seguido de CIM em um checker, exige sucesso de ambos e conserva a inspeção imediatamente antes desse comando.

| Estrutura de B | Antes / contraprova | Depois |
|---|---:|---:|
| Consultas externas PowerShell/probe |15 |9 |
| Jobs/guardiões de comando |5 |3 |
| Guardiões totais, incluindo worker |6 |4 |
| Lançamentos diretos pelo controller (consultas+guardiões) |21 |13 |

As consultas são invocações externas, não número de syscalls. O checker ainda abre Docker e consulta CIM, em ordem. Não suprime trabalho obrigatório nem adia cleanup para depois do retorno. Os lançamentos economizados eliminam seis inicializações/compilações de probe e dois ciclos guardião/adapter por B. Tempo/espaço assintóticos permanecem O(1) por chamada de ambiente; o histórico de requisições continua O(n) com o protocolo aceito. Não foi introduzido processo auxiliar persistente, cache, batching de Jobs, nova conexão, paralelismo ou polling.

Um único Job do checker contém os dois checks de leitura, que não precisam de Jobs distintos. Não é um certificado agregado de vários Jobs: seu nome/owner/identidade continuam individuais. A leitura interna de Docker/CIM não atesta o encerramento do checker. O broker aguarda close, abre **outro processo externo** e exige desaparecimento do objeto Job antes de responder. Root/worker mantêm baseline, creationCount, identidade PID+nascimento, sessão/mutex, contenção, cancelamento por stdin e confirmação final. `owned-process.*`, `owned-command.mjs`, `owned-job-probe.ps1`, broker, mailbox e ProofStore estão byte idênticos à base aceita.

Trade-off concreto: o checker compartilha10s entre os dois checks, em vez de dois budgets de10s. É mais restritivo: erro/nonzero/saída de Docker, JVM presente ou erro de CIM bloqueiam, sem restaurar/complete/avanço. Há menos discriminação operacional por código de retorno; logs preservam a falha. Os testes dirigidos verificam isso. Uma remoção incorreta da última boundary permitiria efeito com filho não gerenciado; a contraprova específica fica vermelha pelo oracle, e o candidato bloqueia **antes de lançar o checker**.

## Conjunto final previamente fixado

| Runtime | B natural até close | Margem para20s | Script inteiro | Consultas (tempo das chamadas) |
|---|---:|---:|---:|---:|
| after-01 |10.213,2754ms |9.786,7246ms |20.400,1279ms |9 /4.693,3092ms |
| after-02 |11.559,6712ms |8.440,3288ms |23.389,6457ms |9 /5.398,5569ms |
| after-03 |12.226,4317ms |7.773,5683ms |24.510,6733ms |9 /5.974,9070ms |

3/3 no original20s, sem corte solicitado, descartes ou retry. Intervalo10,213–12,226s, amplitude2,013s, média descritiva11,333s. A margem mínima observada7,774s dá distância maior que a linha de base estreita, sem inventar um novo gate ou certificar desempenho de produção. Três execuções não estimam percentis/SLO.

Cada execução tem diretório/fixture novos e B inicia processos/probes frescos, com compilação de tipos incluída. A é interrompido por identidade antes de B; B começa com checkpoint/fonte interrompidos e só restaura após as condições exigidas. Não há aquecimento artificial, remoção de caches do sistema operacional ou outro teste de aplicação concorrente lançado pelo executor durante a amostra. Caches do host não são prometidos frios. Java21 explícito, Node24.18/libuv1.52.1; CPU i7-13620H/16 lógicas, Windows11 Pro. ambiente.json foi observado após a primeira linha de base; environment.json de cada rodada final registra memória/CPU/configuração antes do probe. Não há telemetria contínua da carga do host.

Nas finais, consultas externas ocuparam4,693–5,974s na partição, comandos3,886–4,798s, inicialização0,780–0,814s, IPC exclusivo0,372–0,618s, I/O exclusivo0,073–0,084s, fechamento/retorno0,029–0,040s e parcela não explicada0,133–0,162s. [Partição depois](tempos-depois.json) reconcilia cada soma exatamente ao total, sem dupla contagem. Publicação dos estados e restauração precedem a saída; close dos guardiões e consulta externa final permanecem antes do close de B.

## Contraprova causal e limites

`cost-mutation-01` recolocou só verifyEnvironment antigo e sua importação, sem alterar segurança, cauda nativa ou timeout. O módulo executado tem SHA d761e0d490650bcbf8dd686ccefef608db02bb5e84c3c261cccaa401426398f7, exatamente o anterior. Retornaram15 consultas/5 comandos/21 lançamentos diretos; B18.563,6549ms, contra11.325,9219ms no smoke novo. Também passou20s nesta observação: **não é contraprova global vermelha**. É evidência causal do custo estrutural e do caminho crítico (consultas9,882s + comandos6,411s), sustentada pela reversão precisa, linha do tempo e restauração por SHA. Não se forçou a conclusão com sleep nem repetição no limiar.

Fonte nova testada SHA dbc0f1e0697f2e368ec1fa69c6078c5ae0ba2af18f962b7f9130870aad804da6; cópias restauradas por hash. Perfil interrompido conserva input/checkpoint mutantes em sua cópia descartável, sem promoção, sem processo deixado vivo e sem reclassificar o negativo. A fixture sintética de prazo não produz JUnit causal legítimo: B deve retornar falha de observação com fonte restaurada, como exige o probe. Isso não é teste financeiro positivo nem complete inventado.

Resultado: saneamento local para revisão independente. Aceites RVPLA-03/04 e EPERM permanecem no alcance próprio; TCP/HQL continuam inconclusivos,40s intactos; adoção real não liberada.

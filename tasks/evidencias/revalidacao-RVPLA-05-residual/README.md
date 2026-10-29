# Revalidação independente residual RVPLA-05/P2 — 28/10/2026

**RVPLA-05/P2 encerrado no alcance testado.** As três execuções prefixadas do
probe original20s passaram em **15,084 /12,635 /12,287s**, com margem mínima
observada **4,916s**. A redução de trabalho foi verificada sem cache ou retirada
de confirmação externa. Não houve regressão demonstrada de contenção ou audit.
Isso não aprova runner integral, TCP/HQL, adoção real ou desempenho universal.

Branch `codex/preparacao-local-adocao`; base
`acaa6ed9374f8c9a205d92955f0f4f946b17aa8a`; candidato
`d8bd180a916e5c2351a4baa33368abcead1c2bef`, intervalo `acaa6ed9..d8bd180a`.
HEAD/branch exatos e ancestralidade/diff conferidos. Working tree inicial só com
README raiz alheio modificado; staging vazio. Um único helper existente mudou:
`tasks/evidencias/preparacao-local-adocao/counterproofs.mjs`. Nenhuma correção da
implementação foi realizada nesta revisão. Provas no commit
`66f0ec6288fcfdad7a8fb1652631657343e592ed`; parecer/estados no seguinte,
identificado na entrega.

| Parecer | Decisão independente |
|---|---|
| A — RVPLA-05 | **Encerrado**, Windows/mesma sessão/cenário original.3/3 no20s,9 consultas/3 comandos/13 lançamentos diretos, mantendo encerramento e confirmação anteriores ao retorno |
| B — contenção/quiescência | Aceites específicos RVPLA-03/04 preservados; atualidade, identidade, bloqueio, recuperação e processo alheio sustentados nos controles. Sem promessa universal de daemon/SQL/WMI ou supervisor Linux |
| C — audit/EPERM | Aceite causal preservado por diff/hashes de canal/guardião/probe/broker intocados. Novo PG17 causal/resume/audit/identidade passou. Detentor histórico continua desconhecido |
| D — TCP/HQL | Permanecem separados e inconclusivos;40s intactos. Melhora do runner não encerra bind/reuso nativo ou startup HQL |
| E — preparação/adoção | Aceites locais mantidos no alcance próprio; CF017/P01/P02,CF034 integral,expanded,zoom200%,configuração e gates reais continuam pendentes. Adoção/produção não liberadas |

[Prazo, contagens e comparação](LATENCIA.md), [segurança e consumidores](SEGURANCA.md),
[matriz](MATRIZ.md), [comandos/falhas dos observadores](COMANDOS.md) e
[próximo passo delimitado](ENCAMINHAMENTO.md). [Plano prefixado](PLANO.md),
[conferência independente](conferencia-independente.json),
[resultados/mapa SHA](resultados.json), [inventário novo](runtime-files.json).

## Medições e sentido da comparação

| Execução | B até close natural | Margem para20s | Original |
|---|---:|---:|---|
| prazo01 |15.083,9251ms|4.916,0749ms|Passou|
| prazo02 |12.634,5410ms|7.365,4590ms|Passou|
| prazo03 |12.287,4235ms|7.712,5765ms|Passou|

Todos os resultados mantidos. Não se descontou overhead nem se alteraram prazos,
marcos ou assertions. Sem warmup artificial/seleção/retry; processos/probes frescos
em pastas novas, OS caches não prometidos frios. Condições por rodada registradas.
A margem histórica7,774s não virou requisito: o critério original é20s, atendido.

Contagens independentemente derivadas dos traces e recibos: **15→9 consultas
externas,5→3 comandos,21→13 lançamentos diretos**. Não são toda a árvore. Duas
verificações Docker/CIM continuam executando em ordem, agora no mesmo checker;
a boundary fresca do broker substitui o current isolado redundante. Um Job por
checker, consulta externa depois de close e reply ligado à solicitação correta.
Os10s compartilhados são mais restritivos que dois budgets10s separados.

A reversão exata função/import anterior restaurou15/5/21 e depois os hashes.
**A comparação histórica18,564s passou20s** e não é negativo global. A nova
observação antiga desta revisão falhou no prazo, mas seu close ficou censurado:
timer20.006ms, controller-exit20.008ms, sem close recebido pelo probe. Não se
inventou duração/margem natural nem se forçou esse resultado. A otimização é
sustentada pelo trabalho removido/etapas e pelo candidato satisfazer o contrato;
não depende de exigir que todo caminho anterior ultrapasse20s.

## Validações novas versus reaproveitadas

| Grupo novo | Resultado e alcance |
|---|---|
| Checkpoints/resume/CI local |43/43,0 skips:28 core,10 independentes anteriores,5 consumidores CI. Não são43 testes novos |
| Ambiente agrupado |4 condições bloqueadas antes de Maven/mutação/tentativa; omitir check Docker/JVM em cópia detectado por mesmo oracle vermelho; fontes restauradas |
| Boundary/freshness |Último current bloqueia antes do checker; sua omissão detectada. Geração antiga não libera inspeção atual negada; cache sintético vermelho, restaurado reuse legítimo/SHA estável |
| Confirmação externa |Contraprova própria: omitir closed com Job retido permitiu complete indevido e oracle ficou vermelho; SHA restaurado, controle mantém mutant/restoration-pending e só recupera após liberação |
| Broker |4/4: normal, owner morto, guardião morto e Job retido; filho/neto, processo alheio e outra execução legítima preservados |
| Antes do filho/handoff |1/1 antes do filho; mesmo oracle de handoff antigo vermelho/corrigido verde; sem restauração/complete/próximo gate enquanto inconclusivo; nova geração recupera |
| Inspeção/identidade |2/2 inspeções,5/5 boot/recibo/PID+nascimento/sessão; não termina processo por PID isolado/nome/porta |
| Canal |2/2: mutex recusa segundo dono sem parar primeiro; slot ativo corrompido cancela árvore e preserva mutant, recuperação em nova geração |
| Complemento alheio aceito |Processo controlado vivo durante A/B; oracle verde, término prematuro simulado pelo teste detectado vermelho; outro exemplar termina pela barreira explícita. Probe control20s também passou |
| PG17 limitado |1 assertion causal esperadamente falha,0 erros/skips; complete legítimo e834 inputs restaurados. Resume/audit/identidade passaram, uma tentativa e checkpoint SHA idêntico; audit1 prova/0 testes novos |

Há sobreposição entre grupos; não se apresenta soma de testes únicos. Os drivers
de regressão interrompidos por erro de destino anterior aos atores permanecem
falhos nos logs; somente os grupos ainda não iniciados foram executados depois
de corrigir o observador. Os43 controles não foram repetidos. Auditorias de
recursos anteriores a esses últimos atores ficam intermediárias.

Reaproveitados por diff/hashes: contraprova EPERM causal e semântica dos helpers
intocados; fixture30s e falha histórica/classificação B; aceites locais anteriores
de produto/PG16/17/pacote, cada qual em seu alcance. O grupo completo antigo com
fixture expirante não foi reexecutado/promovido. Não se repetiram suítes financeiras,
PG16, startup API/TCP/HQL ou supervisor Linux sem impacto que justificasse.

## Preservação, recursos e proveniência

Conferidos os **19.841 protegidos exigidos**, versões autorizadas e inventários
posteriores: **25.100 protegidos** inicial/final,29 históricos,16 migrations,
provas/checkpoints/runtimes anteriores. O delta autorizado de counterproofs.mjs
foi conferido no SHA posterior, sem alegar preservação da versão anterior. Os
oito módulos de cada cópia de prazo foram restaurados; contraprovas de segurança
também registram antes/executado/restaurado. Backend/frontend sem diff no intervalo.

README raiz alheio SHA-256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
fora dos commits. JAR p05 SHA-256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`,
produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Nenhum pacote
novo, build atribuído ao HEAD documental ou reprodutibilidade binária alegada.
Maven compilou apenas a cópia descartável do preflight.

Coleta de **1.408 artefatos**, SHA original/coletado e conversão/sanitização
explícitas; **3.630 arquivos novos** inventariados, incluindo binários de teste
somente por hash. Um JSON deliberadamente corrompido preservado com marcador,
sem certificado. Nomes longos compactados sem mover originais. Runtimes somente
em revalidacao-rvpla05-residual-20261028-01 e subdiretórios.

Auditoria posterior a todos os atores:130 recibos íntegros,129 Jobs com ausência
certificada; um recibo proposital de outra sessão sem certificado e um checksum
propositalmente inválido preservado. Zero processos associados/API containers
rotulados ativos. Auditoria só lê, sem término de processos; desconhecido não
recebe certificado por ausência de observação.

Sem correção da implementação, clean/reset destrutivo, limpeza geral de target,
banco real, Railway/Vercel, CI remota, push, merge ou deploy. Nenhum processo
desconhecido encerrado. Limites Windows/mesma sessão/criação cooperativa; Docker
Linux sobre Windows não certifica supervisor Linux nativo ou SLA de produção.

# Revisão independente dirigida — sem autoaprovação

Revisar desde `9bed5e20f2cc46e4c7ae721ff2390054eb6db141` na branch
`codex/preparacao-local-adocao`. Implementação e provas de processo:
`64105c975b9893c0d9ab89d8f4996aec4d47454b`; defesa entre sessões:
`0cf06dc6705a7e9cc8eba9d139c7d15426cef5c6`.
Probes/coleta: `df3ac949d67d4e3e9cd1c47e67d7f0a683aa5090`. A preservação final
foi feita após esse commit e antes do commit documental seguinte. HEAD final e
intervalo completo devem ser os informados na entrega.

Atacar primeiro as fronteiras de criação do guardião/Job/worker, morte do owner,
EOF, mutex, consulta que fecha o próprio handle, roster antes de comandos e
restauração. Conferir guardião que chega tarde após uma nova tentativa já ter
observado ausência do Job. Conferir que erro, corrupção, recibo antigo ou sessão
desconhecida bloqueiam; não confundir `closed` de processo com prova causal
`complete` do ProofStore. Contestar reuso de PID e identidade de processos alheios.

Revalidar as duas interfaces do helper compartilhado: modo nomeado do harness
e modo original sem nome da CI. A conversão null→string vazia foi corrigida;
exigir saída normal e árvore encerrada por EOF, não somente mocks de cancelamento.
Em host Linux, conferir recusa do recovery sem certificação, sem deduzir garantia
POSIX dos testes da aplicação Linux via Docker em Windows.

As cópias coletadas são para inspeção; escolher runtimes novos. Comparar fontes,
XMLs e timestamps com os originais pelo mapa SHA, preservando os erros nativos
de reuso. PG16/JAR tem2 pass/1 erro; PG17/JAR5 pass/1 erro; imagem4/4. Esses
dois erros não são falhas causais do wrapper nem autorização para mudar o probe.
Qualquer nova hipótese de TCP exige captura discriminante, sem atribuir TIME_WAIT
retroativamente. A reserva dinâmica aceita permanece no seu recorte.

HQL continua inconclusivo,40s preservados. O próximo experimento próprio deve
registrar fases/pilhas em ambiente sem contaminação com hipótese discriminante;
não alterar produto para fazer a suíte passar. Pacote p05 e migrations devem
continuar com os hashes históricos. Não há pacote compilado destes HEADs.

Estados esperados após esta entrega: RVPLA-01 preservado, reserva dinâmica
preservada, RVPLA-03 saneado localmente **em revisão**, startup não aprovado,
adoção real não liberada. CF017/P01/P02 e CF034 integral continuam em_revisao.
Não executar push, merge, CI remota, configuração de hospedagem, DB real ou deploy.

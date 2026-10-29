# Consolidação local e revisão integrada pré-adoção — 28/10/2026

## Situação vigente após revalidação CPA-01

[Revalidação independente de193916a1](../revalidacao-CPA-01/README.md): **parecer C
mantido somente por CPA-01/R1/P2, agregação de status do required**. O defeito
original da seleção está encerrado; Linux100/115 + Windows1 preservam101/116
identidades e15 históricos. TCPWindows real1/1 e comunsLinux dirigidos3/3 passaram;
23 contratos passaram em cada plataforma, sem declarar Actions ou suíte integral.

O novo job Windows impede o pacote após falha, mas seu dependente required pode
ficar skipped; isso não é certificado de execução aprovada e pode ser insuficiente
como único contexto obrigatório. Rulesets remotos não foram presumidos atuais.
Próximo lote: saneamento separado dessa agregação e revisão, sem alterar o seletor
aceito. [Resíduo e encerramento](../revalidacao-CPA-01/WORKFLOW-REQUIRED.md).

Os registros abaixo são a fotografia histórica da consolidação em56eb80b5;
seu impedimento original de seleção foi substituído pelo estado acima. Os aceites
de produto/startup/TCP/RVPLA/audit/PG16/17 e demais gates conservam alcance.

## Registro histórico da consolidação em56eb80b5

**Parecer C — saneamento local necessário antes de publicar para CI.**
CPA-01/P2 confirma uma incompatibilidade entre o teste Windows de TCP e o
consumidor Linux de CI: o seletor inclui a classe, JUnit a ignora em Linux e
`requireCounts` recusa qualquer skip. Não é defeito financeiro ou reabertura
do aceite TCP. Nenhuma correção de implementação foi feita nesta revisão.

Main remota consultada por fetch somente de sua referência:
`fb986456a37a48afcafef204f165d15354294d26`. Merge-base igual à main remota.
Candidato recebido/revisado: `56eb80b5cb867539d94995ec58b63ce2dbc519fa`.
Intervalo acumulado: **48 commits**, sem commit exclusivo da main; 11.310 arquivos
no delta recebido, dos quais 33 em produto/configuração/testes/helpers de CI.
Os demais são tarefas e evidências, inclusive resultados negativos preservados.
Branch local criada: `codex/consolidacao-pre-adocao`, sem merge/cherry-pick.
Os commits desta revisão acrescentam provas/documentação/estados, sem mudar esse
código. O HEAD documental final é o commit que contém a preservação final,
identificado com SHA completo na entrega; não se inventa hash autorreferente.

## Decisão e alcance

Pode avançar a preparação documental e o saneamento separado da interface
seleção/OS, mediante autorização de implementação. **O candidato atual não recebe
parecer A para publicação/CI.** Para encerrar CPA-01: particionar explicitamente
os contratos por ambiente, executar o contrato Windows em job próprio e fazer
o consumidor Linux exigir zero skips de sua seleção aplicável. Preservar cobertura,
relatórios obrigatórios, falha por ausência de classe, assertions e prazos.
Outra execução deverá revisar esse delta antes de decidir publicação/CI.

Startup continua aceito no recorte local da revisão final, prazo de 40s intacto;
histórico E/inconclusivo não é impedimento geral desta preparação. As quatro
capturas recentes não são uma nova suíte de 17 contratos aprovada. TCP Windows/JAR/PG16/17,
RVPLA-01/03/04/05, audit/EPERM e controles locais de produto mantêm seus aceites
específicos. Não se estende Windows/mesma sessão a supervisor nativo Linux.

CF-017/P01/P02 e CF-034 integral continuam `em_revisao`; CF-035/036 continuam
`proposta`. Zoom nativo 200%, matriz/runner remotos, configuração remota e adoção
real/produção conservam pendências próprias. Nenhum gate removido ou exceção criada.

## Evidência desta revisão

Commit local de provas:
`44ec18f2af1f5716968aaa2b358a843cb89c9d7c`.

- [Reconciliação Git](GIT.md), [SHAs e commits completos](reconciliacao-git.json),
  [material efetivamente no delta](material-git.json).
- [Mapa do intervalo e aceites](MAPA-INTERVALO.md),
  [matriz vigente de aceites e pendências](MATRIZ.md).
- [Interfaces e revisão estática de CI](INTERFACES.md),
  [achado reproduzível e escopo mínimo](ACHADOS.md).
- [Plano prévio e verificações executadas/reaproveitadas](VERIFICACOES.md),
  [recibos](verificacoes.json), [limite JSON](leitor-limites.json).
- [Proveniência](PROVENIENCIA.md), [imagem observada em leitura](imagem-observada.json).
- [Publicação/CI futura](PUBLICACAO-CI.md), [proposta de PR](PROPOSTA-PR.md).
- [Preservação inicial](preservacao-inicial.json),
  [preservação final](preservacao-final.json), [somente runtime novo](runtime-files.json).

13 contratos de CI/sanitização e 5 testes existentes do leitor passaram, zero
falhas/skips. A reprodução de CPA-01 executou a condição real do JUnit 6.0.2 sobre
fontes originais copiadas por hash, com `os.name=Linux` dentro de uma JVM Windows:
1 teste encontrado/1 skipped; o consumidor exato rejeitou. Isso não é execução
nativa Linux nem CI/Surefire remoto. Duas entradas JSON inválidas confirmaram o
limite diagnóstico já conhecido, sem demonstrar invalidade das capturas atuais.
Falha inicial de permissão para inspecionar a imagem está preservada em
[ocorrências](ocorrencias-verificacao.json); somente a consulta foi retomada com
permissão adequada. Nenhum startup, suíte financeira ou pacote novo.

## Próxima etapa e autorizações

1. Autorizar saneamento local **exclusivo de CPA-01**, testes de seleção/OS e
   eventual job Windows; preservar o gate e submeter o delta à revisão independente.
2. Conferir novamente main, conteúdo/SHAs, gatilhos de hospedagem e permissões;
   atualizar o intervalo se houver mudança. Esta revisão não aceita código novo.
3. Somente após novo parecer favorável e autorização: push da branch, PR para
   main, required e dispatch expanded no SHA conferido. Publicação de pacote,
   configuração, merge e adoção são decisões próprias conforme o plano.

Sem push, PR, merge remoto, CI remota, Railway/Vercel, deploy, ativação de serviços,
acesso a banco real, migration ou limpeza. JAR p05 anterior preservado; README
raiz alheio fora dos commits e com hash histórico. Não há alegação de ausência
universal de defeitos nem de reprodutibilidade binária.

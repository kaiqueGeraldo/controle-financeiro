# Achados independentes do candidato aa068d1

## RVPLA-01 — encerrado no alcance causal do resume

O status1 antigo deixava falha pré-efeito em results.json e permitia skip na
retomada. A reprodução pelo blob07c3963 executou tentativa e resume e confirmou
esse defeito. O candidato, no mesmo cenário, conserva0001 falha, cria0002,
restaura os inputs e não alcança o caso seguinte. O controle28 passou;
reintroduzir o skip por status1 falhou pela assertion esperada; restaurar os
bytes fez os mesmos28 passarem. Os testes não equivalem a56 casos distintos.

O observador independente anterior foi reexecutado byte idêntico, com somente
seu destino de saída redirecionado para preservar a prova histórica. Ele ainda
reporta o predicado antigo mesmo lendo o SHA da fonte corrigida: não executa o
resume. Essa inadequação para fechar a correção foi demonstrada, sem apagar o
observador nem mudar sua expectativa. A execução real do runner discrimina as
versões. Identidade, evidências e validação causal voltam a ser verificadas.

## RVPLA-03 — P2 confirmado: wrapper próprio pode sobreviver e iniciar trabalho após resume

Local: counterproofs.mjs, verifyEnvironment, filtro Win32_Process restrito a
java.exe/javaw.exe; counterproof-checkpoint.mjs, run, restauração após essa consulta.

Contrato violado: antes de restaurar/nova tentativa, os recursos próprios devem
ter encerrado e não poder iniciar operações tardias. Ausência momentânea de Java
não demonstra isso para a árvore do comando síncrono.

Reprodução determinística em orphan/: módulos do runner idênticos ao candidato,
input real LegacyPreflight, ferramenta Maven substituída na fronteira por wrapper
cmd/PowerShell próprio aguardando um evento. Nenhum PostgreSQL nessa fixture.
Após estado mutated, foi interrompido somente o Node dono. O wrapper continuou
vivo. Resume criou0002 e restaurou a fonte; só então o evento liberou o wrapper,
que iniciou Java e gravou o efeito tardio. O primeiro trabalho poderia, no uso
real, compilar/observar o checkout da tentativa seguinte. A fixture não prova
escrita financeira ou DDL e não é classificada como teste de produto.

Recibo original: orphan/result.json; Node68228, wrapper21308, Java52740.
Retomada terminou09:30:09,7009839-03; efeito tardio09:30:10,8577317-03.
O SHA do input voltou a74e9ba07…e3eaad2a;0001 ficou recovered-incomplete e0002
failed. Nenhuma delas foi promovida a complete. Os PIDs próprios foram parados
e aguardados; terceiros não foram encerrados. O resíduo trata isolamento e
restauração, mesmo sem reproduzir o skip causal já corrigido de RVPLA-01.

Menor próximo lote: registrar propriedade/identidade dos comandos e descendentes
na criação; impedir restauração/avanço até encerramento comprovado, incluindo a
janela anterior à JVM. Se a propriedade após interrupção não puder ser provada,
recusar a recuperação automática e exigir verificação explícita dos recursos.
Não basta filtrar mais um nome, enviar stop ou matar todo Java/PowerShell do host.
Manter o teste do wrapper tardio, terceiro preservado, fonte restaurada e controle
causal válido. Não há necessidade demonstrada de banco/coordenação distribuída.

**Retomada após interrupção Windows continua pendente nesse recorte.** Isso não
reabre migrations, guard, writers, jobs, saúde, preview ou pacote. Não se extrapola
para outros mecanismos de cancelamento/plataformas.

## Corrida de porta — diagnóstico e correção aceitos no recorte

Reserva temporária fechada permitia ocupação antes do Tomcat. Porta0 no Tomcat e
publicação dinâmica Docker mantêm a reserva no listener real; descoberta parte do
log exclusivo do processo/container nomeado por UUID. Reintroduzir o alocador
antigo fez a regressão falhar por “Port … was already in use”,1 assertion/0 erros.
SHA90473fc6…83ef foi restaurado e o controle passou. Não foi alterado produto.

Os três contratos originais passaram em PG17/JAR e imagem. A regressão de porta
passou em PG16/17. Probes adicionais confirmaram que readiness200 de terceiro não
certifica a aplicação impedida de vincular a porta, preservando esse terceiro.
Na imagem, PID do cliente, container/ID da imagem, encerramento e reutilização da
publicação foram observados. Não há garantia de identificação contra processo
malicioso que forje logs/assuma endereço depois de matar a aplicação.

## RVPLA-02 — startup ainda inconclusivo

Uma falha nova foi explicada por bind de porta; não se atribuem por associação
os estouros anteriores em Windows/Linux a essa causa. Pilhas HQL mostram trabalho
naquele instante, sem causa completa. A sequência instrumentada rápida não
reproduziu o estouro.40s e suas assertions continuam intactos; nenhuma query,
heap, validação ou dependência foi ajustada. Ver STARTUP.md.

## Correção explícita de alcance histórico

O parecer07c3963 afirmou genericamente que as cinco contraprovas p04 tinham
efeitos conferidos. A leitura do receipt de readiness contradiz esse alcance:
falha anterior ao efeito, rejeitada por validateObservation. A afirmação de
cinco detecções causais não deve ser reutilizada. Os originais ficam preservados.
O aceite local de saúde continua sustentado pela contraprova independente
estreita OperationBoundaryProbeTest.readyDatabaseProbeObservesRealUnavailableDependency
e pelo controle restaurado, não pelo receipt ambíguo de p04.

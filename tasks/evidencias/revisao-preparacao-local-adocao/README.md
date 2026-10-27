# Parecer independente da preparação local de adoção

26/10/2026. **Aceite parcial local; lote não liberado para publicação, ativação
da API ou adoção real.** Não foi corrigido produto, runner ou infraestrutura.
Uma falha confirmada do observador de contraprovas e o gate de startup exigem
saneamento/decisão próprios. Configurações remotas foram somente lidas.

## Base e proveniência

- Branch: `codex/preparacao-local-adocao`.
- Base: `46b85ee0428abb55c22d27d26284d054410ec128`.
- Candidato revisado: `6f70a877cd7c9c0024445026bec43931c8fbcba7`.
- Produtor dos inputs do pacote: `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`.
- JAR p05: 86.235.054 bytes, SHA-256 **b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b**.
- Provas desta revisão no commit local `161cd88`; parecer/estados em commit posterior.

Base e produtor são ancestrais do candidato. Os 212 arquivos do diff real foram
inventariados; mudanças de produto/config/testes foram lidas e as evidências
foram tratadas como fontes a conferir. Produtor→candidato altera documentação,
scripts e provas; nenhum input de produto/CI do JAR muda. Os831 inputs brutos
atuais e preservados, blobs do produtor e manifestos foram confrontados;
22 recursos empacotados conferem, incluindo16 migrations e spring.factories.
Imagem local sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1
contém o mesmo JAR; labels/produtor/usuário10001 e Java21.0.12+8 reconferidos.

O build p05 usou verify com seleção de58 testes de hábitos, e não suíte integral.
Os outros resultados são provas específicas de p03/p05 com equivalência dos
inputs pertinentes. Empacotamento dos mutantes não é teste. Esta revisão também
executou verify na cópia de HEAD para a seleção PG17; isso **não muda o produtor
do JAR p05**. JARs em target e imagens de contraprova dos runtimes novos não são
artefatos aprovados para consumo. Não houve rebuild reprodutível, registry ou deploy.

## Decisões A–G

| Parecer | Decisão independente | Evidência / limite material |
|---|---|---|
| A. Suporte PG16/PG17 | **Aprovado localmente** | Servidores/clientes16.15 e17.11 efetivos; migrations/validate, legado independente, drift, rollback/checksum e restore. Não certifica banco real, outras majors, globals/ACL/RLS/extensões |
| B. Inicialização segura e writers/jobs | **Controles aprovados no alcance local** | Guard antes de refresh, bloqueio HTTP/SQL, ausência de scheduling, e-mail fechado e contraprovas causais/restauradas. Não aprova duração de boot nem drenagem de consumidores reais |
| C. Saúde e previews | **Implementação local aprovada no alcance declarado** | Liveness independe do DB, readiness503 e recuperação; BFF preview503 sem upstream. O bloqueio depende de VERCEL_ENV correto e não revoga deployments antigos; nenhuma correção remota aplicada |
| D. Startup | **Não aprovado** | Controle original17/3 falhas; trabalho em parser HQL observado após JPA. Causa completa inconclusiva; dois diagnósticos verdes não apagam falhas Windows/Linux |
| E. Pacote/proveniência | **Bytes e vínculo aprovados localmente** | JAR/manifesto/831inputs/22recursos/imagem conferidos; adulteração rejeitada. Elegibilidade de publicação continua condicionada a D e aos gates de release |
| F. Aplicar configuração remota | **Changeset preparado; aplicação conjunta não liberada** | Inventário atual e14 linhas concretas com efeitos/reversão. C10/C11 podem formar lote preparatório independente, mediante autorização; aplicar imagem/flags/health pode iniciar deployment e exige candidato/ordem aprovados |
| G. Adoção real e uso | **Não prontos** | Sem classificação A–D, inventário de dados/geração, backup/restore reais, proveniência temporal ou freeze dos consumidores. CF017/P01/P02 e CF034 integral mantêm gates; CF035/036 continuam propostas |

## Resultados novos, sem somar sobreposições

| Execução dirigida | Resultado |
|---|---|
| PG17,11 classes | **74 passaram**, zero falhas/erros/skips |
| PG16,5 classes, incluindo3 probes novos | **15 passaram**, zero falhas/erros/skips |
| Contratos BFF | **14 passaram**, zero pendentes/falhas |
| Controle original pelo JAR p05 | 17 executados, **3 falhas de startup**, zero erros/skips |
| Diagnóstico independente | 1 teste, dois processos prontos em37,365/34,321s; DB pausado503/liveness200 e retorno no mesmo processo |
| Contraprova original de preflight | FK indevidamente aceita pelo mutante; assertion detectou |
| Contraprova original do filtro | Inconclusiva: parou antes da escrita por startup; não contabilizada como detecção |
| Quatro contraprovas independentes estreitas | SQL/efeito externo, readiness com DB pausado,16 migrations sem guard e tarefas registradas indevidamente; todas detectadas por assertion |
| Controle restaurado estreito | **4 passaram**;831 inputs da exportação restaurados por SHA |
| Probes HQL sem DB | 76 consultas com libs extraídas e aninhadas; cinco maiores em JVMs frias. Não reproduziram o custo integral do bootstrap |

A regressão financeira integral e as seis jornadas anteriores não foram repetidas:
não houve mudança nas regras/queries de domínio, e seus inputs/limites foram
reconferidos. O modo aberto conserva a cadeia de autenticação/ownership; os
ensaios HTTP/SQL do pacote p05/imagem e E2E existentes permanecem válidos nesse
recorte. O teste novo de modo aberto parou no startup e não recebe sucesso por
herança; a tabela acima deixa esse limite explícito.

## Decisões de engenharia e riscos delimitados

O filtro e flags imutáveis são uma fronteira simples para este monólito: ingresso
O(1), sem query/N+1 novo ou coordenação distribuída adicional. O custo é fechar
também leituras e exigir drenagem/reinício. Migrations, validate, prontidão e
autorização de writers são decisões diferentes; readiness não é trava de banco.
O inventário/restore preserva multiplicidade, campos brutos, sequences e history;
I/O e espaço crescem com dados, e a ordenação custa O(N log N). Não dimensionar
backup real por fixture pequena. A normalização preexistente de CHECK enum-array
continua estreita e não foi ampliada para ocultar constraints/precisão/literais.

Readiness custa um borrow/validação de conexão, O(1) por chamada; excesso de probes
pode consumir pool. Hikari3s/isValid1s e driver2s foram exercitados localmente;
não há promessa universal para qualquer URL/config. Liveness não depende desse
borrow. No Railway, healthcheck é gate de deployment, não monitor contínuo.
Não é necessário introduzir cache, microsserviço ou flag distribuída neste recorte.

Async/listeners foram rastreados: inicializador de timezone não escreve;
listeners financeiros dependem de eventos do domínio; ingresso fechado impede
novos comandos; scheduling condicional remove os cinco agendamentos; e-mail
confere writers antes do cliente externo. Trabalho iniciado antes de parar o
processo não é cancelado retroativamente por uma flag. O executor de e-mail tem
fila e não oferece aqui prova de drenagem integral. A janela real exige ausência
de tarefas em voo, outras instâncias, scripts e writers administrativos; isso é
etapa operacional, sem ampliar a garantia local ou reabrir aceites não afetados.

## Achados e próximo lote

[ACHADOS.md](ACHADOS.md) separa defeito confirmado do observador (RVPLA-01),
startup pendente (RVPLA-02), configuração remota incompatível e lacunas reais.
O caminho resume antigo aceita status1 como conclusão mesmo quando o processo
parou antes do efeito causal. A reprodução usa o resultado novo e o predicado
exato, sem executar resume. Não foi corrigido durante a revisão.

Próximo lote recomendado: **saneamento local RVPLA-01 + diagnóstico dirigido de
startup RVPLA-02**, seguido de revisão do delta. Autorizar explicitamente alterar
o observador de contraprovas e, somente após causa demonstrada, a mudança mínima
de startup com regressão/contraprova. Recursos descartáveis e pacote novo se os
inputs mudarem; sem remoto/push/CI/deploy/DB real. Não autorizar reescrita ampla
de consultas financeiras nem elevar prazo por tentativa. C10/C11 de prevenção
de novos previews são um lote remoto independente, se o usuário o escolher,
sem ativar serviços, apagar deployments ou publicar código.

[ORDEM-OPERACIONAL.md](ORDEM-OPERACIONAL.md) preserva os cenários A–D e separa
validação remota, publicação do pacote, preparação de configuração, classificação
do banco, backup/restore/preflight, migrations, bootstrap, smoke e liberação.
Qualquer ação remota futura exige os alvos/IDs e autorização indicados na matriz.

## Evidências e preservação

- [Matriz por requisito](MATRIZ.md), [startup e limites](STARTUP.md).
- [Inventário/configuração proposta](CONFIGURACAO-PROPOSTA.md), [comandos](COMANDOS.md).
- [Contagens, hashes e coleta](resultados.json), [falha de resume](observador-resume.json).
- [Proveniência](PROVENIENCIA.md), [pacote verificado](pacote-verificado.json), [preservação inicial](preservacao-inicial.json) e [final](preservacao-final.json).

README raiz permanece com alteração preexistente, SHA
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA,
fora dos commits.29 arquivos históricos e16 migrations conferidos, inventário
atual da pasta de migrations também16. Runtimes p01–p05 e históricos não foram
limpos. Novas execuções revisao-20261026-01/02 permanecem externas e preservadas.
As cópias duráveis de logs suprimem JDBC/segredos; hashes dos originais e coletados
distinguem sanitização. Bytes CRLF/espaços de logs foram preservados, inclusive
as advertências de whitespace do diff; não são código/gate alterado para aprovar
o candidato. Nenhum clean, reset destrutivo, push, merge, CI remota, mudança de
configuração, ativação, deploy ou acesso ao banco real foi feito.

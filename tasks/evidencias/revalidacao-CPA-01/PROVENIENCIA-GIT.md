# Proveniência, Git e limites

| Identidade | Valor conferido |
|---|---|
| Base da correção |434e293f76c3b6ff345fe03f2091149291316aac |
| Implementação examinada |c597ffc5c33abe45f764b1aaca099daa9f520b00 |
| Candidato recebido |193916a1778f1322f5368f66d30a83286766b147 |
| Branch mantida |codex/saneamento-cpa01-selecao-testes |
| Main remota atualizada somente por fetch |fb986456a37a48afcafef204f165d15354294d26 |
| Merge-base |fb986456a37a48afcafef204f165d15354294d26 |
| Main local preservada |272001f7b4c39aebd18bdcd856109f9a0f6c1213 |
| Exclusivos na entrada |0 main / 53 candidato |
| Snapshot testado |470 inputs, sourceDigest b19e7a0bc0d761e5536d4b349eebd240c704d50c56a0bd2bee418f90cd870662 |

O candidato é descendente direto da consolidação anterior. Os dois commits do
saneamento já estão contidos, sem merge/cherry-pick ou reescrita. Os commits desta
revisão acrescentam provas e documentação, sem modificar os seis arquivos de
implementação/testes/workflow do delta. HEAD documental final identificado na
entrega e no commit que contém a preservação final; não se inventa autorreferência.

Intervalo acumulado preparado para uma publicação **futura, ainda condicionada a
R1**: main fb986456 até o candidato 193916a1, mais os commits locais desta revisão.
O texto final informa os SHAs completos e a contagem final. Antes de publicar
qualquer saneamento posterior, novo fetch/merge-base/diff e aceite do código novo.
Não atribuir este parecer a uma combinação futura não verificada.

## Inputs e provas

39 caminhos relevantes foram registrados inicialmente: alterações examinadas,
16 migrations, JAR p05, README e manifests/provas pertinentes por hash. Os 470 inputs
do snapshotWindows foram comparados às fontes atuais. O digest coincide com o
snapshot do executor, agora ligado explicitamente ao candidato 193916a1; isso não
substitui a execução independente, registrada nos novos recibos.

42 referências explícitas dos runtimes anteriores indicadas por conferencia.json
foram rehashadas. O verificador original e CondicaoLinux.java mantêm os hashes
da consolidação anterior e suas assertions. A anotação mudou de local, mas o
corpo, assertions e budget de 3s do teste TCP coincidem com a base. Nenhum manifest
histórico foi reescrito para fazê-lo coincidir com os documentos atualizados.

Produto/src-main, POM, frontend, queries e 16 migrations não mudaram neste delta.
Startup de 40s, TCP/reuso, RVPLA/audit e PG16/17 são reaproveitados no alcance anterior;
não há nova certificação financeira, startup integral, supervisor Linux ou produção.

## Pacote anterior preservado

JAR disponível em `../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar`:

```text
b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b
```

Produtor dos inputs:24844b594e4ed8fe906e0fc6eaee32bdd58f31a0. Não é compilação
do HEAD193916a1 ou dos commits documentais desta revisão. Maven/Surefire compilou
classes no export novo e executou somente o teste Windows; não produziu JAR novo.
A imagem local p05 e a proveniência anterior não foram alteradas. O digest JDK Linux
usado no teste não deve ser confundido com imagem de aplicação ou registry novo.

README raiz permanece com alteração preexistente fora dos commits, SHA-256:

```text
6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca
```

Runtime novo único, com subpastas de export/legacy/Windows/Linux:
`../controle-financeiro-runtimes/preparacao-adocao/revalidacao-cpa01-20261028-01/`.
Inventário somente desses artifacts; junction do JDK registrada sem atravessar
a árvore histórica. Brutos, classes, dependências e XML Windows com propriedades
ficam externos. Sem limpeza de target histórico, clean/reset, banco real,
hospedagem, push, PR, merge, CI remota, serviço de produto ou deploy.

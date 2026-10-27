# Cadeia do candidato e preservação

Base46b85ee0428abb55c22d27d26284d054410ec128 → inputs
24844b594e4ed8fe906e0fc6eaee32bdd58f31a0 → evidências/documentação
6f70a877cd7c9c0024445026bec43931c8fbcba7 → provas independentes
161cd88a136dd54187a2a90d1fa0b1da296df87b → commit de parecer/estados.
Todas as ancestralidades relevantes e o diff real foram conferidos. Branch
permanece codex/preparacao-local-adocao; nenhum push ou alteração de refs remotas.
A primeira leitura Git, antes de criar o observador, mostrou somente README
modificado e index vazio. O recibo inicial já lista o próprio observador de revisão
como arquivo novo não rastreado; isso não é trabalho preexistente do usuário.

JAR p05:86.235.054 bytes, SHA256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Source digest dos831 inputs:
`a04c606f04c5117318f4b9d46854c9aeee5a445e9e3bd5288354c24dcfaad72c`.
Manifesto de inputs SHA256:
`04c0213b2fdb63130d9fdc7af5aea3fa140e46ae810f1648d3304fe1b775367d`.
Os manifestos/stage originais não foram reescritos. O digest foi recalculado;
bytes atuais e p05 batem com o manifesto, blobs com o commit produtor e o diff
normalizado dos inputs é vazio. README raiz/documentação posterior não são inputs.

As16 migrations reais e mais6 recursos do JAR foram comparados byte a byte com
as fontes. META-INF/spring.factories está no local correto no pacote. Lista de
bibliotecas vem do próprio JAR; Spring Boot4.0.2, Data JPA4.0.2, Hibernate7.2.1,
Flyway11.14.1 e pgjdbc42.7.9 não foram atualizados nesta revisão.

Imagem local `sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`,
linux/amd64, usuário10001:10001. SHA do arquivo embarcado e labels conferidos
novamente com entrypoints de inspeção, network none. ID de imagem local não é
digest de manifesto publicado em registry. Base/runtime da construção anterior
e produtor continuam no recibo original; nenhuma imagem foi publicada.

Build p05: Maven verify selecionou58 casos de hábitos; os17 contratos do JAR
tiveram3 falhas de startup, enquanto a rodada Linux original passou17 e o controle
restaurado posterior falhou2. Preservar todas essas afirmações simultaneamente.
Não houve reprodução binária independente ou compilação p05 atribuída ao HEAD
documental. A compilação verify nova da revisão gerou outro artefato de trabalho;
depois houve builds mutantes na mesma exportação. **Não consumir target/api.jar
ou target/api-0.0.1.jar dos runtimes de contraprova como pacote aprovado.**

Uma cópia independente do JAR sofreu alteração em1 byte: hash alterado
0a50f74c35317241e9051aa7c1d14076183d56f2fd5fcceefc4d88e798827562,
recusado; cópia e original retornaram/conservaram o hash esperado. Nenhum arquivo
do pacote p05 foi alterado. Cada mutação de fonte ficou só na exportação nova e
foi restaurada por SHA; witness estreito verifica os831 inputs. Ambos os runtimes
novos foram novamente comparados aos seus manifestos, sem inputs divergentes.

README raiz inicial/final:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
29 arquivos históricos inventariados mantêm os bytes;16 migrations atuais e
históricas batem. Outros runtimes históricos não foram limpos nem alegados como
inventariados integralmente. Nenhum target geral foi removido.

A captura final antecede o commit de parecer, cujo hash exato é entregue ao
usuário após a gravação; não pode incluir o próprio hash de seu commit. Essa
diferença documental não altera pacote ou fontes. Logs duráveis preservam CRLF,
espaços e sua primeira falha; só a sanitização declarada distingue hash original
externo e coletado. O primeiro JSON remoto tinha uma linha vazia final, mantida
como recibo; avisos de whitespace desses dados não representam testes aprovados.

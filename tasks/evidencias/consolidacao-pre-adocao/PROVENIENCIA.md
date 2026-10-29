# Proveniência do candidato e dos pacotes

| Identidade | Valor / limite |
|---|---|
| Código recebido, incluindo testes/scripts | 56eb80b5cb867539d94995ec58b63ce2dbc519fa |
| Último commit em backend/src/main | 6e751934b62cc7524e52c4b5b248fc517a2475ee (saúde); controles em 02b43641, PG em fe770d9d |
| Último commit em frontend/src | 1982dc7caf206cfc30e3b12a1831759cbeffa121 (preview) |
| Snapshot produtor dos inputs p05 | 24844b594e4ed8fe906e0fc6eaee32bdd58f31a0; 831 inputs |
| Último commit nos helpers .github/scripts | 762a085eb241a3b52f64e8fa1a026c878880945c |
| Último commit em counterproofs.mjs | e88ee50af24454f0393fdc1ed5321064387b79d2 |
| Último commit no harness Java | b8b645d00556307e6d7405968277f22c779f7983 |
| Parecer startup / HEAD documental recebido | 56eb80b5cb867539d94995ec58b63ce2dbc519fa; provas6cdf3a49924d7c1a654b618f1453c3d3ff8f998e |
| HEAD documental desta consolidação | Commit que contém preservacao-final.json, posterior aos commits de provas/parecer; SHA completo informado na entrega e resolvido pela branch local |

O commit produtor identifica o conjunto de inputs, não garante que cada arquivo
de produto tenha sido alterado nele. A conferência Git atual mostra **nenhum delta
de src/main, POM, frontend, Dockerfile.release ou workflows** entre produtor p05 e
candidato. Há diferenças nos quatro helpers de supervisão e quatro arquivos
Java de testes/harness; também há scripts/provas posteriores em tasks. Portanto,
os 831 inputs completos não são declarados idênticos ao HEAD atual. Aceite de
produto é reaproveitado no recorte sem delta; os scripts têm aceites próprios.

## Pacote local p05 disponível

Caminho:
`../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar`.
**86.235.054 bytes**, SHA-256 conferido inicialmente e na preservação final:

```text
b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b
```

Manifesto [package.json original](../preparacao-local-adocao/package.json):
inputsCommit24844b59; sourceDigest
`a04c606f04c5117318f4b9d46854c9aeee5a445e9e3bd5288354c24dcfaad72c`;
SHA-256 de [inputs.json](../preparacao-local-adocao/inputs.json)
`04c0213b2fdb63130d9fdc7af5aea3fa140e46ae810f1648d3304fe1b775367d`.

Revisão independente anterior conferiu831 inputs e 22 recursos do JAR, incluindo
16 migrations e spring.factories; seu recibo e os manifests estão referenciados
por hash em preservacao-inicial.json. Aqui se reconferiram os arquivos alterados/
pertinentes e a equivalência Git de produto. Não se gerou outro inventário
recursivo nem se alegou nova auditoria física integral dos 831 inputs antigos.
O verify produtor usou seleção58 hábitos; outras garantias usam provas específicas
anteriores explicitadas nos pareceres. Não é suíte financeira integral nova.

## Imagem local disponível

ID imutável local:
`sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Linux/amd64, usuário10001:10001. Inspect somente leitura atual confirma labels
de produtor 24844b59 e JAR b296…; [recibo atual](imagem-observada.json).
O hash do JAR embarcado e Java 21.0.12+8 foram conferidos independentemente antes;
essa prova é reaproveitada pelo mesmo ID, sem criar container/reextrair/rebuild.
Base resolvida registrada:
`eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b`.
ID de imagem local não é digest publicado de registry; nenhuma imagem foi publicada.

## Pacote main histórico distinto

Mainfb986456, run40337346702/1, 820 inputs, 86.225.965bytes:

```text
c3860ec069aa893b8faed588f9a20904930a2937c0e8eb94818297651c85a9d9
```

É outro JAR, ligado à main e ao run históricos conferidos na revisão de prontidão.
Não é o p05, não representa os controles novos e não recebe testes do HEAD atual.
Os bytes/manifests históricos não foram alterados ou promovidos a nova execução.

## Artifact futuro

Não produzir pacote local só para acompanhar documentação. A futura CI deverá
construir novo JAR do checkout realmente testado, com sourceDigest, lista de inputs,
hashes de POM/lock, toolchain, comandos, seleção, contagens, run/attempt/job/event/ref/SHA
e hash do pacote. O gate rejeita alteração após verify ou pré-requisito divergente.
Relatórios de OS e PG17 novos devem vincular-se ao mesmo candidato e ter hashes
próprios, sem anexar seu aceite retroativamente ao p05.

Se uma imagem for necessária posteriormente, produzir pelo Dockerfile.release
com esse JAR e digest explícito do runtime, conferir hash embarcado, labels, usuário
e contratos do pacote/imagem exatos. O workflow atual não faz esse build de imagem.
Escolha de registry/publicação/ativação depende de etapa autorizada separada.
Não há alegação de reprodução binária, imagem reproduzível ou SLO de produção.

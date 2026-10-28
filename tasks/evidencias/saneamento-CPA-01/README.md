# CPA-01/P2 — saneamento local da seleção por plataforma

28/10/2026. **Saneado localmente, aguardando revisão independente.** O parecer C
da consolidação permanece; este registro não aprova publicação, CI ou adoção.

Base conferida: `434e293f76c3b6ff345fe03f2091149291316aac`, branch de origem
`codex/consolidacao-pre-adocao`. Branch criada:
`codex/saneamento-cpa01-selecao-testes`. Implementação:
`c597ffc5c33abe45f764b1aaca099daa9f520b00`. Intervalo específico de código:
`434e293f76c3b6ff345fe03f2091149291316aac..c597ffc5c33abe45f764b1aaca099daa9f520b00`.
O commit documental posterior e o HEAD final são informados na entrega, sem hash
autorreferente. Não houve merge, rebase ou cherry-pick. `origin/main` local e
merge-base conferidos em `fb986456a37a48afcafef204f165d15354294d26`; sem fetch nesta
execução, portanto sem alegação de estado remoto atualizado.

## Causa e decisão

O seletor anterior descobria classes sem plataforma e incluía
`AdoptionNativeSocketsTest` no Ubuntu. A condição JUnit Windows ignorava seu único
teste, e `requireCounts` rejeitava corretamente o skip. O erro era a seleção.

Agora `backendSelection(root, suite, targetPlatform, scope)` exige `linux` ou
`win32`; não usa fallback ou falsificação de `os.name`. O runner fornece
`process.platform`, porque chama um Maven/JVM local. Execuções em container devem
executar também o controlador nesse container, como na prova Linux deste lote.
O host Windows e o controlador Docker externo não determinam a seleção interna.

A condição `@EnabledOnOs(OS.WINDOWS)` foi movida do método para a classe dedicada,
mantendo JUnit como fonte da partição. Corpo, assertions e budget de3s são idênticos;
o helper TCP não mudou. Não há lista operacional duplicada de classes por OS.
O seletor aceita a forma restrita class-level `OS.WINDOWS|LINUX`; condições em
métodos, múltiplas, `DisabledOnOs` ou sintaxes não suportadas provocam erro. É um
contrato de fontes Java controladas, não um parser Java geral. Nova forma de
condição exige extensão explícita e revisão; não vira exclusão silenciosa.

Benefício: seleção e condição não divergem por manutenção de listas. Custo: um
job Windows adicional, tempo antes do required e sintaxe de condição restrita.
Descoberta continua O(B + N log N), com B bytes de fontes e N classes, incluindo
ordenação; não há estado concorrente, DB ou query nova. Relatórios vêm de execução
própria e diretório externo novo. Portar o supervisor TCP para Linux ampliaria o
escopo sem necessidade para resolver esta composição.

## Matriz por identidade e plataforma

Os números abaixo são observações do candidato; os testes comparam identidades,
não baselines numéricos a atualizar quando entra uma classe comum.

| Grupo | Antes | Depois Linux | Depois Windows | Job/relatórios obrigatórios |
|---|---:|---:|---:|---|
| Comuns smoke |100|100|100 se seleção geral Windows for usada|`required` Linux; cada classe selecionada precisa XML|
| Históricos adicionais expanded |15|15|15 na seleção geral expanded|`expanded` Linux, além de todo smoke; fixtures continuam pendentes|
| Exclusivo Windows: `AdoptionNativeSocketsTest` |1 indevidamente nos dois jobs Linux|0; encaminhado em `routed`|1 no escopo `platform-only`|`windows-native`; XML da classe e execução real sem skips|
| Exclusivos Linux existentes |0|0|0|Nenhum nesta base; mecanismo coberto por fixture sintética|
| Total smoke/expanded antigo |101/116|100/115|1 específico além do Linux|União obrigatória preserva101/116 identidades|

[Seleções completas](selecoes.json). `suites.test.mjs` enumera independentemente
as fontes concretas e confronta a união Linux+Windows em ambas as suites; também
confere comuns, 15 históricos, plataformas desconhecidas e seleções vazias. A
expectativa de identidade do teste Windows é um controle, não outra lista usada
para selecionar produção. Adicionar outro contrato exclusivo requer revisar essa
expectativa e a capacidade do job, impedindo perda silenciosa.

## Workflow e runner

`ci.yml` tem o caminho `windows-native -> required -> expanded`. Windows não tem
condição por evento ou suite: PR para main, push main e dispatch smoke/expanded
atingem esse job nos mesmos filtros de paths existentes. Push desta branch
continua sem disparar o workflow. Expanded preserva sua condição de dispatch e os
15 históricos; nenhum deles foi removido ou declarado aprovado.

Windows/JDK21/Node24 executa `ci.mjs windows-native`, exige relatório da seleção,
zero falhas/erros/skips e usa Maven `test`, sem pacote. A tentativa inicial expôs
aspas de `cmd /c` incompatíveis com o launcher Windows existente; a chamada passou
a usar PowerShell com argumentos literais e retorno de `$LASTEXITCODE`. O controle
de caminhos com espaços/apóstrofos e o estágio real passaram. O launcher de Job
Object, cancelamento e seus contratos anteriores não foram alterados.

`required` mantém frontend/backend/E2E/package e seu próprio `verify`; os comuns
continuam obrigatórios. Windows publica diagnóstico sanitizado de mesmo SHA via
allowlist existente, com seleção/contagens/hashes XML/sourceDigest/identidade CI
em `result.json`. XML com propriedades fica privado; sem upload bruto ou pacote
Windows. Sem CI remota executada, artefato remoto ou regra remota conferida.

Antes de eventual publicação, conferir também `windows-native` nos required
contexts: se falhar, `required` dependente pode ficar skipped; isso não é aceite.
Esse cuidado está no [plano futuro atualizado](../consolidacao-pre-adocao/PUBLICACAO-CI.md).
O pacote não é alcançado pelo workflow enquanto Windows não passar.

## Provas executadas, sem somar sobreposições

| Prova | Ambiente/resultado | Alcance |
|---|---|---|
| Original antes, byte idêntica |Controlador Windows/Node24; JVM Windows21.0.12.1 com condição `os.name=Linux`;1 encontrado/1skip; gate rejeitou|Simulação da condição JUnit6.0.2; não Linux nativo|
| Original depois, cópia histórica idêntica |Mesmo resultado; seletor/Java/assertions antigos por hash, em nova cópia|Contraprova histórica permanece vermelha; não se espera verde do seletor antigo|
| Contratos corrigidos/restaurados |23/23 Windows e23/23 Linux; zero skips|Mesmos23 contratos, não46 testes únicos|
| TCP Windows corrigido |Windows11 amd64 real, Maven3.9.12/wrapper, Temurin21.0.12.1, Node24.18.0; Surefire1/1 em3,125s, zero skips|Novo estágio completo, fontes recompiladas em export próprio; sem JAR ou DB|
| Linux com seleção antiga |JVM Linux21.0.12+8 real:3 comuns aprovados+1Windows skipped; gate rejeitou4/1skip|Reintrodução dirigida da seleção antiga, sem alterar os.name|
| Linux corrigido |JVM Linux real:3 casos de DateUtilTest aprovados/zero skips; seleção integral100/115 calculada|Execução comum dirigida; não as100/115 classes completas|

Linux: Docker Desktop/engine Linux sobre WSL2 no host Windows; controlador interno
Node22.23.1 extraído de imagem local e JVM Temurin21.0.12+8 Linux amd64. Imagem por
digest `eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b`.
Sem rede nos containers. Node Linux não era24, versão prevista no workflow; isso
permanece limite local. Não é Actions, supervisor nativo Linux ou certificação de
cancelamentoLinux/daemon. XML Linux é ponte do resumo do JUnit real, declarada no
launcher de prova; XML Windows é Surefire real.

[Reprodução antes](reproducao-original.json), [depois](reproducao-original-depois.json),
[Windows/contraprovas](validacao-windows.json), [Linux](validacao-linux.json),
[conferência](conferencia.json), [ocorrências](ocorrencias.json).
Os470 arquivos do snapshot testado coincidem com as fontes atuais; sourceDigest
`b19e7a0bc0d761e5536d4b349eebd240c704d50c56a0bd2bee418f90cd870662`.
O recibo conserva base434e293f+alterações locais porque foi produzido antes do
commitc597ffc5; a conferência liga os inputs, sem inventar compilação do HEAD final.

## Gates e contraprovas isoladas

`requireCounts` está byte idêntico ao da base. Permanecem rejeitados falha real,
erro e qualquer skip; presença obrigatória de relatórios é conferida para cada
classe. Foram adicionadas rejeições explícitas de seleção vazia e evidência
interna ao checkout. Diretório de execução já existente continua proibido, logo
relatório antigo não certifica execução nova. Maven também exige testes encontrados.

| Contraprova | Resultado |
|---|---|
| Retirar filtro de plataforma |Teste de identidade falha; Linux real com a seleção antiga gera skip/rejeição|
| Omitir `DateUtilTest` |Oráculo independente de identidades detecta a classe obrigatória ausente|
| XML com skip inesperado |Rejeitado por invalid counts|
| XML com falha/erro real |Rejeitado; falha não foi convertida em skip|
| Classe obrigatória sem XML |Rejeitada por Mandatory classes have no report|
| Seleção vazia com XML positivo |Rejeitada por Empty mandatory backend selection|
| Zero execuções |Rejeitado por invalid counts|
| Reuso de diretório com XML antigo |Rejeitado por Never reuse an evidence directory|

Mutações aplicadas somente no export; bytes originais restaurados e contratos
restaurados23/23. SHA-256 do seletor restaurado:
`a12e30ec01b4be7d1bb6225c723053436b7f0f9af0ac24c7f77de85e044db865`.
Mutante seleção antiga:
`b1ee1822ce2bbfdbc1da4e280bac1ccbf4a0f235471130d838c1d460b3dccd9a`;
mutante omissão:
`abd66248e3c908b751e2ae17544d1a7e830fd19401e0cf6d05fdeb82a0513b3e`.
Logs/hashes dos negativos e suas restaurações estão no recibo Windows.

XML Surefire Windows (privado):
`d266817e7a76f1f34133fc93bf7d0900405d867ce9ae41848805d7e92c730202`.
XML Linux do skip:
`9f2443c8d135ca5e5259be3c4ce5a715f0e2a6a638541797d8ebfde219d2fedd`;
XML Linux comum corrigido:
`e97f8d1a76014d5efb506c36b78d82c96490b1b4bf61db1c2efe9534997d9238`.

## Preservação, estados e revisão seguinte

[Inicial](preservacao-inicial.json) e [final](preservacao-final.json) conferem os
manifestos existentes por referência/hash, sem inventariar runtimes históricos.
Apenas o plano PUBLICACAO-CI foi atualizado na evidência histórica; provas,
assertions independentes, manifests e aceites anteriores permanecem intactos.
Os novos runtimes estão em `../controle-financeiro-runtimes/preparacao-adocao/cpa01-*`;
[conferência](conferencia.json) referencia42 outputs/manifests diretamente necessários.
Temporários/classes/dependências e XML Windows bruto não entram no Git.

README raiz alheio, inicial/final:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
JARp05 anterior, sem novo pacote:
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Produto/backend-main/frontend/pom e16 migrations sem delta. Nenhum clean/reset,
limpeza geral de target, banco real ou alteração de hospedagem.

Mantidos startup local40s, HQL histórico E/inconclusivo não bloqueante para
preparação, TCP/reuso Windows/JAR, RVPLA/audit/EPERM e suportePG16/17 nos alcances
anteriores. Sem reexecutar suites financeiras completas, startups ou adoção.
CI/matriz remota ampliada, CF034 integral, zoom nativo200%, CF017/P01/P02, adoção
real, configuração remota e produção continuam pendentes. CPA-02 fora do escopo.

Próximo passo: outra execução deve revalidar CPA-01 no intervalo final entregue,
confrontar seleção/identidades/workflow/gates/proveniência e emitir o novo parecer
de prontidão. Sem autoaprovação, push, PR, merge ou CI remota neste lote.

## Reprodução em runtimes novos

Comandos locais usados, a partir da raiz; cada destino deve ser novo. Os scripts
recusam reuso e preservam recibos; novas rodadas devem usar cópia da pasta de
evidência para não sobrescrever os arquivos duráveis existentes.

```text
node tasks/evidencias/saneamento-CPA-01/reproduzir-original.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-original-01
node tasks/evidencias/saneamento-CPA-01/validar.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-validacao-02
node tasks/evidencias/saneamento-CPA-01/validar-linux.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-linux-01
node tasks/evidencias/saneamento-CPA-01/reproduzir-original.mjs ../controle-financeiro-runtimes/preparacao-adocao/cpa01-original-depois-01 depois ../controle-financeiro-runtimes/preparacao-adocao/cpa01-original-01/source
```

A primeira reprodução exige seletores históricos: nesta branch corrigida, use
o source export histórico indicado no último comando. Os originais continuam em
`../consolidacao-pre-adocao/`; não executar seu verificador sobre a evidência
histórica, pois ele escreve recibos. Logs duráveis: [Windows](contratos-windows.log),
[restaurados](contratos-restaurados.log), [Linux](contratos-linux.log),
[toolchainLinux](toolchain-linux.log), [execuçãoLinux](execucao-linux.log).

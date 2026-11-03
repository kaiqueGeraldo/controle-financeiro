# Expanded local do recorte autorizado pela DEC-ZOOM-05

**Reprovada/incompleta no gate de componentes Linux.** O preparador foi
corrigido e os controles operacionais passaram; o novo preflight Windows passou.
Na tentativa seguinte, 624 de 626 ocorrências de componentes passaram e duas
excederam o limite original de 5.000 ms. Não houve retry desse gate, alteração
de assertion ou aumento de timeout. A causa dos timeouts permanece inconclusiva.

## Candidato, execução e plataformas

Base inicial 9d3c384a5b36085a1c82014302b1c4191ba3b8e1, limpa, na worktree
pr3-expanded-source/branch codex/saneamento-pr3-expanded. f6297df8 é ancestral.
Candidato efetivo da tentativa de componentes e do contrato Windows:
a7f2256b90a7e195df826e89ba51ea7486c6fbf1.
Os 860 inputs de produto/testes/CI continuam byte a byte iguais a
0aac7ccd25934ec022939464486da9fb28610279, digest
d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
Os scripts operacionais novos/corrigidos têm commit e hashes próprios.
Não houve cópia antiga silenciosa de runner; nenhuma mudança em .github,
produto, testes funcionais ou migrations.

Controlador Node 24.18.0/Windows 11 amd64; JVM Temurin 21.0.12.1+1 Windows;
Maven 3.9.12. Docker Desktop/contexto desktop-linux, daemon aprovado
2455a676-938f-48d8-a0ef-67c98474314d. JVM acessa serviços por 127.0.0.1;
PostgreSQL 16 em container Linux. Frontend executado por Node 24.18.0 em
filesystem Linux nativo /work/s; os 860 arquivos/hashes foram conferidos antes
do gate. Não houve JVM backend Linux, frontend Windows ou navegador real:
componentes usam jsdom. Isto não certifica backend Linux no Actions.

## Estabilização operacional

1. Preparador aceita as duas convenções explícitas de basename, preserva
   destino novo e valida caminho absoluto, raiz lexical/física, traversal,
   parent não diretório e links/junctions. O patch antigo foi analisado;
   só ampliar o prefixo não cobriria todas as garantias do novo pedido.
   Oito controles passaram, incluindo exportação real das 860 fontes.
2. Primeira tentativa no commit 1e1f23cd: probe original passou C–G, com
   Ryuk, PG, guard e JDBC. O snapshot de cleanup ainda viu o Ryuk transitório
   sem a label de session usada para consultar PG. Seu desaparecimento
   automático foi confirmado; a primeira recusa foi preservada.
3. Observador passou a correlacionar o ID exato do Ryuk registrado pela
   própria JVM, imagem e label Testcontainers, recusando IDs do baseline
   mesmo com labels coincidentes. Quatro controles passaram. Novo preflight
   completo passou com cleanup comprovado; sem mudar probe, guard ou Ryuk.

O custo da validação de caminhos cresce com seus segmentos/comprimento e
leituras de metadados; rejeitar também junctions internas é conservador.
A correlação por ID tem custo de inspeção dos poucos recursos próprios e
evita presumir que uma consulta vazia por session prova cleanup. Não altera
domínio, queries, transações ou concorrência do produto. As alterações
operacionais **aguardam revisão conjunta**; controles aprovados não são
autoaprovação de implementação.

## Gates e contagens

| Gate/decisão | Resultado novo |
|---|---|
| Preparador / observador | 8/8 e 4/4 controles distintos, zero falhas/skips |
| Preflight Windows |aprovado na tentativa02; C–G + cleanup; tentativa01 preservada |
| Contratos CI/seleção | 43/43 Windows e 43/43 Linux; mesmas 43 identidades |
| Instalação / lint / tipagem Linux |aprovados; lint zero warnings |
| Temporais/unitários Linux |18 execuções = 6 casos nos 3 fusos; zero falhas/skips |
| A. Componentes frontend Linux | 626 ocorrências/71 arquivos; 624 aprovadas, 2 timeouts, 0 erros globais/skips/todo |
| B. Backend expanded Windows |não alcançado;115 classes comuns não executadas |
| C. Contrato Windows/cobertura Java |AdoptionNativeSocketsTest 1/1 aprovado em execução independente; união planejada 116 = 115 comuns + 1 Windows; cobertura executada1/116 |
| D. RF15 real |não alcançado; A25 = B2 + C23 preservado por inventário/bytes, sem listagem/resultado novo de navegador |
| E. E2E financeiro |não alcançado; zero jornadas novas |
| F. Build/pacote |builds e browser-install não alcançados; nenhum JAR/package-manifest/hash novo |
| G. Publicação/CI |não pronta pelo resultado desta rodada; nenhuma aprovação remota |

O contrato Windows foi executado pelo estágio canônico windows-native, após
o fluxo Linux parar, porque a classe dedicada de TCP não depende de React,
build frontend ou PG. O caso liveOwnedListenerCannotBeCertifiedReleasedOrTerminated
passou em 3,093 s. Não é continuação aprovada do fluxo reprovado e não substitui
os 115 comuns. Maven compilou fontes de teste, mas executou apenas esse caso.
Não somar 137 fontes compiladas, diagnósticos de infraestrutura ou 23 jornadas previstas
como testes Java executados. Não houve startup Spring sujeito ao gatilho de 40 s.

A conferência de componentes preserva o multiconjunto exato do auditor e do
inventário revisado: nenhuma ocorrência ausente ou extra. São 625 chaves distintas
arquivo+título: uma chave em src/services/onboarding/contract.test.tsx aparece
duas vezes, já no inventário anterior. As 626 ocorrências não são apresentadas
como 626 títulos únicos. A colisão nominal fica registrada sem alterar testes.

## Primeiro bloqueio de produto/teste, preservado

| Identidade | Observação |
|---|---|
| tests/component/cards-planning-audit.test.tsx — CF-013: cartões, faturas e planejamento lista longa mantém a ação de pagamento fora da área rolável |timeout de 5000 ms; duração reportada 5769,337 ms |
| src/screens/private/onboarding/screen.test.tsx — compares conflict snapshots and does not silently choose the server |timeout de 5000 ms; duração reportada 5432,949 ms |

São duas ocorrências diretas de timeout, sem erro global do auditor ou cascata
de contexto Spring. Não foi registrada divergência de assertion financeira.
Sobrecarga/temporização do ambiente é hipótese, não causa demonstrada; não se
classifica automaticamente como ajuste operacional nem defeito de produto.
A observação de duração acima de 5 s não autoriza ampliar o limite.
O runner retornou exit 1 e bloqueou build/backend/RF15/E2E/package. Nenhum desses
gates foi disparado manualmente para fabricar aprovação.

## Proveniência, cleanup e preservação

[EXECUCAO.json](EXECUCAO.json) reúne comandos, início/fim, exits, plataformas,
identidades, limites e referências SHA256 dos relatórios obrigatórios.
[MATRIZ.md](MATRIZ.md) foi registrada antes dos gates e distingue as tentativas.
Originais, eventos do auditor, XML e relatórios completos ficam no runtime novo
expanded-local-20261103-02; coleta canônica sanitizada concluída. Não há fallback
bruto publicado nem cópia recursiva do acervo histórico.

Sete containers próprios das duas tentativas de preflight e do frontend Linux
estão ausentes por ID. PG/bancos descartáveis encerrados; nenhum processo próprio
remanescente. Os oito containers históricos, três redes e conjunto de volumes
coincidem com o baseline. Nenhum servidor da aplicação ou navegador foi iniciado.
Somente recursos próprios foram encerrados; sem prune/clean/reset ou limpeza de target.
A ausência dos containers também encerra seus bancos sintéticos; não houve banco real.

Preservação final por hash: READMEs dos dois checkouts, 1.113 referências,
originais dos 11 deltas, provas independentes, migrations, manifests/pacotes/runtimes
históricos. Alterações autorizadas do preparador e dos dois estados documentais
têm originais no runtime. README principal conserva
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA;
README da worktree conserva
E7D3458FBD8AC227520BE27996CE23C73E8C3BE2086D8CFBD51AD59568F4CEE0.
Checkout principal permanece no HEAD c16e6545/branch
codex/saneamento-cpa01-selecao-testes, com somente README.md preexistente modificado.

## Próximo saneamento delimitado

Reprodução: fluxo atual em executar.mjs, tentativa02, com o frontend Linux em
camada Linux nativa e manifest acima; comando exato de componentes consta do
result.json referenciado. Não repetir o conjunto para procurar verde.

Próximo experimento separado: instrumentar as fases dos dois testes em cópia
descartável (render da lista de 80, consulta acessível; digitação, salvamento e
comparação de conflito), medir CPU/temporização e recursos concorrentes, mantendo
fixtures, assertions e 5000 ms. A evidência deve distinguir custo legítimo,
contenção, espera do harness e defeito de comportamento antes de propor correção.
Depois de causa demonstrada/saneada, nova execução coerente dos gates afetados e
dependentes. Não reduzir a lista, retirar teste, adicionar retry ou usar DOM como
prova de pintura/interação real. A colisão de título é limite de observabilidade
separado e não justifica dispensar uma ocorrência.

CF010/CF015 continuam em_revisao, pendentes com somente os dois adiamentos
nativos exatos da DEC-ZOOM-05. Não há aceite do zoom ou expanded original sem
exceção. CF034 em_revisao; CF036 proposta. CF017/P01/P02, adoção e produção mantêm
gates. Sem push, atualização da PR, CI remota, merge, hospedagem ou deploy.

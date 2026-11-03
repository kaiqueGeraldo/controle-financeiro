# Expanded local do recorte autorizado pela DEC-ZOOM-05

**Bloqueada no preparo; rodada de testes não iniciada.** Em 03/11/2026,
uma única invocação do comando preparado retornou exit 1. O runtime solicitado
expanded-local-20261103-01 foi recusado por preparar-proxima.mjs:3, que exige
basename iniciado por revisao-plataformas-docker-. Não houve exportação de fontes,
ci.mjs all, retry, correção de implementação ou substituição de caminho.

Este é um bloqueio de contrato do preparador/harness. Não é falha financeira,
de produto, fixture de banco, guard ou conectividade JDBC. Nenhum startup da
aplicação foi observado; o gatilho de 40 segundos não foi exercitado ou alterado.

## Candidato e inputs

- Worktree: pr3-expanded-source; branch codex/saneamento-pr3-expanded.
- Candidato conferido e usado pelo preparo: f6297df873b5120d610f0b951f706c8981351cfb.
- 2c6bb04a é ancestral desse HEAD. Intervalo dos dois commits de revisão inspecionado:
  somente documentação/evidências/estados; sem alteração nas fontes dos gates.
- Inputs esperados e reconferidos por bytes: 0aac7ccd25934ec022939464486da9fb28610279;
  860 arquivos; digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660.
- O manifest histórico serviu somente de oráculo das fontes. Nenhuma cópia candidata
  ou manifest de candidato novo foi produzida. Resultados históricos não foram herdados.
- Comando completo, início/fim UTC, exit e hashes: [EXECUCAO.json](EXECUCAO.json).
  Matriz anterior à tentativa: [MATRIZ.md](MATRIZ.md).
  Primeira falha sanitizada: [FALHA-PREPARO.log](FALHA-PREPARO.log).

## Decisões separadas

| Decisão | Estado desta tentativa | Limite |
|---|---|---|
| A. Frontend local | Não alcançado | install/lint/tipos/temporais/componentes/build não executados. Linux 626/626 em 71 arquivos é evidência anterior aceita, não resultado desta rodada |
| B. Backend expanded JVM Windows | Não alcançado | zero classes/casos executados, nenhum XML novo ou Maven verify |
| C. Cobertura Java por identidade | Seleção estática conferida; execução pendente | Windows seleciona 116, contém os 115 comuns e 1 contrato Windows; união exata com o universo revisado |
| D. RF15 obrigatório | Não alcançado | inventário anterior A25/B2/C23 retido por identidade; nenhuma nova listagem/receipt/resultado de navegador |
| E. E2E financeiro | Não alcançado | nenhum Java FinancialJourneyPostgresE2E, Playwright, SQL/recibo/reload novo |
| F. Pacote/proveniência | Não produzido | nenhum JAR novo, hash de pacote ou package-manifest; JAR p05 e pacotes anteriores não utilizados |
| G. Revisão/publicação/CI | Não pronta para publicação ou CI pelo resultado desta rodada | lacuna concreta e patch preparados para avaliação; nenhuma aprovação remota inferida |

Os contratos CI/seleção TAP também não foram alcançados. A conferência estática da
seleção não equivale à execução desse gate. O contrato Windows estaria incluído
uma única vez no verify de 116; não se soma 116+1 nem 115+116. As 23 jornadas RF15
são casos Playwright de um wrapper incluído no universo Java, não 23 classes novas.

Somente os dois casos de projeto review-sao-paulo e títulos literais da DEC-ZOOM-05
continuam adiados. Controles nos mesmos arquivos e todos os demais casos mantêm-se
obrigatórios. [SELECAO.json](SELECAO.json) distingue inventário anterior, seleção
atual das fontes e execução nova igual a zero. Não se declara zoom aprovado nem
expanded integral original aprovada.

## Plataformas e aplicação

Controlador Node 24.18.0 em Windows; JVM prevista Temurin 21.0.12.1+1 Windows amd64.
Docker Desktop 4.83.0/Engine 29.6.2, contexto desktop-linux e daemon
2455a676-938f-48d8-a0ef-67c98474314d reconferidos em consulta somente leitura.
Endpoint do daemon: named pipe Docker Desktop; host de serviços previsto para a
JVM: 127.0.0.1. PostgreSQL16 seria container Linux. Named pipe não é endereço JDBC.

O comando preparado executaria também frontend e Chromium no Windows. Frontend
Linux pertence à evidência anterior. RF15 mantém Next dev em 3107; CF032 mantém
Next start do build em 3142. Nenhum deles foi iniciado ou substituído.
Não houve banco real, connection string de ambiente real ou chamada JDBC.
Ryuk/PG/guard/JDBC/cleanup dinâmicos do preflight revisado não foram reexecutados,
pois a incompatibilidade do preparo foi identificada antes. A consulta ao daemon
não certifica esses controles nesta tentativa. [TOPOLOGIA.json](TOPOLOGIA.json).

## Recursos, preservação e evidências

O comando preparado não criou seu destino. Após a recusa, foi criado somente
expanded-local-20261103-01 para guardar originais privados, invocation e snapshots.
Não se criou container, banco/schema, rede, volume, servidor da aplicação ou
navegador. Os conjuntos Docker inicial/final coincidem; a inspeção de processos
próprios não encontrou remanescentes. Nenhum recurso alheio foi removido.
[PRESERVACAO.json](PRESERVACAO.json) contém contagens, hashes e recibos privados.

As 1.113 referências, originais dos 11 deltas, 75 artifacts históricos,
97 protegidos, 852 arquivos do pacote assistido e provas independentes foram
conferidos por hash inicial/final. Migrations, manifests, runtimes e fontes
permanecem intactos; os dois estados documentais atualizados têm originais
preservados no runtime. README principal mantém
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA;
README da worktree mantém
E7D3458FBD8AC227520BE27996CE23C73E8C3BE2086D8CFBD51AD59568F4CEE0.
O principal permanece no HEAD/branch originais com somente README.md modificado.

Não existe result.json do runner porque ele não iniciou. EXECUCAO.json é um
recibo do preparo, explicitamente distinto. Originais stdout/stderr permanecem
privados, com SHA256; somente representação sanitizada da falha e dados
estruturais entram no commit. Não houve limpeza geral de target ou alteração de
caches históricos. Não se publicaram XML properties, SQL, traces, env ou secrets.

## Próxima ação

[PROXIMO-PASSO.md](PROXIMO-PASSO.md) delimita o saneamento.
[CORRECAO-PROPOSTA.patch](CORRECAO-PROPOSTA.patch) altera só a validação do basename
do preparador para aceitar o prefixo exigido, preservando a convenção anterior.
Passou git apply --check; não foi aplicada, executada ou aprovada por isso.

A restrição expressa do pedido impede corrigir o preparador durante esta rodada.
É necessária autorização de um lote separado para aplicar/revisar esse ajuste
e iniciar uma nova execução, em expanded-local-20261103-02 (ou outro nome novo).
Não reutilizar a pasta que agora conserva a primeira falha.

CF010/CF015 seguem em_revisao, pendentes com exceção delimitada. CF034 segue
em_revisao; CF036 proposta. CF017/P01/P02, adoção real e produção mantêm seus
gates. Esta evidência não substitui artifacts/validação Linux futura no Actions.

Sem push, atualização da PR, CI remota, merge, Railway/Vercel, deploy ou banco real.
Os commits desta rodada são somente locais e serão identificados na entrega;
o HEAD após o commit documental não é apresentado como candidato testado.

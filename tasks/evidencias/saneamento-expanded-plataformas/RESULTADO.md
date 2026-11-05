# Expanded do recorte autorizado pela DEC-ZOOM-05

**Bloqueios originais saneados; expanded executada e reprovada no backend por topologia Docker Desktop.** Não houve autoaprovação ou ampliação da exceção de zoom.

03/11/2026, America/Sao_Paulo. Branch codex/saneamento-pr3-expanded; base48d0247b98468c9526bb9af6089062c3049247a3. Inputs corrigidos0aac7ccd25934ec022939464486da9fb28610279,860 fontes, digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660. O orquestrador externo a30bc331 só restringe a cópia aos arquivos atestados; a relação e seu hash estão registrados. O commit documental final não muda os inputs de execução. HEAD/intervalo final constam da entrega e de git-final.json privado.

## Causas e alterações

- **Linux:** bind Windows usado como filesystem de fontes/dependências provoca falhas de inicialização de workers; o JSON de Vitest4.1.11 omite erros globais e módulos não coletados, podendo manter success=true. Reprodução:71 descobertos,65 coletados,575 passes e seis timeouts de startup, sem OOM. Controle com mesmos inputs/pool/seleção/timeouts em filesystem nativo Linux:626/626,71 arquivos,11,50s. Corrigidos a topologia e o observador/coletor; gate agora exige identidades/arquivos/contexto completos e ausência de erros globais.
- **Ressalva histórica:** os597 passes/29 ausentes originais estão reconciliados exatamente por identidade; não eram skips ou assertions falhas reportados. O primeiro erro global não foi retido. A nova reprodução demonstra a classe de mecanismo, com módulos afetados diferentes; não se inventou medição retroativa dos oito workers originais. Todas as29 identidades foram recuperadas e verificadas no conjunto completo.
- **Windows:** SUBST deixava a raiz lógica diferente do caminho físico que o Turbopack dependia. Raiz lógica reproduziu erro; caminho físico passou. O runner usa realpathSync.native para entrada/saída, preservando a proteção contra evidências dentro da fonte. Next/TypeScript, imports e arquivos legítimos não foram excluídos ou alterados.

[Detalhes e limites](CAUSAS.md), [matriz anterior às edições](MATRIZ-INICIAL.json), [comandos e proveniência](REPRODUCAO.md). Código alterado: .github/scripts/ci.mjs, paths.mjs, components.mjs, seus testes, workflow para executar esses contratos, reporter de auditoria e executor local reproduzível. Nenhum código de produto, migration, pacote/lock ou regra financeira mudou.

## Resultados efetivos

| Grupo | Resultado |
|---|---|
| Contratos Windows e Linux |43/43 em cada plataforma, zero skips |
| Quatro contraprovas | erro global ignorado, caso omitido, arquivo perdido e raiz lógica detectados; restauração por hash e controles aprovados |
| Oito arquivos Linux originais |29/29; auditoria real validada |
| Grupo completo de componentes Linux corrigido |626/626 em71 arquivos; todas as identidades iguais ao grupo Windows original; zero erros/skips |
| Windows nos inputs corrigidos exatos |lint/tipagem/build passaram em cópia física nova; Windows nativo AdoptionNativeSocketsTest1/1 |
| Expanded Linux — frontend |instalação, lint, tipos,18 unitários em três fusos,626 componentes auditados, build e browser-install passaram |
| Expanded Linux — backend |115 classes selecionadas e115 relatórios;927 casos reportados,137 passes,0 falhas de assertion,790 erros de contexto,0 skips; gate reprovado |
| Diagnóstico loopback posterior |guard4/4; consumidor5 erros por Ryuk inacessível; não é rodada integral aprovada |
| RF15 real23, E2E financeiro e pacote |não alcançados; nenhum JAR novo produzido |

**Novo bloqueio:** DisposablePostgresGuard recusou corretamente host.docker.internal na primeira topologia. Host network com127.0.0.1 também falhou na conectividade Ryuk. Não se alterou guard, nome obrigatório do banco, Ryuk, timeout ou retry para aceitar o ambiente. Ubuntu WSL existe, mas está sem integração Docker e sem Node/Java; nenhuma configuração operacional foi alterada. [Próximo lote delimitado](PROXIMO-LOTE.md).

[Cobertura e identidades](COBERTURA.json): universo Java116 preservado, Linux115+Windows1. Nova listagem real Playwright confirma RF15 A25=B2+C23 e interseção vazia; listagem não é execução aprovada. B continua exatamente projeto review-sao-paulo/cf015.native-zoom.integrated.spec.ts/R10: zoom nativo 200% com ações, rolagem e foco; e review-sao-paulo/rf15-native-chrome.integrated.spec.ts/RF15: zoom nativo Chrome 200% com ações, rolagem e foco. Os testes permanecem para retomada futura.

CF010/CF015: **pendente, com exceção temporária autorizada para a continuidade delimitada**, em_revisao. Zoom não foi aprovado nem convertido em defeito. Required, asserts, autenticação, ownership, precisão, recuperação e contratos temporais preservados. A reprovação remota histórica da PR#3 não foi encerrada; execução local não é GitHub Actions.

## Preservação e encaminhamento

Conferidos1.113 arquivos de referência intactos; versões dos11 deltas anteriores e originais arquivados preservadas. Neste lote, quatro arquivos preexistentes receberam atualizações autorizadas e suas versões iniciais foram arquivadas/verificadas. Mais51 referências de provas anteriores,75 artefatos históricos,97 protegidos e852 entradas do pacote assistido foram reconferidos. Os dois READMEs mantêm seus hashes, inclusive o principal6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. [Preservação](PRESERVACAO.json).

Principal mantém c16e6545488c8f13efda4dab9efa8aa896fcddaa e somente M README.md preexistente. Nenhuma worktree movida, .r3 criada, clean/reset ou limpeza genérica de target/.next/node_modules. Builds e relatórios próprios separados; primeiras ocorrências e containers/imagens diagnósticos parados preservados. Mapeamento Y: removido sem apagar arquivos; zero processos/containers ativos próprios e listener3107 ao fechamento.

Entrega disponível para **revisão independente da seleção DEC-ZOOM-05 e deste delta**, com ressalvas históricas e novo bloqueio explícitos. Não pronta para declarar expanded aprovada, atualizar PR ou avaliar integração positivamente. Próxima execução requer capacidade Linux/Docker/loopback validada; publicação e CI remota dependem de autorização posterior. CF-017/P01/P02, adoção real e produção mantêm gates próprios. RR3-01 e aceites anteriores não foram reabertos.

Sem push, atualização de PR, CI remota, merge, alteração Railway/Vercel, deploy ou banco real.

# Organização do ambiente — 22/10/2026

Autorizada pelo usuário antes da preparação da CF-032. Base aprovada:
`80106e6ca1fc366014c1895dd28861b9cc1befd6` (CF-031).

## Arquivamento recuperável

As pastas `.cf029-mutation`, `.cf22`, `.cf22r`, `.cf22s`, `.r3` e `.rv3`
foram movidas integralmente para:

`C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtime-archive\2026-10-22`

Nenhuma delas continha arquivos rastreados pelo Git. Foram conferidos os hashes
SHA-256 de **7.953 arquivos** antes/depois. O manifesto completo permanece no
arquivo local `manifest.json`, SHA-256:
`23F0369285661697EDAC1447253D18D021F066B92B9011F98C172BEB246634B6`.

Cinco junctions `node_modules` foram preservadas e conferidas em `junctions.json`;
continuam apontando para as dependências do frontend principal. Os destinos não
foram movidos nem excluídos. Não foram encontrados processos com comando apontando
para esses runtimes; processos auxiliares do editor/Codex não foram encerrados.

Para recuperar um runtime histórico, consultar o manifesto e usar a pasta
arquivada. Se um script depender do caminho antigo, restaurar somente a pasta
necessária, após verificar que o destino está ausente e não há execução concorrente.
Não substituir arquivos existentes. O arquivo local não é um backup remoto.

## Preservação e limites

Fontes, evidências versionadas e migrações não foram modificadas pela movimentação.
README raiz continua modificado fora dos commits, com hash preservado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

A raiz ficou com `.git`, `.github`, backend, frontend, `docs`, `tasks`, README e
LICENSE. Não houve exclusão definitiva, `clean`, limpeza de `target`, mudança de
produto ou banco. Scripts históricos não foram reescritos; referências antigas
podem exigir recuperação/configuração do caminho. Novos runtimes seguem a regra
documentada em `tasks/EXECUCAO.md`.

Não foram repetidos testes de produto: a alteração é de localização dos runtimes
e documentação, com conferência de integridade. A CF-032 exige execução própria;
este registro não constitui seu aceite.

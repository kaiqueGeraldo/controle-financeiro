# Validação documental

01/10/2026, America/Sao_Paulo. Base c7f7ffc9b91d028d1dba441affa81403984ffd53.
Verificações executadas por Node (fs/path/child_process/crypto) e Git locais;
nenhum lint, build, typecheck ou suíte de aplicação foi reexecutado.

| Verificação | Resultado |
|---|---|
| Tarefas canônicas | 36 IDs únicos; CF-017/P01/P02 tratada como derivada, não segundo CF-017 |
| Matriz | 26 entradas ordenadas CF-001–026, com links canônicos |
| Links | 382 referências locais resolvidas nos documentos alterados/novos |
| Estados | Única transição: CF-026 bloqueada→pronta; snapshot final: 10 concluida, 15 em_revisao, 1 pronta |
| Dependências | Linhas canônicas idênticas a c7f7ffc; DFS das 36 tarefas sem ciclos e sem IDs ausentes |
| Bases | 19 referências Git resolvidas e ancestrais de c7f7ffc; integração não interpretada como aceite |
| Baseline | JSON bruto confirma 234 arquivos, 26 com ocorrências, 23 erros/21 avisos; os 26 caminhos existem e não mudaram em 0099185..c7f7ffc |
| Escopo | Diff em frontend/backend/CI/SDD vazio; alterações desta rodada somente Markdown em tasks |
| Preservação | README raiz SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA; fora do staging |
| Whitespace | git diff --check -- tasks aprovado |

Os achados foram conferidos nos pareceres de origem: P01/P02, RV17-01/02,
RVA-03, RJ-022-01, H24-01 e RV24-01/02 não foram encerrados. P03/P04/P05,
R03/RV01, RVA-01/02, D16-T01 e F-018 conservam os encerramentos delimitados
referenciados na matriz/pendências. Não houve alteração de seus critérios.

Confronto semântico: CF-026 consome a liberação independente de 0099185,
reconferida contra CF-022/023, CF-024 e entrega CF-025; a revisão CF-025 continua
pendente. Pronta não é em execução ou concluída. Gates integrados e de publicação
continuam explícitos, inclusive CF-032/034 sem CF-026 aceita.

Links relativos dos documentos alterados/novos foram resolvidos a partir de
cada arquivo, com verificação de existência de arquivos e diretórios. URLs
externas e âncoras de seção não são certificadas por essa checagem. Relatórios
históricos vinculados não foram todos revalidados recursivamente.

Staging explícito: 22 arquivos Markdown em tasks, sem README raiz. Primeira
tentativa foi recusada por index.lock sem permissão no sandbox; a escalada
autorizada executou o mesmo staging. Inspeção do diff confirmou apenas notas,
regras de execução, snapshot e a transição CF-026. O primeiro check staged
identificou linha vazia excedente no fim da matriz; removida antes do check final.
Git diff --cached --check final aprovado. Hash do commit entregue no chat e
disponível no git log, evitando referência circular no próprio documento.

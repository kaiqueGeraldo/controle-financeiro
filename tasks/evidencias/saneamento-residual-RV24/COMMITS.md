# Commits e limites da entrega

Base: `a8c3724f386e0b249d09615d6343ba5774c0658f`.

| Frente | Commit / intervalo exato |
|---|---|
| Saneamento funcional e testes | `9e6e8d7b7202fa29db8077728589d6d557a5d099`; `a8c3724f386e0b249d09615d6343ba5774c0658f..9e6e8d7b7202fa29db8077728589d6d557a5d099` |
| Reconciliação documental | `039a116de81a0ca0d75f30f5e1cedf082ad6f919`; `9e6e8d7b7202fa29db8077728589d6d557a5d099..039a116de81a0ca0d75f30f5e1cedf082ad6f919` |
| Evidências e encaminhamento | Commit que adiciona este arquivo; consultar `git log --diff-filter=A --format=%H -- tasks/evidencias/saneamento-residual-RV24/COMMITS.md`. Seu pai é `039a116de81a0ca0d75f30f5e1cedf082ad6f919`; hash final também consta na entrega do chat |

O candidato testado contém o produto do primeiro commit e a documentação dos
demais. Commits intermediários não recebem certificações independentes por
terem sido separados. Nenhum commit inclui README.md raiz. Sem push ou reescrita.

[Encaminhamento por tarefa](ENCAMINHAMENTO.md) contém os intervalos históricos
CF-025/026/027 e os limites para a revalidação RV24-01. [Verificação](verification.json)
confere README/probes, 27 estados, critérios/dependências preservados, links,
lint e fontes backend das duas cópias de integração (235 arquivos cada).

O verificador inicialmente incluiu CF-017-P01-P02 entre as 27 originais e
reprovou a contagem; corrigido para conferir a derivada separadamente, sem
alterar produto nem critérios. Typecheck/build finais retornaram exit0.
Screenshots das jornadas são registros auxiliares; não representam nova
inspeção da matriz visual completa ou aprovação de zoom.

Sanitização: script local remove apenas credenciais sintéticas de logs/JSON/
traces, preservando asserções e valores financeiros. `sanitization.json`
registra hashes anteriores/publicados; não altera evidências históricas.
Hashes de bytes referem-se à árvore de trabalho Windows; Git pode normalizar
LF/CRLF ao fazer checkout em outro ambiente.

`git diff --check` aprovou código/documentação. Nos logs brutos, apontou espaços
finais e linhas vazias emitidas pelas ferramentas; foram preservados para não
editar outputs nem invalidar os hashes de proveniência. A sanitização não
encontrou credenciais a substituir nos 31 arquivos de texto elegíveis desta rodada.

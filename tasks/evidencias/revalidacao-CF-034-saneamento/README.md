# Revalidação independente dirigida CF-034 — 25/10/2026

**Recorte local ainda não aceito. CF-034 permanece em_revisao.**
RCI034-01 foi parcialmente saneado, mas permanece aberto pelo residual P2
RCI034-01/R1. RCI034-L01 tem aceite no mecanismo Windows de processos comprovado
abaixo; não recebe encerramento irrestrito de finalização de recursos externos.

Candidato examinado: `91ee02d78472747e3fcee0e454b1c25881718314`, branch
`codex/cf034-ci-local`, base `8d58207dff108066e2385eabde31330a3f79e38f`.
Delta: 2b28e18 sanitização/coleta; fa144e1 cancelamento/probes; 91ee02d evidências/
estado. Entrada sem staging e sem trabalho posterior ao HEAD informado; somente
README raiz preexistente modificado. Não houve alterações de produto backend/
frontend no delta, nem correções de implementação nesta revalidação.

Foram lidos canônico CF034, DEC-CI-04, instruções aplicáveis, EXECUCAO,
POLITICA-DE-TESTES, índice atual e parecer/achados/provas/contratos referenciados
da revisão e do saneamento. Caminhos efetivos: `revisao-CF-034/` e
`saneamento-CF-034/`, sem divergência dos nomes informados. Não foram encontrados
AGENTS.md no repo/ancestrais consultados; usadas as instruções fornecidas pelo usuário.

## Conclusões A–E

**A. RCI034-01 — parcial, residual P2:** as mesmas sentinelas originais de senha
JSON, Bearer opaco e cookies são removidas. Caixa, espaços, escapes, múltiplos
valores, JSON estruturado aninhado e headers continuados passaram nos casos
exercitados. Contudo, JSON escapado dentro de mensagem em log com prefixo mantém
a senha; atribuição textual com aspa incompleta deixa seu sufixo sensível.
Os coletores retornam sucesso e liberam esses dados. O primeiro residual foi
provado de ponta a ponta: stdout→bruto→coletor público e durável→arquivo final.
Não é aceitável fechar RCI034-01 apenas pelo verde dos oito testes existentes.

**B. RCI034-L01 — sustentado no alcance Windows/processos:** cancelamento por
UUID, pedido durante inicialização, repetição, estado terminal, filho/descendente
ativos e morte abrupta do runner passaram. Handles retidos antes da ação
confirmaram término, sem expiração natural; próximo gate ausente; processo
sintético alheio preservado. Cancelamento explícito terminou 130/cancelled e
preservou diagnóstico. Pai morto à força não escreveu result e não recebeu
exigência artificial de exit 130. A lacuna original de sobrevivência do filho
não se reproduziu com o candidato, mantendo a assertion original preservada.

**C. Limites:** Ctrl+C nativo e Actions/Linux não foram ensaiados. Job Object
não gerencia containers mantidos por daemon externo. Descarte desses recursos
após cancelamento continua sem prova, como admite o contrato do saneamento;
finalização normal histórica permanece aceita. Não declarar integralmente
satisfeito o critério de finalizar processos/banco ou fechar a extensão de
RCI034-L01 que depende dessa prova. Limites remotos não são o motivo da
reprovação da coleta local e não anulam as provas Windows.

**D. Gates ordinários:** sustentados no delta. Oito testes existentes passaram
sem skip/retry; subprocesso 23→runner 1 e relatório ausente bloquearam avanço;
JAR adulterado foi recusado e restaurado em cópia. Mutações retirando sanitização
e KILL_ON_JOB_CLOSE foram detectadas/restauradas. Falha simulada ao estabelecer
o Job impediu criar filho desprotegido. Nenhuma suíte financeira foi repetida.

**E. DEC-CI-04:** sem aceite local completo enquanto RCI034-01/R1 persistir.
Preservam-se aceites anteriores não afetados de gates, E2E/isolamento smoke e
proveniência da rodada11, além do aceite Windows acima. CF034 integral continua
em_revisao: remoto, matriz ampliada e demais condições não foram satisfeitos.

## Evidências e continuidade

- [Matriz dos dois itens](MATRIZ.md).
- [Sanitização, reprodução e encerramento do residual](SANITIZACAO.md).
- [Job Object, UUID e limites de encerramento](CANCELAMENTO.md).
- [Comandos, contraprovas e falhas dos observadores](PROVAS.md).
- [Preservação, proveniência e encaminhamento](PROVENIENCIA-E-CONTINUIDADE.md).

Runtimes novos: CF-034/v01…v06. Nenhum runtime anterior modificado. Inventário
histórico reconferido: 3.165 caminhos, 3.161 iguais, quatro alterações autorizadas
de implementação e nenhum ausente; não são 3.165 bytes/conteúdos intactos contra
a revisão anterior. O inventário de entrada desta revalidação registra os bytes
atuais para conferir sua preservação ao final.

Conferência final: os 4.323 arquivos do inventário de entrada desta revalidação
mantiveram os mesmos bytes, sem ausentes ou alterações. Probes e resultados no
commit local `b3af4d5`; parecer e estados em commit documental posterior.

README raiz conserva SHA histórico
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`, fora dos commits.
Provas independentes originais, manifests e limites históricos preservados.
Não houve push, merge, fetch, CI remota, deploy, banco, notificação real,
clean/reset destrutivo ou limpeza de target.

Próximo passo: saneamento separado de RCI034-01/R1 com os inputs novos preservados,
seguido de revalidação dirigida da fronteira de publicação. Não executar publicação
remota nem iniciar sucessoras. Zoom 200%, CF010/015 em_revisao, adoção CF017/P01/P02,
DEC-ONB-03 e limites de produção continuam inalterados.

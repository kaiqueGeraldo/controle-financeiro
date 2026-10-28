# Proposta de PR — não criada

Destino: `kaiqueGeraldo/controle-financeiro:main`.
Origem preparada: `codex/consolidacao-pre-adocao`.
**Rascunho documental; CPA-01/P2 precisa saneamento e revisão antes de publicar.**
Atualizar a descrição abaixo para os SHAs/resultado final desse saneamento antes
de abrir a PR. Não afirmar que a correção já existe nem esconder o achado atual.

## Título proposto

Preparar adoção segura:PG16/17, manutenção, jobs, saúde e harness rastreável

## Descrição proposta na situação atual

O bootstrap da API e os previews precisavam de controles antes da adoção do banco
existente. O lote acrescenta suporte operacionalPG16/17, perfil adoption que separa
migrations da validação, ingresso e agendadores fechados por flags, probes mínimos
de vida/prontidão e bloqueio de operações no BFF preview. O harness passa a exigir
prova causal, restauração e quiescência antes de retomar, além de confirmar liberação
TCP no Windows. Migrations V1–V16 e regras financeiras foram preservadas.

Os aceites locais são delimitados nos pareceres independentes:PG16/17, guard/
writers/jobs, saúde/preview, TCPWindows/JAR, resume/contenção/handoff/prazo/audit.
Startup local mantém40s; quatro capturas recentes e provas funcionais anteriores
sustentam seu recorte, sem declarar nova suíte de 17 contratos verde ou causa dos atrasos históricos.

**Pendência antes de publicação:**CPA-01 confirma que o seletorCI inclui um teste
Windows no job Linux e o skip resultante é rejeitado pelo gate. A correção não faz
parte da revisão documental; ela exige lote separado e revisão. O limite do leitor
JSON diagnóstico está registrado sem invalidar as evidências atuais conferidas.

Esta consolidação reexecutou13 contratos de CI/sanitização e5 do leitor, conferiu
ancestralidade, inputs relevantes ehashes de JAR/imagem/manifests, além de reproduzir
a incompatibilidade de OS. Suítes financeiras/startups/TCP/RVPLA anteriores foram
reaproveitados por diff nos seus alcances; nenhumaCI remota foi executada aqui.

JAR p05 b296… pertence aos inputs24844b59; main histórica c386… é outro pacote. A futura
CI deve gerar manifesto/JAR do checkout testado. Não há imagem de registry ou
deploy novo. CF017/P01/P02, CF034 integral, expanded/zoom200%, configuração remota e
adoção real/produção mantêm gates próprios; esta PR não é autorização de uso.

Base remota consultada:fb986456a37a48afcafef204f165d15354294d26.
Entrada revisada:56eb80b5cb867539d94995ec58b63ce2dbc519fa, 48 commits acumulados.
Os commits locais de consolidação e o eventual saneamento devem ser identificados
com SHA completo no texto final da PR. Evidências em
`tasks/evidencias/consolidacao-pre-adocao/`.

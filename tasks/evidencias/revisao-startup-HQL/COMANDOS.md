# Execução desta revisão

Comandos rodados da raiz, somente em leitura de produto/histórico e escrita dos
novos recibos/documentos. Scripts recusam sobrescrever recibos. Para uma revisão
posterior, usar saída nova; não apagar arquivos para fazer estes comandos passarem.

```powershell
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor c091abb8aa0473e7ad46690e21c8158a4dde234a ed42309faeeb0eac6e03c14ddb2acfb94db8579f
git diff --stat c091abb8aa0473e7ad46690e21c8158a4dde234a..ed42309faeeb0eac6e03c14ddb2acfb94db8579f
git status --short
node tasks/evidencias/revisao-startup-HQL/verificar.mjs inicial
node tasks/evidencias/revisao-startup-HQL/verificar.mjs provas
node tasks/evidencias/revisao-startup-HQL/conferir-leitor.mjs
node tasks/evidencias/revisao-startup-HQL/verificar.mjs final
git diff --check
```

Resultado: branch/HEAD exatos; ancestralidade conferida;863 caminhos protegidos,
92 referências de prova/captura e quatro resultados originais conferidos;5 testes
do leitor passaram. Leitura complementar dos JFRs sem novo jfr print ou aplicação:
contagens/somas conferem com extração/summary; JSON estrito da imagem aprovado;
dois envelopes sintéticos inválidos aceitos pelo leitor foram registrados como
limite em leitor-conferencia.json. Nenhuma medição de startup nova foi produzida.

`git show 8605ea42:.../AdoptionRuntimeTest.java` confirmou origem dos40s.
Diff produtor24844b59→candidato: corpos dos testes preservados; App recebeu
visibilidade, descoberta dinâmica e close TCP já aceitos. Sem relaxar assertions.
Diff c091abb8→candidato só acrescenta probes/evidências e nota tasks/README.
Não houve alteração de produto, queries, dependências, perfil ou migrations.

Leitura do JAR como ZIP, via System.IO.Compression:22 recursos comparados ao
manifesto anterior por SHA-256, incluindo16 migrations. Recibo recursos-pacote.json.
Fontes oficiais locais4.0.2 foram lidas do sources.jar, cujo hash foi conferido,
para forHql/SLL/LL e SimpleJpaQuery.validateQuery/createQuery.

Docker: `docker image inspect sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Primeira chamada sem acesso ao pipe falhou, antes de qualquer alteração. Consulta
somente leitura com permissão apropriada confirmou o ID; segunda consulta gravou
somente metadados selecionados em imagem-observada.json. Nenhum container criado,
rede externa, imagem construída ou aplicação iniciada. Sem consulta remota de
Git/Railway/Vercel ou banco real; sem CI remota, push, merge ou deploy.

Commits locais usam staging nominal e diff inspecionado: primeiro scripts/recibos,
commit `6cdf3a49924d7c1a654b618f1453c3d3ff8f998e`; depois parecer/estados/preservação final.
A fotografia final precede seu próprio
commit; hashes finais são entregues depois, sem autorreferência inventada.
README raiz permanece modificado pelo usuário, fora do index. Nenhum runtime novo
foi necessário; históricos não foram movidos, limpos ou inventariados recursivamente.

A conferência inicial de links locais foi feita antes de gerar preservacao-final.json
e apontou esse arquivo ainda ausente; repetida depois da geração para verificar
os links completos. Não foi falha de startup ou repetição de aplicação.

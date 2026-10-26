# Preservação, proveniência e continuidade

## Inventários e bytes

O inventário anterior de 4.323 arquivos foi reconferido: 4.321 idênticos, nenhum
ausente e somente duas alterações autorizadas:

| Arquivo | SHA anterior | SHA observado |
|---|---|---|
| .github/scripts/sanitize.mjs | 0898be0d023ab5a01ad3b08f37d1976097f86a48fae42603c34b24f4d4149869 | 1589f580bdf02b6e5b5daed48816c8ce841cad09bb7b9cca8aaaaf38737f14fa |
| .github/scripts/sanitize.test.mjs | f3e1ebffc17dd5ee9a4660f0c86f2db763979fda9d09ecf9f7e6986b02fa9821 | ffbd6375ee8c05c7abbbeb7985b1209e116d465c9b9321f017f2da18838fd2a6 |

Não são 4.323 arquivos intactos contra a revisão anterior. Estados documentais e
novas evidências do saneamento também constam do delta Git, mas fora daquele
inventário. Esta revalidação capturou **14.393 caminhos atuais**: inventário anterior,
evidências versionadas, decisões, scripts e outputs históricos selecionados de
runtime, sem atravessar links/dependências/targets/checkouts excluídos pelo script.
Conferência final: os 14.393 mantiveram seus bytes. Não é inventário de todo o disco.

README raiz continua modificado, fora dos commits, sem restauração automática.
SHA inicial/final:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
Provas independentes anteriores e manifests preservados. Runtimes novos somente
r1-review-01/02/03; sem remoção ou modificação de runtime histórico.

audit.json vincula bytes realmente exercitados ao candidato ea00a06. Sanitizador
da cópia = workspace por SHA. A transformação CRLF→LF foi **executada e comparada**
e reproduz exatamente o blob versionado
`3a02d663d34b02514cda56c00a930fe5667efd4085b640481108cc0d25b1f6ad`.
O arquivo de testes já é byte a byte igual ao blob. Essa demonstração específica
não presume transformação para outros arquivos ou para os hashes históricos.

## Pacote histórico

Nenhum pacote novo foi produzido. JAR preservado e re-hasheado:

- Fonte: `a5ad7a64794abca1cc852b11cc1bf79a156dafde`.
- SHA-256: `28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.
- A contraprova adultera somente cópia e exige recusa; depois restaura esse SHA.

Não é JAR compilado do HEAD corrigido nem prova de testes financeiros executados
pelos scripts novos. Não é reprodutibilidade binária. Manifests históricos e seus
810 inputs não foram reescritos. As 57 representações brutas antigas sem
reconstrução comprovada continuam fora de qualquer nova certificação; distinção
entre conteúdo versionado e identidade de bytes preservada.

Os testes novos de manifesto são sintéticos, para verificar a fronteira de
sanitização/coleta. A prova anterior da estrutura do manifesto histórico continua
histórica; não se atribui nova certificação de pacote ao presente aceite.

## Próxima etapa, sem execução nesta revisão

Com o aceite local registrado, pode ser preparada **uma etapa separada** para
publicação revisada do intervalo local e execução remota controlada. A decisão
do usuário continua necessária antes de publicar ou acionar Actions. Não houve
push/merge/CI/deploy nem ampliação de permissões nesta revisão.

| Item | Preparação da etapa futura |
|---|---|
| Candidato remoto | Conferir intervalo completo da CF034 e estado Git; excluir README preexistente/runtimes; não apresentar JAR antigo como novo |
| Workflow/eventos | ci.yml: push em main; pull_request para main; filtros backend/frontend/.github/tasks/docs/sdd; workflow_dispatch com smoke/expanded |
| Jobs | required smoke; expanded apenas dispatch suite=expanded, needs required; ubuntu-latest, 45 min cada; Node 24, Temurin 21 |
| Matriz | Smoke e expanded selecionados pelo runner; verificar seleção real dos harnesses e fusos, sem inferir cobertura pela configuração |
| Permissões/secrets | contents:read; checkout sem persistir credenciais; nenhum secret de aplicação/produção declarado; conferir permissões efetivas antes da execução |
| Artifacts | diagnosis-SHA / expanded-diagnosis-SHA após coleta success; tested-package-SHA somente success com JAR e manifesto sanitizado; retenção 7 dias |
| Cancelamento | Comprovar Actions/Linux e cleanup dos recursos descartáveis externos; não extrapolar Job Object Windows; Ctrl+C nativo continua verificação própria |
| Efeitos externos | Downloads/cache npm/Maven/browser/imagens, logs/checks/artifacts/notificações GitHub e consumo do runner; YAML não introduz deploy |
| Critérios encerráveis | Execução efetiva de eventos/needs/if, serviços/comandos Linux, bloqueio causal, coleta/upload, identidade de novo pacote remoto e matriz realmente executada |
| Critérios ainda próprios | Zoom nativo 200% e CF010/015, adoção CF017/P01/P02, imagem quando não produzida, homologação/produção e gates CF035/036 |

CF034 permanece em_revisao global. O aceite local é explícito e não precisa
permanecer pendente por falta das garantias fora do recorte. Nenhuma sucessora
iniciada ou automaticamente liberada; decisões anteriores mantêm o alcance.

# Revalidação independente do saneamento CF-015

21/09/2026. **Marco não aprovado; CF-015 permanece em_revisao.** A correção
do caminho sequencial de R03 funciona, mas a sobreposição de reconciliações
ainda permite fechamento sem releitura confirmada: [RV01/R03](ACHADOS.md).
Recomendação: **corrigir o achado bloqueante identificado**. CF-016 não iniciada.

## Estado examinado e preservação

- Branch `main`, HEAD inicial `681102b9c23e4fb1c296d97897fc2bf8ab802f4c`.
- Intervalo completo `eb40303..681102b`: `ad7fd81` incorpora o candidato
  preexistente; `7a4f89c`, `0429268`, `aade169` são correções; `681102b`
  documenta a entrega. `aade169..681102b` não altera código/testes.
- Staging inicial vazio; única alteração local inicial: README raiz, SHA-256
  `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
  Nenhum hunk desse arquivo pertence à revisão.
- [Manifestos conferidos](hash-verification.json): 207 artefatos do saneamento
  íntegros. Os desvios de hash de testes são alterações desta revisão,
  documentadas abaixo; nenhum arquivo de runtime foi alterado.
- Único ajuste de harness: `CF015_VISUAL_DIR` permite redirecionar screenshots
  para esta pasta. Default anterior preservado; assertions/fixtures mantidas.
  Evita sobrescrever as capturas do implementador. Não é correção de produto.
- Teste PostgreSQL recebeu assertion adicional de inexistência de plano parcial
  ao recusar categoria alheia. Novo teste de componente preserva RV01 vermelho.

Referências preservadas: [revisão original](../revisao-CF-015/README.md),
[achados originais](../revisao-CF-015/ACHADOS.md),
[saneamento](../saneamento-CF-015/README.md),
[commits do executor](../saneamento-CF-015/COMMITS.md).

## Rastreabilidade por achado original

Fechamento abaixo é restrito ao defeito descrito, não conclusão integral da
tarefa responsável. As causas e alterações foram confrontadas com o diff
`ad7fd81..aade169`; os resultados não foram inferidos somente do relatório.

| ID | Defeito / causa / correção examinada | Verificação independente e evidência | Resultado / pendência |
|---|---|---|---|
| R01 | Cache hit não invalidava requisição anual; invalidação antecipada e guards por geração/sessão. AC-UI-008/011. | Original reintroduzido retorna ano 2025 sob seleção 2026: [vermelho](original-R01-R04.log). Candidato passa A→B→A, erro tardio, troca de usuário, desmontagem e nota; [dirigidos](componentes-dirigidos.log), matriz UTC/+14. | Encerrado no cenário original. Não certifica todas as corridas do produto. |
| R02 | Cache do gráfico aceitava resposta do período abandonado; mesma antecipação da invalidação. AC-UI-008/011. | [Original](original-R02.log) substitui 1300 por 900; candidato mantém 6M/1300 e ignora erro antigo/sessão anterior. | Encerrado no cenário original. |
| R03 | Erro absorvido na releitura fazia modal fechar. Modal separa ready/confirmed/unknown; providers propagam erros e recuperação não repete POST; backend trava cartão/recusa PAID. | [Original](original-R03.log) fecha indevidamente; candidato sequencial passa componentes e jornada integrada. [RV01](reconciliacao-sobreposta-final.log) demonstra novo fechamento incorreto quando há reconciliação substituta. | **Não encerrado**, P1 residual CF-013/009. Idempotência durável CF-024 continua separada. |
| R04 | Confirmação de texto anterior fechava editor com rascunho posterior; versão/dirty/identidade e editor estável corrigem isso. AC-UI-006/009/011. | [Original](original-R01-R04.log) perde editor; candidato preserva rascunho em refetch/erro e troca de entidade. E2E usa POST real retido, GET, falha 503, segundo save e reload; SQL confere texto final. | Encerrado no escopo testado. Rascunho sem confirmação não é persistido automaticamente. |
| R05 | Hook registrava falha, tela mostrava vazio/zero; consumo de erro e botão indisponível. AC-UI-002. | [Original](original-R05.log) falha nos dois cenários; tela+hook reais aprovam 503 inicial, retry, troca de mês e fatura indisponível. | Encerrado no cenário original; R03/RV01 continua independente. |
| R06 | POST buscava categoria sem dono; cópia propagava vínculo legado. POST/PUT por ID+dono e validação prévia da cópia. AC-FIN-005. | PostgreSQL com dois usuários: próprio, alheio, inexistente, PUT sem alteração parcial e cópia legítima/legada. SQL verifica estado. [12 dirigidos](backend-dirigido-escalado.log); suite final inclui assertion adicional sem plano parcial. Vermelhos históricos mostram 200/linha/nome privado, não falha de ambiente. | Encerrado para writers examinados. Não certifica saneamento do legado nem todos os domínios de CF-023. |
| R07 | Refetch de objeto do mesmo usuário reinicializava formulário; inicialização por abertura/identidade. | [Original](original-R07.log) troca rascunho por nome original; candidato preserva texto e passa cancelar/reabrir/trocar usuário. | Encerrado para o defeito de rascunho. Não aprova integralmente autenticação. |
| R08 | Fatura sem foco/trap/Escape/retorno; hook compartilhado e portal. AC-UI-001. | Componentes original/aninhado; E2E Tab/Shift+Tab/Escape e retorno a controle operável após pagamento; capturas de fatura longa. | Encerrado no Chromium testado; sem certificação de leitor de tela físico. |
| R09 | Seletores dependiam do wrapper de heading; correção anterior usa role=dialog. | `temporal.integrated.spec.ts` não mudou entre ad7fd81 e aade169; jornada mantém expected financeiros/temporais e SQL/Excel. | Correção anterior preservada. |
| R10 | Sidebar/grades comprimiam tablet e recortavam valores; breakpoint e quebra responsiva. AC-UI-001/003. | Novas capturas 360/768/1440 e geometria; [inspeção delimitada](VISUAL.md). Valores longos e pagamento acessíveis nos recortes inspecionados. | Recorte original corrigido nas larguras examinadas; **zoom nativo 200% pendente**, impede fechar integralmente o aceite CF-010. |
| R11 | Quatro bindings ociosos no double de animação; filtro sem bindings descartados. | [Comparação](lint-comparison.json): candidato reproduz 31 erros/26 avisos, zero diagnóstico novo; saneamento removeu quatro avisos da baseline original 31/30. | Encerrado localmente; lint global continua falhando, dívida CF-026. |
| R12 | Botão mobile só com ícone; `aria-label="Novo lançamento"`. AC-UI-001. | E2E localiza por nome e abre modal em 360px; regressão original não teve expected relaxado. | Encerrado no cenário testado. |

## Qualidade das regressões e engenharia

[Probe reproduzível](regression-probe.mjs) copiou src/tests para diretório
temporário, reintroduziu arquivos de `ad7fd81` e restaurou seus bytes no finally.
[Manifesto](regression-probe.json) comprova restauração e working tree intacto.
R01/R02/R03/R04/R05/R07 falham por estado/UI, não sintaxe/import. Nove casos
aparecem como skipped no probe R05 porque o filtro `-t R05:` seleciona dois
dos onze testes; não foi adicionado skip ao código nem à suíte do candidato.

Os testes originais de corridas, pagamento, perfil e temporal integrado não
foram modificados pelo saneamento. Foco recebeu caso aninhado, visual recebeu
fixtures extensas e novas assertions. Não identifiquei expected enfraquecido
nesses diffs. O novo teste mostra por que 131 verdes não bastam para encerrar R03.

R06 aplica propriedade antes da escrita em transação; cópia usa fetch join e
validação O(n), sem nova consulta de categoria por item. Não foi medido query
count global; não se certifica ausência geral de N+1. Coordenação por lane tem
custo constante para invalidação localizada. Pagamento serializa por cartão,
inclusive meses diferentes: protege fechamento/criação de fatura, mas reduz
paralelismo nesse cartão. Não certifica ordem global de locks ou carga.

O evento de reconciliação agrega Promises dos providers montados; é suficiente
para observar erros do lote sequencial, mas seu contrato atual perde falha ao
substituir o lote. Corrigir esse retorno é preferível a mudar cálculos no frontend.
Uma nova biblioteca de estado não é necessária para corrigir o caso demonstrado.

## Quatro conclusões e gates

| Decisão | Parecer |
|---|---|
| A. Encerramento dos achados do saneamento | Parcial: R03 continua aberto por RV01; R10 revalidado no recorte original, zoom explicitamente pendente. Demais IDs encerrados apenas nos cenários acima. |
| B. Aprovação do marco frontend CF-015 | **Não aprovada; em_revisao.** RV01 viola contrato essencial de pagamento. Zoom 200% é aceite explícito de CF-010, não uma exigência criada pela revisão. |
| C. Situação integral CF-001–CF-009 | **Não concedida aprovação integral.** CF-001–004 não foram reabertas por associação. P03/P04/P05 e cenários temporais preservados; P01/P02 mantêm adoção real em CF-017. R01/R02 fecham seus casos; CF-009 mantém pendência concreta RV01. |
| D. Prontidão para publicação | **Não demonstrada.** Além de RV01, backend exige adoção temporal, schema compatível, proveniência, backup/restore e rollout em CF-017. PostgreSQL descartável não satisfaz esses gates. |

CF-024 permanece proposta para recibo/idempotência durável, adiantamentos e
concorrência entre writers. A guarda PAID não encerra isso. Porém essa dívida
posterior, isoladamente, não impede aprovar UI que mostra resultado desconhecido
e não reenvia. O bloqueio desta revisão é o retorno de sucesso incorreto de R03.
CF-017 bloqueia publicação sobre banco existente; não invalida automaticamente
uma funcionalidade de interface independente já comprovada em schema sintético.

Zoom nativo é uma lacuna do marco atual: concluir em navegador interativo que
realmente altere o zoom e observar ações/rolagem/foco. O harness disponível roda
Chromium headless; não se reutilizou a tentativa anterior ineficaz como prova de
200%. Não houve validação nativa nesta execução. O cenário de 180px foi mantido
com seu nome explícito de viewport e não conta para esse aceite.

Próximo passo recomendado: **corrigir RV01/R03 e completar o zoom indispensável
antes de reapresentar CF-015**. Isso não inicia CF-016 nem obriga executar todo o
escopo de CF-017/024 para corrigir o frontend. Nenhum push, deploy, banco real,
reescrita de histórico ou correção de runtime foi realizado.

Execuções e estado final: [EXECUCOES.md](EXECUCOES.md).

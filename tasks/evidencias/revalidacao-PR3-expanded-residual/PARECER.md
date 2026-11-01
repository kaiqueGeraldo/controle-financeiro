# Parecer independente — saneamento residual da PR #3

01/11/2026, America/Sao_Paulo. Base 965b93c77bce6cde0c4473272901817d221466a1; candidato 4f22d41f5208aca16d334b3d5abbcd5de2841086. Sete commits examinados, sem correção de implementação nesta revisão.

**Parecer parcial.** Cobertura/reserva, relógio SAN-D1, identidade RF15 e preparação/navegação CF023 são aceitos nos recortes abaixo. A geometria por DOMRange resolve corretamente a ausência de caixa de display:contents, mas a exigência de pintura permanece parcialmente atendida: duas contraprovas invisíveis passam pelo observador. **Saneamento residual necessário; expanded integral não executada e sem prontidão de aceite no executor atual. PR #3 sem liberação de merge ou produção.**

| Correção | Decisão | Critério restante |
|---|---|---|
| Cobertura UI01/UI05/UI06 | Aceita | Integração expanded futura; não reabre estes oracles |
| Reserva UI03 | Aceita | Demais jornadas financeiras conservam escopo próprio |
| Presença/geometria SAN-E2 | Parcialmente aceita | RR3-01/P2: rejeitar texto sem pintura por filtro e cobertura sem hit test |
| SAN-D1 | Aceita | Intermitência antiga documentada; outros relógios/cenários não certificados |
| Identidade RF15 | Aceita | Namespace de execução continua obrigação do chamador; zoom continua separado |
| CF023 preparação/navegação | Aceita no fluxo com aplicação pronta | Cold start/SLO e Linux não certificados por esta execução |
| Zoom nativo | Decisão B; verificação obrigatória faltante | AC-UI-001/CF010/CF015 e os dois casos nativos da seleção RF15 |

## Oracles financeiros e reserva

FIN-01/04/05/08 e DEC-04 distinguem posição, renda, consumo, caixa e desconhecimento. Pedido de janeiro inteiro com base conhecida apenas em15/01 não autoriza total mensal zero. Abertura1000 mantém renda observada0; despesa120 deixa caixa880. Compra10×20/venda4×25 deixa caixa900, quantidade6, custo120 e ganho realizado observado20; resgate220 na posição1000/1100 deixa800/800/880 e caixa1220. Os totais mensais continuam null/PARTIAL, com strings decimais nos subtotais; não foram copiados da implementação.

A nova observação preserva essas dimensões e os períodos; consulta investimento pelo ID. UI03 usa a alocação da conta/meta pretendidas, verifica IDs no PATCH, item semelhante pendente, alocação alheia recusada, reload e exclusão real pela UI. Conta1000/reserva300 vira880/180 após compra120; apagar a intenção libera180 sem criar renda e conserva880. O fallback HTTP antigo foi removido; não há force click nem seletor permissivo.

As jornadas originais dirigidas e os controles restaurados foram confrontados com SQL. Mutações de um mecanismo por vez detectam renda fictícia1000, ganho20 trocado por0 e crédito indevido180 na exclusão. A última resulta1060 e falha no esperado880. São novas contraprovas causais; os três primeiros filtros da própria revisão não selecionaram casos e foram excluídos dessa conclusão, preservando seus recibos.

## Presença, pintura e geometria

Medir o texto com DOMRange é coerente: o span PrivacyBlur em display:contents não tem caixa própria. O contrato exige legibilidade e ausência de recorte, não pixels exatos inventados, foco ou ação para um badge informativo. Os tamanhos360/768/1440, rolagem e identidade exata continuam no cenário.

Entretanto textGeometry não prova pintura apenas com estilos parciais e elementFromPoint. Em contraprova própria, filter:opacity(0) no ancestral e uma camada branca com pointer-events:none deixam todos os pixels brancos, mas ok=true e isVisible=true. O probe real na tela de investimentos reproduz os dois falsos positivos sem mudar os dados financeiros; baseline e restauração conservam o texto correto. Os arquivos e a decodificação numérica dos pixels afastam uma falha de prévia da ferramenta. Ver ACHADOS.md.

A correção está aceita para geometria do texto e parcialmente aceita para o objetivo visual completo. RR3-01 pertence ao observador; não há defeito de pintura do produto demonstrado. Não se atribui esse achado ao zoom nem ao relógio.

## SAN-D1

A alteração limita-se a payment: setCivilDateOnly mantém Date em15/01/2027,09h SãoPaulo, atravessando navegações; timers, performance, RAF e timeline WAAPI continuam nativos. O Clock financeiro e as credenciais do wrapper não foram alterados.

A jornada original preserva duas intenções100, replay sem novo débito, conflito409, caixa800, total300/pago200/pagável100, reload e sugestão100. O relógio antigo recolocado isoladamente voltou a falhar no modal residual (esperado0, observado1 após pagamento). Fontes restaurados por SHA e controle atual aprovado. A revisão também releu as medições históricas de desalinhamento entre performance e document.timeline. Os controles antigos que passaram no saneamento continuam publicados: a manifestação é intermitente. O aceite encerra este mecanismo, sem culpar o relógio por outras falhas visuais.

## Identidade RF15

O helper acrescenta dono determinístico por spec/cenário, conservando o alias e o namespace da execução. Login/reload usam o mesmo usuário; os diretórios nativos também são distintos. Não foi alterada a seleção do objeto para aceitar qualquer nome.

Quatro sequências independentes cobrem os dois pares nas duas ordens: IDs diferentes, efeito120 na conta pretendida, caixa880/881, conta semelhante71 intacta, ausência das contas do outro usuário e login/reload na mesma identidade. A fórmula antiga reproduz segundo cadastro400; a nova registra ambos. Os dois cenários originais de privacidade também foram conferidos, preservando seu conteúdo e seus aceites. Isso não conclui ações/foco/scroll depois de zoom nativo.

## CF023: prontidão e sessão

O contrato CF023 verifica ownership/sessão e limpeza de cache com aplicação pronta; não define SLO para compilação lazy de Nextdev. O experimento frio histórico foi relido: clique em 991,5ms; GET/ em 2924,2ms; falha em 6199,3ms; resposta HTTP200 em 7074,3ms; pintura em 8144,7ms. O log da mesma request mede4,1s de compilação em4,2s totais, sem307 e com login/user200. Há evidência causal de compilação no caminho crítico dessa ocorrência; não apenas a palavra Compiling no fim do log. Isso não prova retrospectivamente toda falha remota ou o incidente anterior sem resposta capturada.

A preparação usa fontes físicos novos, build concluído e HTTPS de loopback pronto antes do cenário. GET/auth200 e três GETs BFF401 são condições observáveis no mesmo orçamento120s; permanecem180s do processo e5000ms após clique. O polling de prontidão não repete a jornada. Não há warmup autenticado, cadastro antecipado, sleep de sucesso, retry funcional, alteração de JWT/TTL ou autenticação desligada.

HTTPS conserva Secure/HttpOnly e resolve a diferença entre cookie no navegador e no cliente HTTP auxiliar. O certificado é próprio de cada runtime; o probe Node confia apenas nele. A tolerância Playwright a certificado autoassinado fica no contexto sintético de loopback. Node/Edge usam relógio real; o financeiro JVM/browser continua30/09/2026/SãoPaulo.

Jornada original, controle restaurado e extensão independente de fronteiras passaram no recorte: A/logout/B/reload/404/logout/A, duas abas, SQL1000/2300. Sessão válida abre/200 e lê perfil200; ausente/expirada obtêm401 nos dados e307/auth no caminho protegido, sem efeito financeiro. Assinatura inválida também não obtém dados. O middleware continua responsável por expiração, enquanto a assinatura é validada no backend; não se atribui uma garantia nova ao Edge. Clock antigo de credenciais reproduz307/cookie removido; bytes atuais restaurados e jornada completa aprovada.

Trade-off: cópia O(n) de fontes e O(m) de entradas instaladas/hardlinks, build por execução, TLS e dependência de JAVA_HOME/keytool. Preserva caches anteriores e aproxima o fluxo funcional de uma aplicação compilada; não mede cold start de produto. Sem mudança de queries, concorrência ou arquitetura de domínio. Linux/caminhos/symlinks dependem da futura topologia integral; não são aprovados por um verde Windows.

## Proveniência, gates e limites

88 JUnit históricos =83 casos sem navegador+5 wrappers;11 Playwright+1 jornada CF023 são internos aos wrappers. Não somar. Os15 recibos históricos, XML/logs e11 fontes críticos foram conferidos; a tipagem histórica foi reaproveitada por fonte e recibo.32 contratos CI foram executados novamente e passaram. Os novos builds Next conferem os fontes físicos de produto. Resultados novos, falhas esperadas e erros da própria preparação constam por invocação em RESULTADOS.json.

Produto, migrations, dependências, contratos e .github têm diff vazio no intervalo. A seleção canônica permanece115 classes Linux/116 Windows, com a classe Windows obrigatória, required e rejeição de skips/relatórios ausentes/antigos. Os probes novos terminam em Probe e não entram silenciosamente nessa seleção. Não houve novo JAR; as provas Maven usam classes dos fontes identificados. O JAR histórico da smoke não é pacote validado pelo candidato residual.

O remoto permanece no SHA1c4173f2; consulta de leitura confirmou PR aberta e expanded/required reprovados no run40873511911.927=921 aprovados+5 falhas+1 erro; zero skips. Os quatro wrappers de navegador já estão nessas cinco falhas. Brutos remotos sem traces completos não autorizam atribuir todos os mecanismos locais ao interior remoto.

Realocação,97/36,READMEs,originais arquivados e scripts independentes estão detalhados em REALOCACAO.md/REGISTROS-36.md/PRESERVACAO.json. Não houve correção de produto, fixture ou harness entregue, push, atualização da PR, CI remota, merge, mudança de gate/hospedagem, deploy ou banco real.

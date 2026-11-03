# Contrato de pausa e retomada assistida

Base local: 02bd83f4262db9292de1f7b402b1fae5cbb6847a. Produto e verificações originais equivalentes a f09e69a6511a5772ea9052da7509a8930ae88d17. Fontes originais preservados. Os adaptadores alteram apenas uma cópia descartável.

## O que cada prazo mede

| Prazo | Contrato e decisão |
|---|---|
| 15.000 ms de expect | Resposta funcional observada pelo cenário, inclusive URL após o cadastro; preservado. O helper original faz cadastro UI, login, cookie, refetch e navegação; seu nome não significa que um timeout prove falha do POST de cadastro. |
| 120.000 ms de webServer | Ciclo de vida e prontidão do Next dev por /auth; preservado. /auth disponível não prova compilação das rotas privadas. |
| 120.000 ms por rota no bootstrap novo | Prontidão de compilação, em contexto sintético próprio, antes do cenário. Adota o limite existente de inicialização. Não é medição nem aumento do prazo funcional do cenário. As leituras/ações depois da compilação continuam com 15.000 ms. |
| 180.000 ms de razão DPR | O original espera o operador aplicar zoom e observa razão 2; não mede resposta de negócio. A assertion original é preservada após a pausa estruturada; DPR sozinho não certifica zoom nativo. |
| 60.000 ms de native-confirmed.txt | Coordenação humana: esperar conteúdo exato 200% em arquivo, depois de detectar DPR2. Não mede upload, recebimento de chat ou resposta da aplicação. Substituído somente na cópia assistida por pausa explícita e recibo vinculado ao alvo. |
| 300.000 ms por spec | Orçamento original do teste. A cópia exclui apenas o tempo da pausa humana: amplia temporariamente por uma licença de recursos de até 300.000 ms e, na retomada, desconta somente a espera efetiva. Revalidação da aplicação não ganha esse desconto. |
| 15 minutos do Java e do processo Maven | Envelope original de recursos, preservado. Uma execução por cenário. Ele ainda pode encerrar uma preparação/compilação excessiva; isso não vira aprovação. |

Não há cronômetro de upload. A licença da pausa encerra recursos ociosos; sua expiração deixa o cenário incompleto. Não renova sessão automaticamente, não repete a execução e não altera prazos para esconder falha.

## Preparação

preparacao.mjs é globalSetup do Playwright, depois da prontidão original de /auth. Cadastra/autentica uma identidade bootstrap sintética em PostgreSQL descartável e compila /, /contas, /cartoes, /planejamento e /extrato. O token desse contexto serve somente à inicialização. O spec mantém seu próprio cadastro UI original, identidade por dono, cookie e dados. Não há bypass no cadastro do cenário, API financeira simulada, extensão ou perfil pessoal.

O bootstrap faz verificações reais de status, identidade, heading e ausência de spinner; não aprova zoom ou cenário. Em erro, para antes da intervenção humana. Os dois clocks originais são preservados: CF015 usa a data do navegador; RF15 fixa Date em 15/01/2027. Clocks de credenciais e servidor permanecem os do controlador existente.

## Identidade e estados

protocolo.mjs usa arquivos locais, watcher de diretório e transições exclusivas. Não abre endpoint de controle. A pausa vincula execução, cenário, candidato, SHA do pacote, página, documento, título com identificador único, URL, versão do navegador, hash da identidade e da sessão, cartão, challenge aleatório e instante posterior à preparação. O PID proprietário e o fim da invocação são conferidos pelo terminal.

Estados: waiting → resumed → finished; caminhos de interrupção: cancelled, expired ou invalidated. Uma declaração é consumida uma única vez. Lock exclusivo impede dois consumidores; uma interrupção não produz passed. Um lock deixado por queda de processo exige nova execução, sem reaproveitar sinal nem apagar prova histórica.

A declaração precisa afirmar baseline 100%, observação nativa 200%, capturas realizadas e operador explícito. synthetic-test só é aceito em uma pausa marcada sintética. Em execução humana, o helper exige terminal interativo e origem human-local-terminal. Nenhuma declaração sintética é prova de zoom.

Antes de retomar, o adaptador consulta /api/auth/user, exige a mesma identidade/cookie, confere o cartão, documento, URL e título. Expiração de sessão, reload, troca de página/contexto ou entidade invalida a pausa. Cancelamento durante a consulta também impede a retomada. Não faz login automático para reparar a preparação.

O recibo guarda o hash da declaração. Ele é autorização de continuidade, não medição técnica de zoom. O spec conserva as assertions de geometria e todas as ações originais. A validação estrutural compara byte a byte o bloco funcional desde const after até observations.json. O campo method histórico de zoom.json menciona sky; não é prova de autoria do input. A origem real deve ser humana, associada às capturas revistas.

## Evidência tardia e recursos

Capturas podem chegar depois. attachEvidence somente acrescenta metadados vinculados ao challenge; não modifica resultado funcional. Falha após retomada permanece failed. Os registros não autoaprovam AC-UI-001/CF010/CF015.

Watcher, timer e listeners são fechados em sucesso, cancelamento ou erro. O terminal termina se a pausa encerra/expira; o adaptador cancela pausas interrompidas antes da retomada. Os finally fecham explicitamente contexto e navegador descartáveis, preservando trace. Contexto pessoal nunca é reivindicado.

Custo: hashing/cópia O(bytes); bootstrap O(r), r=5 rotas; fixture O(p), p=12 compras sequenciais; revalidação O(c) na lista pequena de cartões; espera O(1) em recursos, sem polling, sleeps ou retries de coordenação. O custo é inicialização adicional e um usuário bootstrap descartável. Não há mudança em queries, transações, concorrência ou domínios do produto.

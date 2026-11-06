# Rotação de credenciais antes da adoção

A revisão independente de 06/11/2026 aceitou o restore V16 e o startup no
ensaio isolado. A janela Railway segue bloqueada por achados nos clientes,
pela identidade do próximo pacote e pela decisão vigente sobre Onboarding.
[Parecer e condições de retomada](../../tasks/evidencias/revisao-a3-complementar/PARECER.md)

Plano de execução para autorização separada. Alvo Railway controle-financeiro /
production, serviço da API controle-financeiro. BRAPI_TOKEN, JWT_SECRET,
RESEND_API_KEY e SPRING_DATASOURCE_PASSWORD são tratadas como comprometidas pela
captura relatada. A API permanece offline. O conector confirma os nomes, com
valores ocultos e sem indicação de selo nessas variáveis. A Vercel tem somente
BACKEND_API_URL entre as variáveis do projeto retornadas. O frontend recebe o
JWT como cookie e o encaminha como Bearer, sem conhecer a chave de assinatura.

## Estado após o lote A3 — 06/11/2026

| Credencial | Estado |
|---|---|
| JWT_SECRET | Novo segredo HMAC256 de 32 bytes aleatórios em Base64, selado no serviço da API. A Vercel recebe e encaminha o token sem precisar da chave de assinatura. As sessões antigas precisarão de nova autenticação após o primeiro start. |
| BRAPI_TOKEN | Máscara da antiga coincidiu em memória com a configuração anterior. Substituta preparada pelo proprietário e selada no Railway sem deploy. O token antigo continua ativo. Revogar no painel e registrar metadados. Preparar Bearer e logs sem URL ou exceção bruta antes de usar o cliente real. |
| RESEND_API_KEY | Máscara da antiga confirmou a chave Onboarding. Substituta identificada no emissor e selada na API. O remetente configurado pertence ao domínio verificado kaique.dev.br. O proprietário pediu manter Onboarding. A revogação fica pendente e nenhum envio de teste foi feito. |
| PostgreSQL | O datasource da API aponta ao banco novo com o papel cf_adocao_api e senha inédita selada. A referência anterior apontava ao serviço Postgres original e foi retirada da API. A validade no cluster antigo continua sem verificação. O bootstrap do novo banco segue selado e separado do runtime. |

O patch dos provedores e do JWT foi aplicado com skipDeploys após
confirmação explícita. A primeira inicialização da API depende dos
controles pendentes no [runbook](validacao-deploy.md).

## Decisões após o A3 complementar — 06/11/2026

- **BRAPI.** O proprietário confirmou a revogação do token antigo. Essa
  confirmação é operacional. A equipe não obteve recibo do painel nem testou
  a substituta no provedor neste lote.
- **Resend.** `Onboarding` (`fd894a5b-9bb8-4fe9-b2fa-bf1af2c4a545`) é
  a mesma chave exposta identificada no A3. O proprietário informou que
  somente o Controle Financeiro usava a chave e decidiu mantê-la e adiar
  a inicialização. A substituta `controle-financeiro`
  (`080fcdc7-8f3a-4651-8c07-d493f7958327`) segue selada. A verificação
  do emissor foi limitada a metadados, sem envio de mensagens.
- **JWT e PostgreSQL.** O Railway reconfirmou o selo do JWT novo, da senha
  de `cf_adocao_api` e do bootstrap de `cf_adocao_admin`. O papel da API
  tem acesso de leitura restrito ao alvo novo. O bootstrap é administrativo
  e exclusivo desse banco. A referência legada já saiu da API no A3.
  A validade ou revogação da senha no cluster legado segue sem confirmação.
- **Candidato.** O commit `b396630d1a821c5de4a5f626f81476aeb9626e9e`
  usa Bearer em cabeçalho na BRAPI e elimina o registro de destinatário,
  corpo de resposta e exceção bruta nos dois clientes. A regressão usou
  credenciais e respostas sintéticas. Os logs dos chamadores de autenticação
  ainda exigem revisão antes do uso funcional.

A revogação de `Onboarding` e a revisão independente do candidato são
condições para retomar a janela restrita.

## Alvo novo na adoção do zero

O proprietário dispensou os dados do volume antigo em 06/11/2026. Para o
cutover, a senha exposta de SPRING_DATASOURCE_PASSWORD será substituída por
uma credencial inédita de um papel da API no cluster novo. A linha da matriz
que descreve a troca da senha de um papel existente aplica-se somente à
hipótese de reaproveitar o Postgres antigo. O bootstrap do novo serviço tem
credencial própria. O executor Flyway e a API recebem credenciais e grants
próprios antes do cutover autorizado. O serviço antigo permanece offline,
sem tentativa de validar ou reaproveitar a senha exposta. A contenção e a
rotação de BRAPI, Resend e JWT continuam necessárias.

## Matriz de rotação

| Credencial e emissor | Consumidores e dependências | Aplicação e revogação | Validação e recuperação |
|---|---|---|---|
| BRAPI_TOKEN, painel brapi.dev | MarketDataService, job de cotações que usa o token para lotes e persiste preços. Confirmar outros consumidores no painel e com o proprietário antes de remover a chave. | Identificar a antiga por metadados. Com autorização, revogá-la no provedor assim que os consumidores forem identificados. Se houver uso legítimo compartilhado, coordenar a troca sem manter sobreposição indefinida. Criar chave exclusiva pelo dashboard. Confirmar na conta a ação de revogação e o limite de chaves, que a documentação pública consultada não detalha. Antes de injetar a nova, aprovar mudança dirigida para Bearer no cliente, sem token na URL, com sanitização de exceções. | Em rede autorizada, validar com instrumento que exija autenticação e guardar apenas status e resultado funcional. PETR4, MGLU3, VALE3 e ITUB4 podem responder sem chave. Simular falhas em homologação e verificar que URL, cabeçalhos e logs não carregam segredo. Se falhar, manter jobs desligados e corrigir configuração ou emitir outra chave. |
| RESEND_API_KEY, painel API Keys do Resend | EmailService. Cadastro, recuperação e alteração de senha, notificações de vencimento e fatura. EMAIL_RESEND precisa pertencer ao domínio aprovado. Checar outros consumidores e uso do ID antigo. | Com autorização, identificar e revogar pelo ID da chave em Resend API Keys. Emitir substituta exclusiva com sending_access, limitada ao domínio verificado do remetente. Guardar direto no cofre aprovado e instalar na API somente no cutover autorizado. | Antes de abrir writers e jobs, validar a permissão/domínio por metadados e ensaiar envio autorizado para caixa de teste. Conferir aceitação e entrega sem reter destinatário ou resposta bruta. Testar falhas e remover dos logs o corpo/stack sensível e o e-mail de destinatário. Em falha, manter fluxos contidos e corrigir remetente ou emitir outra chave. |
| JWT_SECRET, operador com gerador criptográfico | TokenService assina e valida HMAC256 com uma única chave e TTL de 24 h. SecurityFilter valida a identidade no banco. Next/BFF encaminha o cookie. A troca invalida sessões antigas em todos os clientes, inclusive cookies ainda dentro do TTL. | Gerar no cofre ou em processo efêmero com CSPRNG, 32 bytes aleatórios ou mais, representados em Base64. Transferir diretamente para a variável protegida, sem eco, argumento de linha de comando, arquivo de evidência ou captura. Aplicar em todas as instâncias autorizadas, com instâncias antigas já paradas. Usar somente a nova chave em qualquer rollback compatível. | Em homologação, confirmar rejeição de um JWT sintético assinado pela chave anterior do ensaio, nova sessão aceita e cookie expurgado no 401. Middleware lê exp sem verificar a assinatura. O backend dá a decisão de autenticação. Conferir o cliente antigo e o novo. Se houver falha, corrigir o fluxo de reautenticação ou gerar nova chave segura. |
| SPRING_DATASOURCE_PASSWORD, PostgreSQL e configuração Railway | O papel efetivo da API é definido por SPRING_DATASOURCE_USERNAME, ainda sem confirmação de identidade/grants. Verificar clientes privados, operadores, ferramentas de backup e migrador. POSTGRES_USER, PGUSER, POSTGRES_PASSWORD, PGPASSWORD e DATABASE_URL existem no serviço Postgres. As referências e a igualdade dos papéis não foram comprovadas. | Após classificar o cluster, validar recuperação e autorizar janela própria, confirmar alvo e papel pelo canal privado e manter um acesso administrativo independente. Gerar senha no cofre e aplicar ao papel efetivo com o comando interativo psql \password para o papel confirmado. Atualizar os consumidores comprovados, inclusive a API. Sincronizar aliases do template somente quando vinculados ao mesmo papel e revisar os efeitos de redeploy antes de aplicar mudanças. | Abrir novas conexões privadas e verificar identidade do papel, database, privilégios e TLS. Drenar sessões antigas, pois trocar senha não invalida conexões já autenticadas. Confirmar que o segredo anterior perdeu acesso por evidência controlada, sem reutilizá-lo em logs ou comandos. Se falhar, usar o acesso administrativo independente para sincronizar a senha nova ou emitir outra. Manter a API offline. |

POSTGRES_PASSWORD é entrada de inicialização do template que deriva da imagem
oficial PostgreSQL. O wrapper do digest consultado delega ao entrypoint oficial e não contém ALTER ROLE/USER. Alterar uma variável Railway num cluster existente não
comprova alteração da senha do papel no catálogo. Não usar a troca de variável
como mecanismo de rotação do banco. A inspeção de catálogo do lote 1 usa papel
de leitura já autorizado e não concede permissão para ALTER ROLE. A senha do
migrador tem ciclo separado quando o papel for distinto.
[Imagem oficial PostgreSQL](https://hub.docker.com/_/postgres) ·
[Comando psql password](https://www.postgresql.org/docs/17/app-psql.html) ·
[ALTER ROLE](https://www.postgresql.org/docs/17/sql-alterrole.html) ·
[Wrapper do template identificado](https://github.com/railwayapp-templates/postgres-ssl/blob/09ff77dca25f9af407827b9f27c7de9c5c660790/wrapper.sh)

A BRAPI documenta emissão pelo dashboard e autenticação por Bearer. O código
atual de MarketDataService envia token na query e registra a exceção completa.
A mudança mínima é mover a autenticação para o cabeçalho e limitar diagnósticos
a status, fase e identificadores permitidos, sem URL completa ou conteúdo de
headers. Para Resend, conservar somente status/código de erro e correlação
sanitizada. Ensaiar com chaves sintéticas e respostas 401/403, 429, timeout e
erro de transporte. A validação com provedor real, quando necessária, exige a
operação aprovada e um destino de teste controlado.
[Autenticação BRAPI](https://brapi.dev/docs/authentication) ·
[Emissão de chave Resend](https://resend.com/docs/api-reference/api-keys/create-api-key) ·
[Revogação de chave Resend](https://resend.com/docs/api-reference/api-keys/delete-api-key)

## Ordem e pontos de parada

1. Identificar chaves antigas por IDs, escopo, data e uso no provedor. Documentar
   consumidores e autorização por ação. Com a API offline, priorizar revogação
   de chaves expostas de BRAPI e Resend após confirmar o vínculo. Essa contenção
   independe da versão do volume. Verificar atividade, quota e envios no
   intervalo da exposição. Registrar IDs e eventos técnicos sanitizados, sem
   valores. Se houver uso não explicado, interromper a liberação e manter
   evidências com acesso restrito.
2. Preparar código e provas de sanitização em homologação, com segredos
   sintéticos. Emitir substitutas no provedor autorizado e guardar em cofre.
   Revisar proteção das evidências e compartilhamentos existentes. Qualquer
   restrição, remoção de cópia ou reescrita de histórico tem procedimento próprio.
3. Resolver versão e geração do volume e executar o inventário autorizado com
   as condições do runbook. Ensaiar recuperação e compatibilidade antes da
   janela de alteração de credenciais e schema. Rotacionar o papel real do
   PostgreSQL em janela separada, confirmar nova conexão privada e ausência de
   sessões antigas. Separar o executor Flyway da API. Aplicar migrations apenas
   na etapa aprovada e conferir schema/checksums.
4. Gerar o JWT novo e preparar os valores substitutos e os controles do
   perfil adoption. Conferir o diff e todos os serviços que uma aplicação de
   mudanças iniciaria. Railway pode preparar alterações e disparar deployments
   dependentes ao aplicar o conjunto. Parar se houver changeset alheio,
   deployment não autorizado ou referência para o papel errado. Selar valores
   quando compatível com o consumo e a recuperação planejados. O selo impede
   leitura posterior e cópia em duplicações, e não corrige snapshots anteriores.
   [Variáveis Railway](https://docs.railway.com/variables) ·
   [Dependências de deployment Railway](https://docs.railway.com/deployments/deployment-actions)
5. Iniciar a API apenas com banco/credenciais/schema comprovados, sem Flyway no
   startup, em manutenção e com ingressos antigos contidos. No teste
   autorizado, liberar writers com jobs desligados. A configuração de e-mail
   já precisa estar segura, pois existem envios em fluxos interativos. Confirmar
   rejeição de sessão antiga, login novo, operações sintéticas e isolamento dos
   previews. Liberar jobs somente após os controles de BRAPI e Resend, com
   verificação do primeiro ciclo.
6. Recuperação preserva schema e dados novos. Se necessário, congelar writers e
   jobs e voltar apenas para binário compatível, configurado com credenciais
   novas. Uma chave exposta/revogada fica fora do rollback. Não promover frontend
   antigo que contorne os controles de isolamento ou restaure destino inseguro.

A autorização para inventário por até 30 minutos não cobre criação de chaves,
revogação, senha de papel, aceitação de configuração, envio de e-mail ou deploy.

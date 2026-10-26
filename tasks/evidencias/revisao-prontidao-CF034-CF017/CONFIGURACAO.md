# Topologia, configuração e proposta de operação

Observações de 26/10/2026 em `plataformas-observadas.json` e
`consultas-remotas.json`. Railway foi lida pelo painel autenticado porque o
conector repetiu autenticação sem dados e depois respondeu ferramenta ausente.
Vercel/GitHub foram consultados pelos conectores; a UI confirmou os campos
omitidos pela resposta resumida. Nenhum banco ou endpoint da aplicação foi
consultado. Valores protegidos foram usados apenas para classificação de destino,
sem registrar credenciais/connection strings; a UI voltou a ocultá-los.

```text
Navegador HTTPS → Next frontend/BFF (Vercel)
                  cookie HttpOnly → Bearer no servidor
                    → HTTPS API Spring (Railway, domínio público)
                        → JDBC PostgreSQL (hostname privado Railway)
```

| Item | Observado agora | Implicação/limite |
|---|---|---|
| Vercel projeto | prj_OdfwpJWp3wv8ZgfpcjVEBscrj03r, kaiquedev/controle-financeiro | Next.js, root controle-financeiro-frontend; Node24.x; overrides build/install desmarcados |
| Publicação preservada | dpl_FkfL25jbyrt6FdD5Di5wqoLH9iHm, READY, commit272001f | UI e API concordam; READY não prova fluxo financeiro com API offline |
| Deploy Git | vercel.json main=false e codex/cf034-ci-local=false | Correspondem à fonte integrada e ao root configurado; nenhuma publicação nova listada |
| Vercel checks | UI: No checks configured | main também protected=false na API GitHub; verde não é trava de promoção |
| BACKEND_API_URL | Uma variável, production/preview/development, sem gitBranch | Valor HTTPS, host esperado da API, path raiz, sem credencial/query; não é NEXT_PUBLIC |
| Railway alvo | Projeto19974952-914d-4072-9140-e62e5ed23c31; production73f7324a-a15f-4940-b2dc-d5bcb5510441 | Não criar outro destino por inferência |
| API | f4ad9689-58ed-4112-8bb2-2cfe4af24483 offline, sem deployment ativo | Source main mantida; autodeploy disabled/botão Enable; Wait for CI off |
| Build API | Root/backend e Dockerfile/backend corretos; watch backend/** | Dockerfile usa Maven3.9.6/Java21, clean package -DskipTests; não reutiliza JAR da CI |
| PG | 79d2ee56-cfd0-47bc-8744-e932cf49ba69 offline; imagem postgres-ssl:17 | Tag major17 confirmada; versão efetiva e estado do volume desconhecidos sem query |
| Rede | API pública8080; JDBC privado; PG com proxy TCP público configurado | Não foi usado proxy; não removê-lo antes de inventariar consumidores |
| FRONT_URL | Alias HTTPS controle-financeiro-kaiquedev.vercel.app, presente nos domínios do projeto | Não é o mesmo hostname que three-black, mas é alias listado do mesmo projeto; não é prova de CORS em execução |
| Saúde | Sem Actuator/dependência/endpoint dedicado no código; Healthcheck Path sem valor na UI | Não configurar provedor para endpoint inexistente/protegido |
| Execução | API1 réplica, US East Virginia; restart On Failure até10 | Não foi medida capacidade; limite8vCPU/8GB da UI não é reserva nem consumo |
| Proteção Vercel | SSO all_except_custom_domains | Não oferece isolamento de dados financeiros; nenhum bypass foi criado |
| Perfil Spring | Sem SPRING_PROFILES_ACTIVE nos9 overrides de serviço | Perfil efetivo de processo desconhecido porque não há processo ativo; YAML base e local usam validate |
| Pending/staged | Histórico dizia vazio/null; UI atual não exibiu pending work | Desconhecido em API atual indisponível; reconsultar antes de qualquer mutação |
| PR environments Railway | Desativados segundo inspeção anterior | Não reconfirmados pela UI desta revisão; não declarar estado atual certificado |

Nomes dos9 overrides Railway: BRAPI_TOKEN, EMAIL_RESEND, FRONT_URL, JWT_SECRET,
RESEND_API_KEY, SPRING_DATASOURCE_PASSWORD, SPRING_DATASOURCE_URL,
SPRING_DATASOURCE_USERNAME, SPRING_JPA_HIBERNATE_DDL_AUTO. Só o valor não secreto
`update` foi registrado. Não foram lidos valores de tokens/senhas.

## Fronteiras de configuração e autenticação

`src/app/api/[...path]/route.ts` lê BACKEND_API_URL no módulo do servidor;
esse destino pertence à configuração da implantação do BFF, não ao bundle
NEXT_PUBLIC do navegador. Alterar variável do projeto não modifica por si só
deployments antigos: exigir redeploy/versão e prova do destino do deployment
futuro. No build CI o destino é loopback65535 e o harness troca para API
descartável. Isso não demonstra acesso do deployment Vercel ao Railway.

O navegador chama `/api`; o BFF transfere o cookie token para Authorization
Bearer, mantém query/body, usa no-store, timeout padrão10s e propaga abort.
Cookies: HttpOnly, Secure em NODE_ENV=production, SameSite=Lax, path=/,24h,
sem Domain explícito. São cookies do host, mas qualquer preview que autentique
no mesmo backend pode operar os mesmos dados autorizados: outro hostname/cookie
não cria outro banco. Backend stateless/JWT, endpoints auth POST públicos,
demais rotas autenticadas; CORS lê FRONT_URL e permite credenciais. CORS não
impede o BFF servidor→servidor nem equivale a autorização por owner.

`next.config.ts` não introduz outro rewrite de backend. Headers de segurança
existentes foram lidos; não é uma auditoria ampla de segurança nem regressão
dos aceites CF023. Região iad1 é evidência histórica anterior; não foi confirmada
pela resposta atual do conector e não sustenta promessa de latência. Manter
API/PG próximos é proporcional; mudança de região/pool/réplicas exige medição.

`docker-compose.yml` é infraestrutura local PostgreSQL15-alpine/porta5432/volume
local e pgAdmin5050; não descreve nem autoriza o Railway. Seus defaults de desenvolvimento não são
credenciais efetivas da produção nem prova de teste da major17. Não foi iniciado.
Há três referências distintas: compose15, CI16 e imagem Railway17. Não usar o
compose inalterado como ensaio de compatibilidade do alvo17.

## Precedência e primeira inicialização

Spring Boot4.0.2, `spring-boot-starter-flyway` e migrations V1–V16 presentes.
YAML base/local: Hibernate validate, baseline-on-migrate=false,
clean-disabled=true, out-of-order=false, validate-migration-naming=true e
validate-on-migrate=true. Não existe application-prod separado. A variável
observada é **SPRING_JPA_HIBERNATE_DDL_AUTO**, não uma variável genérica DDL_AUTO.
Ela resolve spring.jpa.hibernate.ddl-auto e sobrepõe o YAML por propriedade
externa; args/JVM/JSON externos poderiam ter precedência maior, mas não foram
observados. Start command customizado ausente, Docker entrypoint java -jar.
Conclusão condicionada: se iniciado com a configuração observada, Hibernate
usará update; não foi observado DDL real já executado.

Flyway habilita por padrão quando presente. Seu initializer chama migrate antes
da inicialização dependente de JPA. validate-on-migrate valida histórico/checksums
**antes de migrar**, não desativa migrations. Trocar Hibernate update→validate
não impede o Flyway de migrar um banco vazio ou versionado na primeira subida.
Em legado não vazio sem history, baseline automática false deve fazer a subida
falhar; isso não substitui inventário nem autoriza baseline para destravar.
Após Flyway, Hibernate update ainda poderia alterar diferenças de schema fora
da cadeia versionada. Defaults não justificam iniciar para descobrir o estado.

Preparar para autorização posterior:

| Configuração/controle proposto | Efeito | Evidência obrigatória antes de aplicar |
|---|---|---|
| SPRING_JPA_HIBERNATE_DDL_AUTO=validate | ORM só valida; nenhuma evolução automática pelo Hibernate | Config resolvida do candidato, schema migrado e teste de falha incompatível |
| SPRING_FLYWAY_ENABLED=false na API normal | Evita migrations no bootstrap HTTP | Job operacional separado info/validate/migrate aprovado; teste mostra que API não cria history nem schema |
| Flyway operacional sem servidor HTTP | Executa a cadeia por decisão da janela | Alvo/database/schema explícitos, backup/restore e preflight próprios |
| Runtime DB sem DDL; migrador separado | Limita evolução ao executor operacional | Grants, owners e necessidade de DML/ShedLock conferidos no clone; mudança remota precisa autorização |
| Bloqueio de writes HTTP e jobs durante adoção | Impede writers/nextval/externos antes dos gates | Implementar e testar mecanismo explícito; não existe flag de manutenção/jobs comprovada no código atual |

`@EnableScheduling` está na aplicação. Habit/InvoiceCron escrevem à00h05;
NotificationCron tem08h diário/semanal, MarketDataService fixedRate30min pode
começar após a inicialização e escrever preços/ShedLock/chamar Brapi. Bloquear
só o tráfego HTTP não congela esses writers. Não presumir que uma propriedade
genérica desabilita @EnableScheduling. Proposta local futura: mover a habilitação
de scheduling para configuração condicional e guard explícito dos writers,
com contrato/nomes a aprovar e testes de ausência de execução; nenhum endpoint
de manutenção ou flag foi implementado nesta revisão. Enquanto não houver esse
controle comprovado, manter a API desligada e usar somente CLI sem Spring para
inventário/migration job. Readiness UP também não é autorização de writers.

## Saúde proposta, sem implementação

Preferir Actuator da versão do Boot do projeto, pois não existe endpoint atual
equivalente. Alternativa endpoint próprio tem menos dependências, mas duplica
ciclo de disponibilidade, tratamento de timeout e contrato de segurança.

| Endpoint proposto | Dependências/retorno | Exposição |
|---|---|---|
| GET /actuator/health/liveness | Somente livenessState do processo;200 UP ou503 | Sem auth, corpo mínimo, sem detalhes; DB/Brapi/email não reiniciam processo por liveness |
| GET /actuator/health/readiness | readinessState e db;200 somente após startup/schema pronto/DB disponível;503 na indisponibilidade | Path do provedor Railway; GET exato sem auth; demais actuator endpoints fechados |

Config de proposta: probes.enabled=true; exposure.include=health;
show-details=never, show-components=never; liveness.include=livenessState;
readiness.include=readinessState,db. Não expor env, configprops, beans, flyway,
heapdump ou shutdown. A SecurityFilterChain atual exige auth em qualquer GET:
precisa liberar apenas os dois paths e confirmar que SecurityFilter aceita
requisição sem token. Sem wildcard /actuator/** público.

Banco é essencial ao monólito financeiro, logo readiness depende dele; Brapi e
email ficam fora. Usar verificação de conexão/consulta trivial, sem tabelas de
negócio ou migrations por requisição. Custo O(1), um round-trip/pool borrow por
sondagem, sem N+1; medir frequência e pool em homologação. Proposta inicial:
timeout de aquisição3s/validação1s, sujeito a teste de saturação e DB inacessível,
sem alterar tamanho do pool por inferência. Se esse limite afetar tráfego normal,
adotar indicador com cache curto/single flight validado, em vez de aumentar pool.

Railway: path readiness e porta efetiva8080; alinhar PORT com o servidor/target
port. Manter orçamento inicial de startup300s e medir cold start em clone; job
de migração tem janela separada. Falha/timeout não promove. Não aumentar timeout
para esconder migração acidental ou conexão inválida. O healthcheck Railway é
gate de implantação, **não monitoramento contínuo**. Após DB cair, readiness503
e livenessUP não fazem Railway retirar tráfego automaticamente: monitor externo
e mecanismo de manutenção/tratamento de indisponibilidade precisam de teste.

## Previews: decisão recomendada

| Opção | Benefício | Custo/manutenção/risco |
|---|---|---|
| API+PG descartáveis por PR | Melhor isolamento e schema do candidato | Provisionamento, custos por PR, TTL/cleanup e sincronização de versões; não justificado ainda para uso individual |
| Staging isolado e sintético | Um ambiente estável para CF035, sem dados reais | Custo fixo e deriva; exclusividade para migrations/testes concorrentes |
| Preview sem operações financeiras | Permite avaliar UI | Exige bloqueio real de backend/ingress ou backend de demonstração isolado; esconder botões/CORS não basta |
| Previews desativados até isolamento | Menor custo e risco imediato | Sem revisão hospedada por PR; usar harness descartável/local enquanto isso |

Recomendação atual: **desativar criação de novos previews financeiros por
decisão explícita até existir staging isolado**, depois considerar um staging
sintético único se CF035 exigir. Não criar infraestrutura duplicada sem alterar
explicitamente o fora-de-escopo da CF035. Existing previews também precisam de
tratamento: mudar só o escopo atual da variável ou main=false não revoga seus
destinos já implantados. Inventariar deployments, manter proteção, avaliar
restrição/desativação dos previews antigos antes de reativar a API; não apagá-los
ou redeployá-los nesta revisão.

Na semântica documentada de git.deploymentEnabled, branches não mencionadas
ficam true. main=false bloqueia criação por Git naquela branch, preserva a
publicação existente e não impede deploy manual/API. Não é barreira global.
Esta nova branch de revisão também ficaria habilitada se fosse publicada agora.
Proposta de configuração futura: `git.deploymentEnabled=false` global durante
o período sem isolamento; depois allowlist revisada. Nenhuma aplicação dessa
mudança ou push foi feita aqui.

Fontes oficiais consultadas em26/10/2026:

- [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration): regras de branch e default true.
- [Railway autodeploy](https://docs.railway.com/deployments/github-autodeploys): gatilho Git separado do deploy manual.
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks): gate, porta, orçamento300s e ausência de monitoramento contínuo.
- [Spring configuração externa, linha4.0](https://docs.spring.io/spring-boot/4.0/reference/features/external-config.html): precedência de fontes; página atualmente4.0.9, projeto4.0.2.
- [FlywayAutoConfiguration4.0.2](https://raw.githubusercontent.com/spring-projects/spring-boot/v4.0.2/module/spring-boot-flyway/src/main/java/org/springframework/boot/flyway/autoconfigure/FlywayAutoConfiguration.java) e [initializer4.0.2](https://raw.githubusercontent.com/spring-projects/spring-boot/v4.0.2/module/spring-boot-flyway/src/main/java/org/springframework/boot/flyway/autoconfigure/FlywayMigrationInitializer.java): habilitação/default e migrate no bootstrap.
- [Spring Actuator linha4.0](https://docs.spring.io/spring-boot/4.0/reference/actuator/endpoints.html): grupos/probes, exposição e dependências; proposta precisa validação na4.0.2.

Essas fontes explicam comportamento documentado. A existência de uma opção na
documentação não prova que ela esteja aplicada ao projeto observado.

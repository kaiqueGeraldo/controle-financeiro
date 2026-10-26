# Riscos, categorias e decisões pendentes

Não foi confirmado novo defeito de regra financeira no recorte desta revisão.
Não houve execução de produto/consulta de dados reais. Os riscos abaixo são
calibrados pelo fato de API/PG estarem offline; não se declara dano já ocorrido.

| Categoria | Item verificável / limite | Impacto | Dono | Próxima ação e autorização |
|---|---|---|---|---|
| 1. Defeito documental confirmado | Tasks/README e CF034 ainda descreviam PR aberta e main272001f como situação vigente, contrariando API/merge/run | Leitor poderia usar base/proveniência erradas | Revisão atual | Corrigido por nota vigente e histórico preservado; commits locais autorizados |
| 1. Defeito de produto | Nenhum novo demonstrado | Ausência de achado não certifica ausência de bugs | Tarefas já aceitas | Não reabrir sem regressão concreta |
| 2. Configuração incompatível | Hibernate externo update vence validate do YAML | Próxima inicialização pode evoluir schema fora da cadeia aprovada | CF017/CF035 | Changeset validate + Flyway separado; autorização remota posterior |
| 2. Configuração incompatível | Flyway habilitado no bootstrap; jobs habilitados na aplicação | Pode migrar antes de backup/preflight e escrever/chamar externos antes do GO | CF017/CF035, escopo de preparação a aprovar | Guard local de writers/jobs e API sem migration; não iniciar para investigar |
| 2. Ferramenta/alvo incompatíveis | PgSchemaInventory.beginReadOnly recusa major diferente16; imagem real configurada17 | CLI preflight/snapshot atual vai parar em17; não serve ao plano remoto atual | CF017 | Adaptar e revisar em17 descartável; não remover guard por conveniência |
| 2. Versões de ambiente distintas | Compose local usa15, CI usa16 e imagem Railway17 | Ensaio feito no compose atual não certifica major17 | CF017/CF035 | Fixar major17 nos recursos de ensaio futuros, sem alterar ou iniciar compose nesta revisão |
| 2. Publicação incompatível | Dockerfile recompila com skipTests/Maven3.9.6, CI usa3.9.12 | Imagem futura não herda automaticamente o aceite do JAR | CF034/CF035/036 | Embutir JAR testado com hash/digest ou testar imagem exata; implementação/CI futuras |
| 2. Preview sem isolamento | Um BACKEND_API_URL em3 ambientes; branches não listadas habilitadas; previews antigos preservados | Ao reativar API, previews podem executar operações no destino de produção | CF035, operador | Decidir desativação/isolamento e tratamento de deployments antigos antes de ligar API |
| 2. Gate operacional ausente | Sem healthcheck e main sem proteção; Deployment Checks ausentes | Deploy manual ou novo gatilho pode publicar sem readiness/revisão | CF035/036 | Preparar saúde e gate explícito; não religar autodeploy como consequência do verde |
| 3. Verificação faltante | Expanded skipped: sete CF032 e15 harnesses diferidos | Não certificar integralidade da CF034 | CF034 | Preparar seleção/fixtures/outputs e autorizar dispatch futuro |
| 3. Verificação faltante | Ctrl+C nativo; aborto de suíte real; recursos alheios Linux; pós-descarte não observados | Prova de cleanup tem alcance delimitado | CF034 | Verificação dirigida somente se requerida, sem estender aceite Windows |
| 3. Verificação faltante | Zoom200% nativo, com onboarding e telas novas | CF010/015 e dependência integral permanecem | CF010/015 | Operador fornece capacidade nativa; não repetir tentativas bloqueadas |
| 3. Verificação faltante | Alvo/geração/schema/history/dados/backup/restore/writers e desempenho reais | CF017/P01/P02 não encerram; CF035/036 sem prontidão integral | CF017/CF035 | Autorizações graduais do PLANO-ADOCAO; nenhum dado acessado agora |
| 3. Durabilidade remota | Artifacts expiram02/11; pacote/brutos ficam privados no runtime | Após expiração, dependerá da preservação privada verificada | Operador | Preservar ZIPs/relatório com hashes em armazenamento privado aprovado; não subir pacotes/brutos ao Git |
| 4. Limitação aceita | Aceite local DEC-CI-04/Windows/processos e histórico de sanitização encerrados | Não certificar Ctrl+C/Linux por associação | CF034 | Preservado; sem reabertura retroativa |
| 4. Limitação aceita | 57 representações brutas históricas não reconstruídas, JAR a5ad7a6 distinto | Não prova JAR main nem indica adulteração nova | Histórico CF034 | Preservado; pacote novo tem cadeia independente |
| 4. Limitação fora do recorte | HA, capacidade/latência e reprodutibilidade binária não medidas | Sem promessa de produção/SLO | CF035/036 | Medir por risco/carga; não criar gate arbitrário de escala |
| 5. Hipótese não comprovada | Banco real seria legadoV1/vazio/jáV16; update já teria alterado schema | Essas alternativas mudam o procedimento, não são fatos | CF017 | Classificar A–D em leitura futura; sem baseline por suposição |
| 5. Informação atual desconhecida | Versão efetivaPG, perfil do processo ausente, staged/pending e PRenv atuais | Pré-condições de mutação precisam nova leitura | Operador | Conector/UI/consulta autorizada futura; histórico não vale como observação atual |

## Decisões de produto/operação ainda necessárias

1. **Previews:** escolher entre desativar novos e tratar antigos (recomendado
   agora), staging isolado (recomendado quando homologação hospedada for
   necessária), recursos por PR ou demonstração sem operações financeiras.
   Custo, manutenção e limites estão em CONFIGURACAO; não aplicar silêncio como
   consentimento. Criar staging duplicado exige ajustar o escopo da CF035.
2. **Release:** preferir imagem que embarca o JAR testado e é homologada pelo
   digest; alternativa recompilar e executar gates na imagem exata. Mais
   rastreabilidade exige pipeline de artifact/storage, não apenas Dockerfile
   com skipTests removido. Não há imagem pronta nesta revisão.
3. **Migração:** recomendar job separado e único, API com Flywayfalse e
   Hibernatevalidate, runtime semDDL e writers/jobs sob manutenção. Migrate no
   startup só seria aceitável com janela/backup/preflight e exclusividade
   demonstrados antes de cada start; acopla restart aDDL e não atende bem ao
   primeiro alvo ainda desconhecido. Nenhuma escolha foi aplicada.
4. **Janela e recuperação:** nomear operador/responsável, RPO/RTO e retenção,
   autorizar acesso aoPG e orçamento/destino do restore. Não inventar a tolerância
   a perda de operações. Aprovação de backup não é aprovação de baseline/migrate.
5. **Integralidade CF034:** cumprir matriz/zoom e revisar as limitações de
   cancelamento. Reclassificação de um harness histórico incompatível exige
   decisão explícita; não obter verde omitindo testes. Nenhuma dispensa criada.

## Prontidão das próximas tarefas

CF035 tem plano e metadados de alvo, mas não tem dependências integrais aceitas
nem backup/restore/compatibilidade reais. Permanece proposta; esta revisão não a
inicia. CF036 depende também da homologação CF035 e release testada pelo digest;
permanece proposta e sem autorização de publicação. CF017/P01/P02 permanecem
em_revisao pelos critérios reais. DEC-ONB-03 não foi ampliada.

Próxima autorização recomendada e delimitada: **um lote exclusivamente local e
descartável para preparar suportePG17 da ferramenta/restore, guard de jobs e
writers, health/readiness e estratégia do pacote**, com revisão independente.
Separadamente, autorizar nova CI expanded do candidato revisto. Somente após
esses preparos propor ativação apenasPG + inventário somente leitura do alvo
identificado; API permanece offline e baseline/migrate/deploy exigem decisões
posteriores próprias. Este pedido atual não autoriza nenhuma dessas execuções.

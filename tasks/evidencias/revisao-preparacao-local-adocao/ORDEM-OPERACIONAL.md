# Ordem operacional futura — não executada

Alvos são os IDs de production de [CONFIGURACAO-PROPOSTA](CONFIGURACAO-PROPOSTA.md).
Nenhuma etapa abaixo foi autorizada por efeito desta documentação. O plano
[A–D original](../revisao-prontidao-CF034-CF017/PLANO-ADOCAO.md) continua vigente;
database/schema/geração e cenário do banco real não foram escolhidos.

| Ordem | Ação concreta futura | Evidência e pré-condição | Condição de parada | Recuperação / autorização |
|---|---|---|---|---|
| 1 | Sanear RVPLA-01 e investigar startup em descartável; alteração mínima somente se causalidade provar necessidade | Caso pré-efeito de resume, JFR/ordem real de queries, controle40s original preservado, novas contraprovas | Falha de ambiente confundida com detecção, timeout aumentado para verde, query alterada sem regra/oracle | Restaurar cópia por hash; autorização exclusiva de saneamento local |
| 2 | Revisar delta e candidato final, separar pacote antigo/novo | Diff exato, inputs, testes pertinentes e parecer independente; nenhum P2 de evidência pendente no caminho usado | Fonte/lock/migration/critério mudou sem prova | Manter candidato local; sem push implícito |
| 3 | Antes de publicar branch, resolver gatilhos de novos previews (C10; C11 em lote separado ou conjunto delimitado) | Readback Vercel, produção/aliases preservados; Railway autodeploy/PR env continuam off | A interface propõe deploy/promover/apagar ou alvo diverge | Não confirmar; restauração de configuração só autorizada. Autorização específica de configuração de gatilhos/escopos |
| 4 | Publicar somente delta aprovado e validar candidato em CI remota | Autorização de push/PR/CI; head_sha exato, required e expanded conforme gate, artifacts/cleanup; sem gatilho de deploy | Checkout divergente, falha/skips/retries/falta de relatório | Preservar primeira falha; saneamento novo, não retry para apagar evidência |
| 5 | Publicar pacote/imagem aprovados para consumo posterior, sem iniciar serviço | SHA/JAR/manifesto do run aprovado; imagem por digest e hash embarcado; acesso ao registry definido | Rebuild remoto gera artefato diferente ou fonte sem vínculo | Manter imagem anterior; autorização de publicação do artefato, distinta de Deploy |
| 6 | Preparar changeset C01–C09; resolver C12 dos deployments antigos | Snapshot atual sem pending/staged alheios; fonte imutável + flags/DDL/Flyway/PORT/health juntos; lista nominal de URLs antigas e mecanismo aprovado | Apply/Deploy inicia API antes dos gates; pacote antigo ignora flags; exclusão não autorizada | Deixar changeset preparado, API offline; não agrupar Apply com aceite de variáveis |
| 7 | Autorizar somente banco existente para classificação, se necessário | Todos consumidores identificados/congelados; volume/geração e canal de leitura aprovados; preferir snapshot representativo disponível | Writer desconhecido, rede/privilégio insuficiente, alvo errado | Encerrar leitura e manter API offline; parar PG só conforme consumidores. Ativação PG/leitura não autorizam DDL |
| 8 | Inventariar e classificar A–D; estabelecer janela e backup/restore | Major efetiva, DB/schema, objetos/history/ACL/RLS/extensões/origem temporal; backup privado sob freeze de DDL/DML/nextval; restore em destino novo equivalente | Leitura parcial, warning, diferença de dados/sequences/catalog, mudança de geração/janela | Preservar origem/backup/clone/falha; repetir sob nova janela, sem apagar anterior. Autorizações backup/clone/custo próprias |
| 9 | Preflight/validação e decisão de migration pelo cenário | B: V1 sem history e preflight exit0 ainda vinculado à janela. A: vazio comprovado. C: history/validate/drift íntegros | Exit2/3, checksum/future/failed/drift/objeto adicional; perda de exclusividade | Parar, reidentificar e repetir gate; sem repair/baseline para destravar |
| 10 | Baseline somente B e migrations por job separado | Autorizações distintas de baseline1 e migrate até16; job único, schemas/locations/target explícitos; ensaio em clone aprovado | Lock/erro/versão inesperada/efeito divergente | Preservar history/estado. Cadeia pode ter versões anteriores já commitadas; correção progressiva revisada, sem reset |
| 11 | Inicialização controlada do candidato com writers/jobs false e validate; observar sem promoção | C01–C05/C09, schema final, imagem/hash/config; mecanismo de observação pendente/isolado aprovado | DDL/migrate/job/SQL indevido, falha ou orçamento excedido | Parar candidato, preservar logs/banco. Readiness503 esperada; não mudar health para liveness para aprovar |
| 12 | Smoke funcional em homologação ou abertura sintética restrita ao operador | CF035 autorizada; ingresso geral efetivamente restrito, writers autorizados para o smoke, jobs false, email/mercado no escopo aprovado; HTTPS/login/ownership/onboarding/operação/reload/export e SQL | Inconsistência financeira, auth/ownership, replay duplicado, efeito externo indevido | Fechar ingresso, parar processo/writers, preservar prova; binário anterior só se compatível com schema |
| 13 | GO de uso, promoção e liberação de jobs, em decisões distintas | CF017 real, CF033/034/035 e zoom/dependências aceitos; smoke e recuperação aprovados; imagem/frontend exatos. Parada/drenagem e reinício para flags | Saúde/funcionalidade divergente, primeira execução de job indevida, outra instância antiga | Congelar e preservar metadados; rollback de aplicação compatível. Restore de banco exige nova decisão sobre perda/reconciliação |
| 14 | Observação após liberação | Dono, métricas/alertas e janela definidos; readiness externo, pool/locks/jobs e reconciliação | Quebra financeira/auth: parar imediatamente; indisponibilidade conforme limites aprovados | Manutenção e investigação; não ligar restart de DB via liveness da API |

## Cenários preservados

| Cenário | Caminho permitido somente após prova/autorização | Não fazer |
|---|---|---|
| A — vazio | Inventário integral incluindo outros schemas/privilégios; backup/restore; migrate V1–V16 sem baseline | Inferir vazio por serviço offline ou falta de visibilidade |
| B — legado sem history compatível com V1 | Backup/restore; preflight read-only completo sob mesma janela; baseline1 explícita; V2–V16 | Baseline automática, adaptar verificador para aceitar drift ou inventar proveniência |
| C — já versionado | Inventário/history/info/validate e drift; restore/upgrade do clone da versão efetiva; somente versões pendentes | Nova baseline, repair, reescrever checksum/migration aplicada |
| D — incompatível/desconhecido | Preservar evidência, diagnosticar/ensaiar clone; propor ajuste aditivo próprio | Migrar/resetar origem para forçar A/B/C |

Ensaios PG16/17 desta revisão ocorreram dentro de cada major, não constituem
upgrade in-place16→17. A tag remota17 não revela versão/generation física. Escolher
clientes/procedimento somente depois da classificação. Dados UNKNOWN/null/brutos
permanecem preservados; prova sintética não fabrica recordedAt/origem real.

## Ações que podem publicar ou reiniciar

Push pode disparar Vercel se o gatilho/arquivo da branch permitir; C10 precede o
push do próximo lote. CI verde não é trava de promoção, pois não há Deployment
Checks configurados. Git deploymentEnabled=false só atua no gatilho Git do
conteúdo correspondente; manual/API e deployments antigos precisam tratamento próprio.

No Railway, staged config não altera processo até aplicação, mas confirmar Deploy
pode aplicar várias mudanças e iniciar serviço offline. Autodeploy off controla
Git e não proíbe Deploy manual. Trocar imagem, variáveis, porta/health ou escala
precisa ser tratado como ação potencial de deployment. Não publicar source antiga
contando com flags novas ignoradas por ela. Ativação do banco altera seu ciclo de
vida e pode recuperar WAL; isso não é uma leitura puramente sem efeito físico.

Writers=false fecha também login/leitura, portanto o smoke funcional do passo12
nunca pode ser chamado de aprovado enquanto só503 foi observado. Restrição de
ingresso para a abertura sintética precisa existir de fato; sem ela, usar ambiente
isolado autorizado. A abertura geral e os jobs ficam depois do smoke e do GO.
Se observar schema exigir uma tentativa que o provider encerrará por readiness503,
registrar esse resultado previsto sem promover/relaxar o gate. Uma ferramenta
dedicada de validate sem HTTP é alternativa a preparar/revisar em lote próprio.

Antes de conceder a janela real, decidir responsáveis, RPO/RTO, retenção privada,
orçamento de startup/migration e duração de drenagem.30s de graceful shutdown não
provam que toda transação/job/fila externa concluiu. Não há autorização implícita
de exclusão de deployment, reset/restore da origem, rede/grants, ativação ou uso.

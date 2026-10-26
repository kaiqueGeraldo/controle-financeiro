# Preparação local de adoção — matriz anterior à implementação

26/10/2026. Entrada `46b85ee0428abb55c22d27d26284d054410ec128`, branch
`codex/preparacao-local-adocao`. Lote autorizado pelo pedido anexado; sem adoção,
configuração remota, publicação, CI remota ou autoaceite. Estado na elaboração:
em execução. Fechamento do executor registrado abaixo, sem reescrever os critérios.

| Impedimento confirmado | Contrato esperado | Responsável / mudança mínima | Prova necessária | Tarefa | Limite após entrega |
|---|---|---|---|---|---|
| PgSchemaInventory.beginReadOnly aceita somente 16 | Inventário rigoroso e restore em 16/17; demais majors recusadas | Ferramentas CF017 / suporte explícito e seleção restrita da major no harness | Catálogo e clientes reais, vazio V1–16, legado/baseline explícita, upgrade, checksum, rollback, restore e divergências nas duas majors | CF017 | Banco/roles/extensões/volume reais desconhecidos |
| Flyway habilitado no bootstrap; override remoto update documentado pela revisão | API de adoção nunca migra nem gera DDL; schema incompatível impede startup | Perfil adoption e validação da configuração efetiva antes do refresh | Processos recusam overrides inseguros antes de DDL/history; JAR sobe apenas após migration separada | CF017/034 | Alterar configuração remota ainda exige autorização própria |
| EnableScheduling na aplicação e SchedulerConfig; cinco métodos agendados | Jobs só registrados quando writers e jobs explicitamente permitidos; defaults normais preservados | Uma configuração de scheduling condicional; retirada da habilitação duplicada | Nenhuma tarefa registrada/execução SQL/externa com jobs desabilitados; controles normais | CF034/035 | Não interrompe execução já iniciada nem coordena outras instâncias |
| Sem fronteira de manutenção; GET pode produzir escrita indireta | Fechar todo ingresso funcional antes de autenticação/serviços, mantendo só probes GET exatos | Filtro HTTP; configuração imutável por processo; proteção adicional no envio assíncrono de email | HTTP 503 + snapshots SQL iguais + zero efeitos externos; abertura mantém autenticação, ownership e replay | CF034/035 | Indisponibilidade das leituras durante freeze; scripts externos fora da barreira |
| Sem saúde nem healthcheck Railway | Processo vivo distinto de prontidão financeira; DB obrigatório e writers abertos | Probes mínimos na mesma porta, sem Actuator/admin; conexão validada com timeout | Inicialização, manutenção, DB cai/retorna, schema inválido, respostas sem detalhes | CF034/035 | Probes não validam catálogo inteiro por chamada nem monitoram produção |
| Vercel bloqueia somente duas branches; destino BFF compartilhado | Proposta concreta de previews desativados e BFF preview sem upstream | Configuração local de desativação global e recusa do proxy em VERCEL_ENV=preview | Teste garante zero fetch, inclusive URL distinta; diff de configuração revisável | CF035/036 | Deploys existentes exigem inventário e tratamento remoto próprio |
| Pacotes históricos pertencem a outras revisões | Novo pacote ligado ao commit e bytes testados | Exportação nova, manifesto, verify, execução do JAR e SHA256 | Inputs/dependências/ferramentas/comandos/relatórios e contraprova de adulteração | CF034/036 | Sem afirmação de reprodução binária ou publicação |

## Decisão operacional e trade-offs

Flags locais, sem transição em runtime: `app.operations.writers-enabled` e
`app.operations.jobs-enabled`, ambas true no modo normal; adoption usa false.
Jobs exigem ambas. Filtro fechado recusa todas as rotas funcionais, inclusive
login/GET/HEAD, com 503 e Retry-After, exceto os dois probes GET exatos. É mais
restritivo que uma allowlist de leituras, mas elimina efeitos ocultos e mantém
custo O(1), sem consulta adicional por requisição bloqueada. Acesso funcional só
depois de validação e reinício autorizado. Sem endpoint administrativo para abrir.

Scheduling condicional evita até aquisição de ShedLock. Eventos de domínio são
síncronos dentro dos fluxos bloqueados; não existem consumidores Kafka/Rabbit no
código. PostConstruct somente ajusta timezone. Email é o único @Async de negócio;
deve recusar envio com writers fechados antes de construir cliente externo.
Parada/drenagem de TODAS as instâncias precede o freeze: não há cancelamento
retroativo, exclusividade distribuída ou reconciliação automática de emails.

Probes próprios evitam adicionar dependências e abrir administração inteira;
manutenção de dois contratos HTTP simples passa a ser responsabilidade local.
Readiness depende de ApplicationAvailability, validação JPA no boot, writers e
conexão válida. Catálogo/checksum completos continuam gates operacionais separados.
Timeouts de conexão/validação são explícitos no perfil adoption. Sem consulta a
dados financeiros por probe; custo O(1). Backup/snapshot lê e ordena conteúdo:
I/O proporcional aos bytes, sort O(N log N), sem extrapolação para produção.

## Preservação e gates mantidos

README inicial: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservar 16 migrations, provas/manifests históricos, runtimes e os 29 arquivos
inventariados. Nenhum clean/reset/repair. Resultados finais complementarão esta
matriz sem converter critérios integrais em aprovados. CF017/P01/P02 e CF034
continuam em_revisao; CF035/036 propostas; zoom 200%, expanded e limites de
cancelamento permanecem pendentes.

## Fechamento do executor — 26/10/2026

Implementação e evidências **em_revisao**, sem autoaceite. [Resultados finais](README.md),
[contrato operacional](OPERACAO-LOCAL.md) e [encaminhamento independente](ENCAMINHAMENTO.md).
PG17.11 e clientes reais exercitados; PG16.15 como controle. A imagem Linux passou
os17 contratos; seis jornadas E2E e626 componentes passaram. A regressão PG16
original teve58 erros de fixture, revalidados em rodada dirigida após correção.
Não houve nova rodada integral verde das894 execuções.

O gate de startup continua aberto: uma falha em classes, três no JAR Windows e
duas no controle restaurado Linux excederam40s. Causa inconclusiva, sem aumentar
timeout/retry ou apagar falhas. Aplicação remota, isolamento de previews existentes,
freeze/backup/restore reais e revisão independente continuam necessários.

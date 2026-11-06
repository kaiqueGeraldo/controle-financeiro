# CF-035 — Preparar homologação, backup e reversão

A revisão independente de 06/11/2026 aceitou o restore V16 e o startup no
ensaio isolado. A janela Railway segue bloqueada por achados nos clientes,
pela identidade do próximo pacote e pela decisão vigente sobre Onboarding.
[Parecer e condições de retomada](../evidencias/revisao-a3-complementar/PARECER.md)

- Estado: em_execucao
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-017](../03-integridade/CF-017-migracoes.md), [CF-034](../05-release/CF-034-gates-ci.md)
- Origem: T-012; prontidão Railway/Vercel

## Recuperação V16 no A3 complementar — 06/11/2026

Comprovado o restore completo de V16 para o banco novo, com history,
checksum, catálogo e grants conferidos. As 36 tabelas de aplicação
estavam vazias. O JAR corrigido iniciou em manutenção na cópia restaurada.
O smoke HTTPS funcional, a prova da primeira réplica no Railway e a
revisão independente permanecem pendentes. O estado segue em execução.
[Runbook](../../docs/sdd/validacao-deploy.md)

## Provas de recuperação no A3 — 06/11/2026

Restaurados em PostgreSQL 17.11 isolado o checkpoint inicial do A2 e a
estrutura V16 capturada no A3. A segunda prova cobre schema e objetos.
O backup completo de V16 com history, o startup real da API, o smoke
HTTPS/autenticação/onboarding e a revisão independente seguem pendentes.
[Runbook](../../docs/sdd/validacao-deploy.md)

## Consolidação pós-PR #3 — 05/11/2026

A preparação de homologação está em_execucao. Inventário em leitura e
[runbook atualizado](../../docs/sdd/validacao-deploy.md) entregues. O critério
de registrar o bloqueio de promoção está atendido. Banco desconhecido,
API/PG offline e nenhum backup listado. Backup/restore real, compatibilidade,
smoke HTTPS e revisão da evidência de homologação ficam pendentes. Ensaio
sintético em alvo isolado pode avançar com escopo autorizado e sem aguardar
classificação do banco real. [Matriz](../../docs/sdd/prontidao-adocao-2026-11-05.md)

## Problema e resultado esperado

Atualização de28/10/2026: CPA-01/R1 encerrado localmente em81b20bca (registro de execução privado).
Parecer A da consolidação para publicação controlada/CI remota, sem aprovação de
homologação, hospedagem, adoção ou produção. CF035 permanece proposta e seus gates
de preservação/backup/restore/autorização mantêm alcance. Notas CPA anteriores
são históricas; nenhuma execução remota realizada nesta revisão.

Backend Railway está desligado e o estado do banco não foi confirmado. Preparar ambiente e ensaio de publicação preservando dados existentes.

## Escopo e referências

- `docs/sdd/validacao-deploy.md`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/Dockerfile`
- `controle-financeiro-frontend/next.config.ts`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Identificar projetos/serviços/ambiente em leitura e verificar destino, versões, variáveis por nome, health/readiness e fuso.
2. Confirmar existência de dados e realizar backup/restauração autorizados em destino isolado; ensaiar migrações sem usar produção nos testes.
3. Homologar frontend/backend, validar logs sem segredos e escrever runbook de promoção/rollback compatível com schema.

## Aceite e testes adversariais

- [x] Restauração comprovada para o banco novo V16, com checksum, catálogo e histórico registrados sem dados pessoais.
- [ ] Smoke HTTPS/autenticação/entrevista/operação/reload/exportação passa na homologação.
- [x] Sem informação/acesso ao banco, registrar bloqueio da promoção e manter produção intacta; não inventar sucesso de backup.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Criar infraestrutura duplicada, apagar volume ou resetar banco existente; publicar produção nesta tarefa.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Revalidação CPA-01 de28/10: seleção aceita, R1 de agregação required aberto (registro de execução privado).
Parecer C mantido por esse resíduo; nenhum bloqueio de startup/TCP reaberto.
CF035 permanece proposta, sem homologação/backup/restore reais autorizados.

Consolidação de28/10/2026: parecer C e plano separado (registro de execução privado).
Aceites locais startup/TCP/RVPLA/audit preservados; CPA-01/P2 exige saneamento da
seleção de teste Windows no job Linux antes de publicação/CI. Não é bloqueio geral
de startup nem início de homologação. CF035 permanece proposta, sem critérios
reais/backup/restore/configuração satisfeitos ou acesso a banco/serviço remoto.

Revisão independente de28/10/2026:
startup local aceito e histórico inconclusivo não bloqueante para preparação (registro de execução privado).
Aceites RVPLA/resume, TCP e EPERM posteriores preservados. Os impedimentos de
startup/observador citados nas notas antigas abaixo são históricos nesse alcance.
CF035 permanece proposta: banco/configuração/backup/restore/homologação reais e
dependências integrais continuam pendentes; nenhuma execução remota autorizada.

Revisão independente de26/10/2026:
parecer/configuração/ordem operacional (registro de execução privado).
Recortes locais aprovados não iniciam homologação real. Startup e observador
resume exigem saneamento; volume Railway sem backups listados, sem restore real
demonstrado. Estado proposta e checkboxes mantidos; nenhum banco real acessado.

Preparação correlata de26/10/2026: lote exclusivamente local/descartável (registro de execução privado),
em_revisao e com startup estável ainda não certificado.
Não inicia a CF035 integralmente, não certifica backup real ou homologação HTTPS
remota e não altera o estado proposta nem os checkboxes desta tarefa.

Ainda não executada. Usar `tasks/evidencias/CF-035/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


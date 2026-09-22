# Revisão independente dirigida da CF-017

Data: 22/09/2026. Intervalo examinado: `2269b2243c920f2302173fbd2959497430ef4140..d3fcb35b99780d4efbe7c0bcff023a3eb971b16c`.

## Parecer

1. **Base local de migrações apta para iniciar a CF-018.** V1 e V2 foram
   reaplicadas nesta revisão com o migrador real em PostgreSQL 16 descartável;
   banco vazio e fixture legada iniciaram com `ddl-auto=validate`. Reaplicação,
   checksum, rollback transacional, recuperação e caminhos temporais dirigidos
   passaram. A CF-018 pode criar sua próxima migração versionada sobre V1/V2 e
   executar seus testes locais; isso não altera seu estado `proposta` nem afirma
   que suas regras financeiras já estejam implementadas.
2. **Adoção no banco real continua bloqueada.** Não há schema, volumes, versão,
   locks, trilhas de proveniência, backup restaurável nem ensaio de restore do
   ambiente alvo. Além disso, [RV17-01](ACHADOS.md) demonstra que o preflight
   sintético atual aceita uma V1 sem FK obrigatória. Ele não pode ser usado como
   verificador de equivalência para autorizar uma baseline real.

O parecer aprova somente a cadeia local V1/V2 como fundação da CF-018. Não
certifica Railway, desempenho, deploy, coexistência de versões nem ausência de
outros defeitos.

## Estado inicial e preservação

- Branch `main`, `HEAD=d3fcb35b99780d4efbe7c0bcff023a3eb971b16c`,
  33 commits à frente de `origin/main`.
- Staging inicialmente vazio; única alteração preexistente: `README.md`.
- SHA-256 do README preexistente:
  `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
- O README não foi editado nem incluído no staging desta revisão.
- Nenhum banco real, push, deploy, reset, clean ou alteração de código de produto
  e migrações foi realizado. O probe adversarial foi criado temporariamente,
  executado contra Testcontainers e removido; a árvore de produto voltou ao
  estado anterior antes desta documentação.

Foram lidos `tasks/README.md`, `EXECUCAO.md`, `POLITICA-DE-TESTES.md`, CF-017 e
sua derivada P01/P02, os três documentos de evidência CF-017, SPEC-002,
SPEC-004/CF-016, CF-004, CF-008, CF-018 e as revisões/saneamentos posteriores de
CF-008/CF-015. Relatórios anteriores foram pistas, não prova desta conclusão.

## Resultado técnico

| Tema | Verificação independente | Resultado e limite |
|---|---|---|
| Configuração | `spring-boot-starter-flyway` e driver PostgreSQL; `baseline-on-migrate=false`, `clean-disabled=true`, `out-of-order=false`, validação de nome/checksum; `ddl-auto=validate` nos perfis principal e local. | Aprovado. O perfil de teste geral mantém `create-drop`/Flyway desligado apenas para a suíte legada; os testes CF-017 sobrescrevem ambos explicitamente. |
| Banco vazio | Spring Boot executa V1+V2 automaticamente e só então Hibernate valida o modelo. | Aprovado: histórico contém exatamente V1/V2; segunda migração executa zero. Nenhuma criação ORM mascarou ausência de tabela/coluna nesse contexto. |
| V1 | 19 tabelas de aplicação/coordenação, relações, uniques, índices e ShedLock. | Compatível com as entidades atuais no `Hibernate validate`. A V1 é pré-FIN-01–08 e não antecipa ledger, abertura ou idempotência da CF-018–024. |
| V2 | DDL aditiva para transações, cartão e investimento; nenhum `UPDATE`, default ou backfill. | Aprovado. Bytes legados ficam nos aliases antigos; metadados históricos permanecem null/UNKNOWN e `recorded_at` não é inventado. |
| Fixture legada | SQL manuscrito/condensado, separado da V1 e do Hibernate, com UUIDs, relações e valores em 00:00 e 23:30:45.123456. | Independente e representativo para adoção temporal. Não representa dados em todas as 19 tabelas nem autoriza inferir compatibilidade remota. |
| Schema/JPA | Contextos de banco vazio e legado iniciam com Hibernate em `validate`; `recorded_at` é `timestamptz(6)` e os demais tipos temporais correspondem ao modelo. | Aprovado no recorte local. Hibernate não substitui comparação de PK/UK/FK/check/default/index em banco legado. |
| Reaplicação e falha | Checksum alterado é rejeitado; V2 mutante faz DDL e divide por zero; PostgreSQL reverte coluna/history; V2 real recupera sem `repair`. | Aprovado com Flyway real e DDL transacional. |
| Backup/restore sintético | `pg_dump`, drop do schema, `psql`, comparação do fingerprint, `validate` e migrate zero. | Execução aprovada, mas o oracle compara agregados e uma contagem de relações; [RV17-02](ACHADOS.md) limita a alegação de reconciliação integral. Não há prova de backup real. |
| Writers e recuperação | Runbook congela writers antigos, publica a aplicação nova antes de liberar escrita e proíbe drop/restore por cima após novas gravações; orienta correção progressiva V3. | Plano coerente. Execução real e replay completo continuam não comprovados; sem recibo CF-024, operações posteriores ao backup exigem reconciliação individual. |
| D16-T01 / `Transaction.time` | Verificador temporal executado em São Paulo, UTC e Kiritimati. | Aprovado: 43 campos Java, 16 TypeScript, 22 grupos e 21 exemplos. A mudança é documental e não altera regra financeira. |

## Dependência efetiva da CF-008 para a CF-018

O arquivo original da CF-008 permanece `em_revisao`, mas isso não torna toda a
tarefa um bloqueio indivisível. As evidências posteriores foram separadas por
domínio:

- os contratos HTTP necessários à CF-018 — validação 400, conflito 409,
  indisponibilidade/reconciliação e DTO/paginação — têm implementação e revisão
  dirigida na base;
- P01/P02 eram a dependência temporal concreta de contas/transações. Writers e
  DTOs foram revalidados na revisão CF-015, e esta revisão agora comprova V1/V2
  localmente com Flyway/Hibernate;
- P03 é planejamento, P04 é relógio do harness e P05 é hábito; R06 também era
  propriedade de categoria em planejamento. Seus estados não definem o schema
  local de contas/transações;
- corridas de UI de resumo/cartão e zoom do marco CF-015 não são pré-condições
  técnicas para implementar o backend da CF-018;
- a política uniforme 403/404 para IDs alheios e o recibo idempotente continuam
  em CF-023/024. A CF-018 deve testar propriedade, rollback e ausência de escrita
  parcial no próprio domínio, sem declarar encerrada a política global.

Logo, não foi encontrado contrato indefinido da CF-008 que impeça **iniciar** a
CF-018. Defeitos existentes de conta/transação e as novas regras de abertura,
realizado, transferência e estorno são trabalho da própria CF-018, definidos por
CF-016; não são motivo para “encerrar toda a CF-008” antes de começar.

## Gates que continuam obrigatórios para adoção real

Antes de qualquer baseline/migração do ambiente alvo:

1. obter inventário completo e comparável de tabelas, colunas, tipos/precisão,
   nulabilidade, defaults, PK/UK/FK/checks, índices, extensões, versão e history;
2. substituir/complementar o helper sintético por preflight reproduzível que
   rejeite mutações de coluna, constraint e índice e seja o mesmo artefato usado
   no clone e na janela real;
3. produzir backup real em formato restaurável, com checksum e revisão, restaurar
   em alvo isolado e reconciliar linhas/valores brutos, nulls, relações, saldos,
   metadados e schema — não só agregados;
4. medir volume, bloat, transações longas, locks e planos no clone representativo;
   os 20 mil registros sintéticos não certificam latência nem índice de produção;
5. inventariar e congelar todos os writers, executar baseline V1 explícita somente
   após equivalência, migrar V2, iniciar o binário candidato com Hibernate validate,
   fazer smoke/reconciliação e só então liberar escrita;
6. ensaiar falha antes/depois do commit e recuperação após novas escritas. Depois
   de escrita nova, manter colunas, congelar writers e corrigir para frente; sem
   CF-024, reconciliar cada operação posterior ao backup.

## Limites

Não foi repetida auditoria frontend, suíte completa, benchmark, carga, banco real
ou revisão integrada das regras FIN-01–08. Essa revisão permanece prevista após
CF-021. Os tempos/planos sintéticos observados nesta execução são apenas sinais de
funcionalidade do índice no dataset de teste.

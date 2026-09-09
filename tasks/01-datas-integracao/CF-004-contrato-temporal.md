# CF-004 — Definir contrato de datas civis, instantes e competências

- Estado: concluida
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: xhigh
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-001](../00-fundacao/CF-001-criterios-e-oracles.md)
- Origem: T-002, T-010; F-001–004

## Problema e resultado esperado

Há LocalDate, LocalDateTime, Date e horários de usuário misturados. A correção precisa preservar semântica entre formulário, API e banco, inclusive quando browser e servidor discordam de fuso.

## Escopo e referências

- `controle-financeiro-frontend/src/types/`
- `controle-financeiro-frontend/src/services/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `docs/sdd/specs/002-datas.md`

Complemento documental autorizado nesta execução: atualizar somente as referências de decisão DEC-01/02/05 na `docs/sdd/specs/003-criterios-oracles.md`, para evitar que a matriz compartilhada continue apontando essas definições como ausentes. Critérios e fixtures da CF-001 permanecem intactos; revalidar seu verificador. Inventário/vetores/verificador novos ficam em `src/types/temporal-contract/`, dentro do escopo, sem importação por runtime.

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Inventariar campo temporal de cada DTO: significado, origem, formato, fuso, nulabilidade, persistência e consumo visual.
2. Definir 'hoje' do produto, horário informado versus createdAt de auditoria e comportamento se a página atravessar meia-noite.
3. Especificar migração de valores legados só com origem conhecida; manter incógnitas explícitas.

## Aceite e testes adversariais

- [x] Cada data das telas financeiras, metas e hábitos tem contrato com request/response de exemplo.
- [x] Mesma data civil mantém dia em qualquer fuso; instante com offset representa o mesmo instante; competência não depende do dia 31.
- [x] Ambiguidade de timestamps legados não é resolvida adicionando Z ou supondo que todos eram UTC.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Migração de dados reais ou refatoração ampla de DTOs antes do contrato.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Iniciada em 08/09/2026 sobre `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com CF-001 concluída e integrada nesta base local. O [snapshot inicial](../evidencias/CF-004/base-inicial.json) registra os 426 arquivos preexistentes antes das edições. Escopo desta execução: contrato, inventário e validação de exemplos independentes; correções de runtime pertencem às tarefas consumidoras.

Concluída em 08/09/2026: [SPEC-002](../../docs/sdd/specs/002-datas.md) define formatos, hoje por consumidor, página aberta, nulabilidade, horário informado/auditoria e plano de migração por proveniência. O [inventário](../../controle-financeiro-frontend/src/types/temporal-contract/inventory.md) cobre 22 grupos e 21 exemplos; vetores/verificador não são importados pelo runtime. As referências DEC-01/02/05 na SPEC-003 foram atualizadas sem alterar critérios ou fixtures anteriores.

Validação: verificador documental aprovado em São Paulo/UTC/Kiritimati, cobrindo presença de 37 campos de DTO Java e 14 do types/index.ts; cinco mutações documentais rejeitadas com exit 1; 15 execuções dos testes existentes de datas aprovadas; verificador CF-001, typecheck e lint do novo verificador aprovados. Hashes preservam 423 dos 426 arquivos iniciais: apenas os três documentos autorizados mudaram. [Evidências completas, comandos e manifesto](../evidencias/CF-004/README.md).

Limites: nenhum runtime/DTO/schema alterado, nenhum HTTP real/PostgreSQL/componente/E2E/build/CI remoto ou revisão independente executado. Perfis canônicos de time/recordedAt exigem adoção coordenada e schema CF-017; proveniência histórica permanece desconhecida. DEC-03 (ciclo bancário) continua CF-019; DEC-08 (janela semanal), CF-022; admissibilidade de criação de meta com prazo passado/presente, CF-020. Não fechar conformidade de produto com esta evidência documental.

Dependências liberadas para início nesta base local: **CF-005, CF-006, CF-008 e CF-016**. CF-010 já estava liberada; CF-007 continua aguardando CF-005/006, CF-009 aguarda CF-008. Nenhuma outra tarefa teve seu estado alterado. Integrar o patch local antes de derivar outro checkout.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Revisão independente — 09/09/2026

Contrato e 40 campos DTO revalidados; proveniência/hora ausente continuam requisitos, sem flexibilização para aceitar runtime.

O [parecer da revisão](../evidencias/revisao-CF-001-CF-009/README.md) prevalece
sobre a conclusão histórica acima para o aceite atual. Somente o conjunto final
foi verificado; commits intermediários não são apresentados como testados.

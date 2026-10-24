# CF033-01 — reconciliação e protocolo

Entrada: branch `codex/cf033-revisao-integrada`, HEAD `8de766f7c0738bd2ea99bd3cb98c23e5a78deba6`.
Base integrada `bfb6c61d6b68e1da112eabf420634bb5b5e9127b`. Staging vazio;
somente README raiz alterado, com SHA256 histórico. Não havia trabalho posterior.
Nenhum AGENTS.md encontrado nos ancestrais ou árvore; aplicadas as instruções do
usuário e a skill Tech Lead & Arquiteto. Execução restrita ao saneamento, sem nova
revisão geral nem CF034+.

## Reconciliação anterior à escolha técnica

1. [DEC-10](../CF-024/CONTRATO.md) protege efeito único/recuperação e progresso de
   contas distintas. Abrange criação de transação/transferência e operação de
   investimento, inclusive o cenário BUY A versus INCOME B. Não basta terminar
   depois que BUY comita. Intenção precede fontes; contas ordenadas, conta antes
   de investimento. Timeout/deadlock aborta, sem retry interno cego.
2. [CF030, decisões](../CF-030/DECISOES.md), §Concorrência real, introduziu guard
   PostgreSQL compartilhado para writers e exclusivo para captura/aplicação
   global. Expressamente conservava concorrência entre writers de fontes distintas.
   [SPEC001 §6](../../../docs/sdd/specs/001-onboarding.md) exige coordenação owner
   contra alterações do inventário durante prepare/complete; não é autorização
   para serializar todo BUY sem examinar dependências.
3. [CF032, saneamento](../saneamento-CF-032/README.md), §Custos, ampliou a exclusão
   para BUY/aumentos/moves porque evidências certificam **todo** o inventário-base.
   [Revalidação](../revalidacao-CF-032/INVENTARIO.md) aceitou capacidade/certificação
   e registrou o custo de serialização. Nenhum desses textos substituiu explicitamente
   a garantia da DEC-10. Não se altera DEC-10 para legitimar o defeito.
4. SPEC001 §5.1 não identifica independência por UUID, saldo, nome ou ausência de
   vínculo isolada. CANDIDATES depende de prova exaustiva; UNBOUNDED alcança o
   universo elegível menos exclusões válidas; união de pendências permanece.
   CLOSED/ASSIGN dependem de evidência compatível com inventário corrente. Alterar
   B pode invalidar uma exclusão/declaração que autorizava A. Nesse caso há recurso
   compartilhado, embora as contas sejam diferentes.
5. [CF033-01](../CF-033/ACHADOS.md) demonstrou o excesso no caso **sem** qualquer
   dependência global: BUY A mantém o guard exclusivo e impede INCOME B.
   A [contraprova CF030](../revisao-CF-030/WRITERS.md) demonstra o outro extremo:
   retirar a participação do writer real permite duas reservas600 em saldo1000.

Não foi demonstrada incompatibilidade que exija abandonar uma garantia. O recorte
permite restaurar progresso usando proteção por fonte, condicionada à inexistência
de dependências do inventário. Com declarações/legado, preserva-se a certificação
existente, sem estreitar tokens, fabricar prova de independência ou renovar evidências.

## Condição verificável e estratégia

`FinancialInventoryGuard.capacity` adquire primeiro **S** na chave transacional
`financial-dependencies:<owner>`. Depois consulta, no banco, se existe:

- qualquer registro em `onboarding_reservation_records` (inclusive CLOSED, histórico
  corrente ou atribuição conhecida, pois sua compatibilidade continua sujeita ao token);
- meta MONETARY com `allocation_reconciled=false`;
- investimento com `goal_id` sem par correspondente meta/investimento.

Se existe, toma **X** no inventário e mantém a projeção aprovada. Se não existe,
toma **S** no inventário e autoriza pelo valor/estado da fonte e SUM dos seus pares,
após o lock da fonte. Não carrega inventário global inconsistente para decidir
capacidade local. `ReservationCapacity` continua a única regra aritmética.
O teste de dependência é repetido no ponto de autorização, sob a mesma barreira.
Isso não equivale a dar autorização a uma fonte apenas porque tem ID diferente.
Essa releitura usa flush mode COMMIT apenas na query, para não persistir metadados
pendentes do próprio BUY antes de avaliar o certificado corrente. O commit e seu
flush final continuam atômicos; o diagnóstico e a prova nova estão em REPRODUCAO.md.

`snapshot` toma **X** dependências → **X** inventário, antes de usuários/sessões e
escritas. `structure` toma **X** dependências → **S** inventário na criação de
investimento com vínculo legado. A ausência de dependências fica estável até
commit/rollback; não há upgrade S→X nem liberação antecipada.

Leituras que esperam o gate ocorrem **depois** da espera, no isolamento READ COMMITTED
efetivo dos comandos; assim enxergam a criação comitada. Não se adiciona uma promessa
para consumidores arbitrários envolvendo esses serviços em transações externas com
outro isolamento. Não há lock em memória, retry, sleep ou validação fora da transação.

## Matriz dos writers diretamente pertinentes

S/X são modos do advisory transacional; fontes usam os locks/versões existentes.
Entradas se justificam por capacidade, introdução de dependência ou token certificado;
não constituem auditoria geral.

| Operação | Recursos lidos/gravados | Invariante | Lock anterior | Escopo necessário e delta | DEC-10 | Prova |
|---|---|---|---|---|---|---|
| BUY | Conta, posição, pares, operações, ledger, recibo | Débito ≤ capacidade, quantidade/custo, efeito único | Inventário X → conta → investimento | Dependências S; inventário S sem dependências/X com elas; mesmas fontes | A/B independentes progridem; disputa A espera | Probe original; novo same-source; CF024 |
| SELL/DIVIDEND/INTEREST/correção | Conta, posição, pares, cadeia/custo/ledger | Sem venda de unidades/reserva inexistente, correção atômica | Inventário S → conta → investimento | Mantido; não cria desconhecimento de origem | Conta/posição compartilhada é conflito legítimo | CF020, MilestoneSourceConcurrency/Correction |
| addValue com fonte | Meta, fonte, par, história | Soma de reservas ≤ capacidade | Inventário X → fonte | `capacity` antes da fonte; sem dependências só fonte/meta | Outra conta sem recurso comum progride | DailyCapacity; novo deposit |
| setAllocation positivo | Meta, fonte, par, história | Validação do delta positivo; reduções não recriam dinheiro | Inventário X → fonte | Mesmo protocolo `capacity`; zero continua S | Outra fonte independente pode progredir | DailyConcurrency; novo set; contraprova1200 |
| moveAllocation | Meta, dois pares, fontes | Reserva de destino válida e duas escritas atômicas | Inventário X → fontes em ordem | `capacity`; A antes I, IDs ordenados | As duas fontes são dependentes da mesma operação | Novo move; CF020 |
| Liberação/consumo/reembolso/história | Pares/progresso/compra, conta ou cartão | Só reduzir reserva; não apagar ajuste negativo para recriar reserva | Inventário S; fontes nos caminhos monetários | Mantido; pares com valor zero não são apagados por set/history | Não introduzem ausência→presença de legado | DailyCapacity; CF020/019 |
| Transferência/criação/baixa/estorno | Contas ordenadas, ledger, pares/recibo | Saldo/reservas, duas pernas/taxa, ownership | Intenção → inventário S → contas → ledger | Mantido; conflita pela fonte com autorização local | Contas disjuntas independentes | CF024, MilestoneSourceConcurrency, RV13 |
| Conta create/update/archive/reorder | Universo/estado/valor/versão | Fonte ativa e owned; token atual | Inventário S; archive bloqueia fonte | Mantido; sem legado não cria reserva incerta; com token espera X | Writer B progride sob BUY A local | Probe original; CF024/ownership |
| Investment.create(goalId) | Posição nova e vínculo legado com meta | Não inventar nominal/capacidade; cria pendência | Inventário S | `structure` X dependências → S inventário antes da leitura | Introduz recurso global; legitimamente espera | Duas ordens da corrida; CertificationProbe |
| Investment.create sem vínculo/delete/valuation/MarketPriceWriter | Universo/posição/valor | Valor corrente, não criar reserva | Inventário S → posição quando aplicável | Mantido; remover posição não cria vínculo; com registro/evidência usa token protegido | Independência sem dependências globais | CF020/Correction/temporal |
| Goal.delete | Meta, história, pares | Remoção de par não pode expor legado durante autorização local | Inventário S | Mantido: FK investments.goal_id→goals impede commit de exclusão com vínculo; sem vínculo não cria pendência. Exclusões ONB/owner já usam snapshot | Não foi acrescentada serialização de exclusão sem necessidade | CF020; Rv24Deletion; inspeção FK |
| CLOSE/ASSIGN, registry, prepare/complete/cancel | Todo inventário, sessão, provas/história, pares/mapping, recibo | Token/evidência coerentes, revisão, commit único | Inventário X → usuário/sessão | Snapshot X dependências → X inventário; produtor permanece MANDATORY | Snapshot global compartilha recursos entre fontes | OnboardingReviewConcurrency; CertificationProbe intacto |
| Exclusão usuário | Grafo inteiro, sessão/defaults/recibos | Não intercalar aplicação com exclusão | Inventário X → usuário → exclusões FK | Novo gate X antes do X já existente | Owner inteiro é recurso comum | OnboardingReviewConcurrency; Rv24Deletion |
| Cartões/pagamento/cron; categorias; hábitos que mudam meta | Linhas/estado/cartão/conta; tipos; progresso | Campos incluídos no token global | Inventário S; locks de agregado existentes | Mantido: não introduzem reserva monetária incerta; são bloqueados por X quando necessário | Sem disputar fonte/aggregado não precisam impedir BUY local | CF019; CF024; inspeção dos caminhos CF030 |

`AuthService.register` permanece criação de owner ainda invisível; não há autorização
concorrente de owner persistido nessa janela. `OnboardingOpenings` e registry só são
chamados após snapshot global. Planning/notas/reorder visual de hábitos não mudam
capacidade nem introduzem dependência; não foram ampliados para este saneamento.

## Ordem, rollback e alternativas

Ordem nova: intenção, se houver → dependências → inventário → fontes/agrupados,
com contas ordenadas antes de investimentos e ordem de move preservada. Writers
ordinários tomam apenas inventário S e nunca tentam dependências depois disso.
Nenhuma chamada aninhada encontrada introduz inversão desse gate. Ordens internas
históricas entre cartão/conta não foram redesenhadas; aborts recuperáveis continuam.
Não se infere ausência universal de deadlock dos ensaios.

`@Transactional` público efetivo envolve guard, releitura, débito/reserva, história,
eventos e recibo; adaptadores MANDATORY usam essa transação. Advisory xact locks e
linhas duram até commit/rollback. Exceção reverte tudo; nada é liberado antes de
evidência/recibo persistirem. Replay continua antes do guard e retorna resultado
original, sem recalcular capacidade. Nenhum contrato HTTP/DTO/frontend alterado.

Alternativas rejeitadas: remover só lock (corrida1200); shared+projeção global sem
estabilizar dependências (evidências vencem durante autorização); checar antes da
transação ou introduzir retry/confito geral (não cumpre progresso); token por fonte,
versionamento global/serializable ou nova arquitetura (delta maior, contratos e
aborts adicionais). Manter tudo exclusivo preservaria finanças, mas não sanearia
CF033-01. A solução usa dois namespaces advisory do mecanismo existente, sem tabela,
migração, cache, scheduler ou coordenação de processo novo.

Trade-off: soma consultas/gate na autorização e mantém serialização conservadora
quando há registros/legado, sem inventar uma delimitação de risco. Reconhecer
subconjuntos de evidência como independentes durante alterações do inventário é
evolução que exigiria prova própria; não se muda a compatibilidade dos tokens aqui.
O caso comprovadamente sem reservas pendentes tem caminho independente efetivo.

# Matriz anterior à implementação — CF-031

21/10/2026; base integrada `6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`.
[Liberação local DEC-ONB-03](../../../docs/sdd/decisoes/003-liberacao-local-CF-031.md).
Fonte normativa: SPEC-001 v1 e extensão de revisão antes/depois CF-030.
CF-031 inclui confirmação financeira. CF-032 é a jornada ampliada de uso diário,
relatório/exportação e dois usuários simultâneos, sem liberação automática.

| Critério / norma | Tela/estado/interação | API / resultado esperado | Prova necessária / fronteira |
|---|---|---|---|
| C1 / §2,4 | Primeiro acesso voluntário, contexto e oito etapas; legado exibe registros; pausa/descarte explícitos | GET sessão + listas em lote; PUT SAVE/PAUSE/RESUME/DISCARD; reload recupera último save | Componente navegação/teclado e integração real; sem inicialização forçada |
| C1 / §2,3 | Contas, cartões e futuras explícitas, investimentos, metas, reservas e previsões | Snapshot parcial permitido; unknown/zero/omissão/NA separados; strings exatas e datas civis | Entradas/limites e E01; não cria histórico, recorrência ou regra financeira cliente |
| C2 / §3,5,5.1 | Fontes removidas conservam referência pendente; meta numérica não é dinheiro | Issues persistidas no save; prepare valida situação atual; review mostra reserva uma vez, permissão separada | Fonte trocada, legado incerto, antes/depois e agregados; servidor autoritativo |
| C3 / §5,6 | Erro de campo, rede/401/409, comparação local/remoto sem sobrescrita | PUT perdido exige GET; GET issues não é revalidação atual; stale preserva memória | Componente 400/503/401/409 e leitura real; sem payload financeiro em storage |
| C3 / §5,6 | Preparar congela snapshot; confirmar/repetir/recuperar/cancelar explícitos | POST prepare/complete/cancel e GET operation/sessão, identidade estável; recibo estritamente válido | Resposta perdida/inválida, duplo clique, efeito SQL único; não inferir rollback |
| C3 / §2,5,6 | Geração por owner/montagem/operação; edição bloqueada durante operação | Resposta antiga A não toca B; logout limpa memória; reload recupera intenção no servidor | Promessas controladas ignorando abort, troca de usuário, desmontagem/reabertura |
| C1–4 / CF010, política | Responsividade 360/768/1440, claro/escuro, privacidade, teclado, foco/erro/scroll | Nomes acessíveis, erro associado, valores extensos sem sobreposição | Jornadas/capturas inspecionadas; zoom nativo200% pendente conforme decisão |
| C4 / política | Encaminhamento independente, falhas/contraprovas preservadas | Lint, typecheck, build, testes proporcionais e backend/PostgreSQL descartáveis | Commits CF031 locais; não autoaprovar, publicar para uso ou executar CF032 |

## Decisões de implementação

Separar schema de entrada, parsing/reconciliação de respostas, cliente HTTP,
máquina de estados e componentes por etapa. Reutilizar cliente HTTP, parser JSON
com rejeição de chaves duplicadas, coordenação de requests, sessão, diálogo e
privacidade aceitos. Sem dependência nova. Strings/BigInt para decimais; Number
apenas calendário/contagens não financeiras. Listas existentes servem identidade
e rótulo, nunca recalcular finanças por DTOs legados de precisão diferente.

Estado não salvo fica somente em memória. Uma operação financeira pendente é
recuperada pelo servidor após reload; não armazenar payload, token ou resumo em
storage do navegador. Cancelamento lógico não desfaz servidor. Nenhuma regra de
financeirização é delegada aos componentes. Review apresenta snapshot capturado,
não avaliação financeira contínua. Novas escritas usam os contratos aprovados.

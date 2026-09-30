# Contrato independente CF-023

Fontes: CF-023, AC-FIN-005, AC-UI-004/008, SPEC-001 (referências inacessíveis e
limpeza em logout) e SPEC-002 (expirado quando now >= expiresAt). Definido antes
da reprodução/correção nesta execução em 30/09/2026.

DEC-09, decisão técnica da tarefa dona: 404 para ID ausente/alheio, mesma mensagem
por tipo de recurso, sem nome, saldo ou outro dado de B. Evita revelar existência
pelo status. Não oculta erros de regra de negócio em recursos próprios: continuam
400/409 conforme contrato; 403 fica reservado a proibição de operação sem
distinção de existência. CF-028 deverá ratificar os DTOs próprios de onboarding.

1. A pode ler/mutar/vincular recursos de A; B não lê/muta/vincula esses IDs.
   Payloads válidos usam UUIDs reais de dois usuários sintéticos.
2. Reordenação mista [próprio, alheio] e [próprio, inexistente] retorna 404 e
   conserva integralmente ordens, linhas e saldos. A ordem própria válida funciona.
   Item de outra meta do próprio usuário também é referência inacessível nesse
   comando. Duplicação de IDs é entrada inválida (400), não nova ordem ambígua.
3. Exportação/listagens/agregados/cache são particionados pelo proprietário;
   filtrar por ID de conta alheia não expõe sua existência/dados financeiros.
4. Sem credencial, com token malformado/assinatura inválida/expirado, endpoints
   privados retornam JSON 401 consistente. Bearer é um esquema HTTP, não texto
   arbitrário removido de um header. Expiração no instante exato deve recusar.
5. Logout/troca A→B limpa cookie e estado financeiro, invalida leituras pendentes
   de A e não apresenta resposta/cache de A após login B/reload. Um 404/403 não
   invalida sessão legítima. Logout stateless não revoga JWT copiado: isso deve
   ser declarado como limite de arquitetura, sem inventar requisito de revogação.
   O cookie de sessão não permanece sete dias com um JWT válido por somente 24h;
   sua duração máxima acompanha o contrato de emissão de 24h do backend.
6. Recuperação: resposta pública não revela código/senha; código de A não altera
   B, expiração exata recusa, tentativas inválidas persistem e sucesso consome o
   código. Somente double de e-mail. Logs/respostas não contêm senhas, JWT ou
   código de recuperação; estado financeiro de B permanece intacto.

Oracles literais: conta A=1000/B=2300, ordem inicial=7; após tentativa recusada,
mesmos valores e mesmas linhas via snapshot SQL independente da implementação.
Reorder legítimo de duas contas produz ordens 0/1. Cache anual/patrimônio deve
retornar os valores correspondentes em leituras alternadas A/B, inclusive após
mutação de A. Nenhum helper da aplicação calcula esses expected.

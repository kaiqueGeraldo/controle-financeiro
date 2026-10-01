# Fronteira concreta antes da extração — base 40e07ef

Levantamento feito antes de editar produto, em 01/10/2026. README raiz tem alteração alheia, SHA256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`, fora do lote.

| Consumidor / responsabilidade | Acoplamento na base | Extração delimitada |
|---|---|---|
| TransactionService.create | Campo concreto FinancialIntentService; fingerprint estático e namespace da implementação; replay antes de createOnce, complete depois | Porta FinancialIntents, canonicalização independente; mesmos argumentos e posição das chamadas |
| InvestmentService.performOperation | Mesmo concreto, hospedado com recibo/repositório em transaction; replay antes de conta→investimento | Mesma porta compartilhada; regras monetárias continuam no serviço |
| FinancialIntentController.recover | Concreto e DTO de transaction; GET autenticado | Porta e DTO de recibo em intent; JSON/status/URL iguais |
| FinancialIntentService | MANDATORY, EntityManager/advisory xact lock, repositório JPA, JsonMapper, Clock e SHA-256 juntos | Adaptador interno PostgreSQL/JSON/Clock e canonicalização pura; sem nova transação |
| FinancialIntentReceipt/Repository | Entidade imutável e busca por owner no pacote transaction embora dois kinds usem a tabela | Persistência interna de intent; tabela, mapeamento, constraint e métodos inalterados |
| Testes temporais de TransactionService/InvestmentService | Double do concreto via ReflectionTestUtils | Double da porta, mesmas assertions |

Busca: `rg -n 'FinancialIntent|financialIntent' controle-financeiro-backend/src`. Únicos consumidores de produto do concreto são os três acima. Ninguém além dele importa o repositório/entidade. UserService limpa a tabela por SQL na exclusão integral; não será modificado. FinancialCommand e pagamentos mantêm protocolos próprios, EntityManager/locks/namespaces existentes. InvestmentService ainda usa fatos de transaction para caixa; esse acoplamento financeiro é legítimo neste lote e permanece.

Decisão: porta sem ORM, User ou DTO de dinheiro; owner passa como UUID. replay/complete ainda exigem transação do chamador (inclusive chave null), recover é readOnly. O DTO público de recibo contém JsonNode para conservar o transporte existente; o contrato não manipula JSON. Fingerprint continua recebendo campos já normalizados pelo caso de uso, sem tentar centralizar defaults financeiros.

Trade-offs: uma indireção a mais e generics para snapshots dos DTOs atuais, em troca de consumidores desacoplados do armazenamento/lock. Não há token de sessão que imponha replay→complete pelo tipo; sequência permanece obrigação documentada e exercitada em integração. Não se generaliza protocolo para pagamentos/comandos antigos nem se adiciona camada de repository abstraindo JPA dentro do adaptador. O módulo é uma fronteira de pacote no monólito, não isolamento de classloader.

Custo preservado: fingerprint O(L) no conteúdo canônico, JSON O(S) no snapshot; quantidade fixa de operações SQL por intenção (não N+1). Busca por PK depende do índice, tipicamente O(log N); latência do lock depende de contenção e pode dominar. Hash advisory conserva possível colisão/serialização indevida herdada; nenhuma promessa de throughput ou ausência universal de deadlocks. Microsserviços exigiriam coordenação distribuída para efeito+recibo, piorando o risco sem demanda operacional comprovada.

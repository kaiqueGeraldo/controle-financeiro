# Modelo de identidade e causalidade

Revisão do intervalo cbbf58d..0f9beb1. Único arquivo de produto alterado: controle-financeiro-frontend/src/components/forms/operationModal.tsx. Hooks, manager, serviços, DTOs, backend e protocolo financeiro não mudaram. Provas originais rf15-review-lifecycle e rf15-review-residual permanecem idênticas.

| Identidade | Nascimento/invalidação | Efeitos permitidos |
|---|---|---|
| Usuário/sessão | Escopo local em layout effect por user.id, linhas69–77; cleanup/unmount/expiração/BroadcastChannel o invalidam. O store financeiro mantém sua geração independente. | Atualizar dados/reconciliar somente na mesma sessão válida. Troca A→B→A de usuário não recupera o escopo antigo. |
| Ativo | asset.id e chave de inicialização owner:asset, linhas117–130 | Identifica payload e formulário. Novo objeto do mesmo ID por refetch não apaga campos. Não serve sozinho como geração. |
| Instância visual | Objeto próprio por isOpen/asset.id/user.id no layout effect, linhas79–85; cleanup e close invalidam diretamente o objeto capturado. | Fechar, apresentar erro local e atualizar loading somente na instância ainda ativa. A→B→A e fechar/reabrir criam outra instância. |
| Execução | Symbol por submit, linhas136–138 | finally somente libera o lock que ainda pertence a esse Symbol; o término de A não destrava B. |
| Intenção financeira | UUID e payload congelados/persistidos pelo useCreationIntent antes do POST | Unknown retém intenção; retry reapresenta mesma identidade/conteúdo; GET autenticado valida recibo. Instância visual não cancela commit. |

captureExecution guarda os objetos de origem e compara validade/referência atual. Callbacks de onSuccess/onReconcile permanecem capturados: o manager aponta para refreshInvestments do mesmo owner, protegido por escopo; encerramento usa a geração visual. recoverOrRetry captura antes do await e só fecha se a intenção pertencia ao ativo e a instância ainda é a mesma. Recuperar A de B permite refresh global e resolução de A, sem tratar isso como confirmação de B. Finally de recover pertence ao store financeiro, cuja busy impede outra intenção enquanto pendente.

UPDATE_BALANCE não possui recibo de criação: a proteção local de sessão cobre esse ramo sem inventar retry/idempotência. Casos de sucesso/erro tardios de avaliação com B já enviando protegem rascunho47 e loading, e o resultado ativo B ainda conclui.

Efeitos indiretos examinados: InvestmentsProvider inicia leitura coordenada na lane investments; useInvestments invalida investment-history ao trocar seleção e no cleanup. useRequestCoordinator verifica escopo/revisão/sinal mesmo quando o transporte ignora abort. O refresh não escreve seleção do modal; manter a entidade/objeto da operação evita reinicialização por atualização da lista. Provas existentes de erro/releitura/foco foram reexecutadas; não se infere que todo caso histórico de refetch foi refeito.

Trade-off: O(1) de estado adicional por ciclo/execução; nenhuma consulta, polling ou N+1 novo. Duas assinaturas locais repetem a fronteira de sessão do hook para cobrir avaliação sem recibo. A duplicação é pequena e delimitada, mas deve permanecer sincronizada em mudanças futuras do contrato; extrair abstração compartilhada agora ampliaria o risco sem necessidade comprovada. Não foi pedido redesign.

Contratos: SPEC-003 AC-UI-008/011 e DEC-10; tasks/evidencias/CF-024/CONTRATO.md. Os aceites de RVR24-02 para unmount/owner não se confundem com o novo ciclo visual. Resolução de recibo válido e refresh global são expectativas positivas, não efeitos que devem ser suprimidos para fazer o teste passar.

# Plano anterior à correção — 13/10/2026

Achado exato: P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02). Base cbbf58d, ancestral sem commits posteriores; staging vazio, somente README raiz preexistente. BASE.json e original-hashes.json preservam estado e provas.

| Critério | Reprodução | Causa a confirmar | Correção prevista | Validação |
|---|---|---|---|---|
| AC-UI-008/011; A não controla B | BUY A pendente, fechar e abrir B, entregar resposta A | OperationModal permanece montado; callback após await fecha seleção global atual | Separar ciclo visual de sessão/intenção; condicionar efeitos locais ao ciclo capturado, conservar refresh e recibo legítimos | Provas originais intactas de componente/navegador; A→B→A, erro, recuperação, unmount, sessão e fluxo normal |

A/B no caso original são ativos distintos e instâncias visuais distintas do mesmo componente montado. O operationId identifica intenção financeira, não instância visual. useCreationIntent já invalida owner/unmount; não deve ser invalidado por simples fechamento visual. Fechar/reabrir ou mudar ativo invalida apenas efeitos locais. Refetch do mesmo ID não cria uma instância nova nem apaga rascunho. Nenhuma mudança backend prevista.

Prova componente original executada: falha em onClose chamado uma vez; exigências positivas de refresh e remoção do envelope permanecem válidas. Navegador original em execução antes de editar produto, entrega HTTP retida após commit real em PostgreSQL descartável. Sem sleeps/retries para ordenar respostas.

Zoom, RVA-03 e opacidade do histórico ficam separados. CF011/012 e aceites RF15 preservados; CF014/015 em_revisao.

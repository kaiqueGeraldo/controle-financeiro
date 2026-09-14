# CF-011 — Auditar e corrigir autenticação e configurações

- Estado: em_revisao
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-010](../02-frontend/CF-010-componentes-comuns.md)
- Origem: T-008; F-015

## Problema e resultado esperado

Formulários públicos e preferências precisam de estados claros, teclado e persistência; falha de API deve continuar distinguível de entrada inválida.

## Escopo e referências

- `controle-financeiro-frontend/src/screens/public/auth/`
- `controle-financeiro-frontend/src/screens/private/configuracoes/`
- `controle-financeiro-frontend/src/components/screens/configuracoes/`
- `controle-financeiro-frontend/src/components/forms/changePasswordModal.tsx`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Executar registro/login/recuperação/logout e edição de perfil/preferências com fixtures, sem envio real.
2. Corrigir visual e feedback de erro, foco, campos, tema, privacidade e exportação; registrar defeitos novos individualmente.
3. Testar reload e sessão expirada durante formulário com contratos de CF-008.

## Aceite e testes adversariais

- [x] Sem corte de formulário ou mensagem em mobile; navegar por teclado e corrigir campos é possível.
- [x] Preferência salva reaparece após reload; falha de gravação não mostra preferência persistida fictícia.
- [x] Recuperação usa provedor falso; download falho mostra erro e não produz arquivo aparentemente válido.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Redesenhar autenticação no backend ou inferir segurança só porque o botão está oculto.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Concluída em 13/09/2026 sobre `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, preservando o patch inicial das tarefas anteriores. Login, recuperação, logout, configurações, perfil e troca de senha receberam validação e semântica de teclado; preferências não atualizam a UI de modo otimista; exportação exige um blob não vazio, evita concorrência e revoga a URL temporária. A validação final aprovou typecheck, 90 testes de componente e o fluxo público em três viewports. [Evidências, mutação e limitações](../evidencias/CF-011/README.md).

Limites: o build não pôde baixar fontes externas no sandbox, e não houve E2E autenticado com backend/PostgreSQL descartável. CF-015 deve fazer a revisão independente do marco e verificar esse percurso integrado.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Parecer independente CF-015 — 14/09/2026

R07 reproduz sobrescrita de rascunho no refetch do mesmo usuário. Registro e preferências têm evidência parcial integrada; os limites e o estado do roteiro visual constam do parecer.

Estado do marco e condições de encerramento: [revisão CF-015](../evidencias/revisao-CF-015/README.md), [achados](../evidencias/revisao-CF-015/ACHADOS.md). Evidências anteriores permanecem históricas e não substituem este parecer.

# Implementação e fronteiras da CF-031

## Contratos e estado

Rota privada `/onboarding`, convite voluntário no dashboard e entrada na sidebar.
Não há redirecionamento que obrigue usuário novo ou legado a concluir entrevista.
CONTEXT/ACCOUNTS/CARDS/INVESTMENTS/GOALS/ALLOCATIONS/FORECASTS/REVIEW seguem SPEC-001.
NONE, DEFERRED, UNANSWERED, KNOWN zero, UNKNOWN e NOT_APPLICABLE são distintos.
Troca de resposta/forma de cadastro com remoção de conteúdo exige confirmação;
remover fonte mantém o vínculo dependente para correção. Não se cria origem provável.

- `model`/`input`: schema parcial, validação de formato e normalização exata.
  Campos ausentes permanecem ausentes; não são substituídos por zero. Limites
  financeiros da escrita preservados. Number somente em calendário/contagens.
- `result`: membros próprios, envelopes, decimais, conhecimento, identidades,
  mapeamentos, coerência aritmética de totais conhecidos e hashes canônicos.
  Recibo deve corresponder à revisão congelada. Não recalcula capacidade como
  autorização nem substitui avaliação financeira/coordenação do servidor.
- `client`: usa `apiRequest`, parser JSON estrito já versionado e BFF existente.
  Opção de leitura onboarding isolada; erros JSON Pointer preservados. Os clientes
  legados mantêm seus contratos. Sem endpoint/migração/dependência novos.
- `flow`: store por montagem/usuário; mutações serializadas e geração autenticada.
  Invalidação no logout, expiração ou desmontagem impede conclusão antiga de tocar
  uma nova montagem. Abort é otimização de cleanup, nunca rollback do servidor.
- Componentes de campos, itens, declaração atual de reserva, revisão e tela:
  apresentação e interação. Diálogo/foco e PrivacyBlur compartilhados reaproveitados.

O rascunho é remoto e autenticado. Edição não salva existe somente em memória;
não há payload financeiro em localStorage/sessionStorage. Ao expirar/trocar usuário,
a memória é limpa; último save, preparação e recibo são recuperados no servidor.
Perder alterações não salvas nessa fronteira é limite explícito, não persistência
secreta no navegador. Antes de sair com edição, há escolha de salvar/pausar ou sair.

## Confirmação e recuperação

GET do draft recupera a avaliação persistida do último save, não revalida finanças.
PUT SAVE/PAUSE/RESUME/DISCARD usa versão explícita. Save perdido só é confirmado
por GET com snapshot, versão seguinte, identidade de sessão e estado esperados.
Se divergir, comparar local/remoto; substituir ou gravar sobre a versão lida exige
ação explícita, sujeita a novo409. Não existe merge automático de respostas.

Prepare salva a etapa REVIEW e cria identidade antes do POST. Resposta incerta
mantém essa mesma identidade; não habilita outra preparação como recuperação.
PREPARED congela edição/descarte; correção exige cancelamento confirmado. Após
reload, GET da sessão reencontra a operação. Confirmação/retry envia os mesmos
sessionId/operationId/versão/hashes/conteúdo. GET da operação e recibo válido são
evidência de conclusão. PREPARED,404,5xx ou resposta inválida não provam rollback.
Cancelamento que perde a corrida não desfaz commit. Replay não inventa histórico.

Valores individuais chegam como strings; hashes usam SHA-256/WebCrypto sobre
JSON canônico. Financeiro usa inteiros escalados BigInt, com Money/Quantity e
AggregateMoney/Quantity separados. Datas civis usam calendário gregoriano sem
conversão para instante; captura do resumo mostra explicitamente São Paulo.
Banco/servidor continuam autoritativos para ownership, fatos financeiros, locks,
capacidade, confirmação e efeitos únicos. Sem nova implementação financeira Java.

## Declarações de reserva e revisão

Apresentação separa saldo, reserva comprovada, disponibilidade e permissão.
Nominal sem origem aparece uma vez; não é somado integralmente em cada candidata.
UNKNOWN/PARTIAL não são total completo nem capacidade para aumentar destinações.
Revisão mostra alteração de par antes/final/diferença e ASSIGN/CLOSE como declaração
atual, sem documentação retroativa. Após cancelar revisão, a captura anterior é
marcada como referência; a declaração conserva a revisão original para revalidação.
Declarações já salvas permanecem editáveis após reabrir mesmo sem captura em memória.

## Custo, alternativas e limites

Carregamento inicial: uma sessão e cinco listas por tipo em paralelo, sem chamadas
por conta, meta, fonte ou parcela. Listas legadas fornecem identidade/rótulo/categoria;
não alimentam somas monetárias a partir de DTOs numéricos legados. Backend financeiro
CF-030 permanece intacto, incluindo o custo e os limites aceitos no seu parecer.

Schema/parser custam O(bytes + linhas + relações materializadas); canonicalização
ordena objetos/listas, O(N log N) nas listas. Campos financeiros não são convertidos
para Number. O resumo pode conter relações fonte–pendência E até N×R; não se promete
linearidade em N+R ignorando E. Mapeamentos e vínculos de bloqueio usam Map/Set.

Revisão e referências indexam nomes/identidades, metas selecionadas e decisões
uma vez por mudança dos dados, com Map e memoização. A apresentação do resumo
percorre suas linhas sem buscar cada nome ou permissão na lista inteira; elimina
o custo quadrático desse lookup sem afirmar benchmark ou latência de produção.

Seletores nativos simplificam teclado e evitam dependência nova, ao custo de
materializar opções para cada referência editável: O(A×(C+D)), com A controles,
C cadastros existentes e D itens no draft. A é limitada pelo contrato; inventário
legado não ganha teto financeiro arbitrário. Não há benchmark de catálogo volumoso,
virtualização ou busca paginada certificados; medir essa carga antes do uso amplo.

Snapshot completo simplifica retomada e comparação e torna o custo de save O(bytes),
sem sincronização por campo. Serialização de mutações bloqueia controles enquanto
aguarda rede e evita duplo acionamento; não promete acesso offline. Preparação
durável custa ida extra e impede edição até cancelamento, compensada pela revisão
recuperável e pelo efeito único implementado no servidor. Nenhuma dependência nova.

CF-032 conserva E2E de uso diário, relatório/exportação, dois usuários simultâneos
e demais cenários ampliados E16–E35. As provas locais desta entrega não a executam
nem a liberam. Zoom nativo200% permanece pendente conforme DEC-ONB-03. O binding
civil de Invoice preserva o DATE existente e não repara datas históricas deslocadas.

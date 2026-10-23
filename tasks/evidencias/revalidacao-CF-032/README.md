# Revalidação independente CF-032 — 23/10/2026

**Aceite local: CF032-01/02/03/04 encerrados; critérios2/3 atendidos; CF-032
concluida no escopo validado.** Critérios1/4 sustentados anteriormente preservados,
sem regressão concreta encontrada. Nenhuma correção de produto nesta revisão.

Candidato conferido: branch `codex/cf032-e2e-financeiro`, HEAD
`864a3c7a02fb34fbdeaa3a54630dca226ab09d9c`, base
`f52152324716fb241134370ee14e6adfec2fefa5`. Sete commits relatados confirmados;
nenhum commit posterior ao candidato no início. Staging inicialmente vazio,
somente README raiz preexistente modificado. Commits desta execução contêm provas,
parecer e estados, não ampliam o candidato de produto.
Provas registradas no commit local `794cb5b`; parecer/estados em commit separado.

## Pareceres separados

**A — CF032-01 e CLOSE/ASSIGN: encerrado.** Capacidade desconhecida rejeita0,01
nos caminhos monetários examinados, sem efeito parcial. Conhecimento por fonte,
exclusões comprovadas, união de pendências, limite exato, redução/zero e movimento
foram verificados. CLOSE/ASSIGN certificam o inventário efetivamente escrito na
transação; histórico anterior é preservado, evidência antiga não é renovada e
mudança posterior invalida sua aplicabilidade. Falha na certificação reverte tudo.
O vínculo direto de investimento foi investigado: permanece pendência, não cria
par/progresso monetário nem permite a alocação0,01. Não foi confirmado bypass.

Concorrência: advisory lock transacional por usuário coordena writers pertinentes;
barreiras e conexões independentes comprovam exclusão durante autorização/aplicação,
rollback e progresso de outro owner. Replay de investimento confirmado precede
nova autorização, retorna resultado original e mantém efeito único mesmo após nova
pendência; operação nova é rejeitada. Custo: maior serialização por usuário e carga
do inventário completo; não se declara ausência universal de corridas/deadlocks.
[Inventário, validade, escritores, complexidade e limites](INVENTARIO.md).

**B — CF032-02: encerrado.** Resumo/cartão/barra usam métricas autoritativas,
confrontadas com contrato e SQL:656 inicial,850 após pagamento,15% comprometido.
Persistem antes/depois de reload e em nova sessão autenticada. Ausência/invalidez
não vira zero nem fórmula de fatura; loading/erro/zero/privacidade e consumidores
assíncronos foram cobertos pelos componentes.

**C — CF032-03: encerrado.** Lista, detalhe, operação, descrições e nomes acessíveis
usam ticker ou nome legítimo; fallback neutro se ambos ausentes. Duas posições sem
ticker, uma com ticker e nome longo exercitados, seleção/histórico/BUY pelo UUID
correto e persistência após reload. Mantém-se a conclusão histórica: não foi
demonstrada operação no ativo errado.

**D — CF032-04: encerrado.** POI e OOXML dos arquivos reais confirmam conteúdo
textual HH:mm:ss, segundos zero e ausência neutra, sem meia-noite inventada nem
deslocamento civil. Totais250,10/162,20/87,90, cobertura parcial/desconhecida e
isolamento preservados. Cinco variantes relatadas não são cinco condições temporais
distintas; esta execução também produziu F-receivables, totalizando seis arquivos.
[Reconciliação independente e variantes XLSX](RECONCILIACAO.md).

**E — Critérios2/3: atendidos integralmente no alcance local da tarefa.** Não se
deduz isso só do encerramento dos quatro achados: B/C reconciliam contas1286,90,
investimentos501,67, dívida270, patrimônio1518,57 e caixa livre836,90; H confirma
dois usuários ativos/isolados; G e backend confirmam invariantes sob falhas/replay.
Reserva não é somada duas vezes. [Matriz normativa](MATRIZ.md).

**F — Aceite integral da CF-032 no escopo local: concedido.** O limite local é
expressamente mantido; não equivale a homologação/uso real, publicação ou liberação
do restante do projeto. Não há saneamento residual de produto confirmado neste
recorte. Probes finitos não prometem ausência de outros defeitos.

## Provas, falhas e limites

14 casos pretendidos aprovados dentro de rodada20 (19 aprovados, R2 histórico
vermelho por procurar nomes vazios), mais RV6 novo aprovado.95 controles backend,
5 probes novos,54 componentes, lint/tipos/build aprovados. Quatro mutações históricas
reconferidas e nova mutação de certificação detectada em CLOSE/ASSIGN, restaurada por
hash e com controle verde. Não somar reruns/subconjuntos. Oito provas originais e487
fontes de produto conferidas por hash. [Execuções, argumentos, erros e contraprovas](EXECUCOES.md).

Preservados: tentativa sem testes por filtro; R2; quatro erros da fixture nova
antes de corrigir sua estrutura UNKNOWN; erro auxiliar de rótulo B; indisponibilidade
temporária de aprovação por uso. Nenhuma assertion normativa enfraquecida, timeout
aumentado, falha apagada ou teste repetido sem causa diagnosticada.

## Encaminhamento e preservação

CF033 permanece **proposta**, não iniciada. CF025/027 estão concluídas; CF032 agora
satisfaz sua dependência funcional **nesta branch local**, sujeita à integração e
conferência da base em execução futura. Não se altera automaticamente seu estado.
CF034 permanece **proposta**: depende também da CF033 não executada e da CF015
com zoom pendente, além das demais dependências próprias. Nenhuma sucessora iniciada.

DEC-ONB-03 conserva seu alcance. Zoom nativo200% em CF010/015 continua pendente;
viewport360 e inspeção visual não o substituem. Adoção real CF017/P01/P02 permanece
pendente; sem certificação de desempenho em produção, banco real ou deploy.

README raiz mantém SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
fora do staging/commits. Runtimes históricos saneamento-before/after/final/mutants
e o novo revalidacao-20261023-01 preservados, sem clean/reset/limpeza de target.
Sem push, merge, exclusão de branches ou alterações alheias incluídas.

Próximo passo concreto: submeter estes commits locais ao fluxo de integração
autorizado; só depois conferir a base e decidir execução separada da CF033.

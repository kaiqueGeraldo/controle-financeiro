# PROP-CF034-01 — Continuidade local condicionada

Decisão posterior de24/10/2026: usuário aprovou expressamente o recorte A em
[DEC-CI-04](../../../docs/sdd/decisoes/004-liberacao-local-CF-034.md). B/C continuam
condicionados. O texto abaixo preserva o estado histórico da proposta na análise;
não é autorização retroativa daquela execução nem aprovação de zoom/uso.

**Proposta pendente de decisão do usuário, 24/10/2026. Não vigente.**
Base: `e1a01b6`, branch `codex/cf015-zoom-gate-cf034`.
Origem: pedido desta análise; CF015→CF034; AC-UI-001/013/014/015;
procedimento de liberação parcial de `tasks/EXECUCAO.md`.

## Decisão concreta recomendada

Autorizar, em **outra tarefa**, desenvolvimento e revisão exclusivamente locais
do recorte de infraestrutura de CI da CF034 descrito abaixo, mantendo CF010/015
`em_revisao` e a conclusão integral CF034 condicionada à prova nativa de zoom e
ao parecer aplicável CF015. Esta proposta não concede aceite nem inicia CF034.

A autoridade para mudar a interpretação da aresta é o usuário, como na
DEC-ONB-03; aquela decisão era específica de CF031 e não pode ser estendida por
analogia. Registrar nova decisão aprovada com base, capacidade, consumidora,
responsáveis e limites; somente então anotar prontidão **desse recorte**, sem
apagar a dependência CF015 ou marcar aceites integrais por associação.

## A — Escopo local que poderá avançar após decisão

1. Em `.github/workflows/`, planejar/implementar gates progressivos frontend
   lint/typecheck/unit/component/build e backend JDK21/PostgreSQL descartável;
   selecionar explicitamente o E2E integrado BFF→Spring→PG e distinguir smoke
   crítico da matriz ampliada. Não assumir descoberta automática dos harness.
2. Ajustar apenas configuração de infraestrutura dentro dos alvos canônicos
   CF034 (`pom.xml`, `package.json`, workflows, Dockerfile quando necessário),
   reconciliando o verify existente e o pacote que ainda usa skipTests.
   Definir mesma revisão, digest e ordem test→build; não publicar imagem/deploy.
3. Ensaiar checkout/exportação limpos em runtime próprio externo, dados e
   identidades sintéticos, sem `.env`/credenciais reais; revisar instalação/cache,
   filtros de caminhos, encerramento de processos/PG inclusive na falha e
   sanitização de logs/traces. Cache só de dependências, sem reutilizar resultado
   de teste como sucesso atual. Não reutilizar banco mutável de outro runtime.
4. Provar negativo causal regra/data em cópia isolada e verde restaurado por
   hash, com assertions originais, retries0 e falhas iniciais preservadas. Nenhuma
   correção/refatoração de domínio para adaptar o produto ao runner.
5. Entregar commits locais, matriz por critério, comandos/seleções efetivamente
   executados e parecer independente do recorte CI. Limitação de runner remoto,
   proteção de branch e correspondência de artefato publicado permanecem
   explícitas até autorização própria e execução verificável.

Antes de executar, reconferir a base/diffs e os aceites CF026/032/033; as
dependências diretas já têm aceites locais, mas alterações futuras nos consumidores
pedem verificação dirigida. Falta de zoom não dispensa acessibilidade dos testes
que forem feitos. Achado concreto gera escopo próprio; não ampliar para sucessoras.

## B — O que continuará sem aceite integral

- AC-UI-001 nativo 200% em todo o escopo atual e parecer CF015, inclusive onboarding.
- Conclusão integral da CF034 enquanto a dependência não tiver o aceite aplicável;
  execução local de parte dos critérios não fecha o marco.
- Pipeline remoto real e falha bloqueando avanço, se não executados; configuração
  YAML/verde histórico não os substituem. `verify -DskipTests` histórico é pacote.
- Build/artefato **publicado** correspondente à revisão testada, se somente ensaiado
  localmente; nenhuma autorização implícita de publicação dos commits novos.

## C — Uso, homologação e produção

Continuam exigidos zoom com interação/capturas e revisão, gates próprios CF035/036,
adoção real CF017/P01/P02, proveniência/backup/restore/migração e limitações de
produção já registradas. O recorte A não libera writers, serviços, banco real,
notificações, homologação, deploy ou produto para uso. A publicação Git do lote
CF033 já autorizada não é uma liberação de uso.

## Risco, alternativas e rastreabilidade

Limite comprovado: [CAPACIDADES](CAPACIDADES.md), interrupção por URL antes de
captura/input; sem defeito ou aprovação de zoom. Risco não verificado: ampliação
pode ocultar ações/erros/conteúdo ou prejudicar foco e conclusão/cancelamento.
Mais pipeline verde não reduz automaticamente esse risco visual.

| Alternativa | Benefício | Custo/risco |
|---|---|---|
| Manter gate integral antes de qualquer implementação CF034 | Mantém uma só etapa formal de prontidão | Adia detecção automática sem ligação técnica com o limite de zoom; é a situação vigente se a proposta não for aceita |
| Aprovar somente A, conservando B/C condicionados (recomendada) | Permite reduzir risco de regressão em ambiente descartável | Exige rastreabilidade do recorte e revisão posterior; risco de confundir verde CI com produto aceito precisa permanecer explícito |

Não há justificativa para dispensa genérica de acessibilidade. O tamanho do zoom
não diminui sua função: o usuário precisa ler, corrigir e concluir ações ampliadas.
O limite pode ser proporcional ao aceite/uso sem paralisar infraestrutura local.

Responsável pela implementação e evidências A: executor futuro CF034. Parecer
independente: execução dedicada conforme CF034/EXECUCAO, sem tomar a conclusão do
executor como prova. Zoom: executor dirigido CF010; aceite do marco: revisor
independente CF015. Operador provê capacidade de navegador acessível; usuário
decide a liberação restrita. Estes papéis seguem a convenção, não são delegações
nem novas tarefas iniciadas por este documento.

Retomar zoom somente com a capacidade concreta do preflight descrito em
CAPACIDADES, depois executar [MATRIZ-ZOOM](MATRIZ-ZOOM.md), reunir provas e submeter
a parecer. Defeito mantém gate e recebe saneamento próprio. Não há prazo fictício
ou repetição automática. Nova alteração de telas compartilhadas exige reconferir
se a matriz ainda cobre o produto da base testada.

Se aprovada, registrar a decisão em `docs/sdd/decisoes/` com esta proposta e sua
base, atualizar nota do recorte na CF034 e referências CF010/015. Preservar estados
e dependência de aceite integral. Se recusada, a evidência continua válida e
CF034 permanece proposta até prova/aceite CF015. Nenhuma mudança canônica de gate
foi feita nesta análise.

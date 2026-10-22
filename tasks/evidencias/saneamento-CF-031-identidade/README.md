# CF031 — saneamento residual de identidade RC031-02

22/10/2026. **CF031 permanece em_revisao; residual saneado localmente, aguardando
revalidação independente. RC031-01 continua encerrado.** Branch
`codex/cf031-onboarding-frontend`, base `75ede48f07350e5b8a1e14eac45be9328f57c831`.
Não houve mudança de branch ou implementação de CF032.

## Causa, regra e correção

Antes: `reference` validava o tempId próprio A, mas `refKey` usava
`r.id ?? r.tempId`. Um id B herdado prevalecia: duas partes com o mesmo tempId A
recebiam chaves ACCOUNT:A/ACCOUNT:B e passavam pela unicidade. O inverso também
ocorria: fontes próprias distintas com o mesmo id herdado eram rejeitadas como
duplicatas. O objeto validado era devolvido sem mudar essa divergência de consumo.

SPEC-001 §4: Ref tem kind próprio e **exatamente um** UUID próprio: id persistido
ou tempId da sessão. Não existe precedência entre dois membros próprios. Ausência,
null, tipo/UUID inválido e ambos próprios, mesmo com um nulo, são inválidos.
LINK/INITIALIZE requerem id persistido; referências que admitem posição selecionada
podem usar tempId. Propriedade herdada não supre membro obrigatório nem é alternativa.
§5.1 exige fontes únicas em parts/sources/excluded; a chave continua composta por
kind+UUID, sem impor unicidade global a IDs persistidos de tipos diferentes.
UUIDs temporários únicos no draft conservam sua regra separada. Mapping não é Ref:
ele contém tempId e id com papéis distintos, já validados; não aplicar XOR ali.

Agora `ownReferenceIdentity` escolhe somente o membro próprio único, de tipo string.
Os validadores de leitura/escrita aplicam a validação UUID existente a essa mesma
escolha; `refKey` e a apresentação a consomem. Um tempId próprio A permanece A,
mesmo com id herdado B. Duplicatas reais são recusadas; fontes distintas permanecem
distintas. Sem clone genérico, limpeza de protótipo, roundtrip JSON ou coerção de UUID.
O objeto e seus metadados próprios válidos permanecem preservados.

Escolha arquitetural: resolver em comum, em vez de rejeitar indiscriminadamente
objetos com protótipo ou normalizar toda a resposta. Evita alterar representação,
precisão e hashes, ao custo de exigir o resolvedor nos consumidores de Ref.
Resolução O(1), memória O(1); a passagem de identidade/deduplicação mantém O(N+P)
para linhas/partes, sem nova busca quadrática, request ou query. Isso não reclassifica
o custo total do parser: a ordenação canônica existente continua O(N log N).
Regras financeiras não foram refeitas.

## Arquivos e consumidores conferidos

| Local | Consumo verificado |
|---|---|
| model.ts | Escolha própria comum; chave kind+identidade, sem fallback herdado |
| input.ts / result.ts | Mesmo resolvedor na validação, unicidade de partes/candidatas/exclusões, fontes/cartões/metas, decisões e correspondência de inventário |
| result.ts, canonical | Comparação/ordenação de refs aninhadas usa escolha própria; o clone por chaves próprias já isolava herança antes; vetores de hash válidos preservados |
| Fields.tsx | Seleção atual, aliases e rótulo de vínculo persistido; nenhuma opção determinada por id herdado |
| Review.tsx | Chaves/rótulos/decisões e escolha de meta temporária; id próprio não herda prazo/unidade de outra meta pelo tempId do protótipo |

Flat IDs de mapping, SourceSnapshot, evidência e operação são membros próprios
obrigatórios com papéis definidos, sem fallback id/tempId; foram inspecionados e
mantidos. A soma financeira não reextrai identidade: usa linhas validadas e kind
próprio. Busca em src não encontrou outro consumidor de refKey fora desses cinco
arquivos. Nenhum flow, client, hook, backend, schema, migration ou protocolo alterado.
Revisão React dirigida: sem novo efeito/estado/fetch/dependência, sem mudança de
layout, foco ou rótulos acessíveis; índices existentes mantidos. Testes de componente
conferem valor selecionado e conteúdo acessível; não são certificação visual real.

## Provas e seleção proporcional

| Conjunto | Resultado |
|---|---|
| Probes independentes intactos,9 casos | Antes7/9, duas falhas residuais; depois9/9 |
| Controles novos,22 | Base original com harness corrigido:14 passam/8 falham; candidato22/22 |
| Suíte dirigida |160/160 =138 preservados+22 novos |
| Sete probes originais anteriores; unitários Node |7/7;6/6, sem reabrir RC031-01 |
| Contraprova | Reintroduzir fallback herdado causa6 falhas/16 passes nos22; controle149/149 restaurado,210 fontes idênticos |
| Lint/tipos/build | Resultados e comandos em [EXECUCOES.md](EXECUCOES.md) |

Probes originais em `../revalidacao-CF-031-RC031/independent.test.tsx`, sem editar:
SHA256 `173FA36FF7182F1D1F5B5DB08D0A21BA279D4E0499FA735FF19D72A77275EA7E`.
Config SHA256 `6221DB723E0FC537A50609F080DB3AB46A75D99306BE8C18175E6130B31EA58E`.
Hashes iniciais em initial.json; preservação do conjunto133 em preservation.json.
149 é subconjunto de160, e os22 estão contidos nesses conjuntos: não somar rodadas.

Há controles de id/tempId próprios, herança alternativa/não supridora, ausente/null/
inválido/ambos próprios, duplicação e fontes distintas, incluindo mesmo ID em
ACCOUNT e INVESTMENT. CONFIRMED/CANDIDATES/UNBOUNDED e snapshots são exercitados.
Precisão, UNKNOWN/PARTIAL/NA, coerência financeira e hashes ficam nos138 preservados.
Um consumidor de estado recebe duplicatas construídas em memória: rejeita antes
de adotar sucesso; nova leitura válida recupera o mesmo recibo, sem prepare/complete.

Não repetimos as12 jornadas reais: fluxo de recuperação, transporte e protocolo não
mudaram, e o mecanismo residual não é criado pelo JSON atual. O controle de estado
usa parser real com colaborador get em memória, não é rotulado HTTP/E2E/SQL. Os
controles wire usam o leitor JSON real e mantêm respostas válidas/duplicatas normais.
A prova real anterior aprovada permanece na revalidação, sem reivindicar nova execução.

## Limites e encaminhamento

Reprodução confirmada **em memória**; JSON bruto mantém __proto__ como dado próprio,
não cria o id herdado. Nenhum ataque remoto, poluição global, corrupção do banco ou
duplicação financeira foi demonstrado. Não ampliar essa conclusão pela severidade P2.
O residual é a conformidade entre identidade validada e consumida.

Revisor: reexecutar os dois probes originais e os controles JSON/identidade; conferir
os consumidores acima, duplicatas e falsos positivos, hashes de preparo/recibo e a
recuperação após leitura inválida. A contraprova deve falhar e restaurar por hash.
O executor não encerra RC031-02 nem autoaprova CF031 com estes resultados.

Carregamento/sessão continua historicamente inconclusivo e não bloqueante por si,
sem nova investigação. RC031-01 encerrado, demais aceites, DEC-ONB-03, zoom CF010/015,
CF032 sem liberação e adoção real CF017/P01/P02 preservados. [Git](GIT.md).

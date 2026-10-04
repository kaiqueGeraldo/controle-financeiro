# Saneamento pontual RVR24-01 — bruto incompatível

04/10/2026, base `c45bfb6fa658a7d31e11353c8fb1a667123ebf64`, main.
[Baseline](baseline.json): staging vazio, único delta anterior README raiz,
SHA-256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
Sem commits posteriores à revisão. Instruções AGENTS fornecidas pelo usuário;
nenhum AGENTS adicional encontrado no workspace. A revisão foi localizada pelos
diffs 7704221/c45bfb6, não por presunção de caminho.

## Causa e regra

O ramo sem amount exigia totalValue positivo/finito, mas não coerente com a
execução. BUY2×100/total999 chegava a complete, apagava sessionStorage e retornava
confirmed. POST, retry e GET compartilhavam a falha. [Oráculo anterior à edição](CONTRATO.md)
confronta FIN-04/06, NG-01, DEC-10 e o achado independente **RVR24-01**.

Somente `src/services/creationResult.ts` muda no produto. O bruto por unidades
deve coincidir em centavos com quantidade×preço decimal exato, HALF_UP uma vez,
antes da taxa. Coeficientes BigInt evitam 1.005 binário e tolerância arbitrária;
quantidade/preço com escala excessiva e total fracionário de centavo são rejeitados.
Não muda tsconfig nem dependências; BigInt é usado via construtor, compatível com
a configuração TypeScript existente e os runtimes Node/Chromium testados nesta execução.

SELL com amount conserva o total informado. NG-01 permite quantidade/preço
derivados, inclusive preço descritivo zero; não recompomos esse total. Taxas,
custo histórico e avaliação não viram bruto. Custo/resultado históricos null
continuam aceitos. O snapshot original do recibo não depende da posição atual.

O validador comum mantém erro local e estado unknown; não inventa ausência de
commit nem modifica payload/recibo. A intenção permanece por owner com UUID e
corpo originais; consulta válida posterior pode encerrá-la. Guards anteriores,
lifecycle, callbacks e protocolo backend permanecem sem alteração.

Trade-off: uma relação normativa do DTO é conferida no cliente para impedir
confirmação incoerente. Isso não replica cálculo de carteira, cadeia de custo,
cotação ou autorização do backend. Trabalho proporcional aos dígitos (limitados
no contrato), sem I/O, queries, N+1, lock ou dependência nova. Números JSON legados
já chegam como Number: o parser usa sua representação decimal, não recupera
dígitos perdidos antes da serialização. Esta entrega não migra contratos HTTP.

## Provas desta execução

- [Antes](before.log): três falhas causais POST/retry/GET, um controle positivo
  aprovado. Confirmed indevido e storage/pending null registrados pelas soft assertions.
- [Depois](after.log): quatro aprovados. Original e cópia executada têm SHA-256
  `0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143`, sem mudar entradas/assertions.
- [Regressões](components.log): 89/89 em seis arquivos. Incluem quatro probes,
  22 complementos e 63 casos anteriores de consumidores/lifecycle/storage.
  Não somar o depois com a regressão, pois os quatro estão contidos nela.
- `rv24-gross.test.tsx`: oráculos literais HALF_UP/acima/abaixo do empate,
  preço pequeno em notação exponencial Number, quatro tipos, taxa separada,
  total null/string/NaN/Infinity/ausente/negativo/escala excessiva, NG-01,
  POST/retry/GET incompatíveis com corpo/UUID preservados, GET válido posterior
  sem POST adicional e nova intenção legítima igual com UUID diferente.
- [Lint](lint.json) e [typecheck](typecheck.log), exits em [resultado](static-results.json).
- Build em [log](build.log), exit em [resultado](build-result.json); acesso de rede
  autorizado para fontes Google, sem alterar fontes/configuração do projeto.

Comandos (cwd frontend): `node node_modules/vitest/vitest.mjs run --config
tests/component/vitest.config.mts` com os seis arquivos financial-result-review,
rv24-gross, rv24-residual, rv24-independent-review, rv24-creation-intent e temporal-forms;
`node node_modules/typescript/bin/tsc --noEmit --incremental false`;
`node node_modules/eslint/bin/eslint.js --format json --output-file <arquivo>`.
O primeiro after precede somente a troca sintática de literais BigInt pelo
construtor para o target ES2017; a regressão de 89 casos e gates usam o código final.

## Integração dirigida e proveniência

[Script](run-integration.ps1), [spec](gross.integrated.spec.ts),
[runner de teste isolado](Rv24CreationBrowserIntegrationTest.java).
O runner adapta o harness existente em cópia única no TEMP, nunca em fonte
backend compartilhado. O endpoint SQL de leitura existe somente nessa cópia
de teste e exige usuário autenticado. PostgreSQL16 descartável/Flyway reais;
e-mail e mercado externos são doubles. Não há mock de persistência financeira.

O spec faz BUY real2×100, valida a resposta original200 e só então entrega999
ao browser via route.fulfill. Exige modal pendente, submit bloqueado e envelope
original. Consulta SQL intermediária confere conta800, compra200, recibo200 e
um lançamento INVESTMENT_BUY. GET real é também corrompido para999; a intenção
continua idêntica. Depois restaura o GET, recarrega, recupera, recarrega novamente
e exige um único POST e um efeito. Oráculos SQL finais independentes rodam no Java.

**Resultado novo:** 1/1 jornada browser e 1/1 runner Java aprovados, sem skips.
[Resultado Maven](integration/result.json), [checkpoints SQL intermediários](integration/browser/sql-checkpoints.json),
[oráculos finais](integration/browser/postgres-oracles.txt), [persistência](integration/browser/persisted.txt).
Os três checkpoints conservam a mesma identidade, um POST, conta800, uma operação
de200, um recibo200 e um lançamento200. Reload final conserva quantidade12.
Nenhum ECONNRESET ou erro de produto ocorreu nesse run. A ausência não encerra
a investigação histórica. Não foi necessária alteração de backend de produto
nem repetição das suítes históricas: apenas o runner da jornada dirigida.

Runtime JDK21 externo a target reutilizado da revisão; sem clean nem reconstrução
de outputs históricos. Artefatos em pasta nova, com destino existente rejeitado.
As fontes/templates efetivos são preservados. Logs anteriores das revisões são
históricos, não atribuídos a esta execução. Não se repetiu a auditoria CF025–027.

## Estados e limites

RV24-01 e CF-009 seguem em_revisao. Nenhum autoaceite. CF-025/026/027 concluídas,
RVR24-02 encerrado e RV24-02 aceita permanecem conforme c45bfb6/40e07ef.
CF-028 continua pronta exclusivamente para especificação e não foi executada.
RVA-03, RJ-022-01/H24-01 e ECONNRESET não são alvo de investigação nesta rodada.
Sem banco real, deploy, push, alteração de schema/fingerprint/snapshot ou protocolo.
Não há prova de todos os navegadores, corte TCP físico ou matriz visual/zoom.
Histórico de custo desconhecido continua desconhecido; não se promete correção
universal de qualquer campo arbitrário de resposta financeira.

[Encaminhamento e intervalo exato](ENCAMINHAMENTO.md). [Verificação](verification.json)
confere hashes, estados/checklists/dependências, fontes backend da cópia, gates
e links. Sanitização em sanitization.json preserva hashes antes/depois; outputs
brutos conservam whitespace emitido pelas ferramentas. Não foram editados logs
históricos. A primeira busca normativa tentou diretórios inexistentes antes de
localizar docs/sdd; isso não é reprodução de defeito nem falha de teste.

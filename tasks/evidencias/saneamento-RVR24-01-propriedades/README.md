# RVR24-01/P2 — propriedades próprias na fronteira financeira

Candidato do executor, sem autoaprovação. Base `d4e5a06e04aa96f95a29a7312893798d955d57a8`, branch `main`; reprodução iniciada em 05/10/2026, validação final em 07/10/2026 após retomada. `baseline.json` registra HEAD, staging vazio e única alteração preexistente: README da raiz. Nenhum commit posterior à revisão no início.

## Causa e alcance

JSON bruto → `apiRequest`/`parseInvestmentResultJson` → lossless-json 4.3.0 → `parseObject` → reviver → `validateCreationResponse`/`recoverCreation` → `useCreationIntent.complete` → callbacks do formulário. O parser construía `{}` e fazia `object[key] = value`; uma chave JSON `__proto__` acionava o setter herdado e transformava o snapshot em protótipo do objeto. O reviver também usava atribuição dinâmica. Os validadores verificavam objeto/não-array e liam diretamente os campos: ausência de membros próprios não impedia sucesso.

A reprodução demonstra alteração do protótipo **daquele objeto**, aceitação de membros herdados e remoção da intenção. Não demonstra alteração global de `Object.prototype`, nem que o backend normalmente produza esse JSON. Campos financeiros herdados só precisam parecer coerentes para atravessar a validação anterior. Resposta inválida continua compatível com commit no servidor; não autoriza outra identidade.

Objetos diretos também são uma fronteira: as funções de validação e o retorno de `apiRequest` não podem depender exclusivamente do parser. Foram protegidos o wrapper `data`, envelope do recibo (`operationId`, `kind`, `result`), snapshot e campos obrigatórios por modalidade. O envelope local de intenção mantém JSON.parse nativo, agora com verificações próprias explícitas. O discriminador `in` serve apenas ao narrowing TypeScript, seguido de `Object.hasOwn`. Spreads e serialização de comandos não promovem propriedades herdadas; não foi introduzido merge com entradas remotas.

## Correção e contrato preservado

1. Dois módulos upstream 4.3.0 (`parse.js` e `revive.js`) locais, com licença MIT e assinatura pública original: as três escritas dinâmicas de objetos usam propriedades de dados próprias, enumeráveis, configuráveis e graváveis. `__proto__` permanece dado; objetos comuns e arrays conservam seus protótipos normais.
2. `ownRecord` usa `Object.hasOwn`, funciona com protótipo nulo e `hasOwnProperty` sombreado. Confirma os membros obrigatórios antes das verificações existentes de conteúdo. Não há lista de palavras proibidas nem rejeição geral de extras.

Objetos sem protótipo seriam seguros para construção, mas mudariam a semântica esperada pelo probe/consumidores. A definição explícita preserva a construção de JSON.parse sem perder decimais. A versão 4.3.1 foi inspecionada e ainda continha a atribuição vulnerável; a tentativa de atualização foi revertida para 4.3.0, sem alteração final de package/lock. Não há patch de node_modules, hook de instalação, parser JSON reimplementado ou alteração global. `verify-vendor.cjs` compara os módulos ao upstream instalado: somente três escritas, imports públicos dos helpers numéricos e remoção dos source maps. `vendor-verification.json` e `dependency-before.json` guardam hashes.

Trade-off: manter dois módulos locais exige comparação com upstream ao atualizar a dependência. Evita efeitos globais e mantém a gramática já utilizada. Parsing/transformação permanecem lineares no payload para o fluxo normal; checagem própria custa O(k), k limitado pelo contrato, sem consultas, locks ou IO adicionais. Não houve mudança backend/BFF/schema/HTTP, fingerprints, recibos, snapshots ou finanças.

| Regra existente | Fronteira protegida | Prova |
| --- | --- | --- |
| Snapshot com campos obrigatórios próprios, conteúdo válido | POST/retry e `result` do GET | 4 probes originais; 25 complementares |
| Envelope identificado por UUID/kind e result próprio | GET autenticado | membros herdados individuais e recuperação posterior |
| FIN-06: dinheiro até 999999999999.99 inclusivo/escala2; quantidade/preço informado 12+8 | cálculo exato existente após own checks | teto, coerência e precisão na seleção de 267 |
| NG-01: amount autoritativo, preço derivado descritivo; máximo de quantidade 999999999999.99999999 | parser decimal e recibo BigDecimal já aceitos | regressões decimais e jornada NG-01 |
| Intenção por proprietário e geração ativa | hook/formulário, sem mudança produtiva | lifecycle/ownership e modal real complementar |

Fontes: `docs/sdd/specs/004-regras-financeiras.md` (FIN-06/NG-01), `tasks/evidencias/CF-024/CONTRATO.md` (DEC-10), contratos de CF-027 e matriz já aceita em `../saneamento-RVR24-01-precisao/CONTRATO.md`. Não foi redesenhada a representação: seis campos do snapshot continuam LosslessNumber antes da decisão; números não financeiros seguem a política anterior. Extras e textos com nomes especiais permanecem aceitos quando o contrato é satisfeito.

## Provas executadas nesta entrega

Arquivo independente original e cópia ativa: `parser-independent.test.tsx`, SHA256 **18981B2F600001356F59D87FD2FB9CD0D378DB1F4D71701BD2F2D1D5EED800DD**. Quatro probes mais doze controles, sem alteração de inputs/assertions. `before.log`: **4 falhas/12 passes**. `after-original.log` e `components-final.log`: **16 passes**.

| Probe | Antes | Depois |
| --- | --- | --- |
| Construção de `{"__proto__": snapshot}` | prototype=snapshot, sem membro próprio __proto__ | prototype=Object.prototype, __proto__ próprio, snapshot externo rejeitado |
| POST com snapshot herdado | confirmed, storage=null, pending=null | unknown, mesma intenção persistida |
| Retry da identidade original | confirmed, storage=null, pending=null | unknown, mesmo UUID/payload |
| GET com result herdado | confirmed, storage=null, pending=null | unknown, recuperação válida ainda possível |

O snapshot original está no arquivo independente: id/type/date/dateOrigin/quantity2/price100/totalValue200/fees0/costDelta200/realizedResultnull apenas no protótipo antes da correção. Os probes do hook não instrumentam callbacks de modal; não se atribui essa medição ao histórico. A nova prova com OperationModal instrumenta onSuccess/onClose: não dispara com resposta inválida, dispara uma vez na recuperação válida.

Complemento `own-properties.test.tsx`: 25 casos, campos herdados individualmente, próprios inválidos sem fallback, protótipo nulo/customizado, envelopes aninhados, transação/transferência, nomes especiais, arrays/escapes/decimais, duplicata de chave, descritores de Object.prototype inalterados, intenção e recuperação. `components-final.log`: **267/267, 17 arquivos**, incluindo precisão/teto/coerência/BFF/HTTP, temporalidade, callbacks obsoletos, desmontagem e troca de usuário.

Contraprova exclusivamente em cópia temporária (`run-counterproof.ps1`, `counterproof.json`): validadores antigos → 17/25 falham; construção antiga com validação nova → 1/16 falha; restauração → 25/25 passam. Os quatro hashes restaurados coincidem com a árvore principal, nunca mutada por essa prova.

Ocorrências preservadas: `complementary-first.log` parou por EPERM de cache antes de executar testes; execução autorizada removeu essa restrição. `components.log` teve 266/267 por uso de caminho pontuado especial no matcher Chai, que bloqueia __proto__; somente esse matcher novo passou a inspecionar o descritor próprio diretamente, mantendo o valor esperado. Os originais não mudaram. `inherited-buy` parou antes do navegador porque Docker Desktop não estava ativo; depois de iniciá-lo, a execução distinta `inherited-buy-ready` foi feita. Não houve retry oculto, sleep ou aumento de timeout. Os logs anteriores não foram substituídos.

## Persistência real e limites

`inherited-buy-ready`: Chromium/Playwright, Spring Boot e PostgreSQL descartável; **1/1**. BUY2×100, conta1000: harness obtém POST real já commitado e somente então envolve a resposta em __proto__. POST e GET malformados mantêm armazenamento idêntico, formulário aberto e submit bloqueado. GET válido após reload encerra pendência. SQL em três checkpoints: um operationId/recibo, uma operação200, um débito200, saldo800; posição12 a partir de10. **Um POST efetivo**, GETs não contados como mutação. `browser/post-malformed.json`, `get-malformed.json`, `sql-checkpoints.json`, `persisted.txt` e screenshot registram o percurso.

`ng01-regression`: mesma spec de recuperação aceita anteriormente, executada agora, **1/1**. Resposta perdida após commit, replay explícito da mesma identidade, GET adulterado rejeitado e GET válido após reload. Um POST da interface + um POST de replay = duas requisições mutantes, **um efeito financeiro**: resgate1, recibo único, crédito1, saldo1001, posição0. `raw_operations` e `raw_receipts` consultados como texto e HTTP bruto inicial/replay/GET conservam `999999999999.99999999`; `price:0E-8` continua descritivo, amount1.00 autoritativo. A projeção numérica auxiliar `operations.quantity` do harness usa JSON comum e mostra1e12: não é evidência de precisão; os campos raw e arquivos HTTP são os oráculos, sem reconstrução. A intenção fica vazia somente após recuperação válida.

Lint e typecheck finais: exit0 (`static-final.json`). Build: `build-result.json`/`build.log`. Evidências históricas anteriores continuam nos diretórios originais; nada foi reconstruído como saída histórica.

Limites: navegador Chromium e ambientes descartáveis, sem auditoria global de segurança ou novos clientes hipotéticos. Dependência local requer manutenção futura. npm informou vulnerabilidades da árvore durante instalação; não se fez audit fix nem se declarou segurança global. Backend produtivo não mudou, portanto a revalidação dirigida usa persistência real sem repetir toda a suíte histórica. CF-025/026/027, RVR24-02/RV24-02, precisão e substituição aceita da sexta prova permanecem válidos. RV24-01/4 e CF-009/2 continuam **em_revisao**. Sem CF-028, push, deploy, migração real ou autoaprovação.

README da raiz preservado fora dos commits: SHA256 **6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA**. [Encaminhamento dirigido](ENCAMINHAMENTO.md).

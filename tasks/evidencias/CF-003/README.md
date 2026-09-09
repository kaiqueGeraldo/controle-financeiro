# Evidência CF-003

- Estado real e data: concluída em 08/09/2026; execução iniciada em 07/09/2026.
- Modelo/esforço usados: Codex da sessão, esforço high; revisão independente sugerida não executada.
- Commit/base e identificação do diff local testado: `main` em `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com o patch local anterior de CF-001/CF-002 e correções de produto preservado. A CF-003 alterou somente `package.json`, `package-lock.json`, infraestrutura sob `scripts/` e `tests/`, além desta evidência e do estado da tarefa.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows 11; Node.js 24.18.0; npm 11.16.0; Next.js 16.1.6; Vitest 4.1.11; jsdom 26.1.0; Playwright 1.63.0; Chrome for Testing 153.0.8010.12; 360x800, 768x1024 e 1440x900; `America/Sao_Paulo`; seed `cf001-v1`; relógio controlado `2026-09-08T02:59:59.000Z`.
- Dados: somente identidades sintéticas, com e-mails no domínio reservado `example.invalid`; nenhuma credencial real.
- Dependências integradas: nenhuma; CF-003 não possui dependências.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Comandos separados | Unitário, componente e navegador devem poder falhar e executar independentemente | `npm run test:unit`; `npm run test:component`; `npm run test:e2e` | Aprovado; scripts distintos e códigos de saída propagados |
| Validação real de componente | Submissão vazia deve mostrar os quatro campos obrigatórios e impedir autenticação/navegação | `tests/component/auth-screen.test.tsx` | Aprovado; 1 teste, sem chamada a cadastro, login ou router |
| Smoke público | `/auth` deve responder e exibir heading, e-mail, senha e ação de entrada sem backend ou interceptação interna | `tests/e2e/auth.smoke.spec.ts` | Aprovado nos três viewports; a chamada incidental do provider ao BFF recebeu 503 sem mascaramento e a tela permaneceu utilizável |
| Relógio e timezone | `Date` no navegador deve permanecer no instante exato e `Intl` deve reportar o fuso configurado | `tests/e2e/controlled-clock.spec.ts` | Aprovado nos três viewports, sem tolerância temporal |
| Metadados reproduzíveis | Relatório/log deve identificar fuso, viewport, seed e relógio | Configuração e execução Playwright/Vitest | Aprovado; nomes dos projetos, metadata e `harness-runtime.json` incluem os parâmetros |
| Artefatos de falha | Falha E2E deve preservar screenshot, vídeo e trace; sucesso não deve versionar resíduos | Execução intermediária vermelha e configuração final | Observado em `tests/artifacts/playwright/`; diretório ignorado e limpo na execução final verde |
| Ciclo de vida | A suíte não reutiliza nem encerra processo desconhecido e deve liberar o servidor que criou | `scripts/playwright.mjs`; verificação da porta 3100 após o teste | Aprovado; 6 testes passaram e a porta terminou livre |
| Teste adversarial | Assertion propositalmente errada deve produzir saída não zero e ser restaurada | mutação temporária no teste de componente | Aprovado; exit code 1 e mensagem esperada ausente; assertion correta restaurada |
| Ausência de enfraquecimento | Nenhum `only`, `skip`, tolerância ampliada, interceptação de API interna ou snapshot aprovado | busca estática em `scripts/` e `tests/` e revisão do diff | Aprovado |

## Falhas encontradas durante a execução

1. O primeiro teste de componente passou, mas jsdom registrou `window.scrollTo not implemented` disparado pelo Framer Motion. A fronteira ausente de jsdom foi substituída no setup, sem mockar a regra de validação. A configuração foi mantida em `.mts`, eliminando também o aviso CJS do Vite.
2. O primeiro E2E encerrou com código 1 porque o `webServer` do Playwright resolveu o diretório de trabalho sob `tests/e2e` e não encontrou o binário do Next. Após corrigir o diretório, os testes passaram, mas o encerramento do `webServer` ficou bloqueado no Windows.
3. Um supervisor explícito substituiu esse ciclo de vida. A primeira versão ainda detectou corretamente a porta ocupada depois de `taskkill` e devolveu falha. A versão final envia `SIGTERM` ao filho direto, aguarda e usa encerramento da árvore pelo PID exato apenas como fallback; o teste final confirmou a porta livre.
4. A primeira prova de relógio falhou nos três viewports por diferenças de 15–16 ms causadas por `clock.install`. Não foi adicionada tolerância: o helper passou a usar `setFixedTime`, e as três comparações exatas ficaram verdes.
5. A mutação temporária trocou `O nome é obrigatório.` por `O nome deveria ser opcional.`. Vitest terminou com código 1 e exibiu o texto correto no DOM. A assertion original foi restaurada e a busca final não encontrou a mutação.
6. Uma tentativa de restaurar quatro transitivos do lockfile às versões anteriores fez `npm ci` rejeitar a árvore como inconsistente. As resoluções geradas pelo npm foram repostas; a instalação limpa seguinte aprovou. Isso impede apresentar redução textual do lockfile que não seja semanticamente válida.

## Correção e validação

O harness fixa versões compatíveis com Node 20 ou superior: Playwright 1.63.0, Vitest 4.1.11, jsdom 26.1.0 e Testing Library. Vitest 5 e jsdom 30 não foram adotados porque seus requisitos atuais de Node excluem versões ainda suportadas pelo projeto. A camada de componente usa jsdom e doubles apenas nas fronteiras de autenticação/navegação; o componente e a validação reais são renderizados. O E2E não intercepta API interna e aponta o backend ausente para `127.0.0.1:65535` por padrão.

O supervisor faz polling limitado por prazo, com memória constante, inicia o Next pelo PID conhecido e recusa porta previamente ocupada. Não houve mudança em query, domínio, concorrência do produto ou complexidade de renderização; o custo adicional existe somente no processo de teste.

Comandos finais executados sobre instalação limpa:

```powershell
$env:npm_config_prefix = 'C:\Program Files\nodejs'
npm ci
npm run test:e2e:install
npm run test:unit
npm run test:component
npm run test:e2e
npm run typecheck
node node_modules/eslint/bin/eslint.js scripts/playwright.mjs tests/component tests/e2e
npm run build
```

Resultados:

- `npm ci`: código 0; 563 pacotes instalados a partir do lockfile.
- `test:e2e:install`: código 0; Chromium, headless shell, FFmpeg e Winldd instalados sob `node_modules`.
- unitário: código 0; 5 testes em cada um de `America/Sao_Paulo`, UTC e `Pacific/Kiritimati`, totalizando 15 execuções, nenhuma ignorada.
- componente: código 0; 1 teste, nenhuma repetição ou ignore.
- E2E: código 0; 6 testes, 3 viewports, 1 worker, zero retry; servidor encerrado e porta 3100 liberada.
- typecheck: código 0.
- ESLint limitado aos arquivos do harness: código 0.
- `npm run build`: código 0 após permitir rede para `next/font`; 14 rotas compiladas.
- `git diff --check` nos alvos da CF-003: código 0; somente avisos de conversão LF/CRLF do checkout Windows.

O lockfile passou de 553 para 663 entradas: 110 pacotes foram adicionados, nenhum removido e cinco entradas comuns mudaram. Uma é a raiz com as novas dependências; as outras quatro são resoluções transitivas compatíveis atualizadas (`postcss`, `nanoid`, `tinyglobby` e `picomatch`). O diff textual é grande devido ao grafo multiplataforma de Rolldown/Playwright e à reserialização do npm, mas a comparação semântica confirmou esse conjunto limitado.

## Verificação adversarial

- Assertion de nome propositalmente falsa: falha real com código 1; restauração seguida de teste verde.
- Clock com avanço involuntário: três falhas exatas; corrigido sem timeout ou margem de aceitação.
- Backend sentinela indisponível: o BFF registrou `ECONNREFUSED 127.0.0.1:65535`/503 e o smoke público continuou verde; nenhuma rota foi interceptada para fabricar sucesso.
- Porta 3100: supervisor se recusa a reutilizar processo existente e só encerra o PID que iniciou; porta livre após a suíte.
- Busca final por `.only(`, `.skip(` e pelo texto da mutação: nenhum resultado.
- Usuário sintético A/B: helper cria namespace por execução, cadastra pela UI/BFF real e nunca injeta cookie; será consumido pelos fluxos integrados futuros.

## Revisão e pendências

- `npm audit --include=dev` reportou 12 vulnerabilidades (1 baixa, 2 moderadas e 9 altas). `npm audit --omit=dev --audit-level=high` ainda reportou 3 altas no grafo de produção associado a Next/PostCSS/Sharp e sugeriu Next 16.3.4, fora da faixa atual. Não foi executado `audit fix`: atualizar runtime/produto sem regressão pertence a uma tarefa própria e exige revisão de compatibilidade. A atribuição de todas as vulnerabilidades de desenvolvimento às novas dependências não foi estabelecida.
- O lint completo continua vermelho no baseline documentado: 107 ocorrências, sendo 70 erros e 37 avisos em arquivos de produto. Os arquivos novos da CF-003 estão limpos; o saneamento global permanece na CF-026.
- Em ambiente sem acesso externo, Next usa fallback para Geist durante `next dev`; o primeiro build falhou ao baixar Google Fonts e passou quando a rede foi permitida. Tornar fontes autocontidas é risco de build/reprodutibilidade fora desta tarefa.
- O `UserProvider` global consulta `/api/auth/user` mesmo na tela pública. Com o backend sentinela, essa chamada pode registrar 503; o smoke deliberadamente não mascara o comportamento. Fluxos browser–API–banco serão cobertos por CF-007/CF-008 e dependências.
- O launcher `npm` do usuário aponta por padrão para um `npm-cli.js` inexistente em AppData. A execução foi recuperada com `npm_config_prefix=C:\Program Files\nodejs`; nenhum arquivo global foi alterado.
- O runner unitário preservado da CF-001 emite `MODULE_TYPELESS_PACKAGE_JSON`. Adicionar `type: module` mudaria a interpretação de todo o pacote e não foi feito sem necessidade funcional.
- Capturas, vídeos e traces são retidos somente em falha e ignorados pelo Git. A execução final verde não deixou artefato visual para aprovação; snapshot/layout e auditoria visual permanecem fora do escopo.
- CI remoto não foi executado porque não houve push. Nenhuma credencial, banco, e-mail ou serviço externo real foi utilizado.
- O checkout já estava sujo. Nenhum `reset`, `checkout`, `stash`, commit, push ou alteração em componente de produto foi realizado pela CF-003. Os testes Node, oráculos e correções anteriores foram preservados.

Dependências liberadas: a CF-010 passa a ter sua única dependência satisfeita nesta base local. CF-005 e CF-008 ainda aguardam CF-004; CF-007 aguarda CF-005/CF-006; CF-009 aguarda CF-008. Nenhum desses arquivos ou estados foi alterado nesta execução.

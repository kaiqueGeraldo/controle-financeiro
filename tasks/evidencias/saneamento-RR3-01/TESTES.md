# Resultados dirigidos

01/11/2026; runtime rr3-01-01. [Recibo verificável por fonte e saída](RESULTADOS.json). Brutos privados sob C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/rr3-01-01. Não são execução expanded ou nova revisão independente.

| Invocação | Resultado | Valor probatório |
|---|---|---|
| before-static | vermelho esperado:2 falsos aceites em10 casos | Probe geometry.mjs original detecta o defeito |
| before-live | vermelho esperado:2 soft assertions,1 JUnit falho | Badge real; somente filter/overlay no DOM; reload/API mantêm dados |
| after-static |10/10 | Os dois invisíveis rejeitados por no-glyph-paint; baseline aceito |
| regression |23/23,0 skip/retry/flaky | Identidade, opacity própria/ancestral/descendente, display/visibility, cor/fill transparente, recorte, overlays com/sem pointer, cobertura de palavra, controles positivos, animação e restauração após erro |
| scroll-control |1/1 | Texto após rolagem aceito; o mesmo texto filtrado rejeitado |
| after-live-consumer |2/2 JUnit;1 Playwright em cada wrapper | Probe real original e SAN-E2-visual original; larguras360/768/1440 |
| counter-old-static | vermelho esperado, mesmos2 falsos aceites | Helper antigo só na cópia isolada |
| counter-old-live | vermelho esperado, mesmas2 assertions | Helper antigo no badge real, base/restored continuam visíveis |
| counter-restored-static |10/10 | Após restauração SHA do candidato |
| counter-restored-live |1/1 JUnit/Playwright | Mesma prova original após restaurar candidato |
| CI: ci/required/suites/sanitize |32/32,0 skip | Seleção por identidade, relatórios/gates fail-closed e sanitização preservados |
| TypeScript | saída0 sem diagnóstico | Duas verificações; a final inclui o controle de rolagem novo |
| ESLint dirigido |3 arquivos,0 erro/aviso | Helper, configuração e24 controles |

Não se somam casos internos a JUnit nem se reaproveitam os88 JUnit da revisão anterior como testes novos. O probe independente real continua exatamente com suas assertions de estado/dados; nenhum original foi alterado.

A contraprova registra fonte velha e candidata, comandos/saídas, retorno esperado e restauração em counterproof-restoration.json/counterproof-complete.json. O SHA do candidato restaurado é52bf34a08d93ee8a8ecc61805e8b2c97cf58a2555b2b417532e80cd752349dae, igual ao arquivo de trabalho e à fonte de execução corrigida. O observador antigo ée45890231a31656c9a6e0f9ed42a6ab48868bebcdffce812ad6734638f7ea977.

Hashes dos probes independentes:
- geometry.mjs:c29410640c70ee27064530519f3789e5108c210a509440813aecc81e52918ba6;
- live-geometry.ts.txt:efe86cb13077ed131d26acea55b4cbda61a9d1c2734961844e8a39e9a0671947.

As4 invocações Maven têm inputs.json, execution.json, logs e XML próprios. Os4 estáticos possuem JSON/PNG/saída/recibo próprios. Há traces dos vermelhos e capturas do motivo no consumidor. CI/tipagem têm retorno registrado do histórico das ferramentas; o recibo distingue essa síntese dos logs Maven/Playwright efetivamente persistidos. ESLint tem JSON próprio.

Ocorrências operacionais sem valor de contraprova: a primeira escrita dos testes usou cwd com prefixo duplicado e não criou os arquivos; uma primeira coleta auxiliar carregou Playwright antes de PLAYWRIGHT_BROWSERS_PATH e procurou um browser ausente. Foram corrigidos caminho e ordem da variável, usando as dependências já instaladas. Não houve instalação, relaxamento de assertions ou descarte das falhas causais.

Capturas antes/depois foram inspecionadas; Sharp contou os pixels dos originais de forma independente da análise do helper. Não existe baseline visual renovado nem produto modificado para gerar verde.

A primeira coleta pós-commit do recibo final interrompeu ao interpretar a ausência de listeners em Get-NetTCPConnection como código1 do PowerShell. A coleta foi corrigida para enumerar listeners e filtrar as portas, conservando erro real de consulta como erro; não houve alteração de requisito/assertion do produto. O commit documental local foi ajustado antes da entrega, mantendo três commits neste lote.

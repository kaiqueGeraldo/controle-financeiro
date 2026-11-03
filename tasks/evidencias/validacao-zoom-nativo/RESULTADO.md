# Viabilização e validação de zoom nativo — resultado

03/11/2026, America/Sao_Paulo. Candidato executado: **f09e69a6511a5772ea9052da7509a8930ae88d17**, branch **codex/saneamento-pr3-expanded**, worktree **C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source**. Commits desta etapa acrescentam apenas esta pasta; não mudam o candidato de produto/testes executado.

## A. Capacidade efetivamente encontrada

**A, assistida por operador humano, para operação/captura nativas.** A inspeção inicial classificou C para input autônomo: APIs atuais não expõem uma operação própria segura de zoom e não houve diferença demonstrada que autorizasse repetir o caminho de janela/URL recusado. O usuário então se disponibilizou, operou os menus dos navegadores descartáveis e forneceu capturas reais. Nenhum input nativo foi automatizado por este agente. Nenhum ambiente alternativo B foi presumido.

**Zoom nativo200% comprovado no RF15**, por capturas humanas do menu com URL/título corretos. Na segunda invocação, há captura100%, captura200% e fim da página200%; o prefixo de usuário sintético na captura100% corresponde à namespace da invocação. Não são screenshots responsivos, CSS zoom, transform, DPR artificial, pinch ou escala do sistema. A conclusão é sobre o percentual observado nessa página; não certifica interação, overlays ou foco.

No CF015, o primeiro ensaio ultrapassou o poll de razãoDPR2, porém suas capturas humanas não mostram o indicador e a janela foi maximizada após a baseline1440×1000. Não há prova suficiente para certificar200% pelo menu desse cenário nem constância da janela. Nenhum marker foi fabricado.

Escala do sistema não foi verificada diretamente. WMI retornou1920×1080 para Intel UHD; o monitor da janela não foi confirmado independentemente. BaselineDPR1 não foi transformada em alegação de configuração100% do Windows. [Inspeção e limites](CAPACIDADE.md).

## B–C. Resultados dos dois cenários obrigatórios

| Invocação | CF015 — R10: zoom nativo200% com ações, rolagem e foco | RF15 — zoom nativo Chrome200% com ações, rolagem e foco |
|---|---|---|
| runtime01 / atendida-01 | **Falhou** no sinal nativo: esperado200%, recebido pending,60000ms. Poll relativoDPR2 já ultrapassado; captura sem indicador e janela maximizada. N04–N11 não alcançados | **Falhou** no mesmo sinal60000ms. Capturas humanas mostram menu200%, mas chegaram após encerramento. N04–N11 não alcançados |
| runtime02 / atendida-02 | **Falhou antes do zoom**: registerSyntheticUser esperou URL final / durante15000ms; permaneceu em /auth?modo=cadastro. Sem ready.json deste caso | **Falhou** no sinal60000ms. Poll relativoDPR2 ultrapassado e capturas humanas100%/200% válidas, mas sem confirmação dentro do prazo. N04–N11 não alcançados |

Os dois casos são os originais, selecionados pela configuração RF15 e pelo controlador Rf15RemediationBrowserTest. Cada invocação teve dois Playwright falhos, zero skips, zero retries/flaky; o JUnit contém um wrapper falho que engloba esses casos. Não somar o wrapper aos dois cenários. Não houve execução integral da expanded.

Baseline dos três ready.json existentes: Chromium153.0.8010.12 ou Chrome155.0.8059.84, projeto review-sao-paulo; outer1440×1000, inner1424×905, DPR1, visualViewport.scale1. Não existe zoom.json após confirmação; portanto não se afirma largura pela metade, outerWidth constante ou escala visual final1. Os polls ultrapassados mostram razão2 em algum momento observado, não substituem recibo final nem indicador.

Nenhum defeito de produto foi demonstrado. As três falhas de confirmação são impedimentos de procedimento/orquestração. A falha de cadastro é uma pré-condição não satisfeita; causa **inconclusiva**. O trace disponível contém etapas do teste, sem rede/DOM que sustentem atribuição causal a aquecimento, relógio, backend ou produto. O contexto preserva a página Crie sua conta. Não corrigir produto ou fixture por suposição.

## Preparação, diferença entre invocações e erros próprios

Foi montada cópia física de849 fontes, dependências já instaladas por hardlinks imutáveis, caches próprios e nenhum .env/dado real. O único ajuste operacional da cópia é o caminho de recurso Java do frontend para f; specs, política, timeouts e asserts permanecem iguais. Driver usa JDK21, Maven offline e PostgreSQL16/Testcontainers com Flyway real, sem fallback externo.

A preparação independente runtime01/p validou cadastro UI→Next→Spring→PostgreSQL, conta/cartão longos e12 compras; reload voltou ao cartão correto. PostgreSQL final:1 usuário,2 contas (inclui a conta inicial),1 cartão,12 compras. Captura sintética inspecionada; não é prova de zoom nativo. Credenciais ficaram somente no runtime privado, em banco já encerrado. Os fontes originais de execução em s permaneceram frios até cada invocação.

Compilação offline passou nas duas cópias. A primeira listagem do preparador selecionou zero casos porque a âncora inicial ignorava o prefixo projeto/arquivo do título Playwright. Primeira saída preservada em runtime01/selection/list.txt; filtro do **preparador novo** corrigido para nomes completos com âncora final. Listagens posteriores retornaram exatamente2 testes em2 arquivos. Nenhum teste original ou resultado esperado foi alterado.

A primeira invocação mostrou que o upload pelo chat excedia a janela de60s. A segunda foi delimitada por uma condição concreta diferente: confirmação humana local, sem ampliar prazo nem apagar o primeiro vermelho. Um painel gráfico próprio foi preparado; ele não emitiu sinal. Seu primeiro encaminhamento aguardou o ready do CF015 mesmo depois da falha pré-zoom; apenas o painel foi corrigido/reaberto para o RF15 já ativo, sem reiniciar testes. Tampouco houve sinal. Não foi preservado diagnóstico que explique a ausência final do painel; não se declara capacidade funcional desse painel. Fontes anteriores/atuais foram arquivados no runtime02; processos próprios conferidos ao final.

Não houve terceira invocação. Preparou-se alternativa pequena de terminal humano: o operador digita200% localmente depois de capturar o menu, e envia imagens depois. O helper recusa stdin canalizado, caso encerrado e substituição de sinal. Sintaxe/argumentos e checagem sem escrita passaram; interação humana ponta a ponta **ainda não verificada**. Ele não controla navegador, não captura tela e não constitui aceite. [Procedimento concreto](ROTEIRO-ASSISTIDO.md).

Trade-off do preparo: cópia/hash O(bytes dos fontes), enumeração/hardlinks O(entradas instaladas), compilação e armazenamento por invocação; conserva os históricos e evita compartilhar cache mutável do frontend. Não há mudança de queries, domínios, concorrência de produto ou arquitetura. A confirmação local reduz a dependência do upload, mas continua exigindo declaração humana e revisão posterior das capturas.

## D. AC-UI-001 / CF010 / CF015

Somente o percentual nativo RF15 e as provas parciais N01–N03 estão sustentados. N04–N11 — geometria final, cinco telas, transação, fatura longa, pagamento aninhado, teclado/foco e retornos — **não foram alcançados**. A [matriz](MATRIZ.md) explicita cada critério, fonte e lacuna.

AC-UI-001 continua aberto. CF010/aceite1 e CF015 mantêm em_revisao. Não há autoaprovação global por checkbox histórico, DPR, screenshot isolado ou tamanho responsivo. Mesmo dois passes futuros precisam ser confrontados com a matriz integral, incluindo360×800 e consumidores/onboarding, pela política de revisão.

RR3-01 continua encerrado no contrato de atribuição/pintura demonstrado. Não foi reaberto ou reexecutado, não houve outra solução de observação de pintura e não foi ampliada sua garantia para contraste, interação ou percepção universal.

## E. Expanded e próximo passo preciso

**Pré-requisitos não atendidos.** Dois cenários nativos sem aprovação; confirmação síncrona não demonstrada; cadastro CF015 da segunda rodada sem causa definida. Expanded integral local não executada; PR#3 sem liberação de merge.

Trabalho interno delimitado: diagnosticar somente a pré-condição de cadastro na reprodução fria original CF015, preservando esta primeira ocorrência; sem correção de produto nesta etapa. Reprodução mínima preparada: novo runtime, controlador Rf15RemediationBrowserTest, seleção exclusiva pelo nome completo CF015, sem warmup/retry e com os mesmos15s da autenticação.

Única intervenção humana adicional para o protocolo nativo: depois de capturar100%/200% no menu da janela correta, **digitar200% no terminal local de confirmação antes de enviar as imagens pelo chat**. O agente deve abrir e coordenar o terminal; o usuário não precisa investigar infraestrutura. O roteiro não autoriza automaticamente outra execução nem afirma que essa alternativa já passou.

Depois de dois cenários completos e avaliação de suas evidências, preparar o encaminhamento à expanded local integral conforme o plano vigente. Não iniciá-la por efeito desta nota. O histórico remoto da PR#3 não foi consultado ou atualizado; nenhum aceite remoto novo é inferido.

## Preservação, provas e Git

Conferência inicial/final por referência aos manifests, sem recópia do acervo:

- 1.112 arquivos presentes no HEAD inicial conservados byte a byte, incluindo os1.087 do manifest histórico do candidato.
- 97 protegidos idênticos;36 registros conforme hashes vigentes autorizados; sete originais arquivados conferidos.
- Manifest1053 com SHA08e3a7dfdf1921a1113cecb8d4c77939714ede66446d0d0956594ef3eabce0ad:1.051 idênticos e dois deltas autorizados, com os dois originais preservados.
- README principal6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA; README worktreeE7D3458FBD8AC227520BE27996CE23C73E8C3BE2086D8CFBD51AD59568F4CEE0. Nenhuma restauração automática.
- Principal continua em c16e6545488c8f13efda4dab9efa8aa896fcddaa, branch codex/saneamento-cpa01-selecao-testes, somente M README.md preexistente. Publicação limpa permanece em1c4173f2e9a8bd459a9f2ecd4acf2d803245be88.
- Nenhuma worktree movida, .r3 recriada, limpeza geral, alteração de histórico, migration, pacote, runtime ou prova anterior removidos. Recursos próprios encerrados; preferências pessoais preservadas.

Espaços/listas e hashes completos também estão no recibo estruturado [RESULTADOS.json](RESULTADOS.json). Runtimes01/02 conservam manifests, logs, XML, JSON Playwright, quatro traces, SQL, primeira ocorrência e oito capturas humanas originais; esses brutos/credenciais não entram no Git, conforme tasks/EVIDENCIAS.md. A síntese referencia os caminhos e hashes. Os commits locais desta pasta usam staging explícito e diff inspecionado; SHA final e estado Git pós-commit ficam no recibo privado git-final.json, evitando autorreferência do commit.

Sem push, atualização de PR, CI remota, merge, hospedagem, deploy ou banco real.

# Próximo passo específico — ambiente Windows de browser

Não repetir o Linux626 neste lote nem ampliar watchdog/fixture/concorrência.
A execução Linux atual está aprovada; a causa histórica permanece inconclusiva.

## Ajuste operacional fundamentado

1. Dar aos binários Playwright uma localização física curta dentro de runtime
   descartável autorizado, com versão/hash conferidos. A prova atual compara o
   mesmo chrome-headless-shell:274 caracteres → ENOENT;172 → exit0/versão
   153.0.8010.12, SHA addfa79abb060e1e514e155ed745d4bf96140bca402735958bb4e223aea0b98c.
   Os292 arquivos da cópia curta são hardlinks com bytes conferidos, preservados
   apenas como diagnóstico; não certificam jornada nem pacote.
2. Tornar esse caminho configurável de forma coerente nos lançadores Java,
   Node e scripts CI. Há vários PLAYWRIGHT_BROWSERS_PATH=0 explícitos; mudar só
   o ambiente pai não resolve. Preservar default/isolamento do CI onde cabíveis.
   Não alterar assertions, retries, seletores ou os dois adiamentos da DEC.
3. Separar diretórios de execução preparados dos diretórios descritivos de
   evidências. UserIsolationBrowserIntegrationTest já aceita a propriedade
   cf023.frontend.runtime; usar um diretório físico curto, com namespace próprio,
   em vez de aninhar frontend-runtime sob o nome longo da classe no relatório.
   Inventariar os outros prepared frontends antes da nova tentativa.
4. Consolidar o lançador Maven por arquivo de argumentos em um mecanismo
   operacional revisável. O adapter desta rodada é delimitado a Windows,
   Maven3.9.12/JDK21, sem opções JVM/mavenrc adicionais; falha se essas condições
   mudam. Não promover seu caminho local hardcoded a configuração compartilhada.
   A lista completa116 e a verificação Surefire continuam obrigatórias.
5. Antes de novo verify completo: provar lançamento real de um navegador vazio
   por Playwright no caminho definitivo e startup da cópia preparada do Next,
   usando as mesmas ferramentas/overrides do gate. Manter preflight da JVM
   Windows → Docker Desktop → loopback e guard original.

## Trade-offs e limite

Caminhos explícitos curtos evitam falhas de CreateProcess/Turbopack e mantêm
ownership do runtime. Exigem um contrato comum de configuração nos lançadores
e prova de que o browser executado é o instalado pelo lock. Manter0 incondicional
simplifica instalação hermética, mas torna o caminho do executável dependente
da profundidade do checkout; a instalação pode passar e o lançamento falhar.

Não usar SUBST/junction para contornar physicalPath nem mudar configurações
globais para disfarçar o limite. Alterar helpers/runner de forma legítima muda
inputs: exportar novamente, registrar diff/proveniência e definir no plano
quais gates podem ser reaproveitados pela identidade efetiva dos seus inputs.
Os adapters atuais são evidência operacional local; CI compartilhada permanece
inalterada e sem certificação remota.

A nova execução backend/23RF15/E2E/pacote pertence ao próximo lote depois desse
ajuste e da revisão de seus deltas. O verify atual não será repetido neste lote.
A consolidação final distingue erros confirmados de caminho de quaisquer outras
falhas e conserva todos os relatórios. Não presumir que corrigir caminho garante
aprovação de produto.

6. Redirecionar os artefatos Playwright hoje gerados em frontend/tests/artifacts
   para o diretório externo de evidências do runtime. Foram24 arquivos adicionais;
   os860 inputs originais mantiveram os hashes, mas sourceFor rejeitou o conjunto.
   Preservar os24 e o manifest antigo. Não resolver ampliando o ignore ou
   regravando o snapshot como se os artefatos fossem inputs originais.

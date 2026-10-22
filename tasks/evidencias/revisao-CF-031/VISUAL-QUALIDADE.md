# Inspeção visual, contratos e qualidade

Inspecionadas capturas **desta** execução: mobile360 revisão/ações, etapa cartões, desktop1440 tema claro, tablet768 subtotal extenso e RC031-01. Elementos no topo da etapa não são prova dos campos abaixo da dobra. O harness percorreu as etapas, acionou controles por teclado e mediu scrollWidth, aguardando dois frames antes das capturas. Capturas não foram aceitas como snapshots por semelhança com as do executor.

No recorte observado, rótulos e botões quebram linha, revisão longa mantém ações alcançáveis por scroll, valores extensos e UNKNOWN/PARTIAL não se confundem com zero, e temas claro/escuro mantêm controles visíveis. O screenshot de RC031-01 demonstra exposição de **dado falso com privacidade desligada**, não vazamento com privacidade ligada. A primeira tentativa do próprio observador encontrou esse texto hidden e não foi aceita como exposição visual.

Inputs financeiros usam password em privacidade; PrivacyBlur usa visibility:hidden/aria-hidden e substituto acessível “Valor oculto”, sem transição de revelação. Testes de tela exercitam labels/aria-describedby, Escape e retorno de foco no modal, foco por issue e avanço. Não certificamos leitores de tela específicos, todos os contrastes ou cada frame de todas as transições. Zoom nativo200% permanece sem prova conforme DEC-ONB-03, sem nova tentativa da API nativa indisponível.

## Estrutura e custo

- Separação efetiva: input/model, validação de resposta, HTTP, store por owner, hook e apresentação. Backend de produto/schema não mudou no intervalo. Novo Java é harness. Não há motivação neste delta para Kafka, saga ou microsserviços.
- Carga inicial é uma sessão e cinco listas em lote; não há fetch por item. Escolhas são rótulos/IDs, não fontes monetárias numéricas legadas para o resumo. Falha de uma lista rejeita o conjunto de escolhas; trade-off é consistência simples com disponibilidade menor, explicitada na UI.
- Parser percorre payload/resumo, usa Map/Set; canonicalização ordena listas O(N log N), não O(N) total. Relações de origem incerta podem ser O(N×R). Não há nova query backend a otimizar/N+1 introduzida por esta entrega.
- RefField/availableRefs materializa opções e índices por controle: O(A×(C+D)); Fields filtra issues por campo. Inventário legado volumoso pode pressionar render/memória. Limites de entrevista reduzem o risco, sem provar desempenho de catálogo ilimitado. Refatoração prática futura: compartilhar índices de referências/issues por snapshot e medir antes de virtualizar. Não é bloqueio sem gargalo demonstrado.
- Store serializa ações e usa geração+AbortSignal. Evita update tardio e chave nova; custa bloquear edição enquanto aguarda rede. Testes exercitam A→B, unmount/reactivate, double-click e recovery; não prova todos os interleavings. Desativação limpa memória e não confunde abort com rollback.
- Validar invariantes de leitura é necessário, mas manter regras financeiras autoritativas no servidor. O resíduo RC031-01 exige conferir consistência de resumo, não duplicar elegibilidade/capacidade para autorizar operações. RC031-02 favorece validador comum em vez de validação parcial duplicada por local de uso.
- As mensagens do GET dizem que a avaliação é persistida; referência de revisão cancelada é identificada como captura anterior. Fonte sem vínculo não é liberada automaticamente; editor admite manter pendência/ASSIGN/CLOSE e o servidor continua decidindo prepare.

## CF032 e preservação de escopo

CF021/022/023/024/026 têm Estado concluida nos arquivos canônicos e implementação ancestral integrada. O delta CF031 não altera seus backends; alteração compartilhada de api.ts e novos consumidores foram inspecionados e passaram lint/tipos/build/testes pertinentes. Seus aceites não são reabertos apenas pelas três falhas preexistentes; limitações estão individualizadas.

CF031 continua em_revisao por doisP2 e não satisfaz o gate da CF032. CF032 permanece proposta, não executada/liberada. Jornada ampliada uso diário/exportação, dois usuários simultâneos e E21–35 reais não são exigidos como antecipação nesta revisão. Já confirmação/recuperação e validação de recibo são obrigações atuais CF031 e não podem ser transferidas à sucessora. Zoom e adoção real conservam seus gates separados.

# Complemento independente — geometria e presença

Brutos em `../controle-financeiro-runtimes/preparacao-adocao/revisao-pr3-parcial-2/`; derivados e hashes em [VISUAL.json](VISUAL.json). Produto e cenários originais não foram alterados. Fontes adicionais e argumentos exatos constam dos inputs de cada invocação. Não houve force click, retry, mudança de prazo, seleção genérica ou aprovação por existência no DOM.

## SAN-E2: observador de geometria inadequado — C

Quatro condições delimitadas:360 inicial→360 e1440→360, cada uma com PlaywrightsetFixedTime e com Date-only. As quatro assertions de boundingBox original reprovaram por null, antes/depois da captura. Isso não é um green obtido por retirar assertion.

O próprio locator resolve o span interno de PrivacyBlur, `display:contents`, conectado e com texto “Custo ou avaliação indisponível”. Esse span não tem caixa: rect0/0/0/0. O badge pai específico tem `display:flex`, opacidade1, rectx49/y481/width233,953125/height30; fica inteiramente no viewport360. Ancestrais também foram registrados. A evidência antes do resize já tem o mesmo span sem caixa: não depende da ordem de resize nem da troca de relógio. Não é explicação por zoom200%.

Fonte: `src/components/ui/privacyBlur.tsx` aplica classcontents quando a privacidade está desligada; `investmentsSummary.tsx` coloca a mensagem dentro desse wrapper. A API foi lida pelo ID criado, com tickerSANVIS, quantidade10, custo200 e avaliação null. O texto/estado correto não foi confundido com outra entidade.

As capturas live e animations-disabled mostram a mensagem; as oito imagens das quatro condições têm o mesmo SHA256 `14fe575039ee03470398d3c8d81ae73899e0bbe9553d661a6135ed53b738c957`. Isso sustenta pintura, além do dado/API/DOM. O hit-test registrado no ponto0/0 do span sem caixa aponta para o cabeçalho e **não** é usado como prova de interatividade do texto. Trata-se de texto informativo, não controle que precise receber foco. Foco de toda a tela e leitura integral de acessibilidade não foram certificados.

Conclusão: causa localC demonstrada, sem defeito de layout do produto demonstrado. O teste obrigatório ainda precisa de correção em lote próprio: observar o texto por Range/client rects ou a caixa específica do mesmo badge e preservar texto, clipping e limites do viewport. Não selecionar ancestral amplo para aceitar overflow. Contraprova deve detectar texto efetivamente fora/recortado. O exit1 remoto continua sem trace interno; não se atribui retrospectivamente essa causa exata a ele.

## SAN-D1: relógio do harness distorce saída de animação — B

A primeira invocação do complemento preserva duas falhas de preparação do novo probe: o adaptador assumia JSON em resposta sem corpo de criação da compra. Ambas ocorreram antes dos pagamentos; não são falhas do candidato. Somente esse adaptador foi ajustado para o mesmo tratamento de corpo vazio do helper original. A segunda invocação selecionou apenas os dois casos de presença que não tinham sido alcançados, mantendo as assertions financeiras originais e os mesmos prazos.

| Condição | Resultado | Evidência |
|---|---|---|
| PlaywrightsetFixedTime | Reprovada em dialogcount esperado0/observado1, depois de dois pagamentos100 | performance47980; document.timeline17298,714; animação650ms com startTime33250 e currentTime−15951,286, progress0/fillboth. O início está no futuro da timeline nativa |
| Date-only | Jornada inteira aprovada | Duas intenções distintas100; replay conserva operationId sem novo débito; payload divergente retorna409; conta800; invoice total300/pago200/restante100; reload e sugestão final100 preservados |

O Date civil continua15/01/2027 em ambas; o helper Date-only preserva performance/RAF/Web Animations nativos. As fixtures têm proprietários separados por cenário, mantendo o mesmo dono durante login/reload. Nenhuma autenticação ou operação financeira foi mockada. O SQL confirma as duas contas sintéticas em800 e faturas pagas200, cada uma com sua propriedade; esses valores não são somados entre usuários.

O controle positivo termina com o modal reaberto de propósito para conferir o valor100 e as três larguras. Por isso há dois dialogs no metadata final dos dois testes, mas são estados diferentes: o controle positivo tem o modal intencionalmente aberto; o caso vermelho falhou na remoção do modal após confirmação e conserva animação com início futuro. Não usar o total global de dialogs para inverter essa conclusão.

Conclusão: reprodução localB do relógio de harness, com efeito financeiro confirmado. Não é prova de falta de commit, perda de dinheiro ou dupla cobrança. Próximo lote pode empregar somente em SAN-D1 o helper civil já aceito, com contraprova do relógio antigo e mesmas assertions; não desativar animações globalmente. Essa revisão não implementa a correção e o wrapper obrigatório permanece aberto. Retorno de foco do fechamento não foi certificado pelo complemento e deve ser observado quando pertinente ao aceite de acessibilidade.

Contagens: `visual-complement` teve seis cenários vermelhos:quatro medições causais de geometria e duas falhas do próprio adaptador. `presence-complement` teve dois cenários:um vermelho e um verde. Cada invocação corresponde a um wrapper Maven reprovado. Não somar essas contagens aos seis resultados remotos nem apresentá-las como expanded integral.

## Correção da suspeita de imagem vazia

Durante a inspeção, uma prévia da capturaUI04 em360 parecia vazia abaixo do cabeçalho. A suspeita foi investigada antes de consolidar o parecer e **retirada**. Captura original da worktree, clone e controle restaurado têm os mesmos54325bytes/SHA256 `069321df47f453cabd106048845806a470fa2b13f8d2dbb03fadc58bf3edabf4`.

`verificar-pixels.mjs` decodificou o original com a dependência sharp já instalada. O bufferRGBA tem SHA256 `d3b754849c9da8fcb60565f255aa02a3f95bd75cbea268031d42bb698e9e8611`; PNG de inspeção re-encodificado sem alterar pixels produz o mesmo buffer e hash. A prévia normalizada foi inspecionada e mostraRVVIS, custo/avaliação indisponível e o restante do conteúdo. O original permaneceu intacto. Contagem de pixels distintos sozinha não foi usada como oracle de conteúdo; foram combinados decodificação, inspeção, texto e identidade.

Não há achado de captura vazia de produto/harness sustentado. O consumidorUI04 está aceito no recorte de transporte e estados observados; o verde nunca foi usado sozinho como prova visual. Essa correção de inspeção não elimina os observadores C e o relógio B demonstrados acima.

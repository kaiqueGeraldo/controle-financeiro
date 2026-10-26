# Contrato atualizado de sanitização

Contrato anterior: saneamento-CF-034/SANITIZACAO.md; residual independente: revalidacao-CF-034-saneamento/SANITIZACAO.md. Os documentos anteriores continuam snapshots intactos. Esta atualização limita-se aos formatos de escaping/truncamento e à proteção compartilhada; não muda ownership/cancelamento, gates financeiros ou fronteira de upload.

## Causas e precedência

A regra anterior tratava pares JSON com regex. Ao encontrar message, consumia todo o literal escapado e o devolvia intacto porque essa chave externa não era sensível. Um prefixo INFO fazia a entrada cair nesse caminho textual; a mesma estrutura sem prefixo já tinha visita recursiva. A regra de atribuição, por sua vez, tinha alternativas quoted/unquoted: com aspa incompleta, a alternativa unquoted ainda aceitava 'prefix e deixava o resto da senha.

A solução usa JSON.parse para documentos integrais e um scanner de delimitadores para texto. Não implementa outra gramática JSON nem adiciona dependência. Ordem:

1. Verificar tamanho. JSON integral válido usa parse/visita estruturada. Chave sensível substitui o valor inteiro; arrays/objetos e strings diagnósticas são visitados.
2. No texto, identificar literais entre aspas duplas sem confundir escapes com delimitadores. JSON.parse decodifica o literal. Chaves conservam grafia/escaping; valores/mensagens são sanitizados na forma decodificada e reescapados como literal se mudarem. Isso cobre envelope JSON com prefixo/sufixo e JSON serializado dentro de message/details. Não há unescape global da linha.
3. Fora dos literais JSON, uma única expressão de identificadores conhecidos, ancorada na posição atual, reconhece campos/cabeçalhos. Authorization/Proxy-Authorization/Cookie/Set-Cookie são ocultados até o fim do cabeçalho e suas continuações indentadas. Para password/secret/chaves/tokens, valor com aspa inicial exige fechamento; não pode cair na alternativa sem aspas. Valor sem aspas termina em whitespace, vírgula ou ponto-e-vírgula. Espaços Unicode são reconhecidos; campo sem valor antes de CR/LF é ambíguo e bloqueia a coleta, sem liberar um possível valor na linha seguinte.
4. Padrões históricos de JWT e senha sintética são preservados. A garantia não depende de JWT nem do nome/valor das sentinelas.

Chaves: password/passwd/secret, authorization/proxy-authorization, cookie/set-cookie, api_key/api-key/apikey, access_token/access-token/accesstoken e refresh equivalentes, sem distinção de caixa. Escapes JSON de chaves são decodificados. Campos não sensíveis, contagens/status/diagnóstico, prefixo e sufixo são preservados; documentos JSON e conteúdo JSON serializado sanitizado podem ser canonizados em formatação. Não se introduzem campos nem se decodifica o texto globalmente. JSON é interpretado por JSON.parse; duplicatas seguem essa semântica, e documento integral é reserializado, sem liberar uma ocorrência anterior descartada pelo parse.

## Limites explícitos

- Até **duas camadas de strings JSON serializadas**: envelope com message contendo JSON; também message contendo outro message serializado. JSON estrutural não aumenta esse contador por simples objeto/array; strings decodificadas o aumentam. Texto terminal sem novos delimitadores pode ser processado após a última camada. Havendo mais conteúdo estruturado/aspas além do limite, a publicação é bloqueada.
- Até **64 níveis estruturais visitados** de JSON; ultrapassar reprova. Valor inteiro de chave sensível pode ser substituído sem percorrer sua estrutura.
- **16MiB UTF-8** na entrada/saída de cada chamada pública do sanitizador. Não é um limite de captura do log bruto: o coletor existente lê o arquivo completo antes da chamada, sem streaming; não se promete impedir a alocação inicial do readFile. O limite controla processamento/decodificação e elegibilidade da representação publicável.
- JSON escapado sem uma moldura válida de literal (barra-aspas solta fora de string) é recusado, sem tentar decodificações heurísticas ilimitadas.
- Aspa de atribuição sensível não fechada até CR/LF/EOF: **erro constante e bloqueio de toda a coleta**, conservando o bruto privado. Aspas incompletas em valor de campo JSON reconhecido também reprovam. JSON sensível embutido com valor não escalar não delimitado com segurança é recusado; um documento integral válido tem a redação estruturada do valor inteiro.
- JSON obrigatório malformado reprova com SyntaxError de mensagem fixa, sem eco do conteúdo. Texto malformado sem campo sensível ou estrutura ambígua reconhecidos pode permanecer útil, por exemplo unclosed { diagnostic=keep e diagnóstico com aspa ordinária incompleta. Isso não é promessa sobre mensagens arbitrariamente corrompidas/entrelaçadas.

O scanner avança pelos delimitadores sem regex de backtracking sobre strings. A regex de campos possui nomes fixos e é sticky; a de escalares é delimitada. Cada camada faz trabalho proporcional aos bytes, com duas camadas e profundidade limitadas, além de alocações da visita/representação. Foram exercitados registro de1MiB no sanitizador e coletor, sob limite explícito de5s para cada operação, e entradas acima dos limites. Essa prova representativa não é certificação de qualquer payload/tamanho/plataforma.

Trade-off: mais código de leitura de tokens que a regex anterior, em troca de uma única precedência para literais/atribuições e ausência de fallback parcial. Entradas ambíguas ou excessivas deixam de ser publicáveis; o diagnóstico bruto continua local. Não há descoberta universal de segredos, base64 arbitrário, nomes de campos não declarados, formatos criptografados ou reconstrução de stdout/stderr irrecuperavelmente entrelaçados.

## Fronteiras reais preservadas

Runner mantém stdout/stderr somente no bruto local; console recebe status/erro tratado. Os dois coletores chamam sanitizeFile no arquivo completo. Portanto não há necessidade de remontar chunks dentro do sanitizador; o probe do runner fragmenta stdout e a leitura posterior usa o arquivo completo. Não se afirma proteção de console remoto que não foi executado.

Coletores inalterados: allowlists, destinos novos, staging privado, rename final apenas após sucesso, falha sem fallback bruto. Diretório public preexistente é recusado com exit1 e conservado em bytes; não é aprovação da execução atual. Workflow inalterado: upload diagnóstico exige collect.outcome success e seleciona somente public; pacote usa JAR e manifesto sanitizado, sob success. Inspeção estática não certifica execução de Actions.

Hashes distinguem bruto local e representação sanitizada em collection.json; o JAR tem identidade independente. Arquivos .env/auth-state/XML/SQL/cache/trace não entram no conjunto diagnóstico. Erros do sanitizador/coletores não incluem o texto rejeitado. Nenhum manifesto histórico foi atualizado para refletir representações novas.

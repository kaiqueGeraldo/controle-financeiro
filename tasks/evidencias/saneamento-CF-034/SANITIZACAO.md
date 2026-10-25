# Sanitização: causa, fronteiras e garantia

A expressão anterior exigia nomes sem aspas; em Authorization consumia apenas a palavra Bearer, e não tinha regra para Cookie. A reprodução independente com sentinelas sintéticas foi executada antes de editar. Não se afirma exposição real de credenciais.

| Fronteira | Comportamento corrigido |
|---|---|
| stdout/stderr dos comandos e do supervisor | Bytes gravados em logs brutos privados no runtime; não encaminhados ao console do runner |
| Console do runner | Nomes fixos de etapas/resultados e erro submetido à política comum; erro do sanitizador gera mensagem fixa, sem texto bruto |
| Relatórios JSON | Brutos locais preservados; representação publicável passa por parse/visita estruturada; JSON inválido reprova |
| Log textual/JSON embutido | Transformação do arquivo completo; chunks são reunidos no bruto antes da publicação |
| publish-evidence | Allowlist fixa, arquivos regulares dentro do runtime; escreve diretório privado pendente e só renomeia para public após sucesso completo |
| collect durável | Mesma política para cópias e resumos/casos; staging privado no runtime, destino final novo somente após sucesso; erro genérico no console |
| Artifacts declarados | Diagnóstico somente public/ e condicionado a steps.collect.outcome == success; pacote JAR em sucesso, manifesto na representação public/package-manifest.json |

JSON completo: chaves password/passwd/secret, authorization/proxy-authorization, cookie/set-cookie, api_key/api-key/apikey, access_token/access-token/accesstoken e refresh equivalentes são redigidas sem distinção de caixa. Objetos/arrays aninhados são visitados; chaves escapadas são decodificadas. O valor inteiro de uma chave sensível é substituído, incluindo objetos. Strings diagnósticas passam pelas regras textuais. Outros campos e tipos são preservados semanticamente; a formatação JSON pode mudar.

Texto: pares JSON de chave e valor escalar com escapes; atribuições usuais password/secret/chaves/tokens (aspas permitem espaços); cabeçalhos Authorization/Proxy-Authorization completos, Bearer opaco ou Basic, Cookie/Set-Cookie com múltiplos valores e continuação HTTP indentada. JWT com padrão definido e senhas sintéticas históricas continuam cobertos. Múltiplas ocorrências, caixa, espaços, escapes, objetos, multiline JSON e idempotência foram exercitados. JSON sensível embutido com valor não reconhecido/aspas incompletas bloqueia a coleta. Texto malformado sem campo sensível reconhecido continua diagnóstico.

Limites: não há descoberta universal de segredo arbitrário, conteúdo criptografado/base64 arbitrário, formatos de cabeçalho fora do padrão declarado ou texto fragmentado sem identificação do campo. stdout/stderr entrelaçados podem danificar estrutura; não se promete reconstruir mensagens arbitrárias. A barreira de console impede que a saída dos subprocessos vaze antes da sanitização; sanitizar artifact não apagaria console já emitido. Não há fallback para bruto em nenhum dos dois coletores.

XML/propriedades Surefire, .env, auth-state, perfil, SQL, traces, capturas e caches não são selecionados pelos uploads. A coleta durável gera resumos em vez de copiar esses brutos. Inventários de hash não carregam seus conteúdos. Os comandos/fontes e o JAR têm garantias próprias: não é auditoria geral de segredos do binário. O manifesto publicável tem SHA da representação separado do original; o SHA do JAR permanece identidade do produto, sem transformar o binário.

collection.json novo registra rawLocalSha256 e sanitizedSha256 por arquivo; o coletor durável mantém runtimeSha256/collectedSha256. Não foram corrigidos retroativamente hashes/bytes de coletas históricas. A falha mantém apenas material privado pendente e retorna não zero; upload diagnóstico depende do sucesso desse passo, e upload do pacote continua sob success padrão. YAML foi parseado/inspecionado localmente; sem certificação do serviço Actions.

Política compartilhada usa apenas Node nativo. Leitura integral custa memória proporcional ao maior arquivo permitido e elimina fronteira de chunks; visita JSON também custa alocações proporcionais à estrutura. A allowlist pequena reduz o volume e os formatos expostos. Não adiciona dependências, lockfiles ou mudança de regra financeira.

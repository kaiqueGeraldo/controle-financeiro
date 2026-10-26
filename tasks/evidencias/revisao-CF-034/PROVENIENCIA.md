# Cadeia do pacote e hashes históricos

## Cadeia independente da rodada11

Fonte `a5ad7a64794abca1cc852b11cc1bf79a156dafde`, runtime CF-034/11,
sourceDigest `191e8beb19382553d50946a4b97b83825f878d4c13cff689ca6e49bbc6d6f787`.
Artefato evidence-01/api-0.0.1.jar, 86.226.092 bytes:
`28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.

1. prepare exporta caminhos Git existentes (.github/backend/frontend e dois
   JSONs-oráculo) e registra commit/branch/status original. Não inclui raiz
   README, .env, caches, target, .next ou node_modules. Inclui POM, Maven wrapper,
   package-lock, recursos/migrações, configurações de build/testes e fontes.
2. source registra810 caminhos/SHAs ordenados e digest da lista. sourceFor
   recusa byte alterado, remoção (read falha), conjunto extra relevante e symlinks
   internos; arquivos de saída gerados conhecidos são excluídos. Arquivos fora
   dos escopos declarados não são cobertos e não devem virar inputs implícitos.
3. Auditoria leu cada input do runtime e cada correspondente no workspace;
   todos iguais por SHA. Manifest sourceFiles é exatamente a lista do descriptor.
   Nenhum input relevante difere entre a5ad7a6 e64603a3.
4. result11 é stage all/status passed; todas as nove etapas têm exit0, em ordem;
   manifest.commands coincide com result.steps. Controles/testes vieram dos
   relatórios brutos em evidence-01, com casos, seleção e hashes reconferidos.
5. SHA do JAR foi recalculado diretamente; coincide com manifesto, resultado e
   package-trace. Hashes do manifesto e resultado brutos também coincidem com
   package-trace. Relatórios e checkpoints SQL não foram copiados de10 para11.
6. Dependências frontend diretas efetivas conferidas em node_modules contra
   inventário, lockfile incluído; bibliotecas BOOT-INF/lib listadas por jar tf
   conferem com inventário. Maven POM identifica versões declaradas; não há
   lock hermético de todo download nem prova de segunda compilação idêntica.

O diff a5ad7a6..64603a3 só inclui tasks/README, canônico CF034 e documentação/
coletores/evidências da entrega. Esses scripts de coleta posteriores influenciam
a apresentação da evidência, mas não os810 inputs/compilação/testes da rodada11.
Seus resultados foram conferidos contra os brutos. Produto/build/testes/runner
relevantes são equivalentes; origem do binário continua a5ad7a6, não HEAD documental.

README modificado é expressamente excluído e seu hash preservado; descriptor
registra também documento canônico modificado e diretório CF034 não rastreado
na preparação. Isso não é atestado de árvore original limpa. Apenas o conjunto
de inputs relevantes tem correspondência comprovada com o candidato.

Novo diretório de saída é obrigatório, sem relatórios velhos dentro de `all`.
Marcadores são invalidados por fase. O comando `package` isolado, por outro lado,
aceita recibos da mesma fonte sem nova execução: contraprova reproduzida em rv01.
Seu stage é package, commands=[], não confundir com rodada all. Os recibos não
contêm run ID/suite/URI/hash dos relatórios, de modo que o arquivo standalone
depende de evidência externa para demonstrar origem dos testes. Essa limitação
não substitui nem invalida a cadeia completa conferida da11.

Fonte→inputs→comandos→casos/resultados→JAR→hash está sustentada nessa execução.
Rastreabilidade não garante reprodutibilidade binária, imagem Docker, boot do
JAR em ambiente publicado, distribuição frontend ou liberação de uso. E2E usa
Spring de teste com produto real, não uma implantação desse JAR.

## Históricos

Revisão releu os67 caminhos de historical-hashes.json e os objetos das três
bases d059bc9/e1a01b6/79ce089 via git show. Conteúdo versionado coincide em todos;
os bytes observados não mudaram desde o registro da entrega.

- Dez transformações efetivamente produzem SHA original; não se presume autor
  ou momento da mudança de representação.
- 57 entradas (51XML/6TXT) continuam sem representação bruta original reconstruída.
  Raw, LF e CRLF não reproduzem o hash original. Não foram chamadas equivalentes
  em bytes, nem semanticamente certificadas a partir de dados indisponíveis.
- Os57 não são inputs nem relatórios da rodada11. Não sustentam o pacote novo
  e não o bloqueiam por si; ele possui cadeia independente.

Nenhum manifesto histórico foi reescrito. Inventários inicial/final desta revisão
incluem os430 caminhos de runtimes históricos do preservation anterior,67 entradas
históricas, fontes da11, documentos CF034 e evidências externas alcançadas pelo
inventário (sem percorrer dependências/targets/junctions). É uma conferência dos
arquivos inventariados, não alegação de hash de cada byte de todos os discos.

O índice da entrega64603a3 foi reconferido separadamente:94 arquivos,85 com
identidade bruta e9 com CRLF→LF reproduzindo exatamente o blob. Isso está em
[versioned-check.json](versioned-check.json) e não resolve retroativamente as57
representações antigas. [restoration-check.json](restoration-check.json) também
confirma o descriptor/fontes restaurados da cópia09 e o hash do JAR no target
da11, além do artefato coletado. Nenhuma restauração foi executada nesta revisão.

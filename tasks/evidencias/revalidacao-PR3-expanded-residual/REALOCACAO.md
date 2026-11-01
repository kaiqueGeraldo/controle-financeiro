# Realocação e preservação conferidas

Revalidação independente em 01/11/2026, America/Sao_Paulo. Os registros históricos conservam suas datas e caminhos.

Worktree efetivamente usada: C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-worktrees\pr3-expanded-source. Branch codex/saneamento-pr3-expanded; candidato inicial limpo 4f22d41f5208aca16d334b3d5abbcd5de2841086. Base 965b93c77bce6cde0c4473272901817d221466a1, ancestral do candidato. Sete commits, de e79e68c2 até 4f22d41f.

O registro Git aponta exclusivamente para a localização nova; o ponteiro .git remete ao common-dir do principal. A raiz da worktree é uma pasta física. .r3 está ausente do principal e não foi recriada. Os comandos de Git usam explicitamente o destino novo. A primeira consulta restrita de status retornou erro de acesso; a mesma leitura pelo acesso autorizado confirmou a worktree limpa. Não era corrupção do registro.

Os inventários privados worktree-before.json e worktree-after.json da realocação foram relidos e comparados entrada por entrada: 36.114 arquivos, 1.634.276.589 bytes, cinco junctions. A única normalização documentada é o mtime do ponteiro .git; os bytes desse ponteiro são iguais. Os cinco destinos foram novamente lidos e estão disponíveis. Essa comparação atesta a movimentação histórica, não a ausência de mudanças posteriores autorizadas.

Os resíduos vazios r3-remnant-controle-financeiro-backend e r3-regenerated-empty-next continuam no runtime da organização, com inventários. Não houve exclusão, movimentação ou limpeza nesta revalidação. Os caches/instalações anteriores ficaram no destino movido; novas provas usam cópia física e cache novos fora dos checkouts.

Seis scripts operacionais passaram a obter o principal por git-common-dir, em vez da antiga suposição ../... Nos três scripts da revisão independente anterior, o diff contém apenas essa obtenção de caminho. Assertions, parsers, oracles e resultados históricos não foram substituídos. Os 21 arquivos do snapshot preservado antes das edições funcionais continuam com seus hashes. Isso não significa que os três scripts sejam byte a byte iguais à base anterior à realocação: a alteração operacional é explícita e foi examinada.

O principal permanece em c16e6545488c8f13efda4dab9efa8aa896fcddaa, branch codex/saneamento-cpa01-selecao-testes, somente M README.md preexistente. Seu README conserva SHA256 6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca. O README próprio da worktree conserva e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0. O checkout de publicação permanece limpo em 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88. Não houve restauração automática de README.

Os 97 arquivos do manifest histórico foram novamente calculados no principal e conferem. O manifest de 36 mantém SHA256 b16f787dfa72e721c59803c64696fd4d51be9aa557a5dc61214948f3f3c4f9e0; 29 entradas conservam os bytes e sete têm alterações delimitadas com originais arquivados. Os conjuntos 97/36 são verificados separadamente, sem presumir disjunção.

auditar.mjs reproduz essas verificações e emite audit-initial.json/audit-final.json no runtime novo. A revisão não reescreve manifests nem recibos antigos. Os novos commits contêm somente esta pasta de revisão.

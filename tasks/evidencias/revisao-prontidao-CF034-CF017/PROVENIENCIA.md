# Pacote e evidências remotas

Revisão de bytes existentes em 26/10/2026, sem recompilação nem repetição das
suítes. O verificador independente `verificar_evidencias.py` lê ZIPs sem extrair,
compara tamanho/digest com a API atual e confronta cada input com Git. Executado:

```powershell
python tasks/evidencias/revisao-prontidao-CF034-CF017/verificar_evidencias.py --runtime 'C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/CF-034/rem-integracao-01'
```

Foi usado o Python 3 do runtime de dependências do Codex, sem bibliotecas extras.
Resultado: PASS para cinco digests remotos, 820 inputs, JAR, configurações,
16 migrations empacotadas e contagens. Os ZIPs já baixados foram reutilizados
após igualdade exata com o digest atual; não se alega novo download nesta revisão.

| Artifact | Produtor | Digest SHA-256 do ZIP |
|---|---|---|
| [12657946856: tested-package](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40337346702/artifacts/12657946856) | main fb98645, run 40337346702/1 | f6451d8ff9cef01f7c610a7d818c44558182e91fd0c53e04cd840af4bfec934e |
| [12658201593: diagnosis](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40337346702/artifacts/12658201593) | mesmo produtor | 2ec8394307d6fc9bbd4efc01a8fe9e6753f3bc0ff623bcc1f13ccc28c9e541eb |
| [12655978610: contracts](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40335789742/artifacts/12655978610) | ddd5a41, run 40335789742 | ad927a1dbca7fd099b1e7295e6ec0ea6c3d4addddb6bf6d9ba3ae1b2488151f1 |
| [12656208348: ready](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40335789742/artifacts/12656208348) | mesmo probe | 8b2415c5e42272eab77626f40012b5cd9c95040d68d25b16b59dd95d6885286a |
| [12657281838: cleanup](https://github.com/kaiqueGeraldo/controle-financeiro/actions/runs/40335789742/artifacts/12657281838) | mesmo probe | 7c8972e36bae2ca21edb734c249277598f0282ba78cccc7c6ff35c7277bed5ed |

Retenção declarada nos workflows: 7 dias; API informa não expirados e vencimento
em **02/11/2026**, probes 11h01–11h03 e main 11h19–11h20, São Paulo. IDs,
tamanhos, datas UTC e produtores completos estão em `consultas-remotas.json`.
O pacote contém somente `api-0.0.1.jar` e `public/package-manifest.json`.
Diagnóstico: 12 membros permitidos, 11 hashes da coleta conferidos; sem XML com
properties, SQL, perfil de navegador, traces, dumps ou `.env`. Inventários dos
demais três ZIPs também estão em `proveniencia-verificada.json`.

JAR main: **86.225.965 bytes**, SHA-256
`c3860ec069aa893b8faed588f9a20904930a2937c0e8eb94818297651c85a9d9`.
O hash coincide entre bytes, manifesto, recibo do backend e resultado. Commit
produtor: `fb986456a37a48afcafef204f165d15354294d26`; sourceDigest
`9992001c93f43c541caa6a8de7e62058910132768636c99d1c5d8daa5e5e613b`.
Os gates frontend/backend/E2E usam esse digest, os comandos terminaram exit 0,
e POM/lockfile coincidem com os inputs. O conjunto completo dos 820 caminhos
também coincide com os caminhos relevantes da árvore Git, não apenas seus hashes.
Só `controle-financeiro-backend/mvnw.cmd` exige LF→CRLF conforme atributo
versionado; nenhuma normalização arbitrária foi aceita.

As 16 migrations e YAML/properties da aplicação dentro do JAR coincidem com as
fontes Git. Isso não compara bytecode de todas as classes nem dependências
transitivas individualmente: o elo entre compilação/testes/JAR é dado pelos
recibos da mesma execução e pelo controle de adulteração antes de copiar o JAR.
Não é assinatura independente da cadeia de suprimentos.

`inspecao-sensivel.json` não encontrou padrões conhecidos de chave privada,
token GitHub/AWS/Resend, JWT ou URL com credencial nos JSON/logs dos cinco ZIPs.
Também foram conferidas ausência das sentinelas sintéticas, paths, duplicatas e
hashes de coleta. Recursos do JAR não incluem `.env`/keystores/chaves privadas
pelos nomes inspecionados e suas configurações correspondem às fontes com
placeholders. Não foi encontrado segredo concreto a tratar; isso não garante
detecção de qualquer segredo opaco. Um achado futuro deve registrar categoria e
local, restringir o artifact afetado e avaliar revogação com autorização própria,
sem reproduzir valores.

O log de apresentação atual do job foi consultado via conector; somente excertos
selecionados sem credenciais foram versionados. Os originais completos privados
do runtime continuam com os recibos de recusa do sanitizador (JSON malformado),
sem fallback bruto. A recusa desse canal não invalida os artifacts finais
sanitizados, que são outra representação. Nenhum original foi copiado ao Git.

## Pacotes que não se confundem

| Pacote | Relação correta |
|---|---|
| Histórico a5ad7a64794abca1cc852b11cc1bf79a156dafde | JAR histórico/810 inputs; aceites preservados; não certifica o pacote main |
| Run 40327234898, checkout e2ce3ade53d203037c2df068a7aa267c1bae00df | JAR 4ae18379f6d21c709a76c6e7ac0c1c1ff81201574037ddab1352464c04c35554; cadeia anterior versionada |
| Run 40331734258, HEAD187a167, checkout cc58cdb | JAR 2674c8eead6db9527cbca6436d1b269666a6fe3ee4ebb72cc2b22229300bd09c; prova anterior em CF-034-remota/package-chain-40331734258.json, não reauditada aqui |
| PR run 40335795628, checkout a8278275ca523c5da1902a9818860bd592634534 | JAR 5b825fee74a7bfac9887525d6347ffade3dcad34720940ab6cc9c7ce449df4f1, apenas registrado no relatório; não reauditado aqui |
| Main run 40337346702, fb98645 | JAR c3860ec0… independentemente conferido nesta revisão |

`187a167ab89f7836632dabb4d1c9f72bce4f1349` é documental; não compilou outro
pacote. `ddd5a41` também muda `vercel.json`, que integra os inputs: não é somente
documental. O merge tem árvore igual a ddd5a41, e a CI main efetivamente
checkoutou o merge; não foi necessário atribuir um pacote antigo a ele por
equivalência presumida. Os novos commits desta revisão excluem os inputs do
manifesto e não recebem nova compilação por isso. Manifests históricos e as
57 representações brutas não reconstruídas não foram usados como prova do JAR
novo. Hash igual no download prova integridade dos bytes, **não** build binário
reproduzível. Nenhuma imagem de release foi produzida ou certificada.

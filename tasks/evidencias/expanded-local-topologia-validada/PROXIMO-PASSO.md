# Próximo passo delimitado — lacuna do preparador

Primeiro bloqueio confirmado: preparar-proxima.mjs:3 recusa o nome
expanded-local-20261103-01 exigido pelo pedido. O wrapper proxima-rodada.ps1
aceita a raiz e confirma o daemon, mas a asserção seguinte impede a exportação.
A falha original e o exit 1 ficam preservados; zero retries.

## Mudança mínima preparada, não aplicada

CORRECAO-PROPOSTA.patch troca apenas a validação de prefixo de basename por uma
lista de duas convenções explícitas: revisao-plataformas-docker- e expanded-local-.
Não modifica ci.mjs, produto, testes, seleção, required, guard, Ryuk, timeouts,
retries, root permitido, recusa de runtime existente ou conferência de 860 hashes.

Benefício: torna o preparador compatível com o diretório exigido e preserva
comandos antigos. Custo/risco: admite uma segunda convenção de nome; a fronteira
de diretório continua no wrapper. git apply --check demonstra aplicabilidade,
sem provar comportamento de execução. O predicado mantém custo O(L) no tamanho
do basename, com duas comparações constantes; não altera concorrência ou queries.
Não há razão para mudanças em domínio, SQL ou transações neste saneamento.

## Lote seguinte necessário

Autorizar separadamente aplicação e verificação da mudança no preparador,
com diff revisado e controle de nomes permitidos, raiz inválida, destino existente
e integridade das fontes. Não converter a proposta em aceite automático.

Depois disso, criar execução nova expanded-local-20261103-02 ou outro nome novo,
reconferir candidato/manifest/toolchain/daemon, reaproveitar o InfraProbe existente
na topologia Windows, executar os contratos CI/seleção antes do all e seguir a
matriz sem dispensas. Não copiar markers, outputs ou resultados desta tentativa
ou das provas antigas. Os 860 inputs de produto continuam iguais nesta rodada,
mas devem ser atestados novamente para a próxima.

Frontend Windows é o que o all preparado executa; frontend Linux pode ser citado
somente como evidência anterior aceita. JVM Windows cobre 116 classes por união,
incluindo o contrato específico sem execução duplicada. Backend Linux no Actions
e resultados remotos continuam fora dessa certificação.

Qualquer falha posterior exige preservação e diagnóstico próprio, sem aumento
de timeout/retry ou ampliação da DEC-ZOOM-05. Manter A25=B2+C23 e todos os controles
obrigatórios, relatório por identidade e candidato/digest/runId.

Somente após gates atuais aprovados produzir o pacote e avaliar evidências.
Push/PR/CI remota/merge/deploy/banco real continuam exigindo escopo e autorização
próprios; não fazem parte da correção proposta nem desta tentativa.

# DEC-CI-04 — Liberação local condicionada da CF-034

24/10/2026. Autoridade: autorização expressa do usuário nesta execução.
Base conferida: `79ce0895630f025cce898950797df66f391bfa09`, após a análise
`0f787eb`/`79ce089`, sobre produto integrado `e1a01b6`.

## Decisão e alcance

Aprovar o recorte A da [PROP-CF034-01](../../../tasks/evidencias/CF015-zoom-gate-CF034/PROPOSTA.md).
CF034 pode avançar exclusivamente em preparação, implementação, testes e revisão
**locais/descartáveis de CI**: lint, tipagem, testes/build, PostgreSQL e E2E reais,
diagnóstico/propagação de falhas, contraprovas causais e rastreabilidade do pacote.
A aresta CF015→CF034 distingue prontidão deste recorte de aceite integral.
Registrar `pronta` para o recorte antes da execução e `em_revisao` ao entregá-lo;
não marcar critérios integrais sem a evidência exigida.

Inclui scripts de infraestrutura em `.github/scripts/` e adaptadores/testes do
harness existente quando necessários para compartilhar os mesmos comandos entre
local e CI. Essa extensão dos alvos da tarefa evita dois pipelines divergentes;
não autoriza mudar regras financeiras, assertions para acomodar implementação,
ignores, skips, mocks internos de sucesso ou correções paralelas de produto.
Runtimes novos: `../controle-financeiro-runtimes/CF-034/<execucao>/`, sem limpeza
de históricos, `target` geral, reset destrutivo ou runtime na raiz Git.

CF026/032/033 possuem aceites locais integrados; conferir mudanças posteriores,
seleção e resultados na base realmente executada. A implementação será submetida
a **outra execução de revisão independente**, não autoaprovada pelo executor.

## Condições preservadas

- CF010/015 continuam `em_revisao`. Zoom nativo 200% não foi validado, aprovado
  ou convertido em defeito. Não repetir sua investigação nesta tarefa.
- A preparação/testes locais não aprovam uso, homologação ou produção. Aceite
  integral CF034 continua condicionado à CF015 e aos seus critérios completos.
- Execução local equivalente não prova runner, expressões, permissões ou bloqueio
  de avanço no GitHub Actions. Resultado remoto não executado permanece pendente.
- Adoção real CF017/P01/P02 continua condicionada. Sem banco real, baseline ou
  migração operacional, writers, notificações reais, deploy manual ou pacote
  publicado para consumo externo. Nenhuma sucessora recebe liberação automática.
- DEC-ONB-03 conserva seu alcance exclusivo CF031; não é alterada retroativamente.

## Publicação autorizada e responsabilidade

Publicar/integrar somente `0f787eb`, `79ce089` e o commit documental desta decisão
no remoto `https://github.com/kaiqueGeraldo/controle-financeiro.git`, sem force.
Depois criar `codex/cf034-ci-local` da base integrada. **Implementação CF034 fica
local**, aguardando revisão independente. README preexistente, runtimes e trabalho
alheio ficam fora dos commits. Gatilhos automáticos desse push foram aceitos pelo
usuário; isso não autoriza configurar/acionar deploy manual.

Executor CF034 responde por isolamento, provas, hashes e limites; revisor dedicado
confronta a entrega e sua matriz; usuário mantém a decisão sobre publicação futura
e uso. A mudança permite detectar regressões sem esperar capacidade de zoom, ao
custo de manter dois aceites distintos e reavaliar a acessibilidade antes do uso.

As 67 divergências de hashes brutos serão verificadas sem reescrever manifests.
Relacionar bytes observados, transformações demonstradas e objetos aprovados;
incerteza histórica não pode ser atribuída automaticamente a CRLF. O pacote novo
será vinculado às fontes e resultados **da mesma execução**, não a logs antigos.

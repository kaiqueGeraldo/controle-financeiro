# CF-034 — publicação controlada e validação remota

25/10/2026. Etapa operacional autorizada pelo usuário, estendida por pedido
expresso de revisão das integrações Railway/Vercel. Aceite local DEC-CI-04 e
RCI034-01/R1 preservados; CF-034 integral continua **em_revisao**.

**Resultado atual: publicação parcial, sem integração.** Branch publicada até5593e4e;
[contratos Linux, artifacts baixados, cancelamento/cleanup e limites](RESULTADOS.md).
PR ainda não enviada após403 e recusa automática do navegador; proposta preparada
aguarda confirmação. Gates de produto e JAR novo ainda não executados nesta etapa.

## Entrada, lote e preparação

- Branch `codex/cf034-ci-local`, HEAD aprovado `4d20fb00f929f70cd2fe30b7a3d9aab004526547`.
- Main remota consultada por Git e API: `272001f7b4c39aebd18bdcd856109f9a0f6c1213`.
  Ancestral do lote, 18 commits locais de entrada, sem divergência remota.
- Staging inicial vazio; somente README raiz preexistente modificado, com hash
  `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
- Inventário inicial: 14.640 arquivos observados, incluindo runtimes e manifests
  históricos. Não reescrever as 57 representações antigas não reconstruídas.
- Intervalo aprovado: 232 arquivos, 7.392.443 bytes em blobs; dois inventários
  textuais acima de 1 MiB (1.128.239 e 3.046.100 bytes). Nenhum JAR, runtime,
  README raiz, .env, credencial privada ou pacote histórico adicionado ao lote.
  Busca de padrões selecionados de credenciais sem ocorrência; isso não equivale
  a descoberta universal de segredos. Sentinelas sintéticas históricas são provas.

O commit operacional `087fb19d9702de5f70c3e9777877742443b2eca8` adiciona probes
sintéticos remotos, proveniência Actions/Maven/Java e bloqueio Vercel **somente**
da branch autorizada. Nenhuma regra financeira, assertion, timeout existente,
retry, secret, infraestrutura de produção ou gate existente foi flexibilizado.
O sanitizador compartilhado aceito não mudou; apenas `maven-version.log` foi
adicionado à mesma allowlist sanitizada. O diagnóstico de cleanup sintético é
coletado também quando a observação falha, sempre por `public/`, sem fallback bruto.

Validação local dos ajustes: 12 contratos Node passaram, zero skips/falhas;
experimentos sintéticos propagaram exit 23 de subprocesso e bloquearam as etapas
seguintes; validador real recusou relatório obrigatório ausente; gate real de
pacote recusou bytes sintéticos adulterados, restaurados por SHA256; coletor real
removeu sentinelas e recusou aspa incompleta. Não são novas suítes financeiras.
Ambos YAMLs parseados e escopo exato da regra Vercel conferido.
Runtimes novos `CF-034/rem-preflight-01` e `rem-preflight-02`; nenhuma limpeza.

Falha de preparação preservada neste registro: primeira tentativa de inventário
leu saída Git com quoted paths e não encontrou um caminho Unicode. Classificação:
harness deste preflight. Corrigido para caminhos delimitados por NUL, inventário
reexecutado com sucesso. Não é arquivo histórico ausente nem defeito de produto.
Consulta Git inicial sob rede restrita falhou no DNS; consulta autorizada fora
da restrição confirmou a main. Nenhuma restauração foi feita por essas falhas.

## Execução e rastreabilidade

[Matriz](MATRIZ.md), [Git inicial](git-initial.json),
[inspeção GitHub](github-inspection.json), [auditoria do lote](publication-audit.json),
[configuração Railway](platform-inspection.json), [inspeção do navegador](browser-inspection.json).
Resultados remotos efetivos constam em [RESULTADOS](RESULTADOS.md), por run ID,
tentativa, job, checkout e artifact; o planejamento não aprova execuções pendentes.

Workflows: `CI integrated gates / required` via PR, e
`CF034 synthetic remote probes / contracts,cancellation` via push desta branch.
O segundo é experimento de falha esperada; seu cancelamento não é resultado dos
testes de produto. `expanded` permanece condicionado ao preparo dos 15 harnesses
históricos; sem marcação de aprovação por estar configurado.

## Decisão pendente para main e estado das aplicações

**Não integrar a main enquanto seus gatilhos puderem implantar a aplicação.**
Railway tem produção conectada à main, Wait for CI desligado, backend/PG offline,
PR Environments desativado. O último push documental foi SKIPPED por ausência de
mudanças no watch path, não por um bloqueio geral de deploy.

Vercel está **ativa**: Production Ready em `272001f`, autoassign de domínios ligado,
main em produção, previews de outras branches e nenhum Deployment Check. Root
Directory frontend e Node24 corretos. O bloqueio versionado protege só a branch
CF034 e não autoriza deploy na main. É necessário decidir a desativação explícita
dos gatilhos da main antes de integrá-la, preservando o deploy atualmente servido.
Wait for CI/Deployment Checks podem proteger uma futura publicação, mas CI verde
seguida de deploy continua fora da autorização desta etapa.

A main não possui proteção nem ruleset efetivo. Essa ausência não dispensa os
gates exigidos pelo usuário. Permissões globais de Actions requereram autenticação
na API pública (401); workflow limita GITHUB_TOKEN a contents:read, checkout não
persiste credenciais, não usa pull_request_target, secrets ou environments reais.

## Limites preservados

Nenhum banco real, deploy manual, promoção, secret ou infraestrutura de produção
alterado. Nenhuma sucessora iniciada. Sem aceite integral, Ctrl+C nativo, zoom200%,
adoção real CF017/P01/P02 ou garantia de produção. O JAR histórico continua
exclusivamente do candidato a5ad7a6; nenhum pacote novo foi produzido na preparação.

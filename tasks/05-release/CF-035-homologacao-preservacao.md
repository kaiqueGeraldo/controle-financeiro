# CF-035 — Preparar homologação, backup e reversão

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-017](../03-integridade/CF-017-migracoes.md), [CF-034](../05-release/CF-034-gates-ci.md)
- Origem: T-012; prontidão Railway/Vercel

## Problema e resultado esperado

Backend Railway está desligado e o estado do banco não foi confirmado. Preparar ambiente e ensaio de publicação preservando dados existentes.

## Escopo e referências

- `docs/sdd/validacao-deploy.md`
- `controle-financeiro-backend/src/main/resources/`
- `controle-financeiro-backend/Dockerfile`
- `controle-financeiro-frontend/next.config.ts`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Identificar projetos/serviços/ambiente em leitura e verificar destino, versões, variáveis por nome, health/readiness e fuso.
2. Confirmar existência de dados e realizar backup/restauração autorizados em destino isolado; ensaiar migrações sem usar produção nos testes.
3. Homologar frontend/backend, validar logs sem segredos e escrever runbook de promoção/rollback compatível com schema.

## Aceite e testes adversariais

- [ ] Restauração é comprovada, não apenas arquivo de backup existente; checksum/revisão/schema registrados sem dados pessoais.
- [ ] Smoke HTTPS/autenticação/entrevista/operação/reload/exportação passa na homologação.
- [ ] Sem informação/acesso ao banco, registrar bloqueio da promoção e manter produção intacta; não inventar sucesso de backup.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Criar infraestrutura duplicada, apagar volume ou resetar banco existente; publicar produção nesta tarefa.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-035/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


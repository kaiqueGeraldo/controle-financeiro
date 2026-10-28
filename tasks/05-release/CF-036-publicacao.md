# CF-036 — Publicar versão validada e verificar produção

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-033](../05-release/CF-033-revisao-adversarial.md), [CF-034](../05-release/CF-034-gates-ci.md), [CF-035](../05-release/CF-035-homologacao-preservacao.md)
- Origem: T-012; primeiro uso diário

## Problema e resultado esperado

Promover somente o artefato e schema ensaiados, com rollback conhecido e evidência de prontidão completa.

## Escopo e referências

- `docs/sdd/validacao-deploy.md`
- `tasks/evidencias/`
- `projetos Railway e Vercel identificados em CF-035 (destinos externos)`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Revisar gates, risco residual e autorização do pedido em execução; confirmar o destino exato antes de mutações remotas.
2. Publicar a revisão validada, executar smoke em conta sintética autorizada e verificar readiness/logs/persistência.
3. Registrar URLs, revisão, horários, resultados, observabilidade inicial e procedimento de reversão; tratar falha antes de declarar disponível.

## Aceite e testes adversariais

- [ ] Nenhum P0/P1 crítico pendente; backup/restore e compatibilidade da migração comprovados.
- [ ] Login, onboarding novo, operação e reload funcionam via HTTPS sem expor tokens ou afetar registros reais.
- [ ] Versão efetivamente publicada corresponde ao teste; falha de smoke aciona plano documentado e impede declaração de sucesso.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Publicar só porque o build passou, usar dados reais como fixture ou mudar schema sem plano de reversão.

## Modelo e revisão

A tarefa envolve decisão de contrato ou revisão crítica entre domínios; o esforço adicional se concentra em ambiguidades e riscos. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Revisão independente de28/10/2026:
[startup local aceito e histórico inconclusivo não bloqueante para preparação](../evidencias/revisao-startup-HQL/README.md).
Aceites RVPLA/resume, TCP e EPERM posteriores preservados. Os impedimentos de
startup/observador citados nas notas antigas abaixo são históricos nesse alcance.
CF036 permanece proposta: revisão/publicação do candidato, CI/matriz, homologação,
backup/compatibilidade e gates de uso/produção continuam próprios. Sem deploy.

Revisão independente de26/10/2026:
[parecer A–G](../evidencias/revisao-preparacao-local-adocao/README.md). Vínculo do
pacote aprovado localmente não libera publicação/ativação/uso. Startup, saneamento
do observador e gates integrais/reais permanecem; configuração somente proposta.
Estado proposta e checkboxes mantidos; nenhum deploy/publicação foi executado.

Preparação correlata de26/10/2026: [lote local de pacote e controles](../evidencias/preparacao-local-adocao/README.md),
em_revisao e com startup estável ainda não certificado.
Nenhuma publicação/configuração/deploy executados. CF036 permanece proposta;
pacote local testado não é aceite de produção nem liberação dos critérios acima.

Ainda não executada. Usar `tasks/evidencias/CF-036/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


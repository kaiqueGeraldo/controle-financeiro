# CF-036 — Publicar versão validada e verificar produção

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-6-astra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-033](../05-release/CF-033-revisao-adversarial.md), [CF-034](../05-release/CF-034-gates-ci.md), [CF-035](../05-release/CF-035-homologacao-preservacao.md)
- Origem: T-012; primeiro uso diário

## Expanded local estabilizada no recorte DEC-ZOOM-05 — 03/11/2026

Preparador e observador de cleanup saneados localmente, controles 8/8 e 4/4; preflight Windows aprovado. Candidato a7f2256b, mesmos 860 inputs de 0aac7ccd. Contratos 43/43 por plataforma, lint/tipos e 18 temporais Linux aprovados. Componentes Linux 624/626, dois timeouts de 5000 ms de causa inconclusiva; zero skips e nenhuma omissão no multiconjunto dos 71 arquivos. Fluxo interrompido; builds, backend comum (115 classes), RF15 (23 jornadas), E2E e pacote não alcançados. Contrato Windows independente 1/1 aprovado, cobertura Java executada1/116. [Resultado, proveniência e próximo saneamento](../evidencias/expanded-local-estabilizada/RESULTADO.md). Ajustes operacionais aguardam revisão conjunta; sem autoaprovação, prontidão de publicação, CI remota ou ação remota. CF010/CF015 seguem pendentes sob exceção delimitada; CF017/P01/P02, adoção e produção mantêm gates.

## Expanded local do recorte autorizado pela DEC-ZOOM-05 — 03/11/2026

Tentativa no candidato f6297df8 **bloqueada no preparo**, exit 1: o preparador exige prefixo revisao-plataformas-docker-, incompatível com o runtime expanded-local- exigido. Nenhum gate de testes, RF15, E2E financeiro ou pacote foi iniciado. Seleção estática Windows116 = comuns115 + contratoWindows1 conferida; zero classes executadas. Lacuna e patch mínimo preparados, sem aplicação ou correção de implementação. [Resultado, primeira falha e próximo lote](../evidencias/expanded-local-topologia-validada/RESULTADO.md). CF010/CF015 continuam pendentes com exceção delimitada; CF017/P01/P02, adoção e produção mantêm gates. Sem prontidão para publicação/CI desta rodada, sem ação remota.

## Saneamento local das plataformas — 03/11/2026

Componentes Linux626/626 por identidade, builds Windows/Linux e contratos43/43 por plataforma verificados localmente. A expanded avançou ao backend115, mas reprovou pela topologia Docker Desktop: host.docker.internal recusado corretamente pelo guard de banco descartável. Diagnóstico host/loopback também reprovou na conexão Ryuk. 23 jornadas reais RF15, E2E financeiro e pacote não alcançados. [Causas, resultados e próximo lote](../evidencias/saneamento-expanded-plataformas/RESULTADO.md). DEC-ZOOM-05 mantém somente seus dois adiamentos; CF010/015 pendentes, revisão independente da seleção e deste delta ainda necessária. Reprovação remota histórica não encerrada por este lote; sem liberação de PR, merge, adoção ou produção.

## Continuidade delimitada — 03/11/2026

[DEC-ZOOM-05](../../docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md): zoom **pendente, com exceção temporária autorizada para a continuidade delimitada**. Somente os dois casos exatos ali registrados são adiados na expanded desta etapa. Estados e aceites integrais permanecem; não há autorização de uso, deploy, produção ou ação remota. [Matriz e plano correntes](../evidencias/excecao-zoom-expanded/MATRIZ.md) substituem somente a regra de continuidade desta etapa; notas datadas abaixo conservam seu alcance histórico. Implementação/gates/resultados aguardam revisão independente.

Rodada local DEC-ZOOM-05: expanded **reprovada/incompleta** no gate Linux de componentes; backend/navegador/pacote não alcançados. Não pronta para atualização remota da PR. [Resultado, identidades e saneamentos delimitados](../evidencias/excecao-zoom-expanded/RESULTADO.md).


## Problema e resultado esperado

Atualização de28/10/2026: CPA-01/R1 encerrado localmente em81b20bca (registro de execução privado).
Consolidação recebe parecer A para publicação controlada e CI remota mediante
autorização própria. CF036 permanece proposta; isso não autoriza deploy, ativação,
adoção ou produção. Gates de CF017/034/035, zoom e configuração remota preservados;
notas CPA anteriores são históricas. Nenhuma ação remota nesta revisão.

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

Revalidação CPA-01 de28/10: seleção aceita, R1 de agregação required aberto (registro de execução privado).
Parecer C mantido por R1; publicação/CI futura dependem de saneamento e revisão.
CF036 permanece proposta, sem deploy, adoção ou uso liberados por associação.

Consolidação de28/10/2026: parecer C e publicação futura preparada (registro de execução privado).
CPA-01/P2 confirma incompatibilidade seleção Windows/job Linux; saneamento e
revisão separados antes de novo parecer de publicação/CI. Aceites locais de
produto/startup40s/TCP/RVPLA/audit preservados. CF036 permanece proposta: sem
liberação de deploy/uso por CI, sem publicação, banco real ou configuração remota.

Revisão independente de28/10/2026:
startup local aceito e histórico inconclusivo não bloqueante para preparação (registro de execução privado).
Aceites RVPLA/resume, TCP e EPERM posteriores preservados. Os impedimentos de
startup/observador citados nas notas antigas abaixo são históricos nesse alcance.
CF036 permanece proposta: revisão/publicação do candidato, CI/matriz, homologação,
backup/compatibilidade e gates de uso/produção continuam próprios. Sem deploy.

Revisão independente de26/10/2026:
parecer A–G (registro de execução privado). Vínculo do
pacote aprovado localmente não libera publicação/ativação/uso. Startup, saneamento
do observador e gates integrais/reais permanecem; configuração somente proposta.
Estado proposta e checkboxes mantidos; nenhum deploy/publicação foi executado.

Preparação correlata de26/10/2026: lote local de pacote e controles (registro de execução privado),
em_revisao e com startup estável ainda não certificado.
Nenhuma publicação/configuração/deploy executados. CF036 permanece proposta;
pacote local testado não é aceite de produção nem liberação dos critérios acima.

Ainda não executada. Usar `tasks/evidencias/CF-036/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

## Revisão independente de plataformas — 03/11/2026

[Seleção DEC-ZOOM-05 e saneamentos aceitos no alcance local](../evidencias/revisao-expanded-plataformas-docker/PARECER.md), com zoom/CF010/CF015 ainda pendentes sob exceção delimitada. A alternativa JVM Windows no Docker Desktop passou o preflight mínimo e 9 testes dirigidos; isso libera apenas a tentativa de uma nova rodada integral no ambiente identificado.

CF-036 não está aprovada para publicação/integração por esse resultado. A rodada reprovada não produziu JAR novo; 23 jornadas reais RF15, E2E financeiro e pacote não foram alcançados. Exigir [nova execução completa](../evidencias/revisao-expanded-plataformas-docker/PROXIMO-LOTE.md), relatórios atuais, pacote vinculado às fontes e autorização da etapa externa. Nesta revisão: sem push, PR, CI remota, merge, alteração de hospedagem, deploy ou banco real. CF-017/P01/P02 preservam critérios próprios.

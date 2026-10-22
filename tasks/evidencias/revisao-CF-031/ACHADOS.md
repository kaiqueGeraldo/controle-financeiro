# Achados independentes — candidato 0f0b619

21/10/2026. Nenhuma correção de produto. Severidade P2: corrigir antes do aceite local.

## RC031-01 — P2 — recuperação aceita caixa livre incoerente

- Local: `controle-financeiro-frontend/src/services/onboarding/result.ts:132–145` (reconciliação incompleta) e `:219–222` (recibo do GET sem preparação anterior).
- Reprodução: `probes.test.tsx`, caso RC031-01. O controle E01 original passa. Na sessão COMPLETED, conservar identidade, payload, mapping e hashes; mudar somente `metrics.freeAccountCash.value` e `knownSubtotal` de `950.00` para `999999.00`.
- Esperado: recusar resposta incoerente. E01: contas 1300 − reservas em contas 350 = caixa livre 950; as fontes também somam 950 de livre. Não usar o resumo para declarar conclusão validada.
- Observado: `parseSession` resolve normalmente. `receipt-browser-probe.mjs` reproduziu no navegador depois de commit real via BFF/Spring/PostgreSQL: heading “Entrevista concluída”, caixa livre **R$ 999.999,00** visível. Nova leitura direta do servidor conserva **950.00**. Ver `RC031-01-browser.json/png`.
- Critério: SPEC-001 §5, tabela de reconciliação e “cada soma deve reconciliar com suas parcelas”; CF031 trabalho3/aceite3; pedido §§7–8, resposta adulterada sem sucesso indevido.
- Causa: são conferidos patrimônio, contas, investimentos e dívida/crédito, mas não a relação de livre/reservas com seus componentes. A comparação integral com `prepared.summary` protege confirmação na mesma montagem; não protege o recibo recuperado por GET após reload. `contentHash` autentica a correspondência do payload, não a consistência de todas as métricas.
- Impacto: resumo financeiro falso apresentado como confirmado, sem corrupção do banco demonstrada. Não é duplicação financeira nem defeito de atomicidade backend.
- Encerramento: validar as relações possíveis com os componentes e estados recebidos, inclusive agregados e parciais, sem transformar isso em autorização financeira local. Reprovar esta adulteração em GET/reload e preservar E01/E16–35, UNKNOWN/PARTIAL, negativos e agregados acima de M. Revalidar tela e recuperação real. Não exigir recomputar reviewHash sem sourceSnapshot/mappingPreview, ausentes do recibo por contrato.

## RC031-02 — P2 — validação incompleta da estrutura de reservas no recibo

- Local: `controle-financeiro-frontend/src/services/onboarding/result.ts:45–67` e `:126–130`.
- Reprodução A: no resumo normativo com reserva de meta KNOWN, mover `goal.value` de propriedade própria para o protótipo. O controle próprio passa; `Object.hasOwn(goal, 'value')` é false; `parseReceipt` ainda aceita. O mesmo padrão de leitura sem exigência de membros próprios ocorre nas variantes de atribuição.
- Reprodução B: acrescentar `reservationChanges` com identidades/revisões/nominais válidos, mas `previous.goal`, `previous.attribution`, `proposed.goal` e `proposed.attribution` iguais a null. `parseSummary` aceita. Este caso usa valores representáveis em JSON, sem depender de protótipos na rede.
- Esperado: validar `LegacyReservation` integralmente em todos os lugares onde aparece e exigir propriedades próprias nas variantes; null não é Fact nem Attribution.
- Observado: dois probes de rejeição falham por aceitação, sem erro de fixture/importação. Ver `probes-expanded.log`.
- Critério: SPEC-001 §4 (membros próprios, inclusive respostas), §5.1 (`LegacyReservation`, `Fact<Ref GOAL>`, união Attribution), §5 (antes/depois); pedido §7, campos próprios versus herdados nos parsers.
- Impacto: reserva inválida pode atravessar a fronteira de leitura e ser exibida como parte do recibo/revisão. Não foi demonstrado que o servidor atual produza essa estrutura; o defeito é a garantia explícita de rejeitar resposta inválida. A variante herdada é prova de parser, não alegação de ataque HTTP por protótipo.
- Encerramento: reaproveitar um validador integral de LegacyReservation/Attribution nas reservas e nas mudanças antes/depois; exigir campos próprios nas variantes; testar formas ausentes, null, herdadas, partes, referências e nominal coerente. Manter aceitação dos exemplos normativos válidos e recusar os dois probes.

## Ocorrências e hipóteses separadas

- RI031-T01: timeout inicial da jornada de rascunho em 1440/Kiritimati na primeira rodada real. Snapshot do erro ainda mostra loading; captura posterior mostra formulário renderizado. Não é prova de invisibilidade permanente, nem de causa em fuso/animação. Rodada original preservada; ver EXECUCOES.md. Não aumentar timeout.
- RI031-T02: segunda rodada, tablet768/UTC, retorno após login mostra sessão encerrada e falha de conexão; o campo salvo não reaparece dentro da assertion. Causa inconclusiva, não atribuída automaticamente a ambiente nem ao produto. Cobertura integral sem falhas permanece pendente, mesmo com seleção mobile4/4+SQL posterior.
- Os testes originais de conflito verificam conteúdo e versão utilizada ao salvar; o painel não imprime o número da versão remota. Melhoria de rastreabilidade visual recomendada, sem evidência de atualização perdida.
- `api.ts` conserva path e múltiplas mensagens de fieldErrors, mas `flow.ts` usa código genérico SERVER para erros HTTP; códigos de issues persistidas são mantidos. Preservar também os códigos específicos seria útil para diagnóstico. Nenhuma regra é decidida pelo código genérico na UI examinada; não usado como bloqueio adicional.
- Sem alegação de ausência de outros defeitos ou de cobertura exaustiva de interleavings.

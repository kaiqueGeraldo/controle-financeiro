# RC031-02 — P2 residual: identidade própria validada difere da identidade consumida

Candidato44e8fee. Local: `controle-financeiro-frontend/src/services/onboarding/result.ts:15–20`
(`reference`), uso nas partes em `:81–88`; consumidor `model.ts:61` (`refKey`).
Apresentação usa a mesma identidade em `screens/private/onboarding/Review.tsx:26–38`.

`reference` valida kind próprio e exatamente um id/tempId **próprio**, mas devolve
o objeto original. `refKey` prefere `r.id ?? r.tempId` sem distinguir herança.
Com tempId próprio válido e id herdado, o primeiro valida tempId e o segundo usa id.

Reprodução em `independent.test.tsx`:

1. Criar snapshot anterior CONFIRMED, duas partes de12.00 com o mesmo tempId
   próprio, nominal24.00. Sem herança, o controle JSON é rejeitado por duplicidade.
2. No objeto da segunda referência, definir protótipo local `{id: outroUUID}`.
   Não modificar Object.prototype nem o tempId próprio.
3. `parseSummary` aceita: `identityUnique` recebe chaves distintas embora as
   identidades próprias das fontes sejam iguais. O probe exige rejeição e falha.
4. Controle complementar numa referência de bySource: o resumo é aceito, mas
   `refKey` devolve o UUID herdado em vez do tempId validado. Segunda assertion falha.

Critério: SPEC-001 §4 exige membros próprios inclusive em respostas; §5.1 exige
fontes únicas nas partes CONFIRMED. O encerramento original de RC031-02 inclui
referências/estrutura integral em todos os consumidores. Corrigir os exemplos
originais não encerra esse requisito. É continuação do achado contratual, não
alegação de nova regressão causada pelo saneamento: o refRule anterior também
usava identidade própria sem normalizar o objeto retornado.

**Limite essencial:** os dois casos vermelhos constroem objetos em memória.
O caminho JSON bruto atual não cria esse protótipo: o leitor preserva `__proto__`
como dado próprio. Os controles de rede demonstram que esse dado não produz id
herdado, não evita rejeição de duplicatas e não polui protótipos globais. Não foi
demonstrado ataque remoto, geração desse objeto pelo backend, corrupção do banco
ou duplicação de aplicação financeira. A severidade P2 é de conformidade da
fronteira explicitamente exigida e testada nesta tarefa, não vulnerabilidade HTTP.

Encerramento: garantir que a identidade consumida seja a própria validada em
partes, inventário, mudanças e apresentação. Opções práticas: rejeitar identidade
alternativa herdada na fronteira, ou normalizar a referência e usar sempre campos
próprios nos consumidores. Rejeição é pequena e explícita, mas restringe objetos
com protótipo; normalização exige consistência entre o objeto devolvido, hashes e
consumidores. Não voltar ao schema fechado de escrita para bloquear metadados
adicionais legítimos de leitura. Manter ambos os probes, JSON/__proto__, duplicatas
comuns, UNKNOWN/PARTIAL e respostas reais. Nenhuma opção foi implementada aqui.

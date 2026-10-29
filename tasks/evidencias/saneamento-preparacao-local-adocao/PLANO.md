# Saneamento dirigido — critérios anteriores à correção

Base07c396371029d9942b8667e5c638c04a9e6aeb4b, mesma branch. README preexistente,
provas/revisão,29 históricos,16 migrations e JAR p05 preservados. Sem remoto.

| Recorte | Critério / prova | Limite |
|---|---|---|
| RVPLA-01 | Executar tentativa e resume originais com falha injetada na fronteira de infraestrutura; observar skip indevido antes de editar | Injeção não é teste financeiro nem execução de PostgreSQL |
| Retomada | Conclusão exige causalidade, assertions, identidade e restauração; tentativas imutáveis com checkpoint consistente | Não autentica um operador malicioso; protege interrupção/corrupção/reuso acidental |
| Regressão | Falhas antes/depois da mutação, observador, interrupção, sobrevivência, restore, evidências e candidato; controle válido reutilizado | Sem repetir suítes de domínio não impactadas |
| RVPLA-02 | Três contratos originais sem mudança; diagnóstico limitado com mesmo JAR, queries reais temporizadas, JFR/CPU/GC/classes | Instrumentação tem custo; observação até90s não aprova gate40s |
| Eventual correção | Só após relação causal demonstrada; caso inconclusivo, registrar próximo experimento | Sem lazy global, dispensa de validação ou troca silenciosa de orçamento |

Hipóteses: custo cumulativo da preparação real HQL versus uma query isolada;
carregamento/JIT/GC versus espera SQL; recursos/OS versus configuração/harness.
Previsão: temporizar a sequência real por hashes de consulta deve localizar o
tempo cumulativo, e JFR/pilhas devem distinguir CPU, class loading, GC e espera.
Rodadas limitadas: três contratos originais, uma observação instrumentada nativa
e uma Linux. Não repetir até passar. Se necessário, um probe discriminante
adicional somente após examinar os resultados. Prazo40s mantido e origem8605ea4
registrada; não há SLO40s comprovado nem aceite automático do padrão Railway300s.

# Encaminhamento para revisão independente

Lote exclusivamente local, **em_revisao, sem autoaceite**.
Branch `codex/preparacao-local-adocao`.
Intervalo de implementação: `46b85ee0428abb55c22d27d26284d054410ec128..24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`.
Documentação/evidências posteriores são distinguidas desse commit dos inputs.
O HEAD documental final e o estado Git são informados na entrega ao operador.

Construir os resultados esperados a partir do pedido, plano A–D, política de
testes e matriz inicial antes de confrontar o código. A conclusão do executor
não é oracle ou aceite. Conferir diffs e bytes reais, não somente este relatório.

1. **PG17:** verificar major efetiva/clientes, ausência de normalização nova de
   constraints, V1–V16, preflight legítimo/negativo/read-only, baseline somente
   fixture apropriada, checksum/reaplicação, falha transacional e recovery,
   restore por linha/campo/catalog/sequences/history. PG16 conserva regressão;
   não aceitar o número17 sem as provas executadas. Não extrapolar para extensões,
   ACL/RLS, locale, SSL ou volume reais desconhecidos.
2. **Bootstrap:** tentar overrides de ambiente/CLI/JPA map com colchetes; guard
   precisa recusar antes de Flyway/Hibernate/SQL init. API adoption não deve
   migrar, gerar DDL ou fabricar history. Validar schema incompatível e lembrar
   que JPA validate não certifica sozinho todas as constraints.
3. **Writers/jobs:** conferir ordem e alcance do filtro, GETs com efeitos
   indiretos, auth/recovery/onboarding/replay, estado fechado/aberto, transações
   e efeitos externos simulados. Conferir registro de cinco tarefas e ausência
   de ShedLock quando fechado. A fixture de hábitos habilita jobs explicitamente
   para manter seus testes reais de concorrência, sem mudar assertions.
4. **Saúde:** GETs públicos exatos, respostas mínimas, estado inicial/manutenção,
   token anexado sem resolução de usuário nos probes, DB pausado/retomado,
   timeout/custo e porta. Readiness503 não pode promover manutenção nem garantir
   que deployment anterior foi congelado. Configuração Railway é proposta.
5. **Proveniência:** conferir831 inputs brutos e blobs Git normalizados, commit
   dos inputs, lockfiles/toolchain,22 recursos do JAR, hash do pacote e do JAR
   extraído da imagem, runtime por digest/usuário10001, labels e execução do ID
   local. Não confundir com JAR histórico c3860ec0, reprodução binária ou registry.
6. **Falhas e alcance:** confrontar rodadas originais completas e revalidação
   dirigida. Não somar testes sobrepostos ou transformar 894 execuções numa nova
   suíte integral verde:58 erros de fixture foram revalidados separadamente, com
   equivalência dos outros inputs. A matriz Linux executa os mesmos17 contratos
   do JAR nativo. Startup Windows falhou em40s inclusive sequencialmente; causa
   inconclusiva, sem aumento de timeout/retry. Dois startups Linux também falharam
   no controle posterior às mutações, apesar do verde anterior da matriz completa.
   Exigir diagnóstico/decisão sobre esse gate; não certificar estabilidade de startup.
7. **Contraprovas:** conferir causalidade em SQL/HTTP/processos, não só exit1;
   fontes e pacote precisam restaurar os hashes. A interrupção inicial do gerador
   por CRLF deve continuar preservada, sem contar caso não aplicado como detectado.

Reexecutar apenas em runtimes/containers/bancos descartáveis novos, conforme os
scripts e comandos da entrega. Não tocar banco real, Railway/Vercel, secrets,
CI remota, branch remota, imagem publicada ou deploy. Não criar exceção aos gates
de adoção real, expanded, zoom nativo200%, cancelamento ou CF035/036.

Registrar achados com prioridade, contrato violado, reprodução e limite examinado.
Uma revisão sem achados deve declarar seu alcance; não significa ausência total
de bugs ou prontidão de produção. Qualquer publicação/adoção é decisão posterior.

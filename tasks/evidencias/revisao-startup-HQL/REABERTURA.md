# Gatilhos objetivos e captura da próxima ocorrência

Investigação histórica E fica não bloqueante para preparação local. Reabrir se:

- Qualquer nova execução válida do contrato ultrapassar40s, inclusive HTTP200
  recebido depois do limite. Preservar a falha e bloquear o gate dessa invocação.
- Readiness falhar com processo/schema/configuração válidos, ou responder200 com
  writers fechados, DB inválido ou antes de trabalho obrigatório concluir.
- Houver repetição externa anormal comprovada do mesmo texto/método no bootstrap,
  sem motivo legítimo de configuração/catálogo, ou fase crescer a ponto de consumir
  a margem e violar o orçamento. Repetição interna exige captura própria, não76hashes.
- Surgir ocorrência no candidato/ambiente remoto validado. Usar seu contrato
  aprovado e identidade efetiva; não transferir40s como SLO de produção.
- Produto, bootstrap, catálogo de queries, JDK/perfil ou artefato mudar de forma
  relevante à capacidade aceita. Reconferir o alcance antes de reutilizar o aceite.

## Roteiro limitado, preparado e não ativado nesta revisão

1. Usar diretório novo `../controle-financeiro-runtimes/preparacao-adocao/revisao-startup-<execucao>/`.
   Registrar branch/commit, diff relevante, SHA do pacote, produtor dos inputs,
   ID/digest da imagem quando aplicável, JDK/heap/perfil/flags e hash dos arquivos
   de configuração sanitizados. Nunca copiar env/credenciais/dados de usuário.
2. Verificar banco **descartável**/major/clientes, schema/migrations antes de t0,
   capacidade disponível e outros processos/instalações/carga. Caso real exige
   autorização própria; não usar banco real como fallback. Registrar JVM nova
   e estado conhecido de caches, sem alegar frio de SO se não foi controlado.
3. Registrar nanoTime antes de start, retorno, entrada/fim do gate; Instant apenas
   para correlacionar logs. Identificar PID/nascimento/log e container UUID/porta
   real. Capturar status e body mínimo de ambos probes, com timestamp da resposta;
   não esperar só uma porta nem imprimir headers de autenticação.
4. Preservar logs e marcos de guard/DB/JPA/repositories/web/availability/HTTP.
   Uma amostra de CPU/memória por segundo pode ser reutilizada com custo separado:
   no acervo, trabalho total51–2.451ms e primeira coleta nativa2.360ms. É overhead
   conhecido empiricamente, não teto universal; não subtrair nem ocultar competição.
   Não iniciar build/npm/teste concorrente para tentar provocar o problema.
5. Ao falhar40s, registrar resultado original antes de diagnóstico. Se JFR já
   estiver disponível na execução delimitada, um dump antes de destroy. Sem JFR,
   no máximo um Thread.print após a falha, comando limitado10s e limpeza de erro2s.
   Ausência de captura anterior não se reconstitui por attach tardio. Observação
   pós-gate até90s desde criação é só diagnóstico; sucesso tardio continua falha.
6. Identificar queries por hash UTF-8/método sem valores de usuários. Agent/HQL/JFR
   desde premain só em uma futura condição instrumentada explicitamente planejada,
   com controle e custo declarados. Deltas0,727/4,845s anteriores são confundidos
   por ordem/cache e não garantem overhead puro; não usar coleta permanente.
   Se a pergunta for fallback interno, incluir id de thread e spans SLL/LL, sob
   novo escopo. O agent atual não comprova ausência dessa repetição.
7. Encerrar só recursos próprios com App.close aceito e seus prazos. Auditar
   processos/container/endpoints das portas corretas; erro de inspeção é explícito.
   Preservar logs, JFR bruto privado, falhas de attach/cleanup, hash original e da
   cópia sanitizada. Inventariar só arquivos novos necessários, sem varrer/copiar
   novamente todo o histórico. Não usar kill por porta/nome ou limpeza geral.
8. Encerrar após a ocorrência/condições previamente delimitadas, também se
   inconclusiva. Sem campanha até passar, retry silencioso ou extensão do gate.

Nenhuma gravação permanente, alteração de runtime, agent novo ou processo de
aplicação foi habilitado nesta revisão. Falha nova muda o estado do recorte
efetivamente afetado; não reabre automaticamente TCP/RVPLA, produto financeiro,
zoom ou outros aceites sem evidência de relação.

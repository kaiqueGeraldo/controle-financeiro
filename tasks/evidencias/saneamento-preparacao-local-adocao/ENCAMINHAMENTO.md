# Revisão independente dirigida do delta

Branch codex/preparacao-local-adocao. Base07c396371029d9942b8667e5c638c04a9e6aeb4b.
Código/probes atéb7b3be7ac919b3f9da0c3cb42929eb11ecef772f; commit documental final
informado ao operador. Resultado do executor não é aceite.

1. Reconstruir contrato antes de ler a conclusão: tentativa/exit1 não é detecção;
   causalidade, identidade e restauração devem preceder conclusão/reuso. Conferir
   runner, ProofStore, validateObservation e o diff real dos commits5078b40/09315b6/b7b3be7.
2. Invalidar resume com preparação/infra/observador falhos, interrupções, arquivos
   ausentes/corrompidos, candidato/config/observador diferentes, tentativa antiga
   completa seguida de incompleta, processo ativo e restauração pendente. Conferir
   que a falha fica preservada, não libera o próximo caso e não mata terceiros.
3. Conferir28 testes, execução original real do script com fault injection na
   ferramenta, reprise corrigida, mutação do predicado antigo e restauração por
   SHA. Conferir também prova PG17 real02: assertion causal, checkpoint completo,
   resume sem Maven novo, rejeição de observador incompatível e audit scoped.
   A prova final saneamento-quiescencia-01 também detecta filho nativo fora do
   diretório, antes de Maven, e continua/reutiliza somente após encerrar o PID próprio.
4. Checkpoints v1/recibos sanitizados não são importados como prova v2. Examinar
   hashes e seleção only= vinculada à identidade; caso único não certifica cinco
   provas ou startup. Quiescência local e fontes não equivalem a targets mutantes
   aceitos ou exclusividade de banco. Examinar fail-closed de PowerShell/Docker,
   PID reutilizado e gravações interrompidas sem exigir coordenação distribuída.
5. Startup: separar falha natural de porta dos três estouros HQL da revisão.
   Conferir reprodução determinística, nova regressão com listener concorrente,
   mutante antigo e correção somente do harness. Manter40s e contratos HTTP/SQL.
   Revisar reserva efetiva de Tomcat/Docker e descoberta do mapeamento em loopback.
6. Diagnóstico: mesmo JAR/imagem, schema previamente migrado,76 queries reais sem
   repetição, métricas JFR e custo da instrumentação. JFR nativo0bytes é inválido;
   wrapper diagnóstico verde não é startup aprovado. Dados rápidos novos não
   explicam pilhas/CPU históricas. Exigir ocorrência lenta discriminante antes
   de mudar query, validação, lazy, heap ou orçamento. Nenhuma correção ampla é proposta.
7. Conferir limites de regressão: PG17/JAR4, PG16/JAR1 e imagem3, sem somar casos.
   Produto/CI/frontend/migrations sem diff; aceites anteriores não são reabertos
   por associação. Pacote p05 segue24844b5/SHA b2967058…31395b, sem pacote novo.
8. Verificar327 arquivos protegidos,29 históricos,16 migrations, README alheio e
   fontes p05. Cópias de evidência são sanitizadas com hashes originais/coletados.
   Runtimes e logs originais mantidos. Estados maiores e pendências remotas não
   são encerrados pelo executor.

Reexecutar só em novos runtimes saneamento-*, bancos/containers sintéticos e
comando explícito do recorte. Não acessar DB real, alterar Railway/Vercel, fazer
push/merge/CI/deploy ou dispensar gates. Registrar achados com contrato, evidência
e reprodução. Separar pareceres: A resume; B corrida de porta/HQL inconclusivo;
C preservação dos aceites; D nenhuma liberação de adoção/produção.

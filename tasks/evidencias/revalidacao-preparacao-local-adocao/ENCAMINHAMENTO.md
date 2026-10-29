# Próximo trabalho recomendado

1. Saneamento local **somente RVPLA-03**, em novo lote autorizado: propriedade e
   término de wrapper/descendentes antes de restauração/avanço. Reproduzir o
   evento tardio desta revisão, manter terceiro vivo, interromper Node no mesmo
   ponto, comprovar ausência de trabalho tardio e só então permitir nova tentativa.
   Alternativa conservadora: negar recuperação automática quando a quiescência
   do proprietário interrompido não puder ser demonstrada. Sem matar por nome.
2. Diagnóstico de startup separado conforme STARTUP.md: duas capturas delimitadas
   com flush JFR, mesmos artefatos/configuração e orçamento40s preservado. Se
   continuar rápido/inconclusivo, parar e registrar; não ampliar prazo ou reescrever
   queries sem evidência causal. Não reabrir a corrida de porta já demonstrada.
3. Revisão independente do futuro delta. Somente depois tratar integração/CI,
   configuração remota e adoção por autorizações próprias. Esta recomendação não
   implementa nem inicia esses trabalhos.

RVPLA-01 está encerrado; sua regressão permanece obrigatória. RVPLA-03 afeta
retomada/isolamento, sem defeito financeiro provado. Reuso nativo imediato de porta
não certificado: preservar os dois erros de bind; se virar requisito próprio,
capturar estado TCP no instante do erro antes de definir outro contrato de cleanup.

Gates preservados: CF017/P01/P02, CF034 integral, expanded, zoom nativo200%,
configurações remotas e adoção/produção. A vazio: sem baseline, V1–V16; B legado
V1 comprovado: preflight da mesma janela, baseline1 explícita, V2–V16; C versionado:
info/validate/drift e só pendências, sem baseline; D desconhecido/incompatível:
nenhum DDL, diagnóstico em clone. Freeze/drenagem, geração/alvo, backup/restore e
proveniência temporal reais continuam sem comprovação. Sem sucessoras iniciadas.

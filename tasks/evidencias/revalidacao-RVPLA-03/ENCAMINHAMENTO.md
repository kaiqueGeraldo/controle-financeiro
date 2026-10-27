# Próximo trabalho concreto

1. Saneamento local **RVPLA-04**, separado do RVPLA-03 encerrado: consistência da
   fotografia de processos durante handoff. Reexecutar a barreira QueryIds→leitura
   de identidades; enquanto houver filho/identidade ambígua, não restaurar nem
   marcar complete. Fechar Job e provar ausência antes de recuperação alternativa.
   Não substituir por sleeps, busca de Java ou morte por nome. Teste atual deve
   deixar de certificar o estado inseguro; fonte deve permanecer mutante até
   cleanup comprovado, e retomada posterior precisa completar/reutilizar válida.
2. Investigação de reuso nativo, se escolhida em lote próprio: captura TCP/owner
   no primeiro bind falho, sem rebind automático para obter verde. Preservar os
   dois erros e o probe byte idêntico. Sem evidência nova, manter inconclusivo.
3. Diagnóstico HQL separado e finito conforme REUSO-STARTUP.md. Nenhuma alteração
   de queries/lazy/heap/prazo antes de causa demonstrada.40s continua aplicável.

Essas recomendações não implementam nem iniciam os lotes. RVPLA-03 encerra
exclusivamente o abandono original Windows/sessão atual; não certifica a consulta
current defeituosa de RVPLA-04. Native bind e HQL não reabrem aquele abandono.

Prontidão local mantém aceites PG16/17, guard/writers/jobs, saúde/preview, reserva
dinâmica e pacote. Preparo integral depende de RVPLA-04 e dos limites abertos.
CF017/P01/P02, CF034 integral, expanded, zoom nativo200%, configuração remota e
adoção/produção seguem pendentes; CF035/036 propostas, não iniciadas.

Plano A–D mantido: A vazio sem baseline, V1–V16; B legadoV1 compatível com preflight
da mesma janela, baseline1 explícita e V2–V16; C versionado com info/validate/drift
e só pendências, sem baseline; D desconhecido/incompatível sem DDL, diagnóstico
em clone. Identidade/geração, backup/restore, freeze/drenagem, temporalidade/brutos/
null/UNKNOWN e todos consumidores reais continuam sem comprovação. Não autoriza
acesso/ativação, CI remota, push, merge, configuração, publicação ou deploy.

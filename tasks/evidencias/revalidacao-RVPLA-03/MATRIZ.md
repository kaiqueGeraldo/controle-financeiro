# Matriz de requisitos e decisões

| Contrato | Evidência | Decisão / limite |
|---|---|---|
| Abandono Node não permite wrapper tardio após resume | Original9bed reproduzido,5/5 processos,5/5 janelas, oracle independente vermelho/restaurado verde | RVPLA-03 encerrado, Windows/sessão atual |
| Guardião pode morrer abruptamente | Handles de guardião/wrapper/filho/neto sinalizados; Job ausente antes de B | Aceito no cenário exercitado, sem extrapolação universal |
| PID/nome/porta não bastam para ownership | Nascimento/Job/session/recibo; PID simulado divergente e terceiro Java preservados | Aceito no recorte; não se forçou reuso real de PID nem outra sessão real |
| Falha de consulta/recibo impede mutação | Fault injection nativa, checksum inválido, legado e sessão divergente | Fail-closed observado, diagnóstico preservado |
| Bloqueio não equivale a cleanup completo | Handle retido/Job active0 bloqueia; só após ausência restaura | Bloqueio conservador aceito; processos já estavam mortos |
| Nenhum descendente relevante antes de restaurar/concluir | Handoff GUI sincronizado na captura/resolução de PIDs | **RVPLA-04/P2**, fonte restaurada/complete enquanto filho escreve; contrato amplo pendente |
| RVPLA-01 não regride |43 testes, falhas pré-efeito failed/recovered-incomplete, novo PG17 causal reutilizado | Aceite anterior preservado; nenhum status1 importado como sucesso |
| Recurso Docker externo à árvore precisa gate próprio | Sentinel alheio lógico permanece vivo após recusa; stop/ausência só pelo criador | Guard observado; não promete encerrar daemon ao matar Node |
| Helper compartilhado sem nome e fronteira nomeada | Normal/interrupção reais e novas regressões no candidato final | Windows observado; Linux host recovery não certificado |
| Reserva de porta não usa janela socket fechado→Tomcat | Regressores16/17, mutação antiga vermelha/restaurada1/1 | Aceite anterior preservado |
| Reuso nativo imediato após HTTP | Dois BindException linha32 pós-processo morto; Linux4/4 separado | **Inconclusivo**, sem dispensa nem vínculo causal com RVPLA-03/04 |
| Startup previsível sob40s | Contratos atuais verdes, históricos/diagnósticos preservados | **Inconclusivo/não aprovado**, sem query defeituosa confirmada |
| Produto/pacote/proveniência | Backend/frontend sem diff,833 atuais restaurados,831 p05/JAR/16migrations intactos | Aceites anteriores preservados; sem build/reprodução binária do HEAD |
| Prontidão integral e adoção real | Estados canônicos/A–D preservados; nenhum critério real executado | CF017/P01/P02 e CF034 em_revisao; expanded/zoom/config/reais pendentes; adoção não liberada |

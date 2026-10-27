# Contrato de retomada v2

O checkpoint representa uma tentativa identificada. Exit1, arquivo existente e
assertion genérica nunca bastam para concluir. O runner é local/sequencial;
nenhum checkpoint deste lote libera adoção real ou um gate de produto.

| Situação | Representação | Comportamento de resume |
|---|---|---|
| Não iniciado | Sem diretório de tentativa | Criar tentativa nova |
| Preparação/incompleto | running + backups registrados antes da mutação | Verificar quiescência/owner e hashes; recuperar sem promover conclusão |
| Mutação aplicada / observação em curso | mutated | Não usar resultado inexistente; restaurar após quiescência e observar novamente |
| Resultado recebido | observed | Exit/relatórios ainda precisam passar pelo verificador causal |
| Efeito validado, restauração pendente | restoration-pending | Não liberar próxima etapa; validar/recuperar ambiente; interrupção não vira sucesso |
| Falha pré-conclusão | failed-before-completion → failed após restauração | Preservar motivo/resultados; tentar novamente em novo diretório |
| Conclusão | complete + evidências + restorationVerified + environmentVerified | Revalidar a última tentativa, identidade, arquivos, causalidade e todos os inputs antes de reutilizar |
| Interrupção recuperada | recovered-incomplete | Preservar histórico; nova tentativa obrigatória |

Tentativa antiga concluída não encobre uma posterior incompleta. PID de owner
ainda vivo impede retomada concorrente. PID reutilizado pode bloquear de forma
conservadora: conferir o processo e preferir execução nova, sem matar terceiros.
Estado/evidência truncados, backup ausente, bytes desconhecidos ou restauração
incompleta não liberam avanço. Falhas são propagadas, interrompendo o loop.

Cada tentativa tem diretório próprio0001/0002…, backups, checkpoint e eventos
append-only. Checkpoint usa temporário, fsync e rename; não há retry de gravação.
Uma interrupção entre o evento e o checkpoint não promove o evento a autoridade:
o leitor verifica o checkpoint e os arquivos. Arquivos parciais não são sucesso.
Não há transação distribuída nem garantia contra operador adversarial que reescreva
estado/evidências; hashes detectam corrupção/reuso acidental no escopo local.

## Identidade e causalidade

Identidade v2 vincula commit declarado e SHA do manifesto completo dos inputs,
SHA dos três módulos do observador, seleção de casos, major17, ID imutável da
imagem, JAVA_HOME/Java SHA, Node versão/SHA e hash do ambiente relevante. Valores
de ambiente não são publicados. Alterar candidato, observador, seleção ou
configuração recusa a retomada; iniciar execução nova preserva a anterior.

O verificador exige relatório JUnit novo e consistente: exatamente o método/classe
selecionados,1 assertion falha,0 erros/skips; mensagem específica do efeito.
Writer exige HTTP200/SQL1 no log; Flyway exige16 migrations num log filho novo.
Readiness exige503 esperado/200 observado depois do congelamento, conforme a
fonte de teste identificada. Timeout de startup não satisfaz essa causalidade.
Relatórios/logs/filhos são ligados por hash. Na reutilização, o verificador causal
é executado novamente, além de conferir bytes; flags persistidas não bastam.

Antes de restaurar/reutilizar/avançar, o runner verifica ausência de Java associado
ao runtime, de JVMs com o argumento adoption e de containers API com label de preparação.
O argumento cobre filhos nativos que referenciam JAR compartilhado sem marker do cwd.
Não imprime comandos nem
encerra processos desconhecidos. Se houver processo ativo ou a consulta falhar,
o resultado fica pendente. Retomar só depois de quiescência verificável. A checagem
conservadora também pode bloquear outra preparação de adoção local em paralelo.
Não se promete exclusividade de banco, drenagem universal ou cancelamento retroativo.

Restauração escreve apenas backups ligados aos inputs, quando o arquivo ainda
tem hash original ou da mutação conhecida. Bytes desconhecidos exigem intervenção,
sem restauração automática. Todos os inputs são conferidos antes de concluir.
Targets/classes/imagens mutantes permanecem isolados e não são artefatos de uso;
o witness positivo do runner completo exige recompilar/testar a fonte restaurada.
Modo `only=` certifica somente o caso selecionado, nunca o witness/gate completo.

## Compatibilidade

results.json legado é preservado e ignorado como comprovação; status1 pode ter
sido infraestrutura ou timeout. Resume cria tentativas v2 e reobserva, sem
importação automática. Audit recusa certificar checkpoints legados ambíguos.
Recibos de versões incompatíveis de observador também são preservados e recusados.
As cópias sanitizadas em execucao/ são para revisão; referências/hashes originais
continuam identificando arquivos dos runtimes, não essas cópias.

## Custo e trade-offs

São arquivos locais e estados explícitos, sem banco/feature flag distribuída.
O custo de retomar cresce com histórico A, arquivos mutados M, bytes dos inputs S
e evidências E: O(A·M + S + E), além das consultas locais de quiescência. Backups e
eventos consomem espaço por tentativa; evita sobrescrever falhas. Não muda custo,
queries N+1 ou locks da API. O custo operacional é recusar ambiguidades e exigir
nova execução/verificação manual quando a identidade ou o ambiente divergem.

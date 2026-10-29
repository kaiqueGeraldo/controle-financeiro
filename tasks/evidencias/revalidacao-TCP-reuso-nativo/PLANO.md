# Contratos prefixados — revalidação TCP,28/10/2026

Base3b245d9dd23e876700507718767827ea5e9f8a11; candidatob7a2c206459f8f376b7bb7a84580444b2b6b4f15.
Branch codex/diagnostico-tcp-nativo,HEAD exato e base ancestral. Somente README
raiz alheio modificado,staging vazio. Delta apenas em três arquivos src/test;
src/main/frontend/migrations,runner/broker/probes/mailbox/checkpoints intactos.
Nenhuma correção da implementação nesta revisão. Sem HQL,remoto ou adoção real.

Antes dos atores: verificar inventário anterior30.964 entradas e runtime1.479,
JAR/README/migrations/históricos e criar fotografia exclusiva. Destino novo
revalidacao-tcp-20261028-01 e subdiretórios,sem limpar/mover runtime histórico.

Experimentos finitos e sequenciais,sem retry de bind/suíte:
1. Originais byte idênticos PG16/JAR e PG17/JAR,uma invocação cada; dois métodos
   PortLifecycleProbeTest + negativo AdoptionNativeSocketsTest,3 testes por invocação.
2. Uma reversão exata de App antigo em cópia,PG17,janela original instrumentada
   sem I/O/enumeração entre close e bind,com mesmas assertions. Esperado BindException
   se a corrida ocorrer; se passar/não chegar ao bind,registrar inconclusivo,sem
   repetir para provocar. Restaurar/hash.
3. Uma falha explícita da inspeção em cópia,PG17,mesmo contrato. Deve bloquear
   close/reuso,sem converter erro em sucesso. Restaurar/hash e um controle final
   instrumentado PG17,mesma porta/replacement/serviço alheio.
4. Uma matriz sintética original limitada: seis términos cooperativos e dois
   abruptos,com snapshots IPv4/IPv6. Diagnóstico pode registrar bind falho como
   dado,sem ser aprovação do oracle original. Sem laço para procurar corrida.
5. Complemento independente: porta livre,listener próprio vivo,substituto/alheio,
   família/endereço alternativos e conexão sem LISTEN; respostas de inspeção
   incompleta/erro/lenta por injeção só na cópia. Medir orçamento único,frequência,
   criação/término dos observadores. Positivo real sem injeção separado. Não
   alterar exclusividade/portas nem startup40s. Registrar explicitamente custo da
   observação e cleanup de erro2s,sem certificação após deadline.

Uma falha pré-bind de startup40s é preservada e não prova TCP nem autoriza repetir
até passar. Não investigar HQL nesta revisão. Janela temporal alterada por observador
não substitui a prova de bind imediato. Linux/Docker/porta0 preservados por diff;
não certificam supervisor Linux nativo. RVPLA-01/03/04/05 e EPERM reaproveitados
por diff/hashes,pois o caminho20s não é alterado. Nenhuma suíte financeira ampla.

Critérios: condição TCP atual com inspeção válida,deadline10s ou5s da fase de
shutdown,sem renovação a cada consulta; bind único na mesma porta,sem relaxar
socket. Ausência de endpoints próprios não reserva porta contra terceiros:
colisão posterior deve falhar explicitamente sem matar/tomar serviço alheio.
Históricos PG16/17 têm BindException,sem estados TCP contemporâneos; mecanismo
equivalente não vira medição retrospectiva nem prova de TIME_WAIT.

Ao final: auditoria de leitura dos próprios recursos/portas/containers,processos
preexistentes e preservação final. Provas e parecer/estados em commits locais
separados,staging explícito e README raiz excluído. CF017/P01/P02,CF034 integral,
zoom/expanded/configuração/gates reais continuam próprios.

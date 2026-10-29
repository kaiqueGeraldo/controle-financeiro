# Próximos trabalhos delimitados

1. **RVPLA-05: custo do ciclo de resume.** Reduzir custo de fronteiras/consultas
   e lançamentos auxiliares preservando Jobs próprios, certificado de fechamento,
   baseline selado, identidade e fail-closed. Usar os intervalos registrados,
   separar custo de lançamento/consulta de trabalho da ferramenta. Revalidar
   probe original20s, base comparável, complemento vulnerável vermelho/corrigido
   seguro e handoff/falhas. Não substituir garantia por cache/listas/sleeps ou
   aumentar prazo para obter aprovação. Se outro orçamento for proposto, exigir
   decisão própria, sem retroaprovar esta rodada.
2. **Audit EPERM: diagnóstico operacional.** Uma captura delimitada da substituição
   atômica da mailbox, com erro Win32/dono do handle/condições do filesystem,
   para discriminar compartilhamento/ACL/ambiente. Nenhuma causa foi provada.
   Preservar o audit falho e não adicionar retry silencioso; provar que eventual
   mudança conserva bloqueio e checkpoint/identidade antes de aprovar esse caminho.
3. TCP/reuso nativo e HQL seguem lotes próprios já descritos. Sem atribuir-lhes
   custo do broker ou encerrar histórico por uma rodada positiva.40s mantidos.

Essas recomendações não implementam nem iniciam novas tarefas. RVPLA-04 fica
encerrado no handoff demonstrado; RVPLA-03 específico continua sustentado, com
limite funcional do20s explícito. Segurança de contenção não aprova desempenho
ou operação integral do runner. Manter todas as contraprovas e histórico de falhas.

Aceites de PG16/17, guards/writers/jobs, saúde/preview, reserva dinâmica e bytes
do pacote permanecem nos seus alcances. CF017/P01/P02 e CF034 integral em_revisao;
expanded, zoom nativo200%, configurações remotas, adoção/produção pendentes.
CF035/036 continuam propostas, não iniciadas. A–D preservados: A vazio sem baseline,
V1–V16; B legadoV1 compatível/preflight mesma janela, baseline1 explícita e V2–V16;
C versionado info/validate/drift/só pendências sem baseline; D desconhecido sem
DDL, diagnóstico em clone. Backup/restore/freeze/consumidores reais não provados.
Nenhuma autorização de acesso, CI, publicação ou operação remota decorre daqui.

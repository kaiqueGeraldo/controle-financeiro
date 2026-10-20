# Encaminhamento independente RC030

Revalidar os três achados sobre todo o intervalo251d6c7..HEAD entregue, com
commits separados e provas preservadas. **CF030 permanece em_revisao**; correção
local e contraprovas não constituem aceite independente ou liberação de sucessora.

1. Ler o parecer/ACHADOS originais e a matriz deste saneamento, sem substituir
   expected pelo código. Reconciliar189 de principal/disponível811 no probe de
   encargos entre faturas; rever pagamentos abaixo/igual/acima dos encargos,
   múltiplas linhas, UNKNOWN, quitação/excesso, alocações e rollback/replay.
2. Revalidar INITIALIZE_EMPTY com configuração autoritativa, CREATE, parcelas
   futuras, override, dezembro9999 válido/inválido e configuração alterada após
   revisão. Confirmar rejeição antes de preparar e ausência de gravação parcial.
   Verificar binding LocalDate direto em Invoice com SQL e releitura (inclusive
   ano0001); nenhuma alteração de fuso, calendário, schema ou dados antigos.
3. Confirmar400 para contractVersion diferente de inteiro1 em prepare/complete,
   inclusive overflow;409 para os conflitos previstos e500 sanitizado para falha
   interna real. Não confundir contractVersion com Revision do draft.
4. Auditar o ajuste mínimo de observador: original integral e erro pós-correção
   preservados; assertion ano≤9999 mantida no ramo concluído e novas assertions
   fortes no ramo que rejeita. Não tomar esse ajuste como um expected financeiro
   relaxado. Os demais probes não foram editados.
5. Reproduzir comandos de EXECUCOES com nomes novos. Conferir hashes principal/cópia
   e restauração de cada contraprova, incluindo a regressão de binding civil.
   Não somar seleções repetidas como casos únicos ou apagar falhas históricas.

Atomicidade, recibo, replay, recuperação, estado, propriedade e guard dos writers
participantes continuam com as fronteiras anteriores; os probes relevantes foram
mantidos na seleção afetada. Não se promete ausência universal de corridas/deadlocks,
SLA de produção ou correção retroativa de datas/composições históricas.

Preservar aceites sustentados da revisão e CF029 concluída. CF031/032 continuam sem
liberação automática; gate CF015/zoom e adoção real CF017/P01/P02 permanecem.
Nenhuma autorização de push, merge, deploy, writer real ou banco real está implícita.

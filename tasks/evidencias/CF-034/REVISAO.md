# Encaminhamento para revisão independente

Entrega exclusivamente local pela DEC-CI-04, sem autoaceite. O revisor deve partir
da base documental272001f e examinar os commits locais e as coletas novas,
mantendo distinto o candidato efetivamente testado do commit posterior de provas.

1. **Seleção obrigatória:** confrontar os94 testes concretos e as seis jornadas
   A/B/G/H/K/L com os contratos vigentes. Os15 bridges históricos foram nomeados
   na matriz ampliada; não foram aprovados nem excluídos do repositório. Confirmar
   que nenhuma garantia obrigatória ficou sem representante corrente. Havendo
   lacuna, ampliar a seleção e executar, sem aceitar verde por falta do teste.
2. **Oráculos e harness:** revisar as expectativas explícitas V1…V16, contagem
   de upgrades, preservação de dados/rollback/checksum/restore; conferir HH:mm:ss
   contra SPEC-002, inclusive segundos não zero. O mock do guard está somente no
   teste unitário de calendário; integração deve continuar com guard financeiro
   real. Conferir schema por contexto e idempotência diante de initializer herdado.
3. **Causalidade e restauração:** conferir exits1, sequência interrompida,
   ausência de pacote aprovado nas falhas e igualdade SHA antes/depois. Os gates
   negativos frontend pertencem ao candidato7ac7407; seus scripts/helper são
   idênticos em a5ad7a6. Não somar tentativas para fabricar cobertura nem atribuir
   ao pacote novo resultados de um candidato diferente.
4. **Proveniência:** conferir package-trace/manifest contra o JAR preservado,
   sourceDigest e inputs; verificar que os gates positivos são da mesma execução.
   README raiz está deliberadamente modificado e excluído do pacote/commits;
   isso não pode ser representado como árvore original totalmente limpa.
5. **Actions:** validar posteriormente em runner real os eventos/path filters,
   permissões, cache, shell Linux, instalação de dependências do Chromium,
   needs/if, cancelamento, uploads e proteção da main/checks. Os nomes novos de
   jobs precisam de conferência externa antes da adoção. Nenhum desses contratos
   recebeu comprovação remota nesta entrega. Falha/timeout obrigatório deve
   impedir pacote, mesmo que o diagnóstico always termine com sucesso.
6. **Aceite integral:** Dockerfile histórico e sua imagem não foram certificados;
   não relacionar sua compilação com skipTests ao JAR aprovado pelos gates locais.
   Matriz ampliada e pacote remoto ainda exigem evidência própria. Não liberar
   deploy, uso, writers, adoção CF017/P01/P02 ou sucessoras por inferência desta CI.

Trade-offs de implementação: um runner compartilhado e sequência serial reduzem
divergência de comandos e tornam explícito o bloqueio por falha, ao custo de
latência maior e repetição na matriz ampliada. Cache apenas de dependências evita
reutilizar aprovação de outra base. Exportação/hash percorre O(bytes) de fontes e
fixtures; schemas adicionais custam DDL por contexto, mas eliminam a interferência
de create-drop sem um PostgreSQL por caso. Separar jobs ou reutilizar builds no
futuro exigirá preservar os vínculos de fonte/resultado/pacote já demonstrados.

Não há parecer de aprovação independente neste diretório. A aprovação desse
recorte local não substitui zoom nativo200% (CF010/015 continuam em_revisao),
aceite integral CF034, adoção real ou a decisão própria de publicação posterior.

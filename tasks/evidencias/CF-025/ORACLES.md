# CF-025 — contrato de medição e oráculos

Definido antes de alterar produto, em 01/10/2026. Fonte: CF-025, SPEC-004,
CF-021, DEC-08 e prontidão local do parecer CF-024. A tarefa recomenda um modelo;
nenhum agente adicional/modelo diferente foi iniciado nesta execução.

- As listas retornam somente recursos/logs/itens do principal. Coleções não
  multiplicam os recursos retornados nem perdem entradas. H hábitos com sete
  logs completos têm exatamente H respostas e sete datas/status por resposta.
- Reordenação é atômica: IDs duplicados/nulos/ausentes/foreign são rejeitados,
  sem ordens parcialmente gravadas. O comando válido atualiza a ordem pedida;
  saldo, dias específicos, logs e progresso não mudam. Vazio não consulta banco.
- SELECTs de listas/reordenação não crescem por recurso. Escritas por entidade
  são permitidas e medidas separadamente: preservar dirty checking, versões e
  locks tem prioridade sobre reduzir UPDATEs sem evidência.
- Trinta receitas realizadas de 10,00 de contas distintas têm total global
  300,00, saídas 0,00 e caixa 300,00. Páginas 20+10 têm exatamente os trinta IDs,
  sem duplicação, mesmo quando existem dados de outro principal. O expected é
  aritmética sintética e contrato, não query/helper da implementação.
- Checklist com dois itens por meta retorna os dois, ordenados 0/1. Sem histórico
  conhecido não se inventa cobertura completa: subtotais observados são distintos
  de totais certificados. Ganho desconhecido continua desconhecido.

Método: PostgreSQL 16 descartável, Flyway V1–V13, serviços/proxies/ORM reais,
captura na fronteira JDBC no thread da operação, sem mock de regra financeira.
Somente email/mercado externos usam os doubles da fundação. Datasets 3/30/120;
três aquecimentos e vinte amostras por operação, contexto de persistência novo
por invocação, commit incluso nas escritas. p95 empírico = 19ª amostra ordenada;
sem SLA inventado ou assertion frágil sobre milissegundos. Nenhum consumidor de
produção ganha timeout/retry novo para satisfazer o teste.

Contar SELECTs e UPDATEs reais separadamente, incluindo flush. Contagem JDBC não
é uma captura de pacotes de rede. Estatísticas Hibernate de entidades carregadas
e buscas secundárias de coleções auxiliam a análise de memória, sem prometer
medição de pico de heap. EXPLAIN ANALYZE/BUFFERS usa SQL e bindings capturados,
fora da janela cronometrada, em transação revertida (inclusive SELECT com lock).
ANALYZE antecede o benchmark. IDs/schema são aleatórios; valores/cardinalidades
e ordem de comandos são determinísticos; nunca usar banco real.

O p95 mede execução local aquecida, sem HTTP/rede/autenticação e sem carga
concorrente. Repetir não apaga uma primeira falha; não inferir SLA ou throughput
de produção a partir desta comparação. Não adicionar índice/fetch de coleção
paginada/cache sem benefício demonstrado e preservação do contrato.

# Custos e limites do delta

Dados de `restored-delta/capacity-cost.json`. Instrumentação JDBC real reutilizada
do teste de custo do projeto; conta SELECTs do guard/ORM/JDBC, sem estimar pelo
número de chamadas Java. Relógio mede a seção sintética através do retorno de
TransactionTemplate (commit/rollback incluído). Não mede lock acquisition isolado,
latência HTTP, produção, p95/p99, heap máximo ou taxa de requisições.

| Fontes | Pendências UNBOUNDED | SELECTs de autorização + fonte | Tempo observado | Resultado |
|---:|---:|---:|---:|---|
|1|0|8|17,94ms|Permite1 em capacidade1000 |
|1000|0|8|9,85ms|Permite1; sem leitura completa das1000 fontes |
|1000|1|17|96,55ms|Bloqueia por conhecimento incerto |
|1000|50|17|106,76ms|Bloqueia; união das pendências preservada |

O warmup explica por que o caso pequeno não é necessariamente mais rápido. Não
há inferência de tendência estatística com quatro amostras. No caminho global,
são10 SELECTs de inventário, uma vez por relação, não por fonte/pendência. As
demais consultas são gate, seleção do modo, releitura e lock da fonte.

Prepare1000 da regressão histórica agora usa27 SELECTs: orçamento anterior25 mais
dois fixos (set_config e lock de dependências). Provas com1 e máximos de itens
mantêm comparações de crescimento exatas. A fonte antiga do teste25 foi preservada
em diagnosis; o ajuste27 é a contabilização da proteção nova, sem tolerância de N+1.

## Escopo e duração dos locks observados

`restored-delta/progress-locks.json`: BUY local mantém dois ShareLocks; INCOME em
outra conta comita antes da liberação (blockers vazio). `same-source.json`: outro
comando no mesmo saldo espera `transactionid`/linha da conta, e não um advisory X
global. Depois do BUY600, saldo400/reserva0 e reserva600 concorrente rejeitada.

As provas de gate registram espera advisory tanto para criar legado durante BUY
quanto para BUY iniciado durante criação de legado. Depois da espera, a nova
pendência impede a autorização; saldo1000 fica intacto. O caso de certificado
válido registra ShareLock de dependências e ExclusiveLock de inventário; o writer
da outra conta espera, como exige a compatibilidade da evidência.

Os períodos abaixo são **limites inferiores observados**: começam depois da
operação e terminam ao liberar a barreira, ainda dentro da transação. Os locks
começam antes e só terminam em commit/rollback. Não se apresentam como duração
natural do comando, pois as barreiras intencionalmente prolongam a transação.

| Prova | Intervalo retido observado | Escopo |
|---|---:|---|
|setAllocation|23,55ms|dependências S + inventário S + fonte/meta/par |
|addValue/deposit|14,18ms|dependências S + inventário S + fonte/meta/par/história |
|moveAllocation|16,93ms|dependências S + inventário S + ambas as fontes/pares |
|BUY com certificado|12,13ms|dependências S + inventário X + conta/investimento |

Timeout configurado permanece no máximo5s, preservando orçamento menor existente.
Não foi aumentado. Não limita duração do commit, nem garante que carga real nunca
o esgote. Colisão de hash advisory pode causar contenção entre chaves diferentes;
não concede ownership. Não há promessa universal de ausência de deadlock.

## Crescimento e índices

N é quantidade de linhas do inventário; P são pendências/evidências; A_s são pares
da fonte; E é incidência fonte–pendência. O caminho local não materializa N linhas,
mas a consulta EXISTS pode visitar metas/investimentos do owner para provar
ausência de legado. Quantidade constante de roundtrips não torna seu trabalho O(1).
O SUM da fonte custa trabalho proporcional a A_s, com índices de fonte V5; o anti
join de vínculo usa pares indexados. Não se alega plano ótimo para toda distribuição.

A projeção global mantém custo de leitura/materialização O(N+P+E), mais ordenação,
canonicalização/hash proporcional a bytes; E pode chegar a fontes×pendências.
O cenário1000×50 produz até50000 incidências, abaixo do teto200000. Materialização
continua limitada a32MiB. Certificação pode custar O(D×E) na preservação anterior
mais O(D) escritas, D≤200; não foi alterada. Sem SELECT Java por fonte/pendência.
Nenhum índice novo foi justificado por essas amostras; não houve benchmark ou
EXPLAIN de produção. Volumes de metas/investimentos e distribuições enviesadas
merecem medição própria antes de qualquer compromisso operacional.

## Limitações preservadas

- Caminho independente exige inexistência comprovada das dependências descritas;
  registros/evidências legadas continuam conservadoramente coordenados pelo
  inventário, sem token estreitado nem origem presumida. Não se promete paralelismo
  universal de todo par de contas em qualquer estado legado.
- Guard vale para writers participantes, não SQL administrativo ou nova instância
  de código que ignore o protocolo. Rollout com versões antigas precisa manter
  todos os gates de adoção e revalidar coexistência; não foi certificado aqui.
- Comandos exercitados em READ COMMITTED padrão, com conexões distintas. Não se
  certificam consumidores arbitrários envolvendo-os em transações externas de
  outro isolamento, nem todos os pares possíveis de writers.
- Nenhum contrato frontend/HTTP/DTO mudou. Aceites anteriores de UI/relatórios,
  fusos e jornadas sem delta foram reaproveitados; não se alegam novas jornadas
  de navegador, auditoria visual ou matriz frontend nesta execução backend.
- Zoom nativo200% CF010/015, adoção real CF017/P01/P02, limites de produção e
  alcance específico DEC-ONB-03 permanecem. CF034+ não iniciadas; sem banco real,
  notificações reais, deploy, push, merge ou exclusão de branches.

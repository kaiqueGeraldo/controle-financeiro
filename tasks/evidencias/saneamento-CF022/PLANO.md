# Saneamento dirigido — 17/10/2026

Base eb41301ec7d2f08007c7c4637463df81e8460a54, branch codex/cf022-investigacao.
Staging vazio; README raiz alheio e .cf22 preexistentes. Manifesto inicial preserva
2313 arquivos, incluindo provas independentes, seus runtimes e a investigação.
Nenhum AGENTS.md encontrado nos caminhos do repositório; instruções fornecidas
na conversa e skill Tech Lead aplicadas. Contrato DEC-08, SPEC-002/AC-TIME-010,
matriz e diagnóstico independente são os oracles; timeouts históricos não são
condição para saneamento. Nenhum produto/onboarding/publicação autorizado neste lote.

## Estratégia e expected definidos antes do verde

- Calendário fixo em 2027-01-05T02:59:59Z, diaProduto04/01, nos dois fusos.
  Somente Date deve mudar; timers/performance/rAF e timeline continuam nativos.
  Regressão executa a instalação antiga preservada e depois o helper real novo.
  Contraprova original compara deliberadamente ambos os modos e deve passar.
  Quatro jornadas reais preservam as assertions existentes e acrescentam pintura,
  hit-test, fechamento do modal e calendário após reload. Animações normais.
- Cada método de integridade recebe contexto/schema novo. Isolated impede
  paralelismo JUnit desta classe: Clock, scheduler e pool não são compartilháveis
  entre seus métodos. Processos separados possuem containers separados. Não se
  promete execução paralela de métodos no mesmo contexto; não se usa rollback
  do teste para tentar desfazer commits dos workers.
- Regressão suplementar: volume501→callback→callback→volume501. Pré-condição0
  hábitos por método; resultados501/1/1/501 e leituras1002/2/2/1002. Chama casos
  originais, sem mudar os10s. Antes: três métodos herdam501 e falham.
- Contraprova independente preservada: fresca→residual→isolada,2→1006→2 sob
  suas condições. Nova execução anterior já preservou TimeoutException no
  residual, após2 no fresco e446 leituras observadas no residual503. Não é
  conclusão histórica. Execução posterior planejada após a correção, uma vez,
  sem repetição cega, prazo maior ou descarte da falha anterior.
- Testar a classe original inteira porque a fronteira de fixture afeta todos
  seus métodos. Não contar casos herdados/observações como testes independentes.

## Trade-offs

Recriar contexto e aplicar migrações por método custa startup; o container fica
por JVM. Schemas antigos são retidos até o descarte Testcontainers/Ryuk, inclusive
na falha. Isso evita limpeza referencial frágil ou truncamento de alvo compartilhado
e mantém workers antigos restritos ao schema antigo. DirtiesContext encerra os
recursos Spring; executores explícitos existentes mantêm seus fechamentos.
O custo de storage cresce com o número de métodos, limitado à vida do container.

Helper CJS local mantém o mesmo algoritmo Date-only do helper TS já aprovado,
sem mudar seus consumidores ou exigir carregamento TypeScript no runner Java/Node.
Há pequena duplicação intencional entre runners; o contrato de relógio é testado.
Outros usos de page.clock (inclusive avanço intencional) não são modificados.

Exportação nova inicialmente em runtime/ para Java; movida para .cf22s antes das
jornadas porque Tailwind deve enxergar fontes não ignoradas. Junction de dependências
e turbopack.root são apenas adaptações de ambiente na cópia. Não injetar CSS nem
mascarar visibilidade. O .cf22 histórico permanece intocado.

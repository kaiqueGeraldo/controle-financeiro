# Triagem dos erros de contexto

Os 115 XML novos correspondem exatamente às 115 classes selecionadas no Linux: 927 casos, 137 passes, zero falhas de assertion, 790 erros e zero skips. Foram examinados todos os blocos error, não somente o resumo Maven.

| Grupo | Quantidade | Classificação |
|---|---:|---|
| Erros cujo stack preserva a recusa do guard | 168 | Falha de inicialização por JDBC em host.docker.internal |
| ApplicationContext failure threshold | 622 | Contexto já falhou; Spring impede nova tentativa |
| Falhas de assertion | 0 | Nenhuma reportada nesta rodada |
| Erros não classificados ou raiz independente encontrada | 0 | Não houve evidência de outra causa nos 790 blocos |

CAUSAS-CONTEXTOS.json preserva os 92 descritores/classes com erro e seu primeiro tipo observado. Eles não são 92 causas independentes. Em 33 descritores o primeiro caso já era threshold; em 59 havia recusa explícita. A correlação final usa as mensagens XML integrais, não as versões abreviadas de diagnóstico.

CACHE-CONTEXTOS.json agrupa os descritores em 29 chaves de configuração representadas nos logs e relaciona todos os 622 casos threshold a recusas iniciais. Cada grupo indica classe/caso e linha da primeira falha localizada no backend.log bruto. A comparação retém todos os campos de configuração e customizadores, removendo somente testClass e identidades de objeto de MergedContextConfiguration/ImportsContextCustomizer. O bytecode local de Spring Boot4.0.2 confirma equals/hashCode pelo key de ImportsContextCustomizer e toString via ToStringCreator(this); o conteúdo do key é preservado na comparação. A documentação do [cache Spring](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/ctx-management/caching.html) enumera os campos usados na chave. Esse agrupamento identifica a propagação do bloqueio; não conta 29 defeitos.

A primeira recusa de banco está no backend.log, linha102, pelo PostgresTestContainerInitializer. A outra família, Cf017PostgresSupport, preserva a mesma recusa com seu banco sintético próprio. Ryuk havia iniciado na linha64 da rodada principal. Os endpoints PostgreSQL publicados foram alcançados/inicializados, mas a URL exposta à JVM continha host.docker.internal, fora da allowlist literal. Os nomes efêmeros eram os esperados: a divergência era o host.

A prova posterior loopback-diagnostic é outra invocação: guard4/4 e consumidor5 erros. Seu primeiro bloqueio real é Could not connect to Ryuk at 127.0.0.1:52768 (controller.log, linha1880). Não explica retrospectivamente os 790 erros da rodada original e não comprova que localhost dentro do executor Linux alcança as portas publicadas pelo Desktop.

Não se diagnosticou defeito funcional a partir das assertions que não chegaram a executar. Também não se declarou o backend integral aprovado pelos 137 passes ou pelo novo consumidor5. Causa demonstrada do primeiro bloqueio: incompatibilidade entre endereço de acesso no executor Linux e contrato do guard. Limite do segundo: loopback/Ryuk inacessível naquela topologia; não foi demonstrada a causa operacional completa dessa indisponibilidade, nem habilitação global do host networking.

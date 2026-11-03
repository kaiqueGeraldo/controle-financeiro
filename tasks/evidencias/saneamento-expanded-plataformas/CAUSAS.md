# Causas, correções e limites de atribuição

Base48d0247b98468c9526bb9af6089062c3049247a3. Inputs históricos4204080aa9b2fa46c52f9d1ef6638b77231087fd; inputs da expanded corrigida0aac7ccd25934ec022939464486da9fb28610279, digest d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660,860 fontes.

## Componentes Linux

A correspondência original é exata:626 identidades Windows =597 relatadas Linux +29 ausentes em oito arquivos. [Matriz anterior à edição](MATRIZ-INICIAL.json). Não eram skips ou falhas de assertion reportados; os oito arquivos não tinham entradas no JSON Linux. Arquivos, imports, versões e lock estavam presentes na cópia atestada.

O JsonReporter de Vitest4.1.11 recebe somente módulos devolvidos pelo runner e ignora o argumento unhandledErrors. Calcula success sobre esse subconjunto, não sobre a descoberta esperada. A implementação instalada foi inspecionada e uma contraprova sintética real produziu assertion passada1, JSON success=true, erro global1 e exit1. O novo gate rejeitou esse resultado. Não é teste de produto.

Na reprodução completa dos mesmos inputs e dependências sobre bind mount Windows,71 arquivos foram descobertos;65 coletados,575 testes passaram e seis workers falharam ao iniciar por Timeout waiting for worker to respond. O log contém a causa encadeada; o JSON continuou success=true. O cgroup registrou zero OOM/oom_kill. As seis falhas aconteceram antes das assertions desses módulos; as mensagens503 dos testes de recuperação são controles esperados, não essa causa.

O controle com o mesmo código/pool/seleção/timeouts e os mesmos reporters, alterando a localização de trabalho para filesystem Linux nativo, passou626/626 em71 arquivos em11,50s. O bind levou481,50s e falhou. Os oito arquivos originais passaram29/29 isolados e suas29 identidades também estão no conjunto completo aprovado. Nenhum teste, timeout ou retry mudou.

**Limite histórico:** a primeira ocorrência597/29 não preservou o erro global. A nova reprodução demonstra causalmente a classe de perda por inicialização dos workers nessa topologia, com módulos afetados diferentes. Não foi medida retroativamente a causa de cada um dos oito workers históricos; essa ressalva permanece explícita.

Correção: executar fontes/dependências em filesystem Linux nativo e apenas evidências no bind do host. O executor copia somente860 fontes atestadas, sem trazer target da compilação Windows, .next, dependências ou markers antigos. O runner conserva reporter humano e acrescenta auditoria independente de arquivos esperados, coleta, casos e erros globais. O gate exige correspondência de identidades e contexto de candidato/digest/rodada. JSON parcial ou de outra rodada não aprova.

A auditoria grava journal de coleta incremental e um resumo final; o total de serialização é linear nos casos/arquivos. A comparação usa ordenação O(n log n), memória O(n), n=casos. Custa uma cópia das fontes e registro privado adicional; evita usar IO entre Windows/Linux como filesystem de execução. A configuração de Vitest, seus timeouts, pool e assertions não foram alterados.

## Build Windows

A reprodução usou duas cópias com os mesmos arquivos, lock e dependências. Chamar Next16.1.6 por Y:/w/before resultou em exit1: Turbopack comparou raiz lógica Y: com caminho físico C: de eslint.config.mjs. fs.realpathSync preserva SUBST; fs.realpathSync.native resolve o destino físico, demonstrado diretamente.

Chamar os mesmos inputs pelo caminho físico passou, exit0,46,09s. A correção36d3c3e2 canonicaliza raiz e saída do runner pelo ancestral físico existente. Também preserva o bloqueio de saídas dentro da fonte através de aliases/junctions. Não houve alteração de Next/TypeScript, import, exclusão de arquivo ou ignore de erro. Contraprova que volta a path.resolve foi detectada e restaurada por hash.

## Nova ocorrência da expanded

Frontend corrigido passou até build/browser-install. No backend, o Docker Desktop publicou PostgreSQL descartável em host.docker.internal. DisposablePostgresGuard exige host loopback e nome efêmero exato; recusou corretamente essa URL. Primeiro consumidor: CF015PlanningOwnershipTest. A cascata totalizou927 testes,0 falhas de assertion,790 erros,0 skips, com relatórios de todas as115 classes selecionadas. Esses erros não são790 defeitos financeiros distintos.

O diagnóstico separado com --network host e TESTCONTAINERS_HOST_OVERRIDE=127.0.0.1 não resolveu a capacidade: Ryuk não ficou acessível no loopback. DisposablePostgresGuardTest passou4/4; CF015PlanningOwnershipTest teve5 erros de contexto. Diagnóstico9/5 erros, não expanded aprovada. Não se desativou guard/Ryuk nem se permitiu host genérico. Essa configuração não foi incorporada como solução aprovada.

Ubuntu WSL existe, mas sua CLI informa integração Docker indisponível e não há Node/Java instalados. Não se alterou integração, daemon, permissões ou hospedagem. O próximo lote precisa de um Linux com Docker/loopback comprovados antes de nova expanded. [Proposta delimitada](PROXIMO-LOTE.md).

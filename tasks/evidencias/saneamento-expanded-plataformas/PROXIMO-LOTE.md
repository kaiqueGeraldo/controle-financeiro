# Próximo lote delimitado

Os dois bloqueios originais de plataformas foram saneados e revalidados. A expanded permanece reprovada por capacidade de rede do runtime Linux sobre Docker Desktop, demonstrada em duas topologias. Não é problema de zoom e não amplia DEC-ZOOM-05.

Proposta: disponibilizar um executor Linux descartável com Docker e acesso real aos serviços publicados em loopback, incluindo Ryuk e PostgreSQL efêmero. Pode ser um ambiente Linux nativo já autorizado ou uma integração WSL preparada e validada em etapa operacional própria. O Ubuntu atual não tem integração Docker, Node ou Java; habilitar/provisionar essa capacidade não foi feito por associação. Não implementar proxy amplo de Docker/banco, expor daemon TCP ou relaxar DisposablePostgresGuard neste lote.

Antes do grupo integral: verificar propriedade/isolamento dos containers, conectividade loopback de Ryuk e PG, executar DisposablePostgresGuardTest e um consumidor Spring real em runtime novo. Conferir que o guard ainda rejeita host externo/nome errado. Depois executar a sequência canônica completa, com sources/outputs novos e sem markers reutilizados: frontend,115 classes Linux, contrato Windows correspondente,23 jornadas RF15, E2E financeiro e pacote.

Preservar expanded-01 e loopback-diagnostic, inclusive seus primeiros erros e relatórios; não reapresentar diagnóstico isolado como rodada integral aprovada. Seleção permanece116 classes Java; RF15 A25/B2/C23. Somente os dois casos nativos DEC-ZOOM-05 ficam adiados. CF010/CF015 e adoção CF-017/P01/P02 permanecem separados.

Próximo passo da entrega atual: revisão independente conjunta da seleção/gates DEC-ZOOM-05 e destas correções/provas, incluindo a ressalva de atribuição histórica597/29. A revisão deve conferir o intervalo anterior64b0cb4c..48d0247b e o intervalo deste lote48d0247b..HEAD final. Publicação e nova CI remota dependem de autorização posterior. A reprovação remota histórica da PR#3 não foi encerrada; sem merge, deploy, produção ou banco real.

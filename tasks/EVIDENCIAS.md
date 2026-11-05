# Evidências e publicação

A árvore pública contém somente planos/decisões, código e dados sintéticos reutilizados pelos testes. A allowlist de arquivos sob tasks/evidencias está declarada no .gitignore.

As duas fixtures de onboarding, o oracle financeiro e os scripts/manifests sintéticos usados pelo verificador histórico são entradas de teste. As duas sínteses CF-001 sustentam o validador de especificação. Nenhum arquivo retido contém uma execução nova, log bruto, dump, screenshot, credencial ou configuração privada de hospedagem.

Provas de execução completas ficam em armazenamento privado com controle de acesso e retenção apropriados. Artifacts de CI passam pela allowlist e sanitização existentes. Estados canônicos e exigências de teste são preservados; nenhuma falha é dispensada para obter um check verde.

Esta mudança reduz a árvore atual e os próximos commits. Conteúdo já publicado pode continuar acessível em branches, commits, PRs, caches e clones anteriores. Remoção histórica e revogação de uma eventual credencial real exigem tratamento separado.

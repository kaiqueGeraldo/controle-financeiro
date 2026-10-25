# Registros de ambiente e preparação

Transcrição factual dos resultados das ferramentas; não são logs brutos de produto.

- Primeiro teste sanitização: três testes passaram e o teste de coleta encontrou EPERM em rename do diretório .public-pending para public no temporário do sandbox. Não houve fallback. Mesmos testes executados em s02/temp autorizado:8/8.
- Primeiro supervisor: comando sintético console.log(123) bloqueou antes de criar o filho. CIM confirmou node41280 e supervisor46388, pai41280, criação2026-10-25T13:24:38UTC, caminho .github/scripts/owned-process.ps1. Encerrado somente o supervisor após conferir a identidade; sessão terminou exit4294967295. Causa: leitor Console.In sincronizado do .NET Framework. Worker Task.Run corrigiu; controle posterior imprimiu123 e exit0. Sem processos restantes na conferência final.
- Inventário final: primeira conferência recusou a allowlist por separador de caminho: tasks\evidencias\CF-034\collect.mjs versus tasks/evidencias/CF-034/collect.mjs. O hash observado foi d351aa25bc6bfe7cb6245739f1c819a5897833f44c82c8140cc68dc453f47fa0, alteração autorizada do coletor. Normalização apenas do nome para comparação resolveu; nenhum hash ou conteúdo histórico foi alterado. Resultado final:3165 caminhos,3161 idênticos,4 alterações de código autorizadas,0 ausentes/sem explicação.

Falhas s03/s05/s06 e controles finais têm logs literais próprios neste diretório e runtimes externos preservados. O primeiro temporário do sandbox ficou preservado; nenhuma limpeza geral ocorreu.

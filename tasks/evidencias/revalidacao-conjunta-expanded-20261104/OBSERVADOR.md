# Falhas e correções do observador desta revisão

Nenhuma destas ocorrências foi classificada como falha de produto ou usada para alterar resultados recebidos. Não se repetiu a suíte de produto.

- Leitor Git restrito inicialmente retornou erro de worktree/permissão. A inspeção com acesso adequado confirmou branch/HEAD e árvore limpa; nenhuma configuração Git foi alterada.
- O alias python do Windows não tinha interpretador. Foi usado o Python já distribuído com o aplicativo, sem instalação.
- A versão1 do reconciliador não conseguia abrir uma referência Windows longa. A versão2 de preparação tinha erro de sintaxe no prefixo. Versões preservadas por SHA em RECIBOS.json; a versão final usa prefixo de caminho extenso e concluiu2340 referências, sem relaxar expected. Os erros anteriores constam do histórico de ferramentas desta revisão; este texto é transcrição resumida, não log bruto.
- A primeira conferência E2E comparou o arquivo relativo de uma junction com o relativo da raiz física. O log de assertion e o script foram preservados. A versão final resolve ambos contra rootDir e realpath, confirmando exatamente o mesmo arquivo físico, projeto e cadeia de títulos. As10 listagens já produzidas foram reaproveitadas; nenhuma jornada foi executada novamente.
- A primeira preparação dessa correção encontrou um delimitador textual ausente e parou antes de escrever o arquivo. O delimitador foi corrigido.

Mutações funcionais desta revisão ocorreram somente em clones JSON/XML e fixture do guard; os XML/input restaurados foram comparados por SHA-256. O candidato863/JAR foi conferido antes/depois. Captura, download sintético e brutos novos ficam privados no runtime de RECIBOS.json.

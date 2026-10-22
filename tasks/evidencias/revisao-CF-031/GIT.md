# Identidade, commits e preservação

- Branch conferida: `codex/cf031-onboarding-frontend`.
- Base: `6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`.
- Candidato revisado: `0f0b6190799d0dff39da01f9dd81bbd1f776d694`, incluindo fc786f3/5496fdd/0f0b619.
- Na abertura: staging vazio, README raiz modificado e `.cf22/`, `.cf22r/`, `.cf22s/` não rastreados. Nenhum commit posterior ao candidato existia; nenhuma mudança posterior de produto foi encontrada ao retomar em22/10.
- Primeiro commit local da revisão: `780542bdc92ea43071f6e83ef5bc3fc1888568e4`, somente provas/scripts/probes,228 arquivos. Não inclui parecer nem mudança de estado.
- Segundo commit local: o commit que introduz este documento, assunto `docs(cf031): reject local acceptance and delimit receipt remediation`; contém parecer/matriz/limites e registros em tasks/README e CF031. Obter hash pelo histórico, sem reescrever o próprio hash no arquivo.

Não há produto alterado, nova implementação de CF032, push, merge, deploy, exclusão de branch ou acesso a banco real. Fontes testadas permanecem iguais ao manifesto final621 arquivos da entrega. Staging explícito, primeira seleção restrita à nova pasta de provas; segunda seleção nominal dos documentos e dois arquivos de tarefas.

README raiz: SHA256 inicial e conferências finais **6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA**, igual ao informado. Continua modificado e fora dos commits. Não foi restaurado automaticamente.

`preservation-runtimes.json` confere4123 arquivos contra o inventário CF030, zero diferenças/ausências. `preservation-source.json` confere621 fontes sem mudanças e hashes java/javac idênticos aos registros anteriores. Diretórios preexistentes e arquivos ignorados preservados. Build/testes geram seus artefatos normais; relatórios Java de cada rodada foram copiados antes da seguinte. Sem clean/reset destrutivo ou limpeza geral de target.

Evidências anteriores não foram sobrescritas: scripts de contraprova/baseline foram copiados à pasta desta revisão antes de executar. Cópias temporárias preservadas;206 fontes da contraprova restauradas byte a byte e controle64/64 verde. Logs/capturas de falhas permanecem. Busca por JWT compacto nos novos logs/JSON/XML/Markdown não encontrou ocorrências; sem cookies/traces/vídeos gravados.

Diff de produto vazio. Diff-check dos probes indica somente linha vazia final em dois arquivos; logs brutos podem conter espaços finais. Não reformatados para fabricar evidência limpa. Documentos finais conferidos separadamente. Ao encerrar, staging deve estar vazio e somente README/diretórios preexistentes devem permanecer fora dos commits.

# Revalidação independente dirigida do RVPLA-04

Revisar desde `3a6e95be68678e394cd718d9d688fab1fdc428ce` até o HEAD informado
na entrega, branch `codex/preparacao-local-adocao`. Commits locais de implementação/
testes e documentação separados. Esta entrega não é autoaprovação.
Implementação/testes em `5c751cb75a8345ff8cc812273ae0d053fd888464`;
provas/coleta em `1eb5bbdcb813c0c7e94da627daa6d49741a41dfe`.
Preservação final executada após esse commit e antes do documental; HEAD final
consta na entrega, sem autorreferência neste arquivo.

Tentar invalidar a fronteira entre captura, nascimento/saída de pai/filho,
resolução de identidade e restauração. Usar primeiro o teste original vermelho,
preservando seus hashes/assertions, depois o controle que admite bloqueio seguro
e só recupera em geração nova após fechar os Jobs anteriores.

Conferir que a separação de grupos elimina produtores de comandos antes do
resultado; não aceitar TotalProcesses, active0 ou duas fotografias como garantia
isolada. O contador vitalício serve para recusar fork direto no grupo de controle;
o grupo de comando precisa desaparecer. Atacar simultaneidade de pedidos,
fechamento de handles, guardian tardio, owner morto, wrapper/neto e Job retido.

Verificar erros tipados e os callers: nenhuma exceção pode virar roster vazio,
restore indiscriminado, complete ou próximo gate. O estado incompleto deve
preservar mutação/backups/evidências e recuperar sem promover prova antiga.
Contestar observer identity, PIDs reutilizados e sessão desconhecida. Revalidar
o modo sem nome compartilhado e o novo adaptador cmd, sem executar CI remota.

Avaliar também o custo: o observer legado20s ficou falho, não dispensado. A prova
nova antes do filho usa sincronização por handles/Job; ela não transforma a
rodada antiga em verde. Rever a necessidade de cada fronteira e o custo de
varredura/launch, sem trocar a garantia por sondagens probabilísticas ou aumentar
limites. Comparar os manifests e fontes realmente executados, não presumir build
do HEAD ou somar testes/rodadas sobrepostos.

RVPLA-01 e RVPLA-03 específico continuam aceitos no alcance anterior. TCP/reuso
nativo e HQL permanecem inconclusivos,40s preservados; Linux anterior é Docker
em Windows. Não ampliar para supervisor nativo Linux, WMI/serviço externo ou
quiescência universal de daemon/SQL. Pacote p05 e migrations devem manter SHA.
CF017/P01/P02 e CF034 integral continuam em_revisao; adoção real não liberada.
Sem banco real, ação remota, push, merge, CI remota, hospedagem ou deploy.

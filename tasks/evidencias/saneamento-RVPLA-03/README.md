# RVPLA-03/P2 — saneamento local dirigido, 27/10/2026

**Correção local para revisão independente; sem autoaprovação.** O defeito era
a árvore de comando fora da supervisão: interromper Node não encerrava cmd e
PowerShell, que ainda podiam iniciar Java. A checagem anterior de JVMs não via
essa capacidade futura. Produto financeiro, migrations e pacote permanecem iguais.

| Estado | Conclusão deste lote |
|---|---|
| A — RVPLA-01 | Aceite preservado. Falha pré-efeito permanece falha e é reexecutada quando a restauração é segura |
| B — corrida de porta | Aceite anterior da reserva no listener real preservado; reuso nativo imediato continua não certificado |
| C — RVPLA-03 | Saneado localmente no caminho Windows demonstrado, **aguardando revisão independente**, inclusive dos helpers compartilhados |
| D — startup HQL | Inconclusivo, gate não aprovado; limite original40s e falhas históricas preservados |
| E — adoção real | Não liberada. CF017/P01/P02 e CF034 integral permanecem em_revisao; nenhuma sucessora encerrada |

Base `9bed5e20f2cc46e4c7ae721ff2390054eb6db141`, revisão anterior
`af73bbd8fc6821a1e084dd1bcfdd436212811d82`, ancestralidade conferida, branch
`codex/preparacao-local-adocao`. Entrada: somente README raiz alheio modificado.
Os commits deste lote são locais; o HEAD final consta na entrega, sem hash
autorreferente neste documento.

## Prova causal e garantia demonstrada

Antes de editar, o probe original foi executado em `rvpla03-before-01`.
Somente a allowlist do destino foi adaptada de `revalidacao-` para `rvpla03-`;
assertions e observador originais continuam preservados. Node47700 foi
interrompido, wrapper32640 ficou vivo durante0002; a retomada terminou às
13:15:29.660Z e Java40408 produziu efeito às13:15:30.613Z. Fonte restaurada não
significava árvore encerrada. Nenhum DB ou efeito financeiro nessa fixture.

A correção reutiliza o Job Object e a identidade UUID existentes, abrangendo o
worker Node, cmd, PowerShell, Java e descendentes **antes de comandos mutantes**.
O controlador externo registra PID, nascimento e sessão do owner; o guardião
cria seu Job antes de conferir a vida desse owner. Assim, mesmo um guardião que
inicie tarde não pode liberar trabalho após a morte do owner. A retomada usa
mutex da execução, verifica registros anteriores e exige ausência de seus Jobs.
Dentro da execução, a restauração exige roster sem descendentes de comandos.
O simples envio de stop ou a ausência de Java não autoriza avanço.

As provas com barreiras interromperam Node antes de Java e depois de filho e
neto Java. A retomada imediata restaurou os inputs e criou0002 failed; ao liberar
o sinal antigo, nenhum Java tardio pôde nascer porque o Job anterior já estava
ausente. Outra execução legítima e um Java externo permaneceram ativos. O teste
de cleanup parcial conservou `restoration-pending` enquanto havia descendente,
e somente a execução seguinte, após fechar o Job, restaurou a mutação.

Na contraprova isolada, remover as duas fronteiras novas restaurou o defeito:
wrapper16968 sobreviveu e iniciou Java54076 após a tentativa seguinte. O runner
isolado foi restaurado por SHA e o controle corrigido passou. A fonte canônica
não foi mutada. [Modelo e limites](MECANISMO.md), [comandos](COMANDOS.md),
[resultados e mapa de artefatos](resultados-final.json) permitem auditar os dados.

## Controles e falhas preservadas

| Controle | Resultado e alcance |
|---|---|
| Resume/checkpoint + independentes + CI |43/43:28 +10 +5, sem skips. Uma rodada; contagens não somadas com rodadas anteriores |
| Processos |5/5 em process-03, sobre fontes finais. Process-01/02 preservados, mesmos cenários; rodadas não são somadas |
| Janelas/identidade |5/5 em edges-04, incluindo recusa entre sessões Windows. PID reutilizado simulado por nascimento divergente; intervenção recusada, processo vivo |
| Helper compartilhado | shared-03: saída normal e interrupção abrupta; handles de guardião, filho e neto sinalizados, sockets sintéticos sem conexões reutilizados. Shared-02 preservado |
| Preflight real PG17 | Mutação detectada por assertion causal; fontes restauradas, checkpoint complete. Resume/audit de real-01 e real-02 retornaram0, sem Maven adicional; respectivos checkpoints SHA idênticos |
| PG16/JAR |3 testes:2 pass,1 erro de bind do probe de reuso imediato,0 skips |
| PG17/JAR |6 testes:5 pass,1 erro de bind do mesmo probe,0 skips |
| PG17/imagem Linux |4/4, sem falhas/erros/skips |
| Alocador antigo | Mutação isolada detectada:1 assertion falha,0 erros/skips; fonte restaurada por SHA e controle1/1 |

Os dois erros nativos ocorreram depois de `app.close()` e da assertion de processo
morto, em provas Java diretas sem interrupção de Node. Reapareceram com supervisão
ativa. Não foi demonstrada a mesma causa de RVPLA-03. Sem estado TCP no instante
dos binds históricos, a causa permanece **inconclusiva**; TIME_WAIT é hipótese,
não diagnóstico. O probe original permanece intacto e falho; nenhum substituto
relaxado, retry ou timeout maior foi usado. O contrato aceito reserva porta0 no
listener real, verifica identidade e readiness; não prometia reassumir
imediatamente o mesmo número fixo após tráfego HTTP. O residual fica explícito,
sem reabrir genericamente nem dispensar silenciosamente o aceite anterior.

Falhas intermediárias também foram guardadas: smoke-01/02 detectaram o erro do
observador que contava processos de console criados pela própria consulta;
passou-se a consultar de fora do Job e registrar o roster inicial antes de
liberar o worker. edges-01/02 tentaram abrir um processo já encerrado; as fontes
v1/v2 estão preservadas. A versão discriminante retém o pipe no controlador e
abre o handle antes de soltar a barreira, isolando a janela de boot do EOF real.
shared-01 encontrou regressão da conversão PowerShell null→string vazia no novo
parâmetro opcional; normalização em C# corrigida e caminho original revalidado.
Essas falhas não contam como detecção causal do wrapper antigo.

A auditoria agregada teve duas falhas próprias preservadas: argumento Windows
grande demais (antes de criar PowerShell) e comparação literal de mensagem
quebrada em duas linhas pelo PowerShell. Entrada por arquivo e normalização
somente de espaços corrigiram o observador; o motivo completo continuou exigido.
Auditoria final:57 identidades de Job examinadas,20 ausências certificadas com
sessão,36 registros intermediários anteriores sem sessão (ausentes apenas na
sessão atual, não reutilizáveis),1 sessão sintética divergente corretamente
bloqueada e6 recibos inválidos preservados. Nenhum comando de terminação nessa
auditoria e nenhum container de API ativo com o label do harness.

## Proveniência e preservação

JAR p05 **b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b**,
produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Imagem local
`sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Nenhum JAR/imagem novos. Maven test compila classes/probes descartáveis; não se
atribui pacote ao HEAD documental ou ao HEAD sujo dos manifests.

Exportações PG/real têm833 inputs: delta em helpers, sem alteração de produto.
Todos os inputs exportados foram restaurados e conferidos. PG usou o helper
antes da normalização do modo sem nome e do bloqueio entre sessões; o caminho
nomeado daquela rodada foi verificado, e as alterações posteriores são cobertas
pelas provas finais de processos/janelas. Shared-03 cobre o modo sem nome.
As rodadas reais01/02 registram seus próprios manifests e fingerprints.

Preservação inicial/final cobre2.989 arquivos protegidos, incluindo29 históricos,
16 migrations, JAR,831 inputs p05, provas independentes e runtimes anteriores.
README raiz SHA
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`,
fora dos commits. Apenas três fontes antigas autorizadas foram excluídas da
comparação por serem a correção; novos helpers/probes são delta explícito.
O snapshot final foi gravado após o commit de provas df3ac949 e antes do
documental; nenhuma fonte de produto foi alterada entre esses momentos.
Originais externos foram preservados; cópias de logs têm sanitização e SHA
original/coletado distintos, descritos no mapa. Checkpoints coletados são provas
para leitura, não recibos portáveis para retomar de outra pasta.
Coleta final:894 artefatos de23 runtimes novos,41 cópias com sanitização/decodificação
distinta; nomes acima do limite foram mapeados por hash, sem mover o original.

Sem alteração de src/main, frontend, migrations, configurações de produto ou
proveniência do pacote; sem limpeza de target, encerramento por nome/porta,
banco real, ação remota, push, merge, CI remota ou deploy. [Encaminhamento](ENCAMINHAMENTO.md).

# RVPLA-04/P2 — saneamento local dirigido, 27/10/2026

**Saneado localmente no cenário demonstrado, aguardando revisão independente.**
O observador descartava um PID capturado que terminava durante a resolução de
identidade. Um wrapper podia criar filho e sair nessa janela: o pai era descartado,
o filho não estava na captura e a lista parcial autorizava restauração e complete.

Base `3a6e95be68678e394cd718d9d688fab1fdc428ce`, branch
`codex/preparacao-local-adocao`. Revisão antecedente:
`eb785362a3a95dfb00a66e235890f701edecdc88` e3a6e95be. HEAD, ancestralidade, diff
real e working tree conferidos; entrada somente README raiz alheio modificado.
Nenhum AGENTS.md adicional encontrado no repositório/ancestrais; instrução Tech
Lead fornecida pelo usuário aplicada. [Garantia definida antes de implementar](GARANTIA-PREVIA.md).

| Estado | Alcance nesta entrega |
|---|---|
| RVPLA-01 | Aceite preservado: falha pré-efeito não vira sucesso/cache; recuperação segura reexecuta a tentativa |
| RVPLA-03 | Aceite específico anterior preservado: abandono Windows/mesma sessão. Não ampliado para host Linux ou outros modos de criação |
| RVPLA-04 | Corrida de handoff bloqueada, controles locais concluídos, **em revisão independente** |
| TCP/reuso nativo | Investigação própria inconclusiva; PG16/JAR2/3, PG17/JAR5/6 históricos com erros de bind preservados. Reserva dinâmica aceita no alcance anterior |
| Startup HQL | Inconclusivo/não aprovado;40s e falhas históricas preservados |
| Adoção real/produção | Não liberadas. CF017/P01/P02 e CF034 integral em_revisao; sem fechamento de tarefas maiores por associação |

## Prova antes e depois

O teste vermelho original rodou **antes de editar**, em rvpla04-original-01.
Somente a allowlist do destino do driver foi adaptada; teste contratual, GUI e
assertions originais ficaram intactos. Diagnóstico exit0, contrato exit1 por
OWNED_DESCENDANT_EFFECT_AFTER_COMPLETE. Às16:08:27.776 de27/10, em São Paulo,
o checkpoint estava complete e a fonte original; às16:08:27.782 o filho69520
gravou seu efeito lendo essa fonte. Timestamps brutos UTC estão nos artefatos.
Houve efeito sintético após conclusão/restauração; não se demonstrou corrupção
financeira nem execução efetiva de outro gate.

A correção deixa de usar lista de PIDs como autoridade. Cada comando é iniciado
em Job próprio pelo controlador externo e só devolve resultado depois de o Job
desaparecer. O Job do worker conserva apenas seus papéis de controle registrados;
qualquer criação direta adicional invalida a fronteira pelo contador vitalício,
inclusive quando o processo já terminou. Desaparecimento/erro durante inspeção
é falha conservadora. [Mecanismo, alternativas e limites](DESENHO.md).

Na mesma barreira após captura, o corrigido registrou restoration-pending,
environmentVerified=false, restorationVerified=false, fonte mutante e nenhum
próximo gate. O filho44636 da rodada final, liberado **após observar esse bloqueio**, leu mutant.
Só após fechar a execução anterior e confirmar ausência do Job, outra geração
restaurou, reexecutou e gravou0002 complete. Os resultados e o checkpoint são
observáveis; não se infere segurança apenas de flags do teste.

Contraprova isolada reintroduziu os módulos ancestrais: o mesmo oracle ficou
vermelho por complete prematuro. Fontes restauradas por SHA e controle corrigido
verde. Oracle SHA-256
`dcc24ed893817b9ad665bdfdf201a1a317cdf4664dd390f32c1d4eab2b93801d`;
probe corrigido antes/restaurado
`4a31928cef4878fb296afe0964ccf4917e49a35f70c97ed05d63b934475c741e`.
O adaptador novo, ausente da base, fica presente mas sem uso no mecanismo antigo.
Nenhuma mutação dessa contraprova ocorreu na fonte canônica.

## Resultados, sem somar sobreposição

| Grupo | Observado |
|---|---|
| Checkpoint/resume e CI |43/43,0 skips:28 +10 +5 existentes. unit-02 usa todos os temporários no runtime; unit-01 preservado, não são86 casos |
| Handoff original e contraprova | Original vermelho; mecanismo antigo vermelho; corrigido verde com fonte mutante enquanto bloqueado e recuperação posterior válida |
| Inspeção falha |2/2: identidade inconclusiva e erro operacional após efeito bloqueiam restore/complete/próximo gate; geração seguinte recupera |
| Ciclo de vida do broker |4/4: wrapper cria filho/neto, normal seguro, interrupção de owner/guardião, objeto de Job retido bloqueando resume |
| Antes do filho |1/1 por handles: wrapper encerrado e Job ausente antes do resume; sinal antigo liberado depois não pode criar filho |
| Histórico do grupo | Filho já encerrado, sem extras no roster, ainda bloqueia: total vitalício4 contra baseline3. Ausência na fotografia não apaga a criação |
| Identidade/janelas anteriores |5/5 preservados na nova execução: antes/depois do Job, registro inválido, nascimento e sessão divergentes |
| Helper compartilhado | Saída normal e interrupção com Java/neto passaram no modo sem nome; sem CI remota |
| Preflight real PG17 |1 assertion causal esperada,0 erros/skips, fontes restauradas e complete legítimo. Resume/audit0, sem novo Maven, SHA do checkpoint idêntico |
| Observador divergente | Recusado por identidade incompatível; checkpoint real e número de tentativas permaneceram idênticos |
| Probe legado de abandono | **Não certificado nesta rodada:** seu limite global inalterado de20s interrompeu o resume. Falha e histórico conservados; recuperação separada terminou failed com fonte restaurada. Não contado como verde |

O probe legado de20s continua como limitação de custo da nova orquestração, não
como prova de wrapper sobrevivente ou autorização de quiescência falsa. Não se
aumentou esse prazo nem o de startup. O novo controle antes do filho usa término
de handles e fechamento do Job para decidir, sem substituir o resultado legado.
[Falhas intermediárias](FALHAS.md), [comandos](COMANDOS.md),
[mapa final de resultados/hashes](resultados-encerramento.json).

Não foram repetidos testes financeiros integrais, PG16/JAR ou API Linux sem
hipótese discriminante: o delta é contenção Windows/observador, exercitado por
processos reais e preflight PG17. Não há mudança em API, alocação de porta ou HQL.
Linux4/4 anterior significa aplicação Docker em Windows, não supervisor Linux.

## Preservação e proveniência

JAR p05 SHA-256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`,
produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`, intacto.
Imagem anterior `sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Nenhum pacote/imagem novos; Maven test compilou somente a cópia descartável.
Os manifests registram o HEAD real3a6e95be com delta sujo de helpers; não se
atribui uma compilação de produto a esse HEAD ou aos commits documentais.

Preservação inicial/final de5.854 arquivos protegidos, incluindo29 históricos,
16 migrations,831 inputs p05, JAR, provas independentes, checkpoints e runtimes
antecedentes. Cinco fontes autorizadas a mudar estão explicitamente separadas.
Produto/backend/frontend e migrations sem diff. README raiz conserva
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`,
fora dos commits. Exportações833/834 inputs restauradas, inclusive a tentativa
pré-efeito com exit255. Binários GUI/classes diagnósticos ficam externos e têm
manifest SHA próprio, sem JAR novo.
Snapshot final feito após o commit de provas1eb5bbdc e antes do documental,
sem alterações de produto entre esses momentos.

Coleta final:1.834 artefatos de24 runtimes,10 cópias com decodificação/sanitização
distinta, hashes original/coletado registrados. Auditoria de leitura:127 Jobs,
126 ausências certificadas com owner encerrado;1 sessão sintética diferente sem
certificado e1 recibo inválido preservado. Zero containers de API com label do
harness, sem comando de terminação na auditoria. Checkpoints coletados são leitura,
não recibos portáveis para outra pasta.

Rodadas finais do protocolo3: handoff-03 (mesmo oracle antigo vermelho/corrigido
verde), faults-02, broker-03, before-child-02 e real-03. Os grupos de janelas e
helper sem nome anteriores exercitam ramos que a mailbox não alterou. Não há
soma das rodadas01/02/03 como novos casos. Manifest de31 binários/classes de
diagnóstico em binarios-encerramento.json, sem incluí-los no Git.

Sem clean/reset destrutivo, limpeza geral de target, encerramento por nome/porta,
DB real, alteração de hospedagem, CI remota, push, merge ou deploy.
[Encaminhamento para revisão independente](ENCAMINHAMENTO.md).

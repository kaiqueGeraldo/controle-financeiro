# Achados independentes

## RVPLA-04 — encerrado no recorte Windows/sessão atual

O defeito era certificar uma fotografia parcial como ausência de descendentes.
A reprodução original foi reexecutada com módulos do blob3a6e95be: wrapper cria
filho depois de QueryIds e termina antes da resolução de identidade. O teste
contratual original ficou vermelho por OWNED_DESCENDANT_EFFECT_AFTER_COMPLETE.
Driver só teve allowlist de pasta adaptada; teste e assertions byte idênticos.

No candidato, a mesma barreira conserva restoration-pending, fonte mutant,
environmentVerified/restorationVerified false e nenhum próximo gate. A leitura
do filho, liberado somente após a decisão, observa mutant. Uma geração posterior,
após Jobs ausentes, restaura/reobserva e conclui0002. Contraprova com os módulos
ancestrais: mesmo oracle vermelho; fontes restauradas por SHA; corrigido verde.

Há uma inadequação explícita do teste original como oracle positivo universal:
ele exige inputAfter=original e efeito lendo original antes de exigir ausência de
complete. Contra o bloqueio correto, falha na pré-condição mutant!=original.
O script foi preservado/reexecutado também nessa condição. O complemento exige
fonte mutante/bloqueio, detecta o mecanismo antigo e não afrouxa esse contrato.

O novo broker contém comandos em Jobs próprios antes de poderem criar filhos e
devolve resultados somente depois de confirmar ausência do grupo. O worker de
controle precisa manter o contador vitalício registrado; PID desaparecido,
contagem incoerente ou erro de consulta não viram lista vazia.4/4 broker,2/2
falhas, antes-do-filho1/1 e2/2 controles independentes de canal/mutex passaram.
Não foi demonstrada quiescência falsa no candidato nesse recorte. Sem promessa
universal sobre daemon, WMI, host Linux, código hostil ou outros criadores.

## RVPLA-05 — P2: regressão de custo impede o gate legado de resume20s

Locais: counterproofs.mjs:59–70, verificação de ambiente; counterproof-supervision.mjs:
82–113, fronteira/lançamento/fechamento por comando. O custo agregado é relevante,
não um erro isolado de uma chamada de negócio.

O probe original mede retorno/close de **todo o processo de resume B** em20s.
Não mede apenas término de A, do wrapper ou do broker. Ele passou na base e
falhou no candidato, sob condições equivalentes e instrumentação declarada.
Na base, B fechou em7,711s; no candidato, o observer começou sua interrupção
após20,004s e observou close forçado em20,903s. O tempo total do script36,848s
inclui preparar/interromper A e não é o orçamento de B.

Complemento finito, sem transformar o gate em verde: B da base terminou em7,985s;
B do candidato terminou naturalmente em28,181s. Aos20,012s,0001 estava recovered-
incomplete e0002 failed-before-completion, fonte ainda mutante, verificação de
ambiente por comando ainda pendente. Owners/guardian e Jobs de B vivos tinham
identidade confirmada; os Jobs de A já estavam ausentes antes de iniciar B.
Após28,181s, a tentativa terminou failed, com fonte restaurada. Nenhuma promoção
de falta de JUnit para complete.

Cinco comandos da retomada, incluindo ferramenta de teste sintética e checagens
de ambiente, custaram3,502–4,107s cada entre persistência do recibo e confirmação
de fechamento, sem contar a fronteira anterior a cada recibo. Soma~18,786s,
mais inicialização/consultas/protocolo. São medições de parede locais, não CPU
profiling, percentis ou SLO da API. O teste sintético não executa Maven real.

Classificação **C: latência viola o contrato vigente do probe**. Não foi demonstrada
regressão de abandono/descendente tardio, erro do oracle de20s ou causa ambiental
para essa ocorrência. Carga/instrumentação podem afetar tempos, mas a comparação
controlada, os estados e os intervalos sustentam a regressão observada; não
estabelecem garantia de duração para toda máquina.

Impacto: o controle interrompe o resume enquanto a finalização ainda está em
curso, deixando recuperação pendente. A fixture interrompida foi recuperada em
geração separada, preservando checkpoint/input anteriores, sem aprovar ou repetir
o gate legado para buscar verde. O runner não recebe aceite funcional nesse prazo.

Próximo saneamento: reduzir custo de lançamentos/consultas auxiliares redundantes
sem cachear certificados de quiescência nem devolver resultado antes de fechar o
Job. Perfilar fronteiras e considerar consulta persistente/batch com ownership e
ciclo de vida igualmente demonstrados. Manter o probe original20s e as contraprovas.
Se houver proposta de outro orçamento, submetê-la como decisão separada; nenhum
prazo foi alterado nesta revisão. **Sem correção implementada.**

## Audit real — falha operacional observada, causa ainda inconclusiva

Preflight PG17 produziu assertion causal esperada e complete legítimo; resume
declarou conclusão verificada reutilizada, uma tentativa e sem Maven adicional.
O audit seguinte falhou com EPERM em atomic rename da mailbox, após o registro
do worker e antes de confirmar a verificação solicitada. Não houve retorno de
sucesso. Log, pedido imutável e temporário permanecem; audit não foi repetido.

Não há captura do handle/dono ou erro Win32 detalhado para atribuir a ACL,
antivírus, leitor concorrente ou ambiente. Não se declara bug causal de lock
nem sucesso de audit por herança. A identidade divergente foi testada separadamente:
recusada, hash do checkpoint idêntico antes/depois e nenhuma nova tentativa.
O audit bem-sucedido anterior é prova histórica conferida, não verde desta rodada.

Condição de encerramento: diagnóstico delimitado da substituição de mailbox e
controle do caminho audit sem essa falha, preservando fail-closed/identidade e
sem retry para mascará-la. Sua causa pendente soma limite operacional ao runner.

# CF-031 — saneamento local RC031-01/02

22/10/2026. **CF031 permanece em_revisao**, aguardando revalidação independente
dirigida. Base `e1f5048a0d9c2ab1c98f192ba5476328dc5113d4`, mesma branch
`codex/cf031-onboarding-frontend`; [commits e preservação](GIT.md).
Executor Codex desta conversa, sem mudança automática de modelo/esforço pela tarefa.
Fontes finais:624 arquivos em `candidate-source-sha256.json`, manifesto SHA256
`6AC10102A261FF1507C1E48B0FDDD064C299502F373F6640E8D5E7CFD89C6173`.

## Causas e correções

RC031-01: GET de recibo após reload não tinha a preparação em memória e aceitava
caixa livre que não correspondia aos livres das fontes. `parseSummary` agora
confere caixa livre/investimentos não destinados e seus estados/subtotais no
próprio snapshot, com centavos BigInt amplos. E01 exige950/301, não999999.
Não compara recibo histórico com saldos atuais nem substitui resposta inválida
por resultado local fabricado. UNKNOWN/PARTIAL, negativos e agregados>M preservados.

RC031-02: leitura de reservas era parcial e duplicada. `legacyReservation` aplica
um contrato integral ao inventário e aos snapshots anterior/proposto, exigindo
membros próprios, tipos/nulabilidade, variantes e partes/ref/evidência válidas,
nominal coerente e limites individuais somente nas parcelas. Extras de leitura
permitidos, incluindo __proto__ como dado próprio. Parser JSON existente já
constrói propriedades com defineProperty; não foi alterado e não se alega
poluição global. [Contratos, consumidores e custo](CONTRATOS.md).

Resposta inválida não confirma sucesso. Complete/GET operação conservam
preparação, UUID e hashes; retry repete o corpo. GET após reload oferece carregar
de novo e recupera o recibo original, sem novo prepare/complete. Conflito, rede
e resposta inválida conservam seus tratamentos anteriores; estado incerto não
vira rollback nem compensação financeira.

## Evidências

| Prova | Antes | Depois |
|---|---|---|
| Sete probes independentes intactos |4 passam/3 falham pelos dois P2 |7/7 |
| Coerência, consumidor HTTP/store |2/9 |9/9 |
| Reservas |27 rejeições ausentes em42 controles iniciais |53/53 finais, com ampliação documentada |
| Suíte dirigida CF031 |75 anteriores preservados |138/138 (75+9+53+1), sem somar rodadas |
| Navegador real + PostgreSQL |RC031-01 original reproduzido após commit,999999 exibido/950 no servidor |12/12, Java1/1,12 checkpoints SQL |
| Contraprovas isoladas |Guardas removidas restauram falhas |2/2 detectadas; controle127/127 restaurado |
| Lint/tipos/build; unitários existentes |—|exit0/0/0;6/6 |

[Execuções, comandos e falhas preservadas](EXECUCOES.md). Configuração suplementar
importa as jornadas originais sem editar assertions ou timeouts. Em cada E01,
GET real adulterado só no retorno é recusado, recuperação relê recibo válido,
replay idêntico retorna o mesmo objeto e reload conserva. SQL confirma1 recibo,
16 itens aplicados, contas1300, reservas550 e1 previsão pendente/0 pagas; nenhum
novo efeito por recuperação/replay. Casos draft/cancel sem efeito permanecem.

Capturas inspecionadas: [erro mobile RC031-01](e2e-after/mobile-360-SP-cash-rejected.png),
[erro tablet RC031-02](e2e-after/tablet-768-UTC-reservation-rejected.png) e
[recuperação mobile com950 visível](e2e-visible-free/mobile-360-SP-valid-recovered.png). Erro e botão de
nova leitura cabem no viewport, sem conclusão/valor adulterado. Capturas seguem
estado observável; complemento com valor950 visível passou4/4, Java1/1 e quatro
checkpoints SQL em `e2e-visible-free/` (seleção sobreposta, não somada às12).
Não há auditoria visual ampla ou certificação de zoom nesta correção de parser.

## Carregamento/sessão e limites

[Investigação separada](SESSAO-CARREGAMENTO.md): T01 carregava entrevista/listas;
T02 terminou em sessão encerrada/aviso de transporte após relogin. Novos timelines
registram requests/status/navegação/DOM sem tokens. Atrasar um catálogo reproduz
loading; falhar o perfil reproduz o segundo estado; restaurar a variável recupera
o mesmo recibo. **A origem histórica continua inconclusiva**. Não atribuir a timer,
fuso, autenticação cruzada ou ambiente sem a correlação ausente na prova antiga.
A nova12/12 não apaga as duas11/12 anteriores nem prova sua resolução.
Nenhuma correção de produto/sessão ou fixture foi justificada. Próximo experimento
útil e hipóteses delimitadas no relatório; os dois P2 não ficaram sem correção.

As três falhas amplas não foram reabertas: uma de fixture e duas inconclusivas
quanto ao timer conforme revisão. Não declarar suíte ampla inteira verde.
Sem benchmark de catálogo/produção ou prova de todos os interleavings.
FIN-06, NG-01, precisão/civil, edição/conflito/persistência e gerações sustentadas
mantêm seus controles. Único produto alterado é o parser onboarding; sem mudança
de API compartilhada, UserProvider, schema ou backend financeiro.

DEC-ONB-03 preservada: zoom nativo200% pendente em CF010/015, sem conclusão dessas
tarefas. CF032 continua não liberada; adoção real CF017/P01/P02 mantém seus gates.
Commits locais; nenhum push, merge, deploy, exclusão de branch ou banco real.
[Encaminhamento independente](REVISAO.md).

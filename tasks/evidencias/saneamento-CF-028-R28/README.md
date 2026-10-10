# Saneamento documental R28-01 e R28-02 — CF-028

10/10/2026, base `ef5cfae3805428f57562e3104284a41570d43811`, branch
`codex/cf-028-contrato-onboarding`. CF-028 continua **em_revisao**. Este documento
explica o delta, não substitui o [contrato canônico](../../../docs/sdd/specs/001-onboarding.md)
nem reescreve o [parecer independente](../revisao-CF-028/README.md).

## Base e reprodução anterior

[baseline.json](baseline.json) registra HEAD/branch/status/staging e SHA256 dos
cinco arquivos independentes antes da edição. HEAD igual à base; ancestralidade
confirmada, intervalo posterior vazio. Staging vazio e único delta preexistente
README raiz, SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
AGENTS da conversa aplicado; nenhum outro aplicável na árvore/ancestrais.

Lidos parecer completo/matriz/condições de encerramento, probe/harness/resultados,
CF-028, SPEC-001, evidências/gerador/verificador anteriores, FIN-01/05/06/08/NG-01,
tasks/README/EXECUCAO/POLITICA-DE-TESTES e CF-029–032. Sem alterações nas dependências.
Busca dirigida não encontrou consumidor de ONBOARDING_COMPLETE/knownSubtotal no
produto; representações afetadas existem em artefatos documentais.

Antes de editar contrato/fixtures foram executados os originais intactos:

```powershell
& tasks/evidencias/revisao-CF-028/probe.ps1
node tasks/evidencias/revisao-CF-028/harness.mjs
```

[before-probe.json](before-probe.json) reproduz `1999999999999.98` de cobertura,
`-1999999999999.98` de livre e dois mundos compatíveis com reserva desconhecida:
livre1000 ou700. Nenhuma alternativa de Fact<Money> anterior expressava os dois
primeiros como conhecidos válidos; reserved:Money/progress:string obrigavam número
no último. [before-harness.json](before-harness.json) confirma E01 e o verificador
anterior9/9 nos três TZ, além da lacuna N2. Verde do probe é prova aritmética da
contradição **textual**, não teste de produto vermelho; valores esperados preservados.

## R28-01 — causa, solução e limites

Causa: teto de entrada/posição Money aplicado também a alguns derivados; outros
usavam OUT_OF_RANGE/null. Solução: AggregateMoney/AggregateQuantity exclusivos de
leitura, exatos, sinal/escala por campo e indicador outsideIndividualRange ortogonal
ao conhecimento. FIN-06 permite informar agregado fora da faixa; agora o indicador
informa essa situação sem ocultar o decimal. Operações/posições individuais mantêm
teto, validação de parcela e rejeição. Não mudou FIN-06 global, NG-01 ou arredondamento.

E16 tem duas parcelas/reservas máximas e meta sem teto pelo alvo: soma conhecida
1999999999999.98; E17 preserva déficit real/livre−1999999999999.98. Não são UNKNOWN.
Schema/validação incluem todos os derivados, totais líquidos e intermediários.
Cardinalidades do request dão limites derivados para novos dados; inventário legado
não tem limite financeiro fixo. Limites de bytes/memória/tempo exigem medição/configuração
CF-030 e erro operacional503, nunca truncamento/recibo parcial/novo teto financeiro.

Alternativas descartadas: ampliar Money global relaxaria entradas; manter null
ocultaria valor conhecido; string sem indicador perderia sinalização FIN-06.
Decimal amplo exige acumuladores exatos e controle de recursos; soma continua
obrigatória, não basta validar representação. A observação R28-N1 foi incorporada
sem auditoria ampla de desempenho ou implementação.

## R28-02 — causa, solução e política de ações

Causa: rótulo de cobertura incompleta não tornava reserved/progress representáveis
sem número inventado. SummaryAmount obrigatório e discriminado abrange KNOWN,
PARTIAL, UNKNOWN e NOT_APPLICABLE (só cobertura numérica). Estado não deriva de zero;
campos/lacunas/indicador têm combinações fechadas na canônica. PARTIAL conserva
subtotal confiável, não total. Reserva desconhecida invalida livre/capacidade da
fonte, não patrimônio/dívida conhecidos. E18 desconhecido, E19 parcial e E20 zero
comprovado têm prepare/recibo/GET completos em [cases.json](cases.json).

Complemento sem modificar vínculos incertos pode concluir; novos vínculos/aumentos
nessas fontes são400. Não liberar par cujo valor/proveniência são desconhecidos;
redução de par conhecido não fabrica capacidade em outras reservas desconhecidas.
Isso preserva FIN-05 e política anterior de impedir nova alocação, sem bloqueio
global de legado ou preenchimento fictício. Nenhuma decisão material adicional
de produto foi necessária; DEC-ONB-01 permanece intacta.

Nulls isolados seriam mais curtos, mas não distinguiriam parcial/desconhecido/não
aplicável. Objeto uniforme amplia DTO, porém permite validação explícita e renderização
segura. PARTIAL é necessário para E19; OUT_OF_RANGE não é estado de conhecimento.
Não há estados adicionados apenas para particularidade de implementação.

## Identidade, artefatos e tarefas futuras

Schema v1 não publicado foi corrigido; versão, sessão, UUID, CompleteRequest,
canonicalização e protocolo não mudam. Mesmo draft E01 mantém contentHash/números;
Summary diferente muda reviewHash/fingerprint explicitamente. Prepare/recibo/GET
de cada exemplo carregam o mesmo snapshot. Recibos reais não foram regravados,
nem haveria autorização para reinterpretar recibo antigo após implementação.
Fixtures anteriores permanecem em `ef5cfae` e nas provas independentes originais.

CF-029 conserva escrita; CF-030 implementará DTOs/agregações/guardas/capacidade;
CF-031 consumidores; CF-032 provas integradas. Nenhuma sucessora iniciada/liberada,
nenhum endpoint/serviço/tela/entidade/migração alterado. N2 recebe checagem dirigida
de newAllocationCapacity no verificador E01 e nos novos casos, sem expandir para
certificação de schema/protocolo completos.

## Comandos de validação documental

```powershell
node tasks/evidencias/CF-028/build-examples.mjs
node tasks/evidencias/CF-028/verify.mjs
node tasks/evidencias/saneamento-CF-028-R28/build-cases.mjs
node tasks/evidencias/saneamento-CF-028-R28/verify.mjs
git diff --check
```

[after-e01.json](after-e01.json): nove grupos e cinco corrupções anteriores passam;
patrimônio1451.00/dívida350.00/reservas550.00 preservados.
[after-r28.json](after-r28.json): nove grupos passam e oito contraprovas são detectadas,
incluindo a capacidade adulterada N2. Cinco cenários completos E16–E20 em
[cases.json](cases.json) reconciliam decimais e hashes de conteúdo/revisão.
E19 representa componentes de um único par legado parcialmente conhecido, não
comandos duplicados. Os SHA256 antes/depois no resultado confirmam que as
contraprovas não modificaram contrato, fixtures, gerador ou verificadores.
Os scripts usam BigInt; expected das fixtures são literais, não importam helpers
de produto. Contraprovas em cópias/VM de memória; arquivos principais/provas
originais não são mutados. Não executar builds/suítes de produto por mudança documental.
Três TZ do harness anterior apenas confirmam independência documental de calendário,
não cobertura runtime; saneamento não precisa repetir essa matriz temporal sem delta.

## Encaminhamento ao mesmo revisor

Revalidar intervalo **ef5cfae..HEAD desta branch**, sem repetir toda CF-028.
Seções alteradas: SPEC-001 §§3–5 (tipos, sinais, estados, propagação, capacidade,
hashes/erros), §7 E15–E20, §8 critérios futuros; artefatos E01 e novos casos/verificadores;
tarefa/evidências apenas anotam saneamento, mantendo em_revisao.

Condições objetivas: E16/E17 representáveis com soma exata e teto individual intacto;
E18/E19/E20 distinguem conhecimento/zero/parcial, free/capacidade corretos e ação
permitida/bloqueada determinada; combinações inválidas e corrupções rejeitadas;
prepare/receipt/GET coerentes; E01 continua patrimônio1451/dívida350/reservas550;
hashes das cinco provas independentes e README preservados. O executor não encerra
achados nem aprova a si próprio.

Aceites preservados: reconciliação E01, protocolo de recuperação/concorrência,
proibição de histórico fictício e limites de prova documental. Sem runtime/HTTP/SQL/
banco real/migração/build/push/deploy/merge/rebase/reset/clean. Após aceite CF-028,
fila continua fechamento dirigido CF-010–015, não onboarding automático.

# R28-02 — correção residual dos totais documentais

Base `bbbe8c30b0795640320818ee3fa36ce79928f323`, branch
`codex/cf-028-contrato-onboarding`. Escopo: quatro totais da
[revalidação independente](../revalidacao-CF-028-origem/README.md).
CF-028 em_revisao; R28-02 aguarda revalidação; R28-01 encerrado.

## Reprodução e preservação

Parecer completo, script e reproduções conferidos. [before.json](before.json)
reexecuta a prova independente intacta antes da correção: quatro divergências
DIMENSION_TOTAL detectadas. O exit0 do script registra a reprodução do achado,
não aprovação do contrato. Nenhuma divergência entre entradas e cálculo do revisor.

[baseline.json](baseline.json): HEAD igual à base, ancestralidade confirmada,
sem commits posteriores, staging vazio; único delta alheio README raiz. A pasta
nova vista no status foi criada para guardar esta baseline. SHA256 do README:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservado fora do commit. Pareceres e provas independentes intactos por hash.
AGENTS da conversa aplicado; nenhum adicional na árvore/ancestrais. Regras de
execução/testes, tarefa e SPEC-001 conferidas. Não mudou política de produto.

## Correção e fontes dos artefatos

Fontes: SPEC-001 §5.1 (regra já correta), build-cases.mjs (entradas/expected literais)
e check-contract.mjs (avaliador exclusivamente documental). Derivados: cases.json,
snapshots.json via build-snapshots.mjs, verification.json via verify.mjs. Corrigidos
gerador e ramo UNBOUNDED, depois regenerados os derivados. snapshots.json permaneceu
byte a byte idêntico: contém E16–E20/E35, não E23/E28/E32/E34. Nenhum snapshot foi
editado para mascarar resultado incorreto. Logs before-* e pareceres são históricos.

| Exemplo | Antes | Corrigido | Entradas e cálculo | Arquivos/verificação |
|---|---|---|---|---|
| E23 | UNKNOWN/null | KNOWN400.00 | A1000/B500/C800, só contas; reserva nominal400 uma vez | Gerador/cases/avaliador; mundos A,B,C→400 |
| E28 | UNKNOWN/null | KNOWN400.00 | Mesmas contas, C nova;400 +0, pois novo10 recusado | Mesmos arquivos; bloqueio400 preservado |
| E32 | PARTIAL/null, subtotal100 | KNOWN500.00 | Reserva400 em A ou B; C800 excluída recebe100;400+100 | Mesmos arquivos; mundos A,B→500 |
| E34 | UNKNOWN/null | KNOWN400.00 | A1000/B500; CLOSE removido, reserva400 continua | Mesmos arquivos; mundos A,B→400 |

SPEC-001 §7 explicita os quatro totais; README da entrega e resultado corrente
apontam esta correção. A origem individual permanece incerta, assim como livres e
capacidade das fontes afetadas. Progresso não confirmado não é promovido a conhecido.
As permissões, independência de C, transições e status de conclusão não mudaram.

O defeito era acrescentar lacuna ao agregado incondicionalmente em UNBOUNDED.
Agora um universo atual, não vazio, somente ACCOUNT após exclusões válidas permite
somar o nominal uma vez. Nominal desconhecido/parcial continua como tal. Universo
misto ou vazio não certifica dimensão; inventário obsoleto E29 continua409/UNKNOWN
até revalidação. Essa guarda usa a versão já existente, não cria regra concorrente.
Não há exceção por ID de exemplo no avaliador. Nenhum DTO, gate ou tarefa futura mudou.

## Validação e limites

[verify.mjs](verify.mjs) enumera atribuições possíveis das entradas e usa centavos
BigInt independentes do avaliador. Todos os mundos têm400/500, sem escolher origem
verdadeira. Compara também **todos os demais campos** dos14 resultados com o
avaliador de bbbe8c3: idênticos. Executa os verificadores anteriores9+9+7 grupos,
incluindo E01 (1451/350/550), E16–E20 e regras de bloqueio. Resultado em
[after.json](after.json).

Controles dirigidos: universo ACCOUNT/INVESTMENT→UNKNOWN; com reserva300 comprovada
adicional→PARTIAL300; nominal desconhecido→UNKNOWN; E31 vazio→UNKNOWN; E29 revisão
obsoleta→409/UNKNOWN; investimento comprovadamente excluído deixa universo só contas
e total400. Contraprova em VM usa o ramo anterior, detectando DIMENSION_TOTAL nos
quatro casos; controles atuais passam. Nenhuma mutação persistida, hashes antes/depois
idênticos. Resultados originais não foram reescritos para fingir ausência do defeito.

```powershell
node tasks/evidencias/saneamento-CF-028-origem/build-cases.mjs
node tasks/evidencias/saneamento-CF-028-origem/build-snapshots.mjs
node tasks/evidencias/saneamento-CF-028-origem/verify.mjs
node tasks/evidencias/saneamento-CF-028-totais/verify.mjs
git diff --check
```

Prova apenas documental: não certifica runtime, SQL, HTTP, locks ou aplicação real.
Sem builds/suítes de produto, banco real, push, deploy ou início de sucessoras/frontend.

## Encaminhamento ao mesmo revisor

Revalidar **bbbe8c3..HEAD desta entrega** exclusivamente: quatro totais, consistência
SPEC/fixtures/verificadores e preservação dos aceites. Solicitar decisão independente
de encerramento de R28-02 e CF-028; executor não aprova. Regras de fontes, evidências,
bloqueios, reconciliação/concorrência aceitas não foram redesenhadas. R28-01, E01,
E16–E20, precisão, prazo original vencido e ausência de histórico fictício preservados.
Após aceite, sequência continua CF-010–015, sem implementação automática do onboarding.

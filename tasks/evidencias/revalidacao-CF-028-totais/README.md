# Aceite independente final da CF-028 — 10/10/2026

**A. Resíduo dos totais aprovado. B. R28-02 encerrado. C. CF-028 concluida,
exclusivamente como especificação.** Nenhum impedimento encontrado neste delta.
R28-01 permanece encerrado. A decisão combina esta revalidação dirigida com os
aceites anteriores; não declara onboarding implementado ou runtime validado.

## Base, escopo e preservação

Base examinada `a7bc256c2600958bac8b87f6971424c581da2a8f`, intervalo
`bbbe8c3..a7bc256`, branch `codex/cf-028-contrato-onboarding`.
HEAD inicial igual ao informado, base ancestral, nenhum commit posterior;
staging vazio e única alteração preexistente ` M README.md` na raiz.
SHA256 preservado: `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
README raiz fora do commit; pareceres e provas históricas intactos.

Aplicadas instruções AGENTS da conversa; busca na árvore não encontrou adicionais.
Conferidos execução/testes, tarefa canônica, SPEC-001 §5.1/§7 e diff, parecer
revalidacao-CF-028-origem e saneamento-CF-028-totais, geradores, fixtures,
avaliador e verificadores envolvidos. Os 12 arquivos do delta são documentais.
Relatórios anteriores foram reutilizados, não reaberta a revisão integral.

## Derivação dos totais e preservação da incerteza

O universo elegível não vazio contém somente ACCOUNT após exclusões comprovadas.
A reserva11 tem nominal KNOWN400.00. Qualquer distribuição desses400 entre as
contas possíveis conserva400 no agregado da dimensão; não é necessário escolher
uma conta ou conhecer suas parcelas. Nenhuma confirmação válida encerra a reserva
nos quatro exemplos. Aplicando somente comandos aceitos:

| Exemplo | Composição independente | Estado/valor conferidos | Disponibilidade e ação |
|---|---|---|---|
| E23 | Reserva400 entre A/B/C, nenhuma nova | KNOWN400.00 | A/B/C bloqueadas, livres UNKNOWN; conclusão sem alocar permitida |
| E28 | Reserva400; tentativa10 na nova C recusada, acrescenta0 | KNOWN400.00 | A/B/C bloqueadas; status400 e nenhum efeito parcial |
| E32 | Reserva400 entre A/B + nova100 em C comprovadamente independente | KNOWN500.00 | A/B bloqueadas; C conserva saldo800, reserva100 e livre700 |
| E34 | Reserva400 entre A/B; CLOSE removido não é encerramento | KNOWN400.00 | A/B bloqueadas, livres UNKNOWN |

Total conhecido não atribui os400 às fontes, não certifica livre nem progresso.
O nominal é contado uma vez, sem multiplicação pelo número de candidatas.
O novo ramo do avaliador usa tipos, exclusões e versão do inventário; não contém
exceção por ID/nome de exemplo. A alteração chegou ao gerador e avaliador, além
do JSON derivado e dos resultados. SPEC §7 explicita os totais conforme §5.1.

Comparação integral dos inputs/expected com bbbe8c3 admite somente os quatro
reservedAccounts e a explicação corrigida de E23: os demais campos são idênticos.
Comparação dos resultados dos avaliadores anterior/atual confirma que todos os
demais campos dos14 casos são idênticos, inclusive fontes, decisões, saldos,
livres, confirmações, status e ausência de transações no modelo documental.
Os outros dez casos conservam os totais esperados.

Os seis snapshots E16–E20/E35 não contêm os quatro exemplos e continuam byte a byte
iguais. Regeneração integral em memória e hashes independentes confirmam consistência;
não foi usado snapshot estável como prova suficiente do cálculo financeiro.

## Provas, contraprovas e limites

[verify.mjs](verify.mjs) executa o conjunto entregue e reaproveita em memória o
oráculo financeiro/conjuntos do revisor anterior. Apenas a expectativa negativa
de reprodução do defeito vira exigência positiva de igualdade, KNOWN, subtotal
igual ao total e missingPaths vazio. Os cálculos e arquivos históricos não mudam.
[result.json](result.json) registra resultados integrais e hashes antes/depois.

Quatro contraprovas executam o ramo anterior em VM contra E23/E28/E32/E34. Todas
falham por `DIMENSION_TOTAL` (400/400/500/400 esperados contra null anterior), com
controle atual positivo KNOWN em cada caso. Não são falhas de importação/sintaxe.
Nenhuma mutação foi persistida; hashes iguais confirmam preservação sem restauração.

Controles do executor reconferidos: universo ACCOUNT/INVESTMENT→UNKNOWN; reserva
adicional comprovada300 nesse universo→PARTIAL300; nominal desconhecido→UNKNOWN;
E31 sem fontes→UNKNOWN; E29 obsoleto→409/UNKNOWN; investimento validamente excluído
deixa só contas→KNOWN400. Controle independente adicional: nominal PARTIAL123.45
em universo só de contas continua PARTIAL123.45/null, não vira KNOWN.

Verificadores documentais anteriores:9+9+7 grupos;14 conjuntos/status e nove
contraprovas da atribuição preservados. E01 recalculado das entradas:
1300 em contas +501 investidos −350 de dívida =1451 de patrimônio; reservas550.
E16/E17 preservam ±1999999999999.98 e teto individual separado do agregado.
E18 mantém UNKNOWN, E19 subtotal300/livre parcial500, E20 zero comprovado e
NOT_APPLICABLE. E35 mantém patrimônio1500 e reservas400. Seis pares de hashes
content/review foram recalculados pelo serializador independente.

Ocorreram duas falhas de infraestrutura na primeira adaptação do novo wrapper:
comparação estrita de objetos entre realms da VM e substituição textual que atingia
o tratamento de import.meta de um gerador aninhado. Corrigidas pela clonagem dos
dois operandos para o mesmo realm (mantida igualdade estrita) e pela substituição
apenas do local da URL do script. Não foram contraprovas de domínio; nenhuma
assertion financeira foi retirada. A execução final saiu0 com todos os critérios.

Comandos reproduzíveis da raiz:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor bbbe8c3 a7bc256
git log --oneline a7bc256..HEAD
git diff --check bbbe8c3..a7bc256
git diff --cached --stat
Get-FileHash README.md
node tasks/evidencias/revalidacao-CF-028-totais/verify.mjs
```

Somente provas documentais; não executadas suítes de produto, HTTP, SQL, banco,
locks ou UI. Sem alteração de regra para obter aprovação, implementação, push
ou deploy. Mudanças desta revisão na SPEC e nos índices são administrativas.
Os hashes no resultado correspondem à execução anterior a essas anotações de aceite.

## Critérios originais e aceites acumulados

| Critério CF-028 | Evidência e decisão final |
|---|---|
| Reconciliação e validação de payloads | E01 e contrato original; R28-01/agregados e estados aprovados em1c54533; fontes e bloqueios aprovados embbbe8c3; quatro totais agora coerentes: atendido |
| Timeout, duas abas, fonte alterada | Protocolo original aceito; extensão de reservas/evidências/revisões aceita embbbe8c3; delta não altera garantias: atendido |
| Sem história fictícia/segunda carteira | Aceite original e transições ASSIGN/CLOSE preservados: atendido como requisito contratual |
| Evidências, limites e testes não enfraquecidos | Oráculo independente, controles legítimos, contraprovas causais e histórico preservado: atendido |

Referências: [revisão original](../revisao-CF-028/README.md),
[aceite de R28-01/representação](../revalidacao-CF-028-R28/README.md),
[aceite de origem/bloqueios e último resíduo](../revalidacao-CF-028-origem/README.md).
Mantidos precisão decimal/temporal, metas vinculadas, prazo original vencido,
reconciliação financeira, ausência de histórico fictício e recuperação/concorrência.
O custo/trade-off aprovado de evidência versionada e composição de riscos permanece;
este delta não introduz consultas, N+1 ou mecanismos de coordenação novos.

Não há pendência essencial remanescente em CF-028. Atualizados tarefa canônica,
cabeçalho administrativo da SPEC e índice tasks/README; catálogo não duplica estado.
Notas datadas de revisão permanecem históricas. Base normativa aprovada: a7bc256;
o commit que contém este parecer acrescenta o aceite, sem mudar regras de produto.

Próximo trabalho planejado: fechamento dirigido CF-010–015. Não iniciado aqui.
Conclusão documental não libera automaticamente CF-029–034 nem altera seus gates.

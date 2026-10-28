# Parecer independente de startup HQL — 28/10/2026

**Decisão A: startup aceito no recorte local descrito na matriz. A investigação
dos estouros históricos permanece E, inconclusiva, e não bloqueia a preparação
local da próxima etapa.** O prazo de 40s continua obrigatório em cada execução
que o utiliza. Não se aprova desempenho de produção, adoção real ou CF-034 integral.

Revisão do intervalo `c091abb8aa0473e7ad46690e21c8158a4dde234a..ed42309faeeb0eac6e03c14ddb2acfb94db8579f`,
branch `codex/diagnostico-startup-hql`, HEAD inicial igual ao candidato. Base e
produtor do pacote são ancestrais; index inicial vazio. Única alteração alheia:
README raiz, preservado fora dos commits. Esta execução fez sua própria leitura
dos contratos, código, XMLs e recibos; não adotou a conclusão do investigador
como prova. Não houve nova inicialização de aplicação nem compilação de pacote.
Provas desta revisão no commit local
`6cdf3a49924d7c1a654b618f1453c3d3ff8f998e`; parecer/estados no commit seguinte,
identificado na entrega. A fotografia final antecede esse commit documental.

## Fundamento e fronteira do aceite

O requisito executável é `AdoptionRuntimeTest.App.awaitStatus`: HTTP esperado em
40s monotônicos, não porta aberta. No perfil adoption, migration é preparação
operacional anterior; validação JPA, repositories e contexto/web continuam dentro
da medição. O contrato também exige guard de configuração, manutenção, writers,
jobs e saúde corretos. Esses controles têm aceites independentes anteriores,
provas dos modos necessários e inputs de produto idênticos ao pacote preservado.

As quatro capturas novas **não substituem os 17 contratos**. Confirmam, sem agent
e com agent, Windows/JAR e aplicação Linux/Docker, writers=true/jobs=false. Os
demais modos são sustentados por provas originais explicitadas na
[matriz contrato/provas](MATRIZ.md), não por extrapolação dessas quatro amostras.
Os XMLs também contêm falhas, conservadas individualmente na
[classificação histórica](HISTORICO.md). Não se soma uma suíte verde artificial.

Não foi localizado requisito normativo de causa raiz completa para encerrar este
impedimento local. A exigência de contraprova causal da política de testes aplica-se
a **correções**; nenhuma correção de produto foi proposta. O encaminhamento original
exigia diagnóstico e decisão de alcance, não identificação obrigatória de uma causa.
A investigação cumpriu o diagnóstico finito; esta revisão decide seu alcance.

`tasks/EXECUCAO.md`, seção “Dependência integral e capacidade liberada localmente”,
permite liberação independente explícita da capacidade consumida, com base,
limites e ausência de impedimento concreto ao trabalho pretendido. É esse o aceite:
capacidade de inicializar e usar os controles locais para preparar a validação do
candidato. Não se declara estabilidade universal do mesmo binário sob qualquer carga.

Isso não constitui quarentena: nenhum teste foi omitido/desabilitado, nenhum erro
antigo foi convertido em sucesso, nenhum retry foi adicionado. A política sobre
flaky/teste essencial continua aplicável: uma falha na próxima invocação bloqueia
seu gate. Não há dispensa de 40s, novo número mínimo de execuções ou percentil criado.

## Evidência conferida e achados delimitados

Readiness desde criação: **18,925 / 13,824 / 19,652 / 18,669s**, todos também dentro
de 40s desde entrada no gate. JPA: 12,395 / 8,220 / 13,223 / 12,944s. Flags de
sucesso original, identidades, fases, cleanup e arquivos de origem conferem.
O wrapper diagnóstico pode terminar verde mesmo com gate falho; por isso os
quatro resultados brutos foram examinados, em vez de aceitar somente o XML verde.

Foram reconferidas 92 referências de captura/proveniência, os 22 recursos do JAR,
os hashes dos JFRs/extrações e as contagens dos eventos contra `jfr summary`.
Os cinco testes existentes do leitor passaram novamente. Duas verificações
adversariais complementares demonstram permissividade do envelope JSON; os
arquivos atuais têm fechamento completo, contagens coerentes, e a extração Docker
também passou pelo parser JSON estrito. Limite registrado, sem invalidar as medições.

Há uma inexatidão documental de portas na investigação: os listeners efetivos são
53120, 53124, 61591 e 60421 na ordem dos cenários; 64885 é porta remota de uma tupla
TimeWait. O recibo bruto final auditou as quatro portas corretas. Esta errata não
altera tempos, identidade ou aceite TCP e não reescreve provas históricas.

Detalhes em [conferência das medições e HQL](MEDICOES.md),
[conferencia.json](conferencia.json), [leitor-conferencia.json](leitor-conferencia.json),
[recursos-pacote.json](recursos-pacote.json) e [imagem-observada.json](imagem-observada.json).
Nenhum defeito atual de produto foi reproduzido nesta revisão; isso não declara
ausência total de defeitos. Os limites de leitor/relato acima não são falha HQL.

## Bloqueio e alternativas examinadas

| Alternativa | Decisão |
|---|---|
| A — aceite local; histórico inconclusivo não bloqueante | **Escolhida**, no recorte de preparação local e cenários da matriz, com reabertura objetiva |
| B — falta cenário obrigatório | Não há modo obrigatório inteiramente sem prova no acervo conferido. Não foi imposta recência ou repetição integral que o contrato não exige |
| C — falha atual reproduzida | Não: sem novos startups; as quatro observações examinadas passaram. As falhas antigas continuam fatos, sem diagnóstico causal retrospectivo |
| D — decisão normativa obrigatória | Não é necessária para este aceite delimitado, que não muda requisito. Alterar prazo, excluir teste essencial ou aceitar outro ambiente/orçamento exigiria decisão própria |

O termo histórico “startup integral não aprovado” não cria por si só um requisito
adicional de causa raiz. Para o estado vigente, prevalece este aceite local.
As suítes antigas com falhas continuam com seu resultado original; CF-034 integral
e os gates operacionais continuam pendentes por critérios próprios.

O benefício é permitir preparar o próximo candidato sem uma campanha indefinida
de reproduções. O risco residual é uma nova ultrapassagem sob condições ainda não
isoladas. A contenção é manter o teste obrigatório, parar no primeiro gate falho,
preservar a ocorrência e aplicar o [roteiro de captura/reabertura](REABERTURA.md).
Não se inferiu que TCP, HQL, carga ou harness foram a causa dos estouros.

## Continuidade e preservação

[Prontidão e autorizações seguintes](CONTINUIDADE.md): consolidação e revisão do
intervalo acumulado podem ser preparadas; CI remota e matriz pendente dependem de
revisão/seleção/autorização próprias. Isso não autoriza push, merge, CI, alteração
de Railway/Vercel, deploy ou banco real. Zoom 200%, CF017/P01/P02, configuração
remota e CF034 integral conservam seus estados.

[Preservação inicial](preservacao-inicial.json) referencia 863 caminhos protegidos,
usando manifestos existentes; [preservação final](preservacao-final.json) registra
a reconferência e o inventário somente dos novos arquivos desta revisão. Produto,
16 migrations, provas/aceites anteriores, runtimes, JAR e imagem preservados.
README raiz conserva SHA-256
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
JAR p05 mantém `b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`,
produzido dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`, não deste HEAD.
Sem alegação de reprodutibilidade binária ou certificação do acervo inteiro.

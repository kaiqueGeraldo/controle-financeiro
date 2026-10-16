# Investigação dirigida CF-022 — 16/10/2026

**CF-022 permanece em_revisao.** Não há correção de produto justificada pelas
provas desta rodada. RJ-022-01 e H24-01 continuam separados e historicamente
inconclusivos, agora com hipóteses delimitadas por experimentos comparáveis.
Próximo passo: revisão independente deste diagnóstico e experimentos adicionais
discriminantes descritos por ID; não repetir suites amplas ou implementar onboarding.

## Resultado por identificador

| ID | Confirmado | Ainda necessário |
|---|---|---|
| [RJ-022-01](RJ-022-01.md) | Clock completo desloca performance/timeline até24,4s, animações negativas e modal invisível interceptando eventos; Date-only elimina distorção.4 jornadas por modo preservam calendário/progresso/SQL | Reproduzir30s/zeroPOST com calllog e hit-test do próprio alvo semanal. A história não contém esses dados. Não encerrar por4/4 nem atribuir automaticamente a RVA03 |
| [H24-01](H24-01.md) | Fixture residual501 amplia2→1006 leituras com lock e tempo total do probe. LAZY/EAGER passam fresca/residual, sem bloqueadores ou pool saturado nas amostras | Reproduzir a classe histórica com ordem/inventário por método e callbacks/PG correlacionados; comparar isolamento de fixture. Não atribuir resolução a LAZY ou tratar11,1s totais como timeout de um callback |

São caminhos independentes: o click ocorre no navegador antes do transporte;
o scheduler percorre hábitos no backend. Compartilhar domínio não demonstra
causa comum. O clock de animação não é explicação para uma Future Java em JDBC.

## Critérios, dependências e estados

[Matriz inicial](PLANO.md) e [linha do tempo](LINHA-DO-TEMPO.md). Os quatro critérios
originais conservam aceites DEC08/backend/calendário/contribuição/rollback/locks
da revisão conjunta CF022/023. Restam a classificação da prova integrada semanal
e do timeout do scheduler, não uma reimplementação dessas regras. Esta investigação
é evidência do executor, não aceite independente novo.

Há somente uma pendência documental desatualizada corrigida no canônico: LAZY e
consumidores da CF025 já foram aceitos por `revisao-CF-025-CF-027-RV24/README.md`,
seção Parecer CF025, e MATRIZ critérios1–4, base06c1a51. Isso não encerra RJ/H24.
CF006/RD58 e fundação CF017 V1–V14 possuem aceites locais posteriores integrados.
Proveniência/adoção real CF017/P01/P02 permanecem fora do recorte.

CF029 continua pronta **exclusivamente local/descartável** conforme seu parecer
anterior. CF022 não é dependência direta da CF029; não surgiu impedimento concreto
à fundação de rascunho. Nenhum onboarding ou sucessora foi executado. Preservados
RVA03 encerrada, CF019/013 e CF011/012/014 aceitas; CF010/015 mantém zoom nativo200%.

## O que foi alterado e validado

Somente probes/instrumentação em exportação isolada, evidências e documentação.
**Nenhuma alteração de produto ou correção do harness compartilhado.** Observador
teve falhas próprias preservadas; autenticação API isolou impedimento prévio ao
fluxo de hábitos. Essas diferenças e limites estão em [EXECUCOES](EXECUCOES.md).

Dois testes Java de scheduler, cada um exercitando assertions originais com duas
fixtures; oito jornadas browser integradas nos dois modos, com dois orquestradores
Java e SQL pós-reload. Quatro falhas de preparação de browser preservadas, sem
contá-las como RJ02201. Sem aumento de timeout, supressão de animações, retries,
assertions removidas das provas originais ou acesso externo real.

`preservation-final.json`:144 arquivos históricos/README preservados;
`source-preservation.json`:431 fontes/assets de produto do checkout e da cópia
equivalentes a e1c6312 (CRLF normalizado somente em texto). Reintrodução EAGER
restaurada. Sanitização documentada; raw/traces privados não entram no Git.

## Git

[Procedimento e confirmação remota](GIT.md): publicados os cinco commits aprovados
ae965aa, ad1d6f8,18c7150,949424a,e1c6312; main integrada por fast-forward.
**main remota=e1c63120129f202440992f29276fa4372111513a**.
Nova branch local codex/cf022-investigacao parte desse hash. Novos commits ficam
locais para revisão, sem push. Orientação curta acrescentada em tasks/EXECUCAO.md.
README raiz preservado com SHA256
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA,
fora do staging/commits. Runtime `.cf22` permanece local, sem clean ou exclusão.

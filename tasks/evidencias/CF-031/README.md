# CF-031 — entrega local para revisão independente

21/10/2026; **em_revisao**, sem aceite independente. Executor: Codex desta conversa;
modelo/esforço não foram reconfigurados pelo cabeçalho da tarefa. Branch
`codex/cf031-onboarding-frontend`, base publicada/integrada
`6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`. Identificação dos commits e preservação
em [GIT.md](GIT.md); fontes finais identificadas por `delivery-source-sha256.json`.
`candidate-sha256.json` é registro histórico anterior aos últimos ajustes de
apresentação e harness; não deve ser confundido com o candidato final.

[DEC-ONB-03](../../../docs/sdd/decisoes/003-liberacao-local-CF-031.md) autoriza
somente implementação/revisão locais. CF028/029/030 e aceites frontend integrados.
Zoom nativo200% não certificado: CF010/015 permanecem em_revisao. Incluir estas
telas na reavaliação antes do uso; nenhuma liberação automática de CF032 ou
adoção real CF017/P01/P02. Datas históricas deslocadas não são reparadas.

## Escopo e resultado

Entrevista voluntária em oito etapas, com vínculos a cadastros existentes,
rascunho parcial no servidor, salvar/pausar/retomar/descartar, comparação explícita
de conflito e correção por campo. Contas, dívidas/cartões, investimentos,
metas numéricas/financeiras, reservas vinculadas e previsões opcionais.
Revisão preparada imutável, confirmação explícita, recuperação por recibo e
entrada no dashboard; usuário legado não é forçado a inicializar.

Money2/Quantity8 são strings exatas; datas civis não usam conversão por fuso.
Zero, desconhecido, parcial, não aplicável e não preenchido têm apresentação
distinta. O frontend confere forma/identidade/coerência do resultado autoritativo;
não substitui a avaliação financeira CF030. GET de draft é avaliação persistida,
não revalidação atual. Cancelamento do cliente não prova rollback do servidor.

As cinco camadas (entrada, HTTP, interpretação, estado, apresentação) estão
separadas; sem dependência nova ou persistência financeira em local/sessionStorage.
Geração por proprietário e serialização de ações protegem respostas tardias e
duplo acionamento. Listas de cadastros são carregadas em lote, sem HTTP por item;
índices evitam busca repetida por nome. Trade-offs e custos em
[ARQUITETURA.md](ARQUITETURA.md).

## Validação e limitações

| Prova | Resultado | Evidência |
|---|---|---|
| Contrato/estado/tela | 75/75 (47+17+11) | `components-delivery.log` |
| Integração browser → BFF → Spring → PostgreSQL | 12/12 + Java1/1 +12 checkpoints SQL | `e2e-final/`, `e2e-final-reports/` |
| Contraprovas dirigidas | 5/5 detectadas; controle64/64 restaurado | `counterproof-results.json` |
| Unitários anteriores | 6/6 | `unit-regressions.log` |
| Componentes amplos | 438/441; três falhas reproduzidas na base | `component-regressions.log`, `baseline-regressions.log/json` |
| Lint, tipos, build | exit0 | `lint-delivery.log`, `typecheck-final.log`, `build-delivery.log` |

[Matriz normativa](MATRIZ.md), [execuções/reprodução/falhas anteriores](EXECUCOES.md)
e [verificação visual](VISUAL.md). Ambiente: Windows, Node24.18, Next16.1.6,
React19.2.3, Vitest4.1.11, Playwright1.63, Chromium153.0.8010.12, Java21 e
PostgreSQL16-alpine descartável. Seeds sintéticas independentes por cenário/largura;
metadados efetivos em `e2e-final/*-environment.json`. Nenhum banco real usado.

Perfil vazio percorre oito etapas por teclado. E01 é semeado por PUT real e
percorrido/revisado/confirmado no browser: não comprova digitação ponta a ponta
de todos os campos. A digitação/validação é exercitada nos testes de tela.
SQL demonstra efeito único e ausência de efeito financeiro de rascunho/revisão
cancelada. POST com resposta perdida é realmente persistido antes da recuperação.
Não somar rodadas antigas como casos distintos nem chamar esta prova de aceite
CF032. Seu uso diário, exportação e cenários ampliados permanecem futuros.

Não há certificação de zoom nativo200%, auditoria global WCAG, carga volumosa de
catálogo, performance de produção ou todos os interleavings de concorrência.
As três falhas amplas continuam abertas; a suíte ampla não está toda verde.
Edição não salva pode se perder após reload/expiração; rascunho persistido retoma.
Capturas/logs preservam falhas intermediárias e usam somente dados sintéticos.
Não foram produzidos traces/vídeos com cookies; varredura dos arquivos textuais
da evidência não encontrou JWT compacto antes do staging.

## Encaminhamento

[Roteiro de revisão independente](REVISAO.md). A tarefa está implementada e validada
localmente, aguardando avaliação independente do diff. Nenhum push CF031, deploy
manual, ativação de writer ou aceite de uso foi realizado. README raiz e runtimes
preexistentes preservados e excluídos dos commits.

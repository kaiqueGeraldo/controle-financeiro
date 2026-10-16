# Execuções, inspeção e reprodução

15/10/2026, base8a83c35. Só testes locais com PostgreSQL descartável.

| Execução | Resultado |
|---|---|
| run-01 / Cf019Rva03DiagnosticTest | Maven BUILD SUCCESS,4 probes em2,3min; três fechamentos dentro15s, **um vermelho visual esperado registrado** original120. `4 passed` significa coleta/financeiro/reload aprovados, não quatro interfaces corretas |
| verify-causal.mjs | Quatro observações confrontadas; exige vermelho original120 com estado fechado, DOM1 e animação negativa, controles Date-only nativos, uma operação/recibo e saldos após reload |
| run-02-harness / MilestoneRemediationBrowserTest | BUILD SUCCESS,2/2 jornadas originais em43,3s, sem observação Fiber/dwell adicional; fechamento, exclusão, reembolso, reload e recusa posterior preservados |
| lint.log / typecheck.log | exit0/exit0, arquivos de teste afetados e tsc frontend |

Não somar os4 probes aos2 originais como seis provas independentes do mecanismo. Original20 passa com atraso; isso explica por que aprovação isolada não exclui clock defeituoso. Nenhuma execução foi repetida após falha funcional para buscar verde. Nenhuma suíte ampla executada.

## Comandos

Na raiz, JDK21 já instalado:

```powershell
$env:JAVA_HOME=(Resolve-Path 'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1').Path
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Cf019Rva03DiagnosticTest' '-Dreview.evidence=run-01' '-Duser.timezone=UTC' test
node tasks/evidencias/investigacao-CF019-RVA03/verify-causal.mjs
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=MilestoneRemediationBrowserTest' '-Dreview.evidence=../../investigacao-CF019-RVA03/run-02-harness' '-Dreview.grep=SAN-BC-card' '-Duser.timezone=UTC' test
```

Em nova revisão escolher **pastas novas**, não sobrescrever run-01/02; o verificador lê run-01 por URL relativa e pode ser copiado/adaptado explicitamente para a nova evidência. Runner usa um processo com limite15min, caso90s, expect15s, workers1/retries0; nenhum desses limites foi ampliado.

Frontend:

```powershell
node node_modules/eslint/bin/eslint.js tests/e2e/cf019-rva03.integrated.spec.ts tests/e2e/playwright.cf019-rva03.config.ts tests/e2e/milestone-remediation.integrated.spec.ts
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
```

Primeiro typecheck detectou `samples` sem tipo inferível; corrigido para Awaited<ReturnType<typeof observe>>[] antes da execução. Primeira invocação de lint partiu da raiz errada e não encontrou node_modules; a chamada correta passou. Primeira validação do JSON comparava representações ISO com/sem `.000`; substituída por igualdade exata do instante1800014400000, sem relaxar a regra temporal. Nenhuma dessas falhas é reprodução de produto. Comandos de busca com wildcard literal Windows e duas leituras de log a partir do cwd errado não localizaram arquivos; repetidas com caminhos válidos. Fetch/Docker inicialmente restritos pelo sandbox e depois autorizados pela revisão automática. A tentativa de staging documental ao final de15/10 não foi executada: a revisão automática de aprovação atingiu limite de uso. Não foi decisão de insegurança. Retomada em16/10 a pedido do usuário, sem repetir testes ou modificar produto.

## Capturas inspecionadas

- Original `../revalidacao-CF-016-CF-021/browser/falha-pagamento120/test-failed-1.png`: spinner, controles desabilitados, saldo880/pagável0; imagem histórica não alterada.
- `run-01/original-120-terminal.png`: reproduz a mesma apresentação, inclusive scale0.8; correlacionada a React fechado e WAAPI negativa no JSON.
- `run-01/date-only-120-terminal.png`: modal de pagamento removido, detalhe janeiro2027, OPEN/pagável0 e Fatura Zerada. Consumo original120 continua corretamente visível.
- `run-01/original-120-reload.png` e `date-only-120-reload.png`: **capturas precoces durante carregamento do detalhe**, com skeleton/indisponível. Não são prova de pintura final do reload, nem prova de falha persistente. Reload financeiro é comprovado pelos GETs/JSON e SQL; o probe não aguardou o debounce350ms/estado carregado para essas imagens. Essa lacuna visual não é escondida nem suprida por timeout maior.
- `run-02-harness/san-b-card-120-360.png`: histórico de compra120 reembolsada permanece após exclusão da meta; legível em360. Captura original do harness usa animations disabled; não a usar como prova causal de saída. A prova causal usa screenshots sem essa opção em run-01.

Demais imagens são artefatos de execução, não recebem aceite visual global por existência. Não houve inspeção visual do vídeo histórico. Quatro traces novos foram abertos/parsing efetivo em `inspect-current-traces.ps1`, com chamadas/redes de pagamento e hashes em current-trace-inspection.json. O trace original foi lido pelo script próprio; seus snapshots diferem por referências e somente atributos armazenados diretamente são relatados, sem inventar DOM runtime completo.

## Integridade e credenciais

`sanitize-evidence.ps1` reutiliza o expurgo limitado à pasta desta investigação. Quatro traces novos tiveram JWT sintético removido,29 arquivos textuais/zip preservados na primeira passagem; sanitization.json registra antes/depois. Headers/cookies não entram nos JSON de observação. Traces novos continuam locais/ignorados; não foram publicados. Nenhum original foi sanitizado novamente ou reescrito. Logs brutos locais são ignorados; exports versionados removem apenas whitespace final, mantendo mensagens/resultados. Manifesto registra hashes dos arquivos locais, inclusive traces, sem prometer igualdade de bytes após normalização CRLF do Git.

Commits locais: ae965aa (probes/plano/verificador), ad1d6f8 (correção restrita de harness), commit documental posterior (evidências/encaminhamento). Intervalo de revisão `8a83c35..HEAD`, sem push da investigação. Testes executaram produto idêntico à base; trim de linhas vazias finais nos novos probes não altera comportamento.

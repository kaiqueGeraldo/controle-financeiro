# Saneamento dirigido CF030 — RC030-01/02/03

**Correções implementadas e validadas localmente; CF030 permanece em_revisao,
aguardando revalidação independente.** Não encerra achados por autoaprovação.
Base251d6c70492e4ad57dc9ca1313dce17afab62464, mesma branch
codex/cf030-aplicacao-onboarding. Commits exclusivamente locais, separados por
achado e documentação; [intervalo e preservação](GIT.md).

## Resultado entregue

- RC030-01: encargos conhecidos de todas as linhas/faturas elegíveis são pagos
  antes do principal mais antigo. Distribuição única por linha, soma exata,
  composição UNKNOWN preservada e nenhuma consulta por componente. Probe relê
  conta989/dívida189/principal189/disponível811, sem liberar limite pelos encargos.
- RC030-02: INITIALIZE_EMPTY valida configuração autoritativa, corrente/parcelas
  e datas derivadas antes da preparação e da escrita, como CREATE. Ano10000 é
  rejeitado400/DATE_INVALID, sem efeitos parciais. Binding LocalDate explícito em
  Invoice preserva também o limite inferior observado, sem fuso/clamp/schema novo.
- RC030-03: versão precisa ser inteiro1 e caber em int antes da conversão.
  Inteiros fora de faixa e demais formas inválidas retornam400 nas rotas reais
  prepare/complete; falhas internas legítimas permanecem500 sanitizado.

[Matriz anterior à correção](MATRIZ.md), [causas, custos e trade-offs](CAUSAS.md),
[execuções/comandos](EXECUCOES.md), [roteiro independente](REVALIDACAO.md).

## Provas e limites

Quatro provas originais reproduziram quatro falhas por três achados antes do
produto ser editado. Após a proteção de data, três passaram e um observador
pressupunha sucesso onde a norma exige rejeição. Original integral/hashes e erro
pós-correção preservados; ajustou-se somente esse observador, mantendo a assertion
original ano≤9999 no ramo concluído e exigindo400 e ausência de gravação no ramo
rejeitado. Não se alega verde dos quatro fontes byte a byte originais.

**134 casos distintos aprovados**,54 dirigidos +80 regressões,0 erros/skips.
Ambas as seleções passaram verify/empacotamento. Quatro mutações detectadas:
prioridade anterior, ausência de validação civil, binding anterior e conversão
anterior de versão. Cada uma falhou por assertion/0 erros; restauração por hash e
controle positivo54/54 na mesma cópia.411 arquivos principal/cópia reconferidos.
[Resultados por execução](results.json), [seleção sem sobreposição](final-selection.json),
[restauração final](final-restoration.json).

Preservados os aceites já sustentados de atomicidade, recibo, replay/recuperação,
E01, precisão, reservas e V16. CF019/024 e os probes de writer real/concorrência e
temporalidade afetados estão verdes. Nenhuma promessa universal de ausência de
corridas/deadlocks, latência de produção ou correção de dados históricos. O plano
adicional de distribuição custa O(N) tempo/memória; não é benchmark de produção.

README raiz com SHA256 original
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA,
fora dos commits.82 arquivos independentes idênticos e original do observador
preservado;4123 arquivos .cf22/.cf22r/.cf22s e binários JDK intactos por hash.
[Preservação](preservation.json). Sem clean/reset, limpeza geral de target,
migração/backfill, push, merge, deploy ou banco real.

CF029 permanece concluída e demais aceites preservados. CF031/032 não liberadas;
gate CF015/zoom e adoção real CF017/P01/P02 continuam pendentes. Próximo passo:
revalidação independente delimitada dos três achados e suas regressões diretas.

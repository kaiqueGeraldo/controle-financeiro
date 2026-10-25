# Preparação e falhas preservadas

Esta sequência não é contagem de cenários distintos. Reexecuções e recortes não
somam cobertura; falhas iniciais continuam com seus logs no runtime externo.

1. `exec-20261024-01`: preparador tentou copiar workflow removido porque `git
   ls-files --cached` ainda o lista. ENOENT, antes de instalar/testar produto.
   Exportador passou a selecionar somente caminhos existentes, registrando as
   exclusões em originalTreeChanges. Diretório parcial preservado.
2. `exec-20261024-02/evidence-01`: npmci, lint, tipos e npmtest passaram; 6 testes
   temporais em cada um dos3 fusos. Coletor esperava TAP, mas Node24 emitiu formato
   spec. Gate recusou a contagem e parou; não aprovou zero testes. Script canônico
   passou a pedir `--test-reporter=tap`, sem mudar casos, expected ou assertions.
3. `exec-20261024-03/evidence-01`: componentes460,457 aprovados/3 falhas/zero skips.
   Pipeline parou antes de build/backend/E2E/pacote. Duas falhas esperavam zero
   timers; terceira montava PrivacyBlur sem o contexto exigido. Os mesmos casos
   eram apontados como falhas de baseline nos registros históricos; nova execução
   preservada sem assumir que o histórico explicava a causa.
4. `diagnostico-20261024-04`: exportação própria com junction de dependências
   **somente para diagnóstico**, não ensaio de instalação limpa ou aprovação de
   pacote. Contexto sintético `privacyMode:false` reparou o cenário temporal,
   mantendo o expected neutro de data inválida e sem mockar a formatação.
5. Hipótese de timer de animação testada em cópia, sem sucesso (7/9); hipótese
   de microtarefas com `runAllTicks` também não explicou (7/9). Ambas descartadas;
   Framer real foi mantido no teste final. Um erro de sintaxe do observador foi
   corrigido e seu log inválido preservado; não conta como regressão de produto.
6. Observador de setTimeout/clearTimeout identificou callback anônimo0ms criado
   por `jsdom SelectionImpl._associateRange → collapse → HTMLButtonElement.focus`
   na montagem. Os dois timers `scheduleNextRefresh` tinham os handles cancelados
   corretamente. Logs `targeted-timer-trace-fixed.log` e `targeted-timer-stacks.log`.
7. Fixture passa a processar `advanceTimersByTime(0)` imediatamente após render:
   entrega selectionchange sem avançar o relógio ou timeout, sem retirar/modificar
   a assertion original zero. Os9 cenários dirigidos passam. Remover o cleanup do
   provider **na cópia isolada** volta a reprovar, exit1; fonte restaurada por SHA256
   `9AA254C658C92430FE742B3943E9B4B267329A49150E0DC5C03F533AE09C26D5`.
   Esse mutante foi somente diagnóstico local, não correção nem teste de CI remoto.

Também foram descobertos7 arquivos de testes de onboarding em `src/` fora do
include antigo de Vitest. O gate passa a descobri-los, além de todos os componentes
anteriores. Não houve filtro para esconder as falhas. Novo ensaio completo é
necessário para a seleção ampliada e o candidato final.

Nenhuma alteração de produto foi feita para obter verde. Relatórios brutos, perfis,
SQL e propriedades de processo ficam no runtime; coleta durável/publicável usa
allowlist e sanitização. A hipótese descartada não virou justificativa de aceite.

## Backend obrigatório — execução07 e correção delimitada

`exec-20261024-07/evidence-01`, candidato8bc4c51, terminou com exit1:
889 testes,22 falhas,10 erros,0 skips. Frontend18+620, lint, tipos e build passaram;
backend falhou e impediu E2E/empacotamento. Não houve pacote aprovado.

- Dezoito falhas são expectativas históricas V13/V14 ao executar as migrações
  correntes até V16. A lista versionada contém V1…V16, inclusive V15__onboarding_draft
  e V16__onboarding_application. Atualização explícita dos totais/listas, sem
  calcular expected a partir do resultado:16 do zero,15 após baseline V1,3 após
  V13,16-start nos upgrades. As comparações de valores, relações, nulos, rollback,
  checksum e restore são preservadas. O teste de checksum copia também V15/V16,
  isolando o checksum alterado de uma possível migração ausente.
- Dez erros `relation users does not exist` ocorreram em contextos Spring que
  compartilham o mesmo schema `create-drop`: o fechamento/evicção de um contexto
  pode apagar tabelas de outro. O inicializador passa a criar schema próprio por
  contexto, no mesmo container descartável. Configurações próprias de migração/
  hábito continuam a sobrescrever seu schema. Não se altera schema de produto.
- Três falhas de cron tinham `inventoryGuard` nulo: serviço atual o exige antes
  de fechar fatura. O teste unitário agora fornece esse colaborador mockado e ID
  sintético, mantendo todas as verificações de instante, virada e fechamento.
  Os testes financeiros integrados usam o guard real, sem esse mock.
- Uma falha de exportação esperava HH:mm onde a SPEC-002 determina saída
  canônica HH:mm:ss. Fixture agora usa23:30:45, espera os45 segundos e00:00:00;
  ordenação e marcador neutro continuam exigidos. Isso requer revisão do oracle,
  mas tem fundamento no contrato, sem mudança no formatter de produto.

Novo candidato7ac7407 submetido a execução08 independente. Não se atribui sucesso
às correções antes de conferir seus relatórios. Os32 resultados vermelhos da07
permanecem preservados e não se misturam com os da nova execução.

## Dupla inicialização herdada — execução08

O primeiro ajuste introduziu uma regressão de harness: o inicializador próprio
chama o inicializador base explicitamente, mas a configuração Spring também herda
o base e o chama depois. A segunda chamada criou outro schema, sobrescrevendo
Hikari/Hibernate enquanto Flyway ainda migrava o schema especializado. Relatórios
mostram os dois initializers e `Schema validation: missing table accounts`.
Essa tentativa reprova o gate e não serve como aprovação de E2E ou pacote.
Totais finais:889 casos reportados,0 falhas de assertion,521 erros de contexto,
0 skips; exit1. Casos com erro de inicialização não são descritos como execução
completa da regra financeira. Coleta [failed-08](runs/failed-08/result.json).

Correção a5ad7a6: marca por **instância de contexto**, registrada somente após
preparação bem-sucedida, torna o inicializador idempotente. Nova chamada no mesmo
contexto conserva o override especializado; um contexto novo ganha outro schema.
Não se altera ordenação para encobrir interferência nem se reduz o cache para
eliminar as classes afetadas. Execução10 parte de nova exportação desse candidato
e repete todos os gates. Os totais finais da08 constam na coleta própria.

As contraprovas lint/data da09 usam7ac7407; ci.mjs, scripts de fontes e helper de
data são idênticos no candidato a5ad7a6. O delta é apenas o inicializador Java,
não alcançado pelos dois gates negativos. Isso não converte relatórios antigos
em testes do pacote: o candidato final precisa de sua própria sequência positiva.

## Inicialização do browser — execução10

Candidato a5ad7a6: lint, tipos,18 temporais,620 componentes, build e backend889/889
passaram. O E2E selecionou seis casos, mas os seis falharam em browserType.launch
com ENOENT, antes de acesso ao produto. Wrapper Java reprovou, e2e exit1, pacote
bloqueado. Isso não é achado financeiro, E2E aprovado ou validação de zoom.

O executável existe; seu caminho tem264 caracteres. [Experimento dirigido](browser-path-diagnostic.json):
o mesmo arquivo real, por junction nova dentro do runtime, tem caminho183 e inicia
headless com versão153.0.8010.12; pelo caminho264 falha ENOENT. Sem acessar URL do
produto ou zoom nativo. O mecanismo de caminho foi demonstrado, não inferido só
da mensagem. Arquivos/binários originais e falha10 preservados.

Nova execução integral do **mesmo candidato**, em `CF-034/11/`, encurta o caminho
do executável para250 caracteres. Não se altera browser/seleção/oracle, não se
copia recibo de sucesso e não se reutiliza aprovação de pacote da tentativa10.
Instalação, lint, tipos, testes, build, PostgreSQL e E2E são novamente exigidos.

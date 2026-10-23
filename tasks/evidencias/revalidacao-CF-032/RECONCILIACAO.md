# Reconciliação e XLSX

Fonte dos esperados: E01/SPEC-001, FIN-03/05/06 e SPEC-002. Cálculo Decimal
fora do produto em `audit.py`; leitura direta OOXML (tipo, conteúdo, estilo e hash),
além do POI do harness. Não se usou helper financeiro de produção para expected.
O script audit foi reaproveitado da entrega após leitura crítica; a independência
é da execução e conferência do contrato, não alegação de autoria nova desse script.

E01: contas100+1000+200=1300; investimentos500+1=501; dívida200+3×50=350;
patrimônio1451. Reservas em contas300+50=350 e em investimento200. Reserva não
reduz ativo nem patrimônio. Principal194+150=344; limite1000−344=656.

| Checkpoint B e C | Contas | Investimentos | Dívida | Reserva de contas | Patrimônio | Caixa livre |
|---|---:|---:|---:|---:|---:|---:|
| Receita250,10, despesa40,20, transferência interna100 e taxa2 | 1507,90 | 501,00 | 350,00 | 350,00 | 1658,90 | 1157,90 |
| Compra120 em três parcelas | 1507,90 | 501,00 | 470,00 | 350,00 | 1538,90 | 1157,90 |
| Pagamento200 | 1307,90 | 501,00 | 270,00 | 350,00 | 1538,90 | 957,90 |
| Aporte2×10+taxa1; reserva adicional100 | 1286,90 | 501,67 | 270,00 | 450,00 | 1518,57 | 836,90 |

Posição: cinco unidades; custo0,60+20+1=21,60; avaliação TOTAL inicial1 para
três unidades resulta1,67 para cinco, HALF_UP ao centavo. Investimento monetário
500 conserva custo/quantidade desconhecidos. Reserva de investimento200 não
entra de novo no caixa livre. Comparação SQL B final=nova sessão é integral.

Relatório: receita250,10; consumo40,20+taxa2+compra120=162,20;
resultado87,90. Pagamento de dívida não é nova despesa; aporte não é consumo.
Variação de caixa250,10−40,20−2−200−21=−13,10. Os6 de encargos da dívida de
abertura não são inventados como consumo novo. Estados de cobertura/resultado
indisponível continuam explícitos, incluindo custo desconhecido.

No cenário S5, sem a compra adicional de B/C, pagamento200 liquida194 de
principal e6 de encargos: principal restante150, disponível850, barra15%.
Antes do pagamento: principal344, disponível656, barra34,4%. Resumo e cartão
usam os campos autoritativos; a barra usa comprometido/limite. Não se substitui
principal por fatura corrente. S2 cobre sessão nova inicial; RV6 complementa
sessão nova **após** pagamento e compara SQL anterior/posterior.

## Arquivos lidos

`audit.json` contém bytes lógicos de todas as células, estilos e SHA256 dos seis
XLSX desta execução. Cinco correspondem aos relatados no saneamento:

| Arquivo | Variante relevante |
|---|---|
| C-october.xlsx | Jornada completa, totais, origens, cobertura e segundos |
| H-A.xlsx | Receita exclusiva A; ausência de B; cobertura PARTIAL |
| H-B.xlsx | Despesa exclusiva B; ausência de A; cobertura PARTIAL |
| R3-time.xlsx | Horário por API/BFF, SQL e arquivo sem depender de input HTML |
| S4-time.xlsx | 12:34:56, 12:34:00 e ausência, três registros distintos |
| F-receivables.xlsx | Extra selecionado pelo filtro: recebíveis/baixas; não contado entre os cinco anteriores |

Os cinco não são cinco condições temporais independentes: C/R3 se sobrepõem em
segundos não zero; H-A/H-B exercitam isolamento e segundos zero; S4 é a borda
explícita de ausência. S4 armazena texto em B, formato geral numFmtId0, inclusive
`12:34:00`; ausência é texto “—”, nunca `00:00:00`. A data civil A permanece
`22/10/2026`. Tipo textual evita perda por exibição/formato numérico do Excel;
trade-off: consumidores que desejem aritmética temporal precisam parsear o texto.

`verify-artifacts.py` verifica novamente isolamento no conteúdo OOXML extraído,
cobertura parcial, oito hashes originais, cinco alvos de quatro mutações históricas
e contagens dos relatórios backend. A prova de download isolada não foi usada como
prova de conteúdo. `S3-long-operation.png` foi inspecionada visualmente: título
longo quebra linhas e mantém fechar/campos/confirmar alcançáveis em360×800.
Isso não representa zoom nativo200%.

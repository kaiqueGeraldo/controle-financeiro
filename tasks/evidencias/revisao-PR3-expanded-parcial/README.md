# Revisão independente parcial — PR #3

Em 29/10/2026, revisado o intervalo `1c4173f2e9a8bd459a9f2ecd4acf2d803245be88..26dce7dbc98b140d22095b6948c539e01fc1128c`, na branch `codex/saneamento-pr3-expanded`, worktree `.r3/pr3-expanded-source`. A consulta remota final confirmou a PR aberta no head 1c4173f2; expanded e required do dispatch 40873511911 permanecem reprovados.

| Parecer | Resultado |
|---|---|
| CF014 / isolamento | **Aceito** para contaminação79 registros e colisãoUUID. Cadeia original, contraprova, duas ordens, recriação e lifecycle conferidos; originais Diagnostic5/5 e Review5/5 |
| CF023 / relógio+BFF | **Parcial**. Mecanismo do relógio/307 aceito. Restauração exata por hash, mas controle funcional novo falhou com sessão válida e GET/ pendente enquanto Next compilava/. Não repetir para obter verde |
| Investimentos / transporte | **Aceito** para os três campos textuais, precisão e consumidorUI04. A suspeita inicial de quadro vazio foi retirada por comparação de hashes/pixels e inspeção da prévia sem alteração de pixels |
| Expanded | **Local integral não executada/aprovada; remota continua failure**. Nenhuma transferência de aceite entre SHAs/topologias |
| PR #3 | **Sem liberação de merge**. Pendências obrigatórias continuam abertas |

Leia o [parecer por correção](PARECER.md), o [mapa das seis ocorrências remotas](FALHAS-ORIGINAIS.md), a [matriz classificada de pendências](PENDENCIAS.md), o [adendo visual](ADENDO-VISUAL.md), os [resultados por invocação](RESULTADOS.json), a [topologia/reprodução/preservação](TOPOLOGIA-E-REPRODUCAO.md) e o [registro final](REGISTRO-FINAL.md). [Consultas remotas iniciais](remoto.json) e [finais](remoto-final.json) são somente leitura.

Provas novas:32 contratos dos gates;16 controles independentes; quatro wrappers originais dirigidos aprovados, com contagens internas separadas; contraprovas de schema, relógio e transporte. A contraprova CF023 registra[1,1], com bytes restaurados, e não é convertida em[1,0]. Fixtures e transporte têm controles restaurados aprovados. Nenhuma soma de execuções sobrepostas representa uma suíte integral.

Reaproveitamento conferido:18 execuções/24 XML/22 traces anteriores e12 fontes vinculados aos bytes testados. O ZIP remoto original não contém XML/traces completos. Os brutos e falhas de preparação desta revisão permanecem privados nos dois runtimes externos identificados; o Git recebe somente scripts, fontes textuais de probes e derivados. Scripts não corrigem os fontes da worktree: mutações e probes ficam em cópia descartável.

Próximo lote mínimo: observadores de cobertura/reserva/geometria com contraprovas; relógio específico de SAN-D1; identidade RF15 e capacidade real de zoom nativo; prontidão/navegação CF023. Geometria e presença tiveram causas locais esclarecidas, mas nenhum desses harnesses foi corrigido. Somente depois das condições locais suficientes cabe a expanded integral e, sob autorização posterior, publicação/validação remota no novo SHA.

README alheio,97 caminhos protegidos,36 entradas do manifest do saneamento, provas, migrations, pacotes e três checkouts preservados. Nenhuma mudança de produto/fixture/harness entregue, gate, dependência ou hospedagem; sem push, atualização da PR, CI remota, merge, deploy ou banco real. `.r3` permanece no mesmo local. Os commits desta revisão são exclusivamente locais.

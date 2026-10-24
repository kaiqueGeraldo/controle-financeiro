# Revalidação independente CF033-01 — plano anterior às provas

Base `8de766f`, candidato `d059bc92fa8267a8eb4d984373b0ee06bd566889`, branch
`codex/cf033-revisao-integrada`. Escopo: os quatro arquivos de produto do delta,
seus writers participantes e o encerramento do achado P2. Sem correção de produto.

| Regra / risco | Aceite reaproveitável | Mudança / verificação nova | Evidência prevista | Limite |
|---|---|---|---|---|
| DEC-10: contas realmente independentes progridem | Probe original vermelho em 8de766f; CF024 histórico | Executar probe intacto; conclusão anterior à liberação do BUY; writers set/deposit/move | SQL/locks, JUnit; mutação BUY snapshot | Fontes relacionadas por evidências não são independentes |
| Capacidade compartilhada não ultrapassa saldo | 600+600 sobre1000 deve deixar total600 | Mesma fonte BUY/reserva; reserva/onboarding; mutação que omite guard | Valores persistidos e assertion600 versus1200 | Não basta sucesso da chamada |
| Escolha local não fica obsoleta por phantom | Criação concorrente entregue | Pausar consulta real depois de false, antes do lock do inventário; criar legado por serviço real | Conexões/locks PostgreSQL, barreiras e saldo800 | Interleaving dirigido, sem alegação universal |
| Global→local após commit/rollback | Espera por criação entregue | Criação com commit/rollback; exclusão real de dependência com commit/rollback; remoção entre classificação e uso | Oracle SQL, estado persistido e ausência de efeitos rejeitados | READ COMMITTED dos comandos atuais |
| Certificado e estado aplicado, não snapshot futuro | CF032 certificação e saneamento CLOSED | Reusar cinco probes intactos; protocolo global e regressões de reservas/replay | JUnit/SQL, fonte efetiva por hash | Sem mudar tokens ou regra |
| Ownership, atomicidade, recibo/fingerprint/recover | Aceites CF024/032 e 229 regressões | Confrontar delta/call sites, repetir seleção afetada | Matriz de writers e resultados | Sem auditar domínios alheios |
| Custo e serialização | Controles de custo entregues | Conferir SELECTs, SUM por fonte e projeção em lote | Resultados de custo e leitura estática | Quantidade fixa de consultas não é custo constante nem benchmark |

As dependências CF025/027/032 da revisão original estão integradas e aceitas no
recorte local registrado em CF033. A nova análise é restrita ao saneamento, sem
repetir a revisão completa. DEC-ONB-03 não dispensa dependências gerais; permanecem
zoom nativo200%, adoção real CF017/P01/P02 e limites de produção. CF034 depende
também de CF015 e CF026; a prontidão será descrita sem iniciar ou alterar seus gates.

Runtime novo externo, PostgreSQL16 descartável, usuários sintéticos, Clock fixo
e consultas SQL independentes como oráculos. Probes existentes e históricos serão
preservados. Novos observadores somente pausam a consulta real, nunca substituem
seu resultado. Mutações apenas na cópia, com restauração integral por SHA256.

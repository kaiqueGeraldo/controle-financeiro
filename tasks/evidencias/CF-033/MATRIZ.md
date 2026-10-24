# Matriz normativa — plano anterior às provas

Base integrada bfb6c61. AC referem SPEC-003; FIN referem SPEC-004.
H = aceite histórico reaproveitável, N = prova nova necessária.

| Critério | Regra normativa / risco | H e alcance | Delta posterior relevante | Verificação N | Evidência / resultado e limite |
|---|---|---|---|---|---|
| C1, AC-FIN-001/002/009 | FIN-01/02/06: abertura não renda, pendente não realizado, centavos exatos | CF018/021 e B/C CF032 reconciliam patrimônio/caixa | CF032 muda somente texto da hora no export; regras de agregação preservadas | .10+.20; previsão250; dez/jan; dashboard/anual/caixa/XLSX | A produzir; sem extrapolar dados reais |
| C1, AC-FIN-014 | FIN-03/06: todo resto na última parcela, soma exata e competências únicas | CF019/030/032 dívida/limite | CF032 UI passa a consumir limite autoritativo; produtor de parcelas intacto | .05/3 em dez/jan/fev; .02/3 rejeitado sem escrita | A produzir |
| C1, AC-FIN-005; UI004/008 | DEC-09, SPEC001 §2: nenhuma leitura/escrita/cache de A em B | CF023 contratos; H CF032 dois owners | CF032 nomes/limites e guard financeiro | coleção owner; logout A/login B no mesmo contexto, ID alheio e nova sessão | A produzir; estados assíncronos históricos identificados |
| C1, AC-FIN-006/007/010 | DEC-10, FIN07, SPEC001 §6: mesmo efeito/recibo, rollback integral | CF024/027 e CF030/032: replay/recuperação/concorrência | guard exclusivo, capacidade e certificação CF032 | disputa da mesma intenção com commit e rollback; replay após nova operação | A produzir; não prova ausência universal de deadlocks |
| C1, AC-FIN-008 | FIN05 e SPEC001 §5.1: capacidade por fonte e união de incertezas | 20 DailyReservationCapacity, concorrência e 5 probes certificação CF032 | Este é o delta mais recente da base | reconferir código e seleção dirigida capacidade/concorrência, sem repetir E01 inteiro | A produzir |
| C1, AC-FIN-003/004; UI011/012 | FIN03/08: pagamento não consumo, histórico desconhecido não vira atual/zero | CF021 e reconciliação CF032 oito checkpoints/seis XLSX | precisão textual alterada e métricas/identidade UI | controles reporting e prova nova export; conferir consumidores e gates | A produzir |
| C1, AC-TIME-001..010 | SPEC002: civil literal, instante explícito, produto SP, competência por calendário | RD58/CF007/022 e temporais CF032 com JVM UTC | invoice civil e HH:mm:ss alterados em CF030/032 | navegador UTC+14, civil 31/12, hora23:59:58, reload/SQL/XLSX; testes existentes pertinentes | A produzir; proveniência remota continua pendente |
| C1, UI001/002/003/009/010 | foco/reflow/privacidade/estado recuperável, preferência persistida | CF011–014; CF031 e componentes CF032 | onboarding e rótulos/limites novos | inspeção dos aceites/diff e sessão nova; reflow200% tem bloqueio explícito | Zoom nativo200% permanece não executado/não aprovado |
| C1, AC-FIN-011 | ADR005: sem N+1 de relação; ownership/paginação/locks | CF025 datasets3/30/120, EAGER detectado | CF032 inventário completo por owner, expansão N×R | inspeção consultas/mapas/limites e controles pertinentes; não repetir benchmark intacto | Sem SLA/heap/carga produção |
| C1, AC-FIN-012; UI014/015 | migrações e gates de build/CI/adoção | CF017 local; CF026 e CF032 checks | V16 integrada e sem migração nova CF032 | Flyway16/validate nas novas provas; build do runtime | Adoção real e pipeline CF034/035 não executados |
| C1, AC-FIN-013 | SPEC001: rascunho próprio sem efeito financeiro, zero conhecido e legado preservado | CF029/030/031 e A/E/G CF032 | Guard/certificação não mudam protocolo de save/zero/skip | conferir fontes/contratos e aceites; N1 nova sessão e isolamento | Aceite histórico no recorte, não nova execução E01/legado integral |
| C2, UI013 | Política: mutante deve falhar pela regra | Mutações antigas são alcance histórico, não substituem quatro exigidas | Candidato integrado novo | realizado, ownerId, resto de parcela e replay; restauração SHA256 | A produzir; sobrevivente deve ser analisado |
| C3 | cenários não executados explícitos; P0/P1 diário impede aprovação | aceites anteriores finitos | revisão global integra módulos | classificar confirmado/hipótese/limitação; condições objetivas por achado | A produzir; revisão encerrada não implica candidato aprovado |
| C4 | evidências íntegras e testes não enfraquecidos | originais versionados e hash CF032 | somente testes/infra da revisão | manifestos de produto, provas históricas/README; logs falhas e comando efetivo | A produzir |

As famílias agrupadas não omitem critérios: TIME001–010, UI001–015 e FIN001–014
estão cobertas por referência, nova prova ou bloqueio de liberação. Alcance
histórico é conservado por documento/base; não há certificação geral por contagem.

## Resultado consolidado — 24/10/2026

| Recorte / critério | Evidência produzida ou reaproveitada | Resultado e limite |
|---|---|---|
| FIN001/002/009, HALF_UP | `counterproofs-02/baseline` e `restored`:7/7; `half-up.json`, `centavos-sql.json`, `centavos.xlsx` | .125×10.04→1.26, .10+.20=.30; pendente250 fora do realizado, sem abrir receita fictícia. Mutação realizado detectada0≠250 |
| FIN014 | `installments-sql.json` e mutante parcela | .05/3=.01/.01/.03 em dez/jan/fev; .02/3 rejeitado sem linhas parciais. Deslocar resto para primeira falha |
| FIN005, UI004/008 | `ownership.json`; N1 browser/SQL A→B→A no mesmo contexto; mutante owner | A42,17/B0; B não recupera reciboA (404); replay após reautenticarA conserva estado. Não cobre toda resposta tardia de cada módulo |
| FIN006/007/010, UI006/009 | `commit-race.json`, `rollback-race.json`, `replay.json`; controles73/74 | Mesmo operationId espera commit/rollback sem efeito duplo; conflito de conteúdo sem nova escrita. **Progresso entre contas do mesmo owner não sustentado: CF033-01/P2**, bloqueio de aceite irrestrito explícito |
| FIN008 | DailyReservationCapacity20, DailyReservationConcurrency1, OnboardingReviewConcurrency8 aprovados; delta estático e cinco probes de certificação históricos | capacidade/incerteza/união/rollback mantidos nos cenários finitos. Não se promete ausência universal de corrida/deadlock |
| FIN003/004, UI011/012 | Cf021Reporting8 aprovados; [reconciliação CF032](../revalidacao-CF-032/RECONCILIACAO.md) sobre864a3c7 | consumidor/anual/export preservados; cobertura desconhecida não vira zero. Oito checkpoints históricos não são oito novas execuções |
| TIME001–010 | N2 API/SQL/XLSX; N3 local23 versus UTC22; RD58 e CF007/022 históricos | civil31/12 e23:59:58 preservados; default local correto/campo editado preservado. N2/N3 complementam calendários, sem nova matriz universal de fusos/instantes |
| UI001/002/003/010 e FIN013 | Capturas N1/N3 após pintura inspecionadas; aceites CF011–014/031/032 | novo modal/alinhamento examinados só no viewport1440 escuro/privacidade desligada. Temas/privacidade/teclado abrangentes conservam provas anteriores. **Zoom nativo200% permanece gate aberto** |
| FIN011 e CF027 | Diff/SQL/guard inspecionados; arquitetura2 + intenção5 aprovados; CF025 medição histórica | OwnedResourceOrder/specificDays sem delta invalidante; adaptador recebeu namespace e parsing exato, controles novos pertinentes passam. Inventário completo custa memória/I/O e expansão N×R; sem SLA/heap de produção |
| FIN012, UI014/015 | Flyway16/validate; build0; lint novo/typecheck0 | migrações locais confirmadas; CI/homologação/deploy não executados. **CF017/P01/P02 e CF034/035 têm gates próprios** |
| C2/UI013 | Quatro novas contraprovas, before/mutated/restored e restore7/7 | Quatro detectadas por assertion/zero erros e skips; nenhuma sobrevivente. Hash dos alvos restaurado e487 fontes conferidas |
| C3 | [Achados](ACHADOS.md), cenários omitidos e limites | P0=0/P1=0/P2=1/P3=0 neste recorte; candidato sem aprovação irrestrita. O timeout antigo desta rodada recebeu nova prova causal; não atribuída a ocorrências históricas alheias |
| C4 | [Execuções](EXECUCOES.md), relatórios/falhas, manifestos487 e oito provas, README histórico | fontes/provas preservados; correções apenas de fixtures novas, sem mudar expected de produto, skips/timeouts/snapshots |

Os quatro critérios **da execução da revisão** estão sustentados: C1 admite teste
eficaz ou bloqueio explícito, não exige esconder uma reprovação; C2 produziu as
quatro contraprovas; C3 registra o P2/limites sem aprovação irrestrita; C4 preserva
evidências. Isso permite concluir o marco de revisão com ressalva aberta, sem
declarar o candidato aprovado integralmente ou a cadeia de release liberada.

## Bases históricas e conferência de mudanças posteriores

| Aceite reaproveitado | Base/alcance | Mudanças posteriores e reconferência nesta revisão |
|---|---|---|
| [CF025/026/027](../revisao-CF-025-CF-027-RV24/README.md) |06c1a51; queries medidas, tipagem e fronteira intenção/recibo | extração preservada; namespace onboarding/guard e leitura decimal alteraram adaptador/consumidores; arquitetura,recibos,concorrência/reporting reexecutados. N+1 de reorder sem delta invalidante, sem novo benchmark |
| [RD58 CF005/006](../revalidacao-RD58/README.md) |0c068d9; ano local, auditoria/legado/migração local | invoice civil/horário XLSX posteriores aceitos CF030/032; nova N2/N3 e export real confrontam esses caminhos; proveniência remota continua fora |
| [CF013/019](../revalidacao-CF019-RVA03/README.md) |18c7150, produto8a83c35; pagamento120 e clock Date-only | CF030 abertura/ciclo e CF032 limite/labels posteriores; aceites CF030/032 mais reporting/concorrência atuais. Não reabre RVA03 por um bloqueio advisory de domínio distinto |
| [CF014](../revalidacao-CF014-historico-invisivel/README.md) |31e6fe2; histórico/pintura, preservando aceites anteriores | CF032 nomes/limites compartilhados aceitos864a3c7; N1/N3 usam Date-only/pintura real. Não certificam zoom |
| [CF031](../revalidacao-CF-031-identidade/README.md) |9d80d2e; recuperação/identidade/consumidores locais | CF032 muda disponibilidade/identificação e certidão de domínio; CF032 aceita864a3c7 e nova coleção/sessão/recibo conferidas. T01/T02 históricos continuam inconclusivos |
| [CF032](../revalidacao-CF-032/README.md) |864a3c7; critérios1–4 e achados01–04 encerrados localmente |794cb5b/bfb6c61 só provas/parecer/estados, sem novo produto; candidato exato testado. NovoCF033-01 limita uma garantia anterior diferente, sem retirar os aceites CF032 |

Ancestralidade das bases acima confirmada em `historical-bases.json`. DEC-ONB-03
mantém somente o alcance documentado da CF031; nenhuma linha desta matriz a usa
como dispensa geral.

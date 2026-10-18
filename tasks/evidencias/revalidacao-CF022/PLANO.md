# Revisão independente — hipóteses anteriores às execuções

Candidato imutável: e1c63120129f202440992f29276fa4372111513a..0bab2050fcb8edbd879f75bb1e9f154ef0deabd8.
Branch codex/cf022-investigacao; staging inicial vazio. README SHA256
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Instruções AGENTS fornecidas na conversa; nenhum AGENTS.md encontrado no repositório
ou nos ancestrais consultados. Sem autorização de alteração de produto/harness.

| Critério | Expected pelo contrato DEC-08/SPEC-002 | Aceite rastreável | Relação / lacuna | Verificação delimitada |
|---|---|---|---|---|
| 1. Dia único/reversão | Uma contribuição por dia; toggle desfaz exatamente seu efeito; meta 0→1→0 | revisão CF022/023, tabela DEC08: contribuição, concorrência, ownership, rollback; browser diagnóstico e SQL | RJ: confiabilidade da ação semanal, não regra de contribuição refutada | Conferir assertions e provas integradas da investigação; mecanismo do clock |
| 2. TZ/semana | 04/01/2027 no produto em SP e UTC+14; semana seg–dom; aberta streak0; fechada meta2 streak1 | revisão CF022/023: defaults JVM reais, fronteira/ano novo, mutações | RJ: Date-only deve preservar instante e calendário | Conferir contrato/payloads e executar relógios em ambos fusos |
| 3. Retry scheduler | ShedLock recusa outro nó; após expirar, um FAILED e streak0; sem contribuição duplicada | revisão CF022/023: worker real, mutação SchedulerLock, rollback/retry | H24: fixture global entre métodos torna carga implícita | Uma sequência fresca→501 residuais→isolada, mesma assertion/10s; contar trabalho e estado SQL |
| 4. Evidência/testes | Provas reproduzíveis e sem relaxamento; falhas mantidas | política de testes e pareceres históricos | Saneamento pode ser necessário mesmo sem atribuição histórica | Hashes, diff, limites, scripts públicos; separar teste novo de evidência reutilizada |

Hipótese RJ: setFixedTime instala também performance/timers/rAF; navegação deixa
performance e timeline com origens distintas. Proxy Date-only preserva origem nativa.
Contraprova mecânica em página local sintética, antes de navegar, dois modos e
dois fusos; mesma navegação, sem sleeps/animações desativadas. Não é E2E do produto
nem reprodução de timeout30s. Oito jornadas do candidato serão inspecionadas,
não contadas como execuções novas. Não importar aceite de RVA03/CF014.

Hipótese H24: remover apenas fixtures do próprio experimento devolve 1006 leituras
a 2; nenhum prazo/assertion é alterado. Novo container PostgreSQL16, mocks de
email/mercado herdados. Mesma implementação LAZY atual; EAGER é confrontado com
as quatro combinações já registradas, sem repetir benchmark sem necessidade.
Não há hipótese de SLA de produção nem de causalidade histórica.

Preservar .cf22 integralmente. Runtime novo sob runtime/ ignorado; nenhuma
execução de scripts antigos que sobrescrevam provas. Falha inicial de acesso
ao Docker: permission denied no named pipe, consulta somente leitura; solicitar
execução fora do sandbox para o teste descartável, sem fallback de banco.

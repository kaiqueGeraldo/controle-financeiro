# Execuções e reprodução — 18–19/10/2026

JDK Temurin21/release21 do runtime já existente; Maven wrapper do projeto;
PostgreSQL16-alpine criado pelo Testcontainers, sem URL externa ou fallback.
Email/MarketData são os doubles externos herdados. Schema por contexto e usuários
UUID por método; testes novos não usam scheduler, relógio do browser ou dados reais.
Clock de aplicação é controlado; timers/locks/conexões continuam reais.

## Falhas preservadas e correções

1. `compile-initial.log`: API Jackson3 não oferece isContainerNode; corrigido
   para isObject/isArray. Falha de compilação não é contraprova financeira.
2. `unit-initial.log`:37 casos,36 passam/1 erro. Jackson3 não converte MissingNode
   por asText() sem default; corrigidas leituras opcionais, sem converter UNKNOWN
   em zero. E01 retomou a validação literal. `unit-expanded.log`:40/40.
3. `integration-initial.log`/`initial-reports`:37 unitários passam,10 erros de
   contexto porque Docker retornava500. Não houve execução SQL desses casos.
   Docker local foi inspecionado/iniciado; usuário reiniciou o runtime e pediu
   nova tentativa. Não se mudou banco, timeout ou assertion para obter verde.
4. `integration-docker-restored.log`/`directed-reports`:50/50, incluindo9 testes
   de integração,1 upgrade e40 unitários. Teste E01 confirma snapshot SQL intacto.
5. `regression/`:175 casos,174 passam/1 erro de teste legado de envelope401.
   UserIsolationIntegrationTest inventaria novas rotas mas pressupunha StandardError
   em todas. SPEC-001 exige `{error:{code,message,fieldErrors}}` para onboarding.
   Agora exige esse contrato somente nas rotas novas; mantém assertions legadas,
   mensagem exata,401 e SQL inalterado em todas. Não houve relaxamento de status.
6. Essa regressão revelou saída fixa de Rv24DeletionIntegrationTest para duas
   evidências antigas. Novas saídas preservadas em regression/deletion-*.txt;
   arquivos históricos restaurados do HEAD (estavam limpos ao iniciar). Teste
   passou a aceitar rv24.evidence, default target/rv24-evidence; runner usa pasta
   por execução. Nenhuma assertion de exclusão mudou; diff histórico final zero.
7. `regression-final/`:176/176 e verify/empacotamento aprovados. Inclui11 casos
   CF-029 PostgreSQL (contenção real409/owner distinto e pausa/terminal incluídos),
   upgrade,40 unitários,80 isolamento,1 segurança HTTP,36 exclusão,5 intenções e
   2 arquitetura. Conjunto proporcional aos caminhos compartilhados alterados.

Delta posterior: issues explícitas para fronteira/custódia não confirmadas,
saldo UNKNOWN e quantidade UNIT UNKNOWN. Inputs continuam salváveis, valores
ausentes nunca são inventados. Novo teste literal acrescido; final-sao-paulo e
restored-kiritimati verificam esse delta, além da cópia restaurada das mutações.
Resultados finais: `final-sao-paulo/`53/53 e verify exit0;
`restored-kiritimati/`53/53 e test exit0. Nos53:41 unitários,11 integração e1
upgrade. Timestamps+14 podem indicar20/10 nos logs; conclusão local19/10/SP.

## Contraprovas em cópia isolada

Runner: `controle-financeiro-backend/src/test/cf029/mutations.ps1`; cópia exclusiva
`.cf029-mutation/controle-financeiro-backend`, sem modificar .cf22/.cf22r/.cf22s.
Cada mutação restaura bytes em finally e compara SHA256. Os três fontes do checkout
original permaneceram idênticos (`mutation-source-before/after.json`).

| Mutação | Teste independente | Falha observada |
|---|---|---|
| Retirar guarda expectedVersion | Duas conexões salvam versão0 | Dois200, esperado um200/um409 |
| Retirar filtro user_id de referências | A tenta LINK de conta B |200, esperado404; fixture B é válida/possui saldo2300 |
| Passar decimal por double | Quantidade máxima literal |1000000000000.00000000, esperado999999999999.99999999 |

Cada pasta mutation-* contém diff deliberado, log, relatório e exit1 por assertion,
zero erros de infraestrutura. `mutations.json` registra restauração3/3. Não são
casos funcionais adicionais aprovados nem prova de ausência universal de falhas.
O controle restaurado repete a seleção CF-029; não reproduz artificialmente a
finalização que pertence à CF-030.

## Comandos reproduzíveis

Da raiz do repositório, com Docker local disponível e JDK21 no caminho documentado:

```powershell
& ./controle-financeiro-backend/src/test/cf029/run.ps1 -Name review-cf029 -Verify
& ./controle-financeiro-backend/src/test/cf029/run.ps1 -Name review-regression -Tests 'DraftValidatorTest,OnboardingIntegrationTest,OnboardingMigrationTest,UserIsolationIntegrationTest,SecurityHttpContractIntegrationTest,Rv24DeletionIntegrationTest,FinancialIntentsIntegrationTest,FinancialIntentArchitectureTest' -Verify
& ./controle-financeiro-backend/src/test/cf029/run.ps1 -Name review-sp -Zone America/Sao_Paulo
& ./controle-financeiro-backend/src/test/cf029/run.ps1 -Name review-kir -Zone Pacific/Kiritimati
```

Nomes de execução devem ser novos; runner recusa sobrescrever. Para mutações,
copiar src/.mvn/pom.xml/mvnw.cmd do backend para uma cópia dedicada sob
.cf029-mutation; o script rejeita o checkout original. As pastas mutation-* também
não podem existir para uma nova rodada; usar outra raiz/cópia de revisão com suas
próprias evidências, sem apagar esta execução. Comparar/restaurar hashes ao final.

Logs de erro do MockMvc podem imprimir JWTs sintéticos: runner preserva falhas,
assertions e dados dos oráculos, mas troca somente tokens por marcador explícito.
Não versionar credenciais reais ou runtime. Sem lint/build frontend/browser: nenhum
fluxo de interface foi implementado. Não houve deploy manual nem migração real.

Conferência Git: diff --check de código/testes/documentos passa. Aplicá-lo também
aos logs/XML brutos sinaliza CRLF/espaços emitidos pelos programas; esses bytes
foram preservados deliberadamente com `* -text`, sem reformatar evidência para
obter um check global verde. Manifesto SHA256 confere os96 arquivos de evidência
(exclui o próprio manifesto). Hashes de fonte referem-se aos bytes deste checkout;
uma revisão em checkout com outra política de EOL deve distinguir conteúdo de EOL.

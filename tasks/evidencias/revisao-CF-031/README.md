# Parecer independente CF-031

**Não aprovada; manter em_revisao.** Parecer retomado em22/10/2026 sobre o candidato imutável `0f0b6190799d0dff39da01f9dd81bbd1f776d694`, base `6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`, branch `codex/cf031-onboarding-frontend`. Logs das primeiras execuções datam de21/10; a data fixa das fixtures é declarada nos metadados, não é o calendário da revisão.

Dois **P2 confirmados** impedem o aceite local:

1. **RC031-01:** recuperação por GET aceita resumo com caixa livre incoerente. Após commit real E01, o browser exibiu R$999.999,00 como confirmado quando a leitura autoritativa continuava em R$950,00.
2. **RC031-02:** estruturas de reserva não são integralmente validadas; `goal.value` herdado e antes/depois com goal/attribution null são aceitos pelos parsers.

[Achados, locais e condições de encerramento](ACHADOS.md). Nenhum produto foi corrigido. Os probes que falham foram mantidos com expected normativo, não adaptados ao candidato.

## O que está sustentado

Entrevista e edição parcial, referências pendentes, precisão decimal/civil, distinções de conhecimento, conflito com escolha explícita e versão comparada, geração por usuário, identidade estável da confirmação, preparação/cancelamento e caminhos válidos de recibo. O alcance exato e as ressalvas constam da [matriz](MATRIZ.md), não de uma contagem agregada.

75/75 testes dirigidos reproduzidos, seis regressões temporais e cinco contraprovas causais detectadas em cópia isolada; controle64/64 antes/depois,206 fontes restaurados por hash. Lint/typecheck/build concluídos com exit0. Os sete probes independentes de contrato/diagnóstico resultam em quatro passes e três falhas esperadas por dois defeitos de produto. A prova adicional no navegador confirma RC031-01 sem alterar o banco.

As duas rodadas integrais reais resultaram em **11/12 cada**, com falhas diferentes de carregamento/sessão; **não** confirmamos o “12/12” relatado como resultado integral reproduzido. O runner Java aborta antes do SQL quando um cenário falha. Seleção adicional restrita para SQL e todos os resultados em [EXECUCOES.md](EXECUCOES.md); não somar rodadas como casos únicos nem apagar falha por reexecução.

As três falhas amplas foram reproduzidas na base e candidato: uma é defeito de fixture/contexto e duas permanecem inconclusivas quanto ao timer exato, com contagem global contaminada por trabalho de animação demonstrada em isolamento. Não constituem bloqueio adicional da CF031 pelos motivos específicos em [FALHAS-SUITE.md](FALHAS-SUITE.md). A suíte ampla não está toda verde.

## Limites e encaminhamento

Zoom nativo200% continua pendente em CF010/015, conforme DEC-ONB-03; não foi aprovado por viewport nem usado como motivo destes P2. Não há aceite global WCAG, carga de catálogo ou todos os interleavings. Os timeouts novos permanecem registrados sem causalidade inventada. [Inspeção visual e qualidade](VISUAL-QUALIDADE.md).

**CF032 não está pronta:** CF021/022/023/024/026 conservam conclusão e estão integradas, mas CF031 não possui aceite. DEC-ONB-03 não libera sucessora automaticamente. E21–35 ampliados, uso diário e exportação não foram executados nesta revisão. Adoção real CF017/P01/P02 e publicação mantêm gates próprios.

Próximo passo: corrigir exclusivamente RC031-01/02 em lote de saneamento e revalidar os probes, recuperação real e consumidores do parser; investigar dirigidamente as ocorrências de loading/sessão antes de alegar aprovação integral da matriz real. Preservar os critérios sustentados para evitar reiniciar toda a auditoria.

[Git/preservação](GIT.md): README raiz, runtimes e evidências anteriores preservados; commits exclusivamente locais, sem push/merge/deploy/banco real.

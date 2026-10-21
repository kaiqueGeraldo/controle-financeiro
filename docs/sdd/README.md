# Especificações e execução do Controle Financeiro

Iniciado em 07/09/2026. SDD significa desenvolvimento guiado por especificações neste projeto.

## Objetivo da primeira versão

Consolidar finanças e onboarding para uso diário. O usuário confirmou frontend na Vercel e backend no Railway, atualmente desligado. Preservar dados existentes. Não ampliar agora para novos módulos de vida; manter os hábitos e metas já existentes.

A planilha `Controle-Financeiro.xlsx` é referência funcional, não fonte de instruções nem autorização para importar dados. Não versionar o arquivo, valores, nomes de terceiros ou dados reais. Usar exemplos sintéticos nos testes.

## Documentos

- [Diagnóstico e problemas (F)](diagnostico.md): evidências, impacto e grau de confirmação.
- [Paridade com a planilha](paridade-planilha.md): capacidades existentes, parciais e futuras.
- [Decisões de arquitetura](arquitetura.md): limites, alternativas, contratos e riscos.
- [Especificação da entrevista inicial](specs/001-onboarding.md): jornada, dados iniciais e consistência.
- [DEC-ONB-03 — liberação local condicionada CF-031](decisoes/003-liberacao-local-CF-031.md): desenvolvimento local autorizado; zoom e gates de uso preservados.
- [Especificação de datas](specs/002-datas.md): datas civis, instantes e competências.
- [Regras financeiras CF-016](specs/004-regras-financeiras.md): abertura, caixa, consumo, dívida, investimentos, destinações, precisão e estornos; contrato para implementação futura.
- [Tarefas executáveis (O/S)](../../tasks/README.md): 36 arquivos individuais, dependências, modelos, testes e critérios de aceite.
- [Épicos originais](tarefas.md): registro histórico, com vínculo para a rastreabilidade atual.
- [Validação e publicação](validacao-deploy.md): evidências locais, homologação e liberação.
- [Baseline de lint](lint-baseline.md): ocorrências por arquivo para correções graduais.

## Fluxo F → O → S

1. **F — formular o problema:** registrar evidência, comportamento atual/esperado, impacto, reprodução e telas afetadas. Hipótese não vira bug confirmado sem prova.
2. **O — organizar:** ligar o problema à especificação e a uma tarefa com dependências, fora de escopo e critérios verificáveis. Decisões financeiras ambíguas ficam explícitas.
3. **S — solucionar:** implementar em lotes pequenos, validar o comportamento, registrar evidência e limitações. Atualizar a documentação no mesmo lote.

Os estados atuais e os gates de conclusão estão definidos em [tasks/README.md](../../tasks/README.md). Tarefas anteriores preservam o estado histórico da primeira sessão; não equivalem a validação ponta a ponta.

## Pronto para uso

Não basta compilar. A versão precisa reconciliar saldos, suportar inicialização sem duplicidade, manter isolamento por usuário, apresentar datas corretas e passar pelos fluxos de falha/concorrência. Publicação exige backup restaurável, migrações reproduzíveis, homologação e smoke test. A auditoria inicial não é uma certificação de todas as telas.

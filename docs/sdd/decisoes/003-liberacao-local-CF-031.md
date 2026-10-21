# DEC-ONB-03 — Liberação local condicionada da CF-031

Data: 21/10/2026. Autoridade: pedido explícito do usuário nesta execução.
Base conferida: `00179d21b2b9a371c3b5f327c0509cd19310352c`.

## Contexto e decisão

Os aceites frontend acumulados sustentam o início **local/descartável** da CF-031.
CF-011/012/013/014 estão concluídas nos seus recortes; o [parecer vigente da
CF-015](../../../tasks/evidencias/revalidacao-CF019-RVA03/README.md) conserva
somente a verificação faltante de zoom nativo 200%. Essa falta não é defeito
confirmado nem aceite. CF-010 e CF-015 continuam `em_revisao`.

A dependência CF-015 → CF-031 passa a distinguir prontidão para desenvolvimento
e revisão locais de aceite integral do frontend. A autorização do usuário
libera implementação e testes locais da CF-031 respeitando CF-028/029/030 e os
demais gates. O [aceite independente da CF-030](../../../tasks/evidencias/revalidacao-CF-030-RC030/README.md)
está integrado nesta base; o lote aprovado será publicado/integrado antes da
branch de implementação. CF-028 é especificação aprovada; CF-029/030 têm aceite
exclusivamente local/descartável. Conferir mudanças posteriores à base consumida.

O gate anterior permanece nos pareceres datados como histórico. Esta decisão
não aprova zoom, não conclui CF-015 e não concede aceite independente à CF-031.
Antes de liberação para uso, reavaliar zoom incluindo todas as novas telas.
CF-032 **não recebe liberação automática**: requer futuro aceite da CF-031 e
conferência das suas outras dependências. Adoção real CF-017/P01/P02, publicação
para uso e deploy continuam sujeitos aos gates próprios.

## Pendência de zoom — CF-010 / CF-015

- **Escopo:** shell/sidebar, diálogos, erros e ações essenciais dos fluxos
  aceitos CF-011–014, mais contexto, contas, cartões, investimentos, metas,
  reservas, previsões, revisão, confirmação e recuperação da CF-031.
- **Procedimento:** em navegador com controle nativo disponível, aplicar zoom
  200% comprovado pela configuração do navegador; percorrer teclado, Tab/
  Shift+Tab/Escape, foco inicial/retorno, formulários longos, erros por campo,
  rolagem e ações de salvar, corrigir e confirmar. Exercitar temas claro/escuro,
  privacidade e larguras previstas 360/768/1440, documentando a geometria real
  resultante, sem confundir largura CSS com zoom.
- **Encerramento:** capturas do zoom configurado e das telas/ações, registro de
  navegador/versão, dimensões, tema e jornada, demonstração de alcance/interação
  e parecer independente sobre reflow, foco e ausência de recortes impeditivos.
  Achado concreto terá severidade e saneamento próprios; ausência de prova não
  será transformada em aprovação ou defeito.
- **Limitação atual:** [tentativas anteriores](../../../tasks/evidencias/fechamento-CF-010-CF-015/OCORRENCIAS.md)
  recusaram selecionar a janela nativa antes de qualquer input; cua_repl tinha
  APIs nativas desabilitadas e o navegador não expunha controle documentado de
  zoom. Não repetir a mesma abordagem bloqueada. Eventual capacidade nova deve
  ser registrada para a etapa de zoom, sem desviar a CF-031 para investigação.
- **Provas complementares:** viewport reduzida, DPR e CSS zoom podem ajudar a
  examinar layout; nenhum deles certifica zoom nativo.
- **Momento:** após a implementação da CF-031 e antes da liberação para uso;
  antecipar somente se surgir capacidade adequada. Responsável: executor da
  verificação dirigida CF-010 e revisor independente CF-015, conforme convenção
  de execução/revisão do projeto; o operador providencia navegador acessível.

## Consequências e limites

Permite progresso local com risco e lacuna explícitos, ao custo de repetir o
aceite de reflow com onboarding antes do uso. A alternativa de manter o bloqueio
integral adiaria desenvolvimento sem prova de defeito; não foi escolhida pelo
usuário. Responsividade e acessibilidade da CF-031 continuam obrigatórias agora.

Autorizada a publicação do lote aprovado CF-030 e desta decisão no remoto
`https://github.com/kaiqueGeraldo/controle-financeiro.git`, sem force push e sem
alterações alheias. Implementação CF-031 permanece local até revisão independente.
Gatilhos automáticos do push aceitos; nenhum deploy manual, writer ou banco real.
O binding civil de Invoice preserva o DATE armazenado, **sem reparar datas
históricas já gravadas incorretamente**; eventual saneamento exige proveniência.

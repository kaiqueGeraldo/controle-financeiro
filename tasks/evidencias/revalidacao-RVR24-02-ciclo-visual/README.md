# Revalidação independente — ciclo visual CF014

14/10/2026, America/Sao_Paulo. Base **cbbf58df6d4034d8c28fd813fc3d7948f4c7da2e**, candidato **0f9beb1efd9b8c614bcb379915380f8e40770d7d**, intervalo completo cbbf58d..0f9beb1, branch codex/cf-028-contrato-onboarding. Ancestralidade confirmada; somente cf97e8d,4ce1ee8,0f9beb1 após a base, nenhum posterior no início. Diff completo examinado, uma fonte de produto alterada pelo candidato. Esta revisão não altera produto.

**Encerrado: P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02).** Identificador conservado literalmente do parecer de origem. A resposta de A não comanda a nova instância B nem a nova A; confirmação/recuperação financeiras continuam funcionando. Aceite limitado a este recorte, sem reabrir aceites anteriores de RVR24-02 por associação.

| Decisão | Parecer |
|---|---|
| A. P2 de fechamento obsoleto | Encerrado: prova original intacta passa, 19 complementos passam, execução ativa conclui; intenções e recibos corretos |
| B. Interface/pintura | Suficiente para o P2: imagens novas ABA/lost/late-recovery legíveis e complemento com clique, digitação, hit-test, captura e Escape. Algumas imagens originais continuam insuficientes; não certificam pintura global |
| C. Dois timeouts históricos | Causa inconclusiva, sem regressão demonstrada. Mesma seleção ampla independente219/219; cleanup dirigido passa. Não declarar a rodada antiga aprovada nem sua causa resolvida |
| D. CF-014 | em_revisao: resta investigação de histórico invisível, no critério de histórico/modais operáveis; demais aceites acumulados preservados |
| E. CF-015 | em_revisao: zoom nativo200%, RVA-03 e histórico invisível permanecem específicos. Não concluir o marco pelo encerramento do P2 |

Nenhuma nova tarefa integralmente concluída. CF-011/012 e RF15-01–04 permanecem aceitos, sem regressão concreta nesta revisão. Não restou defeito confirmado neste recorte: as pendências são investigações inconclusivas ou verificação não executada. Os timeouts não são novo bloqueio de CF011/012 nem exigem auditoria global.

- [Identidades, causa, responsabilidades e trade-offs](IDENTIDADES.md)
- [Matriz de provas e critérios completos](MATRIZ.md)
- [Interface, imagens e persistência correlacionada](VISUAL-FINANCEIRO.md)
- [Investigação delimitada dos timeouts](TIMEOUTS.md)
- [Execuções e comandos](EXECUCOES.md)

Preservação:119 arquivos de provas independentes,89 arquivos do manifesto publicado do executor e5 fontes do candidato conferidos, todos idênticos (hash-check.json). O primeiro leitor de manifestos usou raiz incorreta para published-hashes; a leitura final respeita caminhos relativos à pasta do executor. Não houve divergência real nem alteração de prova. README raiz preexistente preservado, SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA, fora dos commits. Staging inicial vazio.

Contraprova causal reutilizada: lifecycle-final.log e browser-extra da revisão cbbf58d demonstravam exatamente onClose/removal indevido, mantendo confirmação financeira válida. O executor reproduziu os mesmos testes antes do saneamento. Nesta rodada foram reexecutados intactos sobre o candidato, sem necessidade de nova mutação do produto. Nenhuma árvore de produto foi alterada para obter vermelho/verde.

Próximo passo restrito: investigar pintura do histórico com observação passiva de montagem/animação/frame/screenshot e fixture sem nova operação financeira. Zoom apenas com capacidade nativa suportada nova; RVA-03 apenas com hipótese adicional. Timeouts: instrumentação de etapas/event loop somente se reaparecerem. Sem push, deploy, banco real, merge/rebase/reset/clean ou onboarding.

Integridade da entrega nova: EVIDENCE-SHA256.json inventaria os bytes locais de todos os artefatos, exceto o próprio manifesto; Git pode normalizar finais de linha. SOURCE-SHA256.json registra os quatro probes/harness novos. sanitization.json registra a inspeção dos25 artefatos textuais, sem credenciais a expurgar nesta rodada. Última edição de fonte após os gates removeu apenas linha vazia final do probe, sem mudança executável. Commit local dos probes:130dae2.

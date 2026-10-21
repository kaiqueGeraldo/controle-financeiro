# Encaminhamento para revisão independente

Revisar a branch local `codex/cf031-onboarding-frontend` a partir de
`6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`; commits locais identificados em
GIT.md e no histórico. Esta entrega é do executor, **não é aceite independente**.
Não publicar os commits de implementação antes desse aceite.

1. Construir expected pela SPEC-001 e matriz CF031; conferir os quatro critérios
   originais, CF-028 aprovada e contratos CF-029/030 efetivos. DEC-ONB-03 libera
   somente execução/revisão locais. Não transformar zoom pendente em aprovação.
2. Tentar perder respostas de PUT/prepare/complete/cancel, reutilizar identidade
   com conteúdo divergente, receber200 inválido/recibo incompleto,404 e409.
   Verificar comparação local/remoto e ausência de novo comando como recuperação.
3. Tentar respostas antigas após troca de usuário, desmontagem e reabertura;
   observar conteúdo, callbacks e busy. Conferir expiração real e reautenticação.
   Memória limpa não significa rollback nem recuperação de edição não salva.
4. Mudar fonte/tipo da meta, remover item e retomar declarações ASSIGN/CLOSE;
   exigir confirmação atual, versão original, antes/depois e servidor autoritativo.
   Não confundir nominal, progresso, disponibilidade ou permissão de destinar.
5. Recalcular E01 e contestar E16–20/E35 de leitura: zero/UNKNOWN/PARTIAL/NA,
   centavos e oito casas, máximo e agregado fora de faixa, datas civis e prazo
   original. Conferir que arrays/hashes/mapping correspondem à revisão congelada.
6. Percorrer teclado, Escape/foco, erros por campo, textos longos e rolagem nas
   três larguras, claro/escuro e privacidade. Inspecionar capturas sem adotá-las
   automaticamente como esperado. Zoom nativo200% exige etapa própria antes do uso.
7. Reexecutar jornadas reais e conferir SQL/reload. E01 usa seed do draft por BFF,
   não digitação completa de cada campo. CF-032 conserva a jornada ampliada de
   uso diário/exportação e cenários concorrentes amplos, sem liberação automática.
8. Considerar as três falhas amplas reproduzidas na base: não estão corrigidas e
   não foram escondidas por exclusão, mocks novos ou assertions relaxadas.

Não inferir desempenho de produção, todos os interleavings, adoção real ou
saneamento de datas históricas do aceite local. CF-015 continua em_revisao e
CF-017/P01/P02 mantêm seus gates. Achados novos devem ter severidade, causa,
critério e cenário; nenhuma tarefa deve ser autoaprovada pelo executor.

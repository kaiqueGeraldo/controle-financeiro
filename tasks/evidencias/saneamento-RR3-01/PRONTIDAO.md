# Estados e próxima etapa

**RR3-01/P2:** saneado localmente pelo executor, aguardando revisão independente do delta. Os dois falsos positivos foram reproduzidos nos probes intactos antes da alteração, rejeitados após a correção e novamente reproduzidos/restaurados na contraprova isolada. Esta conclusão não encerra o achado por autoaprovação.

**Zoom:** capacidade C nesta sessão; os dois cenários nativos obrigatórios não foram executados. Não há ambiente alternativo seguro preparado e comprovado. Falta comprovar o zoom real200%, leitura/reflow/ações/scroll/foco com URL/janela/indicador vinculados. CF010/CF015 permanecem em_revisao. A recusa anterior não é execução nem defeito de produto.

**Aceites anteriores:** preservados por integridade do conteúdo e seleção/gates. Cobertura/reserva, SAN-D1, RF15, CF023 app-ready/HTTPS e sessões válida/ausente/expirada/assinatura inválida conservam os recortes aceitos da revisão em c3867993. CF014/isolation e investimentos/transporte decimal/precisão/UI04 mantêm seus aceites anteriores. Nenhum desses aceites foi ampliado por este lote; não houve repetição de todas as suítes financeiras. O único consumidor do helper foi revalidado de forma dirigida, com fonte/assertions intactos.

**Expanded:** bloqueio concreto restante: revisão independente deste saneamento e capacidade/prova nativa para os dois cenários obrigatórios. Não foi executada integral, não há pré-requisitos integralmente atendidos nem liberação de merge da PR #3. Expanded/required remotos continuam reprovados até uma nova execução autorizada no SHA correto.

## Preparação posterior, sem execução automática

1. Revisar exatamente c38679933551487e49086e65715243768cba4e44..HEAD documental deste lote, distinguindo commit funcional/provas de capacidade/documentação. Confrontar o contrato com SAN-E2 e tentar invalidar o diferencial de pintura. Não usar a conclusão do executor como prova independente.
2. Preparar um ambiente de zoom que satisfaça CAPACIDADE.md; executar os dois cenários originais completos, incluindo AC-UI-001. Não reduzir viewport para simular zoom, não criar native-confirmed.txt por inferência de DPR, não instalar extensão/política/perfil sem autorização própria.
3. Com esses bloqueios resolvidos e etapa local autorizada, usar checkout isolado de nomes canônicos e runtime externo novo, Node24/JDK21/keytool, lockfile, Docker/PG sintético, browsers/display e vínculos seguros. Limpar do ambiente apenas variáveis de seleção dirigida (não arquivos históricos): RF15_RVA_ONLY, REVALIDATE_GREP etc.
4. Seleção canônica: CF034_SUITE=expanded; node .github/scripts/ci.mjs all <checkout> <runtime-novo>. O componente Windows usa node .github/scripts/ci.mjs windows-native <checkout> <outro-runtime-novo>. Conferir identidades pelo seletor vigente:115 classes Linux,116 Windows completo. Preservar etapa Windows obrigatória e resultados de cada plataforma. Nenhum grep, skip ou reaproveitamento de relatório desta rodada certifica essa seleção.
5. Exigir todos os relatórios atuais por classe, zero falhas/erros/skips/flaky aplicáveis, E2E completo e pacote vinculado ao mesmo digest/gates. Guardar fonte/versões/seleção/comandos/códigos, XML/JSON, traces/capturas/SQL sintético e diagnóstico sanitizado. Nova falha deve ser preservada e delimitada; sem retry/timeouts maiores para esconder estado.
6. Publicação e nova matriz remota no SHA revisado precisam de autorização posterior. Nenhum merge, deploy, hospedagem, adoção real ou banco real está liberado por este roteiro.

O plano permanece condicional; não há pedido imediato de execução manual ao usuário nem exceção de gate. A worktree não deve ser movida, resetada, limpa nem transformada em .r3.

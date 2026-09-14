# Commits e alterações remanescentes

Base inicial: `1ced2f027fa46ab265b211829375581880cbb07b`.

| Commit local | Unidade |
|---|---|
| `3a7d2f4` | CF-011: reprodução da perda de rascunho no refetch do perfil. |
| `41d5193` | CF-012: reprodução de gráfico substituído pela resposta do período abandonado. |
| `127769d` | CF-013: testes de reconciliação de pagamento, foco da fatura e propriedade da categoria em planejamento. |
| `3da964e` | CF-014: regressões de ano em cache e nota editada durante salvamento. |
| `4f3dc8f` | CF-007/CF-010: correção dos seis seletores semânticos dos modais do E2E temporal. |
| `be68a60` | CF-015, consumidores CF-010/012/014: roteiro visual real, persistência de nota/tema, modal e regressão do nome acessível mobile. |
| Commit que contém este relatório (`docs(CF-015): registrar parecer independente e restricoes do marco`) | Evidências, achados, matriz, comandos e status seletivos CF-009–015. O hash consta do Git e da entrega final; não pode ser embutido no próprio conteúdo sem mudar o hash. |

Nenhum desses commits implementa o bloco preexistente CF-010–014. O intervalo `1ced2f0..be68a60` contém apenas código de testes/harness desta revisão; o commit documental seguinte não deve ser confundido com integração das implementações examinadas.

Os testes adversariais novos permanecem vermelhos **por defeitos confirmados**, conforme logs, e são parte explícita do parecer de não aprovação. Não foram introduzidos skips, enfraquecidas assertions nem ajustadas expectativas para coincidir com o defeito.

Os arquivos foram conferidos antes do staging e selecionados nominalmente por unidade. Para os arquivos de tarefa que já tinham notas de implementação locais, [tasks-status.patch](tasks-status.patch) prepara somente status e parecer sobre a base Git; essas notas continuam fora do commit. CF-015 também recebeu a atualização de sua seção de evidência e dos critérios efetivamente verificados. O patch é registro de preparação do staging, não instrução para reaplicação após o commit.

O working tree remanescente conserva o README da raiz, fontes/testes/relatórios preexistentes de CF-010–014 e a alteração anterior em `docs/sdd/diagnostico.md`. [base-inicial.json](base-inicial.json), [preservacao.json](preservacao.json) e [preservacao-final.json](preservacao-final.json) permitem separar esses arquivos das alterações próprias. Os cinco documentos CF-010–014 tiveram status retificado intencionalmente; seus demais conteúdos locais foram preservados.

As evidências representam **HEAD inicial + candidato local identificado por hashes + testes desta revisão**. Um checkout limpo desses commits, sem o candidato local, não equivale à versão testada. A integração dos commits de implementação ainda é necessária antes de certificar uma revisão de release.

Não houve reescrita de commits anteriores, push, deploy, migração em banco existente ou avanço para CF-016.

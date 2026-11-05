# Conferência dos sete registros alterados

Autorização primária lida no pedido do usuário que originou o saneamento: attachment 28254f9a-a85d-4755-9804-8b62155fa08e/Texto colado.txt, SHA256 e6c5dae6024c9b90a14cdbb5c13d94c19fca6f51fa1ca4e16e1e0505fbae8030. A seção 2 autoriza atualizar referências operacionais e corrigir observadores, fixtures e harness das pendências delimitadas; as seções 5/8/12/16 delimitam caminhos, observadores, CF023 e evidências. Essa autorização histórica não autoriza implementar correções nesta revisão.

As sete mudanças pertencem a esse escopo. A preservação exigida não é interpretada como proibição de editar o fonte objeto do saneamento autorizado: os originais foram arquivados e verificados. Arquivar os bytes não aprova a semântica; os aceites financeiros, de identidade e de sessão dependem das provas descritas no parecer.

| Registro | Antes SHA256 | Depois SHA256 | Razão/alcance |
|---|---|---|---|
| .gitignore | a51808773959b1f9fb9b01b10d35341a860425155c5831272e9c9f6601262405 | 2b56c961de87d4626ca0601d4cc4d603aa3939421438ac8f9c087d816ed5931a | Permitir somente os novos tipos de evidência residual; sem mudar seleção, skips ou produto. |
| controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security/UserIsolationBrowserIntegrationTest.java | d3bdad869dfd2e62bb9e57924452599ab5edfa9cd950a3fbb0ad802c10fcb9a1 | 6df313b74968537a4162d032d136ddbaa8fafa584b1321a752e725d4a6b88ea8 | Preparação compilada e passagem do certificado; marcos/SQL/limites conservados. |
| controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security/browser.cjs | 58806ad85903a80db6a6561a5c9c587c334ee4fd58a12c049ae9ab8d422634c2 | 977adc6966d87e2c4d3456d66c241ba36a71c20c7d330b4a66c46461715dbcfb | HTTPS/readiness com certificado local e metadados de cookie; assertions da jornada conservadas. |
| controle-financeiro-frontend/tests/e2e/milestone-review.integrated.spec.ts | e9e041de99aa54dbeb83a8926098c91b0ab5933f2faa502d1dcaf2ff50405625 | 0da3cd202119c279b2d070288653452763eccee553b07c8991d8b68312a0a270 | Oracles de cobertura e reserva, identidade por ID e interações específicas sem fallback HTTP. |
| tasks/evidencias/saneamento-PR3-expanded/consolidar.mjs | b384c9c815c97f2b745687db7985dda934c021f99f342196af1e12b81d465eb4 | 269f811c571e37463c6322fd3c0065f55e7c9b87416050ca4a184a1ac153a746 | Descobrir principal pelo Git common-dir depois da realocação. |
| tasks/evidencias/saneamento-PR3-expanded/executar.mjs | aa1860886a5c6ada0f3d28cde47b0a5220a303dc6831d20d542c15938e8d6f2b | 8ab2abf2681046b709bb2e079ef9fd028c35f46fda2ff93ed8c7f5c954c54596 | Descobrir principal pelo Git common-dir depois da realocação. |
| tasks/evidencias/saneamento-PR3-expanded/preservar.mjs | 1efe1e3af3a7f1f5b83888a13e91966ba5c6c9b8b055092a13427c35aab93246 | 196ac572bb2e977ce9aeb9b21a94aad9f11c4039df420538b8b2fe4d1a293578 | Descobrir principal pelo Git common-dir depois da realocação. |

Todos os originais existem em authorized-sources-before, no runtime pr3-expanded-residual-20261029-01, sob o mesmo caminho relativo. auditar.mjs compara os sete hashes anteriores com o manifest de 36, com os bytes arquivados e com a versão Git da base (considerando apenas a variante LF/CRLF efetivamente comprovada pelo hash). Não restaura o fonte atual. Os caminhos absolutos de cada arquivo arquivado constam em PRESERVACAO.json.

Os três scripts da revisão independente anterior alterados por localização não pertencem a esses sete registros do manifest de 36. A análise do diff confirma alteração única de caminho em cada script; os outros arquivos da revisão anterior não mudaram. O snapshot de 21 arquivos anterior às edições funcionais permanece íntegro. Manifests e resultados antigos foram mantidos; a aceitação parcial da geometria nesta revisão não reescreve o relatório do implementador.

97 históricos intactos; 36 registros =29 intactos+7 alterações declaradas. Não somar os dois conjuntos como se fossem disjuntos.

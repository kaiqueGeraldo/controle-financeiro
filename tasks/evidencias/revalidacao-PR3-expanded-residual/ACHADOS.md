# RR3-01 — P2: o observador pode aprovar texto sem pintura

Estado: aberto, reproduzido nesta revisão. Classificação C — observador inadequado; nenhum defeito de produto confirmado.

Arquivo: controle-financeiro-frontend/tests/e2e/support/text-geometry.ts, estilos dos ancestrais e amostras de hit test, consumido por SAN-E2-visual em milestone-remediation.integrated.spec.ts.

O helper rejeita display:none, visibility, opacity de composição, cor transparente, recorte e uma cobertura comum. Mas filter:opacity(0) no ancestral não altera o valor CSS opacity inspecionado, e elementFromPoint ignora uma cobertura com pointer-events:none. Assim o helper retorna ok=true para texto que não é pintado ou está coberto. Playwright isVisible também continua true; ele não substitui a prova de pintura.

Reprodução independente: geometry.mjs avalia dez condições. O controle tem1100 pixels não brancos; os dois contraexemplos têm0, comprovados por sharp sobre os PNGs originais (360×900). Mesmo assim ambos são aceitos. Os outros sete controles negativos são corretamente rejeitados; o controle positivo passa. Não é a suspeita de prévia vazia retirada na revisão anterior: aqui a ausência é provocada e medida.

O probe live-geometry.ts.txt repete os dois mecanismos no mesmo badge real, em360px, preservando texto/locator, viewport, posição e o ID do investimento. Baseline e DOM restaurado passam; as condições sem pintura passam indevidamente no helper e reprovam o probe independente. Os dados após reload continuam RVLIVE/quantidade10/custo200/avaliaçãonull. Nenhuma interação financeira ou implementação foi alterada pelo experimento.

Critério violado: matriz residual R04 e pedido do usuário §9 exigem rejeitar texto oculto/coberto, mantendo a exigência funcional de legibilidade. A mudança de boundingBox para DOMRange é válida, mas não encerra a obrigação de pintura. Isso pode deixar o gate SAN-E2 verde apesar de uma regressão visual.

Próximo saneamento mínimo: conservar identidade, Range, viewport e clipping; acrescentar estes dois negativos e uma confirmação de pintura/cobertura que não dependa apenas de hit testing. Não construir um renderizador genérico para resolver este badge: justificar uma prova localizada por estilo/camadas e pixels/captura inspecionada. Verificar filtros relevantes nos ancestrais e coberturas mesmo sem hit test. Restaurar DOM/estilos por estado conhecido e exigir o controle positivo. Não remover assertions, mudar produto, relaxar seletor ou desativar animações para obter verde.

O achado mantém a correção geométrica parcialmente aceita. Cobertura/reserva, SAN-D1, identidade e sessão têm decisões independentes e não são reabertos por ele.

Na tela real, o Range x58/y487/largura215,953125/altura18 continha1285 pixels do texto vermelho no baseline e na restauração;0 nas duas condições invisíveis, enquanto ok=true. verificar-pintura.mjs registra hashes e verifica prévias lossless com o mesmo buffer RGBA. Não se infere defeito fora da região alterada a partir da aparência de uma prévia.

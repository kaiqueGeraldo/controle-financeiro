# Expanded do recorte autorizado, com dois cenários de zoom adiados pela decisão DEC-ZOOM-05

**Resultado: reprovada/incompleta.** A decisão e a implementação da seleção/gates estão locais; não houve autoaprovação. A execução all Linux parou no gate de componentes. Nenhuma falha adicional foi absorvida pela exceção.

03/11/2026, America/Sao_Paulo. Inputs: **4204080aa9b2fa46c52f9d1ef6638b77231087fd**, branch codex/saneamento-pr3-expanded. Base inicial 64b0cb4c00e9d5905a9b87814143a33df415db97, limpa e ancestral. Commit da decisão 56f41bce; seleção/gates/testes 4204080a; o commit posterior reúne evidências e estados, sem mudar os inputs de execução. HEAD final e intervalo exato constam da entrega e do recibo privado git-final.json, evitando autorreferência.

## Decisão, cobertura e controles

Autorização explícita do usuário registrada na [DEC-ZOOM-05](../../../docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md), sem prazo de expiração inventado. AC-UI-001/CF010/CF015: **pendente, com exceção temporária autorizada para a continuidade delimitada**. CF010/CF015 continuam em_revisao. Não se afirma que o produto funciona ou falha a 200%; continuam sem demonstração integral recortes, foco, overlays e acesso às ações.

Dois adiamentos exatos, projeto review-sao-paulo, sob controle-financeiro-frontend/tests/e2e:

- cf015.native-zoom.integrated.spec.ts — R10: zoom nativo 200% com ações, rolagem e foco.
- rf15-native-chrome.integrated.spec.ts — RF15: zoom nativo Chrome 200% com ações, rolagem e foco.

Nenhuma classe Java removida: 115 Linux + uma Windows = 116 por identidade, preservando smoke, históricos, ownership, precisão, recuperação, autenticação, isolamento e contratos temporais. No wrapper RF15, listagem real anterior à seleção: A=25, B=2, C=23. Identidades de projeto/arquivo/caminho de títulos conferidas pelo próprio Playwright; A=B união C e interseção B/C vazia. [Conjuntos explícitos](CONJUNTOS-A-B-C.json) distinguem classes e jornadas; suas contagens não são um total de testes leaf.

O controlador usa lista explícita C antes de executar, preserva os testes B e exige manifest com decisão, candidato, digest e rodada; resultados antigos, seleção vazia, identidade desconhecida/omitida, exclusão adicional, relatório ausente, falha/erro/skip/retry/flaky reprovam. Required preserva Windows/Linux obrigatórios e expanded success no dispatch expanded; skipped do job inteiro não é dispensado. Artefatos não recebem rótulo de aceite integral.

## Contratos e execução efetiva

| Recorte | Resultado observado |
|---|---|
| Contratos Windows | 39/39, zero skips |
| Contratos Linux local em Docker | 39/39, zero skips |
| Quatro contraprovas isoladas | Todas detectadas; módulos restaurados por hash e controles corrigidos aprovados |
| Controlador real com Playwright, fixtures sintéticas sem navegador/produto | C=3 executado, B=2 não executado; controle exit0; skip inesperado reprovou com exit1 |
| Windows nativo obrigatório | AdoptionNativeSocketsTest: 1/1, zero falhas/erros/skips |
| Frontend Windows suplementar | Lint/tipagem e 18 unitários em três fusos +626 componentes passaram; build reprovou por raiz física fora do mapeamento Z: |
| Expanded Linux all | Lint/tipagem e 18 unitários passaram; componentes exit1, JSON parcial com 597 passes/63 arquivos; 29 identidades de oito arquivos ausentes comparadas com Windows |
| Backend Linux/23 jornadas RF15 reais/E2E financeiro/pacote | Não alcançados após a falha; nenhum pacote novo produzido |

O JSON Linux success=true não neutraliza a saída 1. Classificação dessa ocorrência: inconclusiva, com diagnóstico delimitado entre harness/ambiente; nenhuma causa de produto presumida. A falha Windows é de topologia/mapeamento, sustentada pelo erro explícito do Turbopack. Primeiras ocorrências preservadas; sem repetição de suítes para obter verde, alteração de timeout/retry/assertion ou correção paralela de produto. [Pendências por identidade](PENDENCIAS.json) e [saneamentos delimitados](SANEAMENTO-SEGUINTE.md).

Node24.18.0 nas duas plataformas; Windows JDK21.0.12.1/Maven3.9.12; imagem Linux com Temurin21.0.12+8 preparado. Playwright1.63.0 foi usado em listagem e contrato sintético; navegador real não foi lançado nesta rodada. PostgreSQL e aplicação Spring de teste não chegaram a iniciar. A imagem Docker é de ferramentas, não release da aplicação. É execução local, **não GitHub Actions**. [Comandos, imagem e proveniência](REPRODUCAO.md).

As preparações de zoom previamente aprovadas e as 852 entradas do pacote assistido histórico foram preservadas, sem contar seus resultados como atuais. A primeira versão do teste CLI auxiliar esperou uma mensagem posterior; o gate corretamente rejeitou o skip antes. Script/saídas originais preservados, expectativa corrigida e fixture sintética nova verificada; nenhum código do gate/produto alterado por isso. [Contratos e limites](CONTRATOS.md).

## Preservação, encaminhamento e limites

Manifests existentes conferidos por referência: 1.124 arquivos iniciais, com 1.113 atuais idênticos e 11 deltas autorizados de seleção/gates/estados; todos os bytes originais arquivados e verificados. Mais 97 protegidos do principal, 75 artefatos históricos, oito capturas humanas dentro desse acervo, 36 registros, sete originais anteriores e manifest1053 com seus dois deltas previamente autorizados. Protocolo e pacote assistido preservados. [Recibo de preservação](PRESERVACAO.json).

READMEs principal/worktree continuam respectivamente 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA e E7D3458FBD8AC227520BE27996CE23C73E8C3BE2086D8CFBD51AD59568F4CEE0. Principal mantém c16e6545488c8f13efda4dab9efa8aa896fcddaa e somente M README.md preexistente. Publicação limpa permanece em 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88. Nenhuma worktree movida, .r3 recriada, limpeza geral de target, clean ou reset destrutivo. Processos/contêineres próprios e listener3107 ausentes; mapeamento temporário removido, sem apagar arquivos.

Material disponível para revisão independente delimitada da implementação, contraprovas e limites; **não pronto para atualização remota da PR ou avaliação positiva de integração**, porque a expanded obrigatória está incompleta. Saneamentos novos exigem seu lote próprio; depois executar os gates completos no candidato correspondente. RR3-01 permanece aceito no alcance anterior, sem reabertura. Retomar zoom quando houver capacidade adequada ou decisão específica de aceite visual/release; ocorrência real de problema será tratada pela gravidade.

Sem push, atualização de PR, CI remota, merge, alteração de hospedagem/proteções, deploy, produção, adoção real CF-017/P01/P02 ou banco real.

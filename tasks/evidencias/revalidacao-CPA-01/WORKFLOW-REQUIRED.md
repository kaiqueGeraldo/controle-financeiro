# Workflow e resíduo CPA-01/R1/P2

**Resíduo confirmado de contrato/status: required não agrega falha das
dependências como um check explicitamente reprovado.** O encadeamento atual é
windows-native → required → expanded. Não se demonstrou geração indevida de
pacote; o problema é usar o status do required como certificado de execução.

## Caminho real e referência de semântica

`ci.yml:60–61` declara required com `needs: windows-native` e sem condição de job
que execute uma avaliação de status após dependência falha/skipped. Windows é
incondicional nos eventos aplicáveis, sem continue-on-error e sem matriz.

O GitHub documenta que dependências falhas/ignoradas propagam skip aos jobs
dependentes. Também documenta que um check skipped pode satisfazer a exigência
de status obrigatório. Fontes primárias:
[Using jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs) e
[Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

Logo, se a proteção exigir apenas required, uma falha Windows pode deixar esse
contexto skipped e não bloquear por ele. As regras remotas atuais **não foram
consultadas**: não se afirma que um merge real já é possível ou ocorreu. Exigir
também windows-native é defesa operacional adicional; o texto preparatório do
executor já a recomenda. Isso não demonstra que o próprio required rejeite os
estados não verdes solicitados no contrato desta revisão.

## Matriz do YAML atual

| Windows / dependência | Resultado do required no modelo de needs | Pacote | Aceite da execução |
|---|---|---|---|
| Sucesso | Elegível para executar; ainda precisa rodar todos os gatesLinux | Só depois de seus próprios gates | Pendente até execução/relatórios |
| Falha de teste/erro ou relatório ausente | skipped | Não alcançado | Não aprovado; risco se apenas esse contexto for obrigatório |
| skipped | skipped | Não alcançado | Não é execução aprovada |
| Cancelamento da dependência | Propagação de skip pelo encadeamento; cancelamento global pode marcar jobs cancelled conforme o momento | Não alcançado | Não aprovado; nenhum resultado de Actions inferido |
| Dependência ainda pending/não iniciada | Espera/não executado | Não alcançado | Não aprovado |
| Dependência inexistente no YAML | Configuração inválida, não uma execução verde | Não alcançado | No candidato a dependência existe |
| Matriz parcialmente concluída | Não aplicável: não há matriz nesse job | — | Nenhuma certificação sintética de matriz inventada |

[workflow-contrato.json](workflow-contrato.json) contém o YAML parseado com js-yaml,
hash, eventos, dependências e modelo local. É prova **estática/contratual**, não
um simulador completo de Actions nem execução remota. Cancelamento de toda a run,
políticas do repositório e agendamento real continuam critérios remotos próprios.

## Eventos e controles preservados

- Push para main e PR para main com paths backend/frontend/.github/tasks/docs-sdd, além
  de workflow_dispatch smoke/expanded, alcançam windows-native nos mesmos filtros.
  Push da branch de saneamento não dispara ci.yml. Probes antigos continuam em
  branch própria e não foram incorporados por associação.
- Windows usa windows-latest, Node 24, Temurin 21, Maven wrapper e estágio específico;
  não é condição opcional por suite. O resultado exige relatório da classe, teste
  real e zero skips/falhas/erros. Foi executado localmente pelo mesmo estágio.
- Required mantém Ubuntu, seleçãoLinux100, frontend/backend/E2E/package. Expanded
  requer dispatch expanded e required; sua seleção115 conserva15 históricos.
  Seleção calculada não significa matriz completa executada.
- Permissão contents:read; checkout sem persistência de credenciais; sem secret
  de produção ou deploy referenciado no delta. Argumentos Maven literais foram
  exercitados no estágioWindows. Coleta always é condição de step, não agregação
  de status de job; não resolve R1.
- DiagnósticoWindows é sanitizado por allowlist, inclui SHA/digest/seleção/contagens
  e hashesXML, retenção de 7 dias. XML com propriedades fica privado e nenhum JARWindows
  é publicado. Required só gera pacote após seus gates; não há pacote alcançado
  no caminho de dependênciaWindows falha.

## Encerramento mínimo proposto, sem implementação

Criar/ajustar um check estável de integração que **sempre avalie o término das
dependências** e só aprove quando todas as execuções obrigatórias tiverem resultado
success. Failure, cancelled, skipped, resultado ausente e relatório inválido devem
bloquear explicitamente esse gate; nenhum pacote pode contornar a dependência.
Preservar as identidades, assertions, prazos, sanitização e o controle de pacote.

Pode-se manter o nome required com guarda explícita antes dos estágios, ou separar
execução e agregação conservando um contexto obrigatório estável. O primeiro tem
menor diff; o segundo separa responsabilidades, ao custo de outro job e ajustes de
needs/contextos. Coleta após guarda falha precisa caminho/condição definidos, sem
usar diretório ausente ou fallback bruto. Não basta permitir skipped como sucesso
ou documentar que o operador deve ignorar um verde insuficiente.

Critério de encerramento: outra execução revisa o delta e controles locais de todos
os estados acima, com restauração/negativos sensíveis; depois, em etapa autorizada,
conferir contexts/rulesets e comportamento real de Actions. Não se exige Actions
prévia para provar o contrato local corrigido, mas ela também não é alegada aqui.

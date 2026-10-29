# Revalidação independente CPA-01/R1/P2 — 28/10/2026

**CPA-01/R1 encerrado no alcance local. Parecer A: candidato apto a publicação
controlada e CI remota.** Nenhum novo impedimento confirmado no delta examinado.
Esse aceite permite preparar a próxima etapa autorizada; não declara Actions
aprovado, CF-034 integral concluída, adoção real, deploy ou produção liberados.

## Base e decisões separadas

Branch: `codex/saneamento-cpa01-selecao-testes`. Base
`e837748a600c356e2e9d4f60291240cebf523916`; candidato
`81b20bca7c95c452fa04899f583a1b0b5007853e`. Commits recebidos:
`b45284e876277e4136b6487ed3e3d9a320bfaa62` e
`81b20bca7c95c452fa04899f583a1b0b5007853e`. HEAD/branch/ancestralidade conferidos;
na entrada só o README raiz estava modificado e o index estava vazio.

| Decisão | Parecer | Alcance |
|---|---|---|
| A — CPA-01/R1 | Encerrado localmente | Agregador elegível após dependência malsucedida; avaliador real rejeita obrigatório não success e dados inválidos |
| B — Cobertura e pacote | Aceites preservados | Linux100/115, Windows1, união101/116,15 históricos, relatórios estritos e cadeia Windows→Linux/pacote |
| C — Workflow | Pronto contratual e estaticamente para validação remota | YAML parseado e comparado com a base; sem execução do scheduler Actions |
| D — Consolidação | **A — Candidato apto a publicação controlada e CI remota** | R1 era o impedimento local concreto; a etapa remota é a próxima validação, não razão para manter C |

Os pareceres C e resultados negativos anteriores são históricos válidos nas suas
bases. [Revisão anterior](../revalidacao-CPA-01/README.md) e
[saneamento recebido](../saneamento-CPA-01-R1/README.md) permanecem intactos.

## Provas executadas nesta revisão

- **32 contratos** no checkout candidato e novamente na cópia restaurada:32/32,
  zero skips. Incluem os nove contratos do avaliador/workflow recebido.
- **Sete probes independentes anteriores**, sem editar assertions:7/7.
- **Seis controles novos independentes**:6/6, com tabela literal de requisitos,
  **500 combinações de resultados** no módulo real:4 aprovadas e496 rejeitadas.
  Também cobrem ausência/tipos/JSON, default/modos, CLI real e estrutura YAML.
- **Sete mutações isoladas**: todas detectadas por assertions, sem erro de import
  ou sintaxe. Cada restauração por hash foi seguida de6/6 controles aprovados;
  os32 contratos finais passaram. A sétima mutação interpreta expanded como smoke.

Comandos, logs e hashes em [validacao.json](validacao.json); tabela executada em
[matriz-resultados.json](matriz-resultados.json); critérios em [MATRIZ.md](MATRIZ.md).
Logs TAP conservam os bytes originais, inclusive indentação em linhas vazias de
assertions negativas; a conferência de whitespace textual exclui esses logs brutos.
Expectativas não importam `jobRequirements` nem calculam expected pelo avaliador.
O módulo/CLI inicial é o arquivo do candidato invocado pelo workflow; a cópia de
mutações usa os mesmos157 inputs, conferidos por hash antes e depois.

As alegações recebidas de32 contratos,7 probes,82 cenários e6 mutações foram
conferidas contra manifests, logs e registros. [Conferência](conferencia-implementador.json),
[auditoria dos15 logs anteriores e CLI expanded adicional](conferencia-final.json).
São conjuntos sobrepostos:32 já incluem9 testes de required; os casos82/500 e as
mutações exercitam critérios presentes nesses testes. Não se somam como cobertura
distinta. As82 decisões antigas conferidas não são rotuladas como82 novas execuções.

Controlador local Windows/Node24.18.0. Não foram repetidos testes financeiros,
TCP, Maven/JVM ou suítes integrais de plataforma: produto, seletor e consumidor de
relatórios não mudaram nesse intervalo. As execuções Windows/Linux/TCP anteriores
conservam suas datas, toolchains e limites, sem serem apresentadas como novas.

## Required e bloqueio do pacote

Windows/Linux são obrigatórios em todos os modos. Expanded é obrigatório no
dispatch expanded; nos demais, deve existir com resultado skipped, exclusivamente
como não aplicabilidade. Falha, cancelamento, skip obrigatório, ausência,
desconhecido, JSON ou estrutura inválidos reprovam. O CLI produz exit1, com
diagnóstico limitado a jobs/status conhecidos; payload/outputs hostis não são
impressos nem usados para construir comandos shell.

`required` mantém o ID sem nome alternativo/matrix, usa always e needs diretos dos
três jobs. Seu último e único comando run é o avaliador, com `toJSON(needs)` em
variável de ambiente. Não há continue-on-error ou etapa que converta rejeição em
sucesso. Checkout/setup malsucedidos também não tornam o job verde.

Linux continua dependente do sucesso Windows. Seu comando sequencial conserva
frontend→backend→E2E→package, relatórios e vínculo do pacote com o source digest;
falha interrompe os estágios seguintes. Upload do pacote conserva a condição
implícita de sucesso. Required não constrói/publica pacote. Um artifact smoke pode
existir antes do expanded e não substitui o agregado final; nenhuma ordenação nova
foi exigida. [Análise do workflow e fontes oficiais](WORKFLOW.md).

## Preservação e continuidade

[Preservação inicial](preservacao-inicial.json):92 caminhos protegidos rehashados,
incluindo provas/manifests anteriores, implementação aceita,16 migrations, README
raiz e JAR p05. Inputs e19 referências de runtime do saneamento conferidos por
referência; nenhum inventário recursivo de runtime antigo. Novo runtime exclusivo:
`../controle-financeiro-runtimes/preparacao-adocao/revalidacao-cpa01-r1-20261029-01/`.
Inventário final abrange apenas artifacts novos desta revisão.

README raiz SHA-256:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
JAR p05:
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Nenhuma correção de implementação, limpeza, novo JAR ou serviço iniciado.

Não houve fetch/push/PR/merge, execução Actions, consulta/alteração de rulesets,
hospedagem, banco real ou deploy. `origin/main` é somente referência local
`fb986456a37a48afcafef204f165d15354294d26`, sem atualização remota nesta revisão;
58 commits exclusivos até o candidato, acrescidos dos commits locais desta revisão.
HEAD final e intervalo completo constam da entrega e dos recibos Git.

Próximo passo requer autorização para reconferir referências e controles remotos,
publicar o intervalo imutável, criar PR e executar a matriz de CI do
[plano de publicação](../consolidacao-pre-adocao/PUBLICACAO-CI.md). Conferir nome,
origem, SHA/evento e exigência real de `required` somente nessa etapa. Always não
garante execução após force-cancel, runner indisponível ou falha da plataforma.
Zoom, CF-017/P01/P02, CF-034 integral, configuração remota e CF-035/036 continuam
com seus gates e estados próprios; nenhum checkbox integral alterado.

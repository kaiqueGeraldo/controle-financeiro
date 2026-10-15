# Achados e encerramentos

## RV17-01 — saneado no código; resíduo operacional P2 aberto

Local do resíduo: `tasks/evidencias/CF-017/ROLLOUT-LEGADO.md:25`, `:65` e `:133`.
As linhas25–27 limitam expressamente o freeze a captura/dump; 65–66 executam o
preflight em outra etapa; 133–138 consideram baseline após inventário/ensaio/revisão
e mandam manter writers congelados. Falta ligar explicitamente a última aprovação
do preflight à mesma janela sem alterações até a baseline e definir sua invalidação.

**Esperado:** freeze/controle de DDL antes do último preflight e até baseline;
troca de alvo, alteração de schema/history, interrupção ou liberação da janela
invalidam aprovação anterior. Novas escritas/nextval invalidam a comparação de
capturas separadas e exigem repetir snapshot/backup/restore pertinentes.
Preflight0 não é autorização permanente. Não é necessário lock distribuído novo.

**Observado/reprodução:** `previousPassDoesNotAuthorizeChangedSchema`, preservado
no probe Java. Em schema próprio descartável, fixture→exit0→remover FK→novo
preflight exit2. Uma baseline explícita que reutilize o resultado antigo consegue
aplicar V2–V14 deixando accounts sem FK. `independent-probes.log:80` registra isso;
o teste consulta pg_constraint diretamente. O bypass é deliberado para provar o
risco do procedimento, **não** um bypass dentro do comparador ou initializer atual.
O schema é descartável e não retorna ao uso; nenhum alvo real foi afetado.

**Critério violado:** requisito de intervalo preflight/baseline e invalidação do
ensaio solicitado nesta revisão; operacionalização da equivalência exigida por
RV17-01. Impacto: aprovação obsoleta reutilizada em adoção de legado. Severidade
residual P2; o falso negativo P1 original da FK está corrigido e aprovado.

**Encerramento:** explicitar início/fim da janela, identidade/revisão do alvo,
repetição do gate antes da baseline, eventos de invalidação e repetição de backup
quando houver escrita/nextval. Revalidação documental dirigida contra este probe.
Não corrigido para depois autoaprovar nesta revisão. Não bloqueia CF-029 em schema
descartável novo/gerenciado; bloqueia declarar rollout integral aprovado.

## RV17-02 — encerrado localmente

Oracle agregado substituído por comparação de linhas/campos, estrutura, sequences
e histórico, aprovado por execução independente dos cenários originais e novos.
Troca de valores com soma preservada, alteração bruta/origem, vínculo, constraints,
índices e sequence detectadas na causa esperada; destino final restaurado equivalente.
O campo numérico extremo e o framing de null/texto foram confrontados por oracle
independente literal. A obrigação de backup/restore real continua na CF-017/P01/P02.

## Limitações e melhorias não impeditivas

* Escala real não medida: sort textual, transação longa, I/O e snapshots extensos
  exigem dimensionamento; não é defeito impeditivo do uso local restrito.
* Diagnóstico reporta primeira linha/campos divergentes por arquivo, com hashes.
  Melhorias de inspeção posterior são opcionais; não imprimir dados sensíveis.
* COMPLETE atesta término da captura, não assinatura contra adulteração externa.
  Preservar diretórios/manifestos/dumps em armazenamento protegido e não remover
  arquivos para fazer comparação passar. A ferramenta não é validador forense de
  artefatos manipulados após captura.
* Aceite sintético não certifica ACLs, cluster, volume, proveniência ou concorrência
  de produção. Nenhuma dessas obrigações foi transferida ou declarada concluída.

# Encaminhamento delimitado após o aceite TCP

O achado de TCP/reuso nativo está encerrado no recorte Windows/JAR/PG16/17
revalidado. A ausência dos estados TCP históricos não impede esse aceite, pois
o mecanismo foi reproduzido causalmente, a contraprova detectada e o controle
restaurado aprovado. Atribuição de causa exclusiva a cada erro histórico continua
sem prova. Limites de identidade, observação e prazo constam no parecer.

## Startup HQL: estado próprio

Permanece inconclusivo/não aprovado, com o limite original de 40s. Falhas antigas
e as pré-bind da investigação anterior estão preservadas. Passar nos probes de
TCP não mede todos os cenários de startup nem explica pilhas de parser HQL.
Nenhuma investigação de HQL foi iniciada nesta revisão.

Há agora condições de processo/rede verificadas para o próximo experimento:
processo próprio identificado, listener efetivo registrado, inspeção bloqueante
quando inconclusiva, confirmação TCP antes do retorno e bind imediato preservado.
Outro processo pode ocupar a porta depois; isso continua sendo erro explícito,
sem tentativa de encerrar o alheio ou trocar silenciosamente a porta.

## Próximo experimento recomendado, ainda não executado

1. Fixar inputs, JAR p05 e SHA, versões/JDK/heap/configuração, PG descartável já
   pronto e schema conhecido. Novo runtime com identificador próprio; preservar
   falhas anteriores. Separar claramente o supervisor Windows e a aplicação
   Linux em Docker sobre Windows, registrando imagem/digest e custos de cada um.
2. Fazer uma captura fria nativa e uma em Docker, sequenciais, uma tentativa por
   cenário. Medir desde o início do startup e manter o resultado de 40s como
   critério próprio. Registrar processo/nascimento, logs e primeiro listener;
   contabilizar custo da observação. Não ampliar prazo para aprovar o cenário.
3. Classificar falha antes de listener, falha de bind ou startup concluído.
   Se houver pilha HQL, correlacionar fases/tempo com carga e memória; diagnóstico
   dirigido a essa ocorrência, sem campanha de queries ou alteração de produto.
   Instrumentação adicional deve ter custo declarado e resultado separado.
4. Encerrar recursos próprios e auditar. No Windows usar o close revalidado e
   registrar separadamente tempo de término, confirmação TCP e eventual limpeza
   de erro. Falha de teardown é falha operacional própria, não prova automática
   de causa HQL. Parar após os dois cenários, inclusive se inconclusivos.

Startup Linux dentro de Docker não certifica um supervisor Linux nativo nem
permite transferir os aceites de Job Object/Windows. Cada resultado conserva seu
contexto e orçamento. Não foi criado um novo gate por associação com o TCP.

## Preparação local e adoção real

RVPLA-01, os recortes aceitos de RVPLA-03/04/05, audit/EPERM e os demais aceites
locais não afetados continuam preservados. Não há nova medição do probe de 20s:
seu código e caminho de execução estão intactos, conforme a matriz.

CF017/P01/P02 e CF034 integral continuam em_revisao. Expanded, zoom nativo 200%,
cancelamento/configuração e gates reais mantêm suas pendências. Nenhum checkbox
de inventário, backup/restore, freeze, baseline, DDL, temporalidade ou coordenação
reais foi encerrado. Banco existente, publicação/adoção e produção não liberados.
CF035/036, ações remotas, push, merge, CI ou deploy não foram iniciados.

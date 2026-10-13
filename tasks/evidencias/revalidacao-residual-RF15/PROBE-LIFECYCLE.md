# Delimitação do probe de ciclo de vida

O primeiro probe do revisor consultava o form no container do render, embora Modal use portal. A falha não exercitava o envio; versão preservada em lifecycle-probe-first.txt e log components-isolated.log. Corrigido para alcançar o form do botão de confirmação real.

A primeira versão executável (lifecycle-probe-broad.txt, lifecycle-component.log) mediu três efeitos: onClose, onSuccess e remoção do envelope após resposta válida. Ela estendia indevidamente o contrato de unmount/troca de owner à simples troca de modal do mesmo owner. Aqui o manager permanece montado e a resposta contém recibo validado: atualizar saldos e resolver a intenção A são legítimos. Não é necessário exigir que um recibo confirmado continue desconhecido.

O teste final exige uma única chamada HTTP, uma atualização global legítima, nenhum onReconcile indevido e resolução do envelope confirmado, mas proíbe onClose da execução A sobre o modal B. Essa assertion permanece vermelha. Não foi alterado nenhum teste anterior ou produto; a prova de navegador confere identidade, recibo, operação única e seleção B. A correção do próprio probe não é saneamento do produto nem reabertura dos aceites de unmount/owner de RVR24-02.

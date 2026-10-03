# Correção das fixtures de sucesso — antes de alterá-las

`first-after.log` registra 6/6 provas independentes aprovadas e duas falhas na
suíte antiga `rv24-creation-intent`: retry usa `data: {}` e recuperação usa
`result: {id: "fact"}`. Não são TransactionResponseDTO válidos (o contrato
Java exige UUID, descrição, valor, data, conta, tipo e estado financeiro).
Esses doubles neutralizavam justamente a fronteira objeto-válido/sucesso.
As assertions de identidade, callbacks, número de POSTs e armazenamento
permanecerão intactas. Somente as fixtures de sucesso serão completadas.
As cinco provas vermelhas independentes e sua sexta prova de storage são
copiadas byte a byte, sem correção ou redução de expectativa.

O teste independente de remoção usa `{}`: depois do saneamento, passa antes
de atingir removeItem. Uma prova complementar usará DTO válido e verificará
explicitamente a chamada de removeItem; não será alegado que o verde antigo
sozinho ainda cobre esse ramo.

`components.log` também demonstra dois R13 de `temporal-forms` que submetem
campos vazios e resolvem `{}` como sucesso. Serão preenchidos dados sintéticos
válidos e respostas correspondentes antes dos dois submits no mesmo tick.
Mantidos a Promise pendente, o número de envios e o sucesso único esperado.

# Correção delimitada do observador
Primeira revisão: browser/native-causal.json, assertionPassed=true, histórico
opacity1 e oito IDs comprometidos; ancestral modal opacity0.704486, transformação
matrix(1,0,0,0.998963,0,0.315253). A assertion síncrona de todos os ancestrais em
cf014-history-diagnostic.integrated.spec.ts:118 antecipava conclusão de uma
animação independente. Não é falha ambiental nem reprodução do histórico0.

Correção: expect.poll do MESMO predicado exato (opacity1, visible, display!=none),
com prazo padrão15s já existente. Sem retry de teste, sleep, aumento de prazo,
remoção de assertion ou mudança de produto. Amostra final anterior permanece;
amostra settled adicional demonstra o estado usado para interação. Testes
causais dos três modos serão repetidos em causal-settled, sem sobrescrever browser.
Se a opacidade nunca atingir1, o probe continuará falhando. Clock antigo mantém
seu ramo vermelho original, sem poll novo. Corrigir sincronização e comprovar
pintura não significa atribuir outros screenshots/timeouts à mesma causa.

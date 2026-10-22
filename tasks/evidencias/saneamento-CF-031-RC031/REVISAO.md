# Revalidação independente dirigida

CF031 permanece em_revisao. Examinar o lote a partir de e1f5048 na mesma branch;
commits em GIT.md. Esta entrega não encerra os achados por autoaprovação.

1. Reexecutar probes originais intactos, conferir hashes e cadeia antes/depois.
   Contestar soma950/301, PARTIAL500, UNKNOWN, zero e déficits/agregados>M.
   Conferir que nenhuma soma de reservas incertas por fonte foi imposta como
   total nominal e que recibos históricos não dependem de saldos atuais.
2. Examinar LegacyReservation em ambos os locais e cada variante: own fields,
   null/ausência/herança, refs e partes inválidas, nominal/estado, extras válidos.
   Conferir JSON __proto__ como dado próprio, sem inferir ataque global não provado.
   Preservar FIN-06/NG-01 e controles normativos válidos.
3. Confirmar todos os consumidores da fronteira compartilhada: prepare,
   complete/replay, GET operação e GET sessão. Resposta inválida não mostra
   sucesso nem gera nova chave/comando. Preparação/UUID/hashes continuam disponíveis
   quando já conhecidos; recuperação usa o recibo durável. Conferir corpo idêntico.
4. Reexecutar integração descartável e SQL, adulterar somente retorno real após
   commit, recuperar/recarregar e distinguir replay de aplicação adicional.
   Verificar950 visível no complemento mobile e as contas/recibos/itens/movimentos.
5. Avaliar os timelines e os limites de T01/T02 separadamente: a origem antiga
   é inconclusiva. Dois experimentos controlados reproduzem estados, sem provar
   gatilho original. Não aceitar passagem verde como explicação histórica nem
   reabrir timers preexistentes sem nova relação demonstrada.
6. Conferir duas mutações em cópia isolada e127/127 após restauração por hash;
   fontes compartilhados e548 provas antigas preservados. Inspecionar o delta
   Java (config opcional de testes), os observadores e assertions complementares;
   não há correção adicional de produto/sessão escondida nesse delta.

Manter aceites anteriores e gates zoom/CF032/adoção real. Registrar achado novo
com critério, causa, cenário e severidade. Aceitar/rejeitar este saneamento exige
parecer independente, não a contagem de testes do executor.

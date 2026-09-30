# Verificador atual e preservação histórica

Em 30/09/2026, o comando integral original foi reproduzido sem alterações:
falhou em `controle-financeiro-backend/pom.xml`, depois das verificações
aritméticas. Registro em `cf016-verificador-integral-vermelho.txt`.
Não há declaração retrospectiva de aprovação dessa execução.

O código do gate de preservação foi extraído, conservando a base,
os hashes, a lista de exceções e a assertiva original, para
`../CF-016/verify-preservation.mjs`. Ele pode ser executado sozinho sobre
um checkout/snapshot histórico. Na árvore atual continua falhando no mesmo
arquivo: `cf016-preservacao-historica.txt`. Não normaliza bytes nem atualiza
o manifesto para acomodar mudanças de produto. O comando integral anterior
continua acionando esse gate por padrão.

Validação documental atual:

```
node tasks/evidencias/CF-016/verify.mjs --current --adversarial
```

Passou: 49 estados, 18 bordas, 15 divergências com donas, 80 links,
precisão racional, sete casos CF-001 e seis mutações rejeitadas. Acrescenta
os oráculos literais NG-01 autorizados pelo usuário: 1,00/200.000.000,
remanescente0,50/0,00; terços0,67/0,33/0,00. Cálculo independente com BigInt,
sem importar produto. Resultado em `cf016-oraculos-atuais.txt`.

O manifesto original, CSV, precisão, ORACLES e log anterior não têm diff;
seus hashes atuais estão em `cf016-artefatos-preservados.json`. A separação
permite evoluir o produto sem confundir validação aritmética com imutabilidade
dos arquivos da base anterior. Os novos passes documentais não certificam
runtime, migrações ou revisão independente do marco.

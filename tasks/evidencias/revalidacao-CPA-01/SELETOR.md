# Seletor, plataforma e identidades

Contrato examinado: `backendSelection(root,suite,targetPlatform,scope)` aceita
somente smoke/expanded, linux/win32 e all/platform-only. Plataforma ausente,
inválida ou alias de runner como ubuntu-latest não recebe fallback para o host.
O workflow usa esses aliases para escolher o sistema; o Node naquele sistema
fornece process.platform linux/win32 ao seletor e ao launcher Maven local.

Windows controlador com JVM Linux em container foi examinado separadamente:
o controlador de fora apenas inicia Docker. Dentro do container, Node e Java são
Linux reais e o seletor recebe linux. A chamada explícita de backendSelection
com alvoLinux também foi testada a partir de Windows. Não se usa os.name para
enganar a seleção corrigida; essa simulação pertence somente à reprodução antiga.

## Oráculo e conjuntos

O oráculo é o seletor **anterior à correção**, extraído do commit 434e293f por Git,
sem a nova regra de plataforma. O único diff em Java de testes move a anotação
do método para a classe; não acrescenta/remove/renomeia fonte ou identidade.
Conferiram-se identidades completas, diferenças e unicidade; nenhum total foi
atualizado para acomodar o resultado observado. [Arrays completos](identidades.json).

| Conjunto | Identidades | Diferença comprovada |
|---|---:|---|
| Anterior smoke |101| Fonte congelada434e293f |
| Corrigido Linux smoke |100| Exatamente o anterior menos AdoptionNativeSocketsTest |
| Windows platform-only |1| Exatamente AdoptionNativeSocketsTest, em ambas as suites |
| União smoke |101| Sem falta, extra ou duplicação |
| Anterior expanded |116| Fonte congelada434e293f |
| Corrigido Linux expanded |115| Exatamente o anterior menos o teste Windows |
| União expanded |116| Sem falta, extra ou duplicação |
| Expanded menos smoke |15| Mesmas 15 identidades históricas; nenhuma comum perdida |
| Seleção geral Windows |101/116| Igual à anterior; o job novo executa só o escopo específico |

As mutações retirando o filtro de plataforma e omitindo DateUtilTest foram
detectadas por um processo separado que usa os arrays congelados anteriores,
sem recalcular o esperado pelo seletor corrigido. Depois de cada mutação,
restauração exata por SHA e mesmo controle positivo. Fixtures independentes com
nomes OtherWindowsTest e DifferentLinuxTest demonstram que a regra não depende
apenas da string do caso conhecido.

## Condições JUnit e limite da análise lexical

Na base atual há uma condição de OS: `@EnabledOnOs(OS.WINDOWS)` sobre a classe
dedicada AdoptionNativeSocketsTest. Nenhuma condição composta/herdada de OS em
uso foi localizada. O corpo, assertions, budget de 3s e helper TCP estão inalterados.

O seletor suporta a forma direta sobre classe dedicada WINDOWS/LINUX. Método,
classe aninhada, múltiplosOS, DisabledOnOs ou forma qualificada não reconhecida
com EnabledOnOs/DisabledOnOs provocam erro; probes independentes confirmaram as
formas pertinentes. Não é parser Java genérico: aliases, anotações compostas,
herança e texto em comentários não recebem garantia universal. Uma anotação
desconhecida não é descartada silenciosamente: a fonte continua comum selecionada;
se JUnit a ignorar, zero-skips rejeita a execução. Nova forma em código real exige
revisão da partição antes de seu aceite, sem prometer reconhecimento de toda Java.

Complexidade: leitura linear nos bytes das fontes, mais ordenação de N classes
O(NlogN). Nenhum estado concorrente, query, N+1 ou domínio financeiro foi alterado.
O custo da solução é a sintaxe restrita e um job Windows; evita lista operacional
duplicada por OS. Não se exige portar a inspeção TCP para Linux para este contrato.

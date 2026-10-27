# Contratos da revalidação

Base07c3963, candidatoaa068d1, branch codex/preparacao-local-adocao.
Sem correção do candidato. Runtimes novos revalidacao-20261027-01 e seus subdiretórios.

O resultado esperado vem da política: falha pré-efeito nunca conclui, reutilização
exige candidato/observador/configuração, causalidade, integridade e restauração.
Interrupção da persistência deve preservar falha ou bloquear; não precisa recuperar
automaticamente corrupção ambígua. Nenhum arquivo/exit/flag isolado libera avanço.

Porta: o listener real deve reservar o endereço; serviço alheio200 não pode
certificar aplicação que não iniciou. Prova antiga deve falhar por colisão,
controle restaurado passar, recursos próprios terminar e terceiros sobreviver.
Executar três contratos afetados em PG17/JAR e imagem, regressão de porta em16/17,
e probes estreitos de identidade/ocupação/encerramento. Não repetir domínio inteiro.

Hipótese adicional de quiescência, delimitada **antes da execução**: após interromper
somente o Node dono, um wrapper cmd/PowerShell próprio ainda pode estar antes da
criação da JVM. O guard consulta Java e containers, mas não esse ancestral.
Fixture: ferramenta sintética aguardando evento, mesmos runner/checagem reais,
nenhum banco. Resultado seguro esperado: não restaurar/nova tentativa enquanto o
wrapper ainda puder iniciar trabalho. Resultado que confirma lacuna: tentativa0002
criada com wrapper0001 vivo; liberar seu evento inicia Java/efeito tardio após
a retomada. Teto20s por espera, helper30s, parada só dos PIDs criados. Isso trata
interrupção Windows deste runner, sem exigir cancelamento universal ou outro SO.

HQL: reconferir bytes, sequência, timestamps, pilhas e JFR já existentes. A hipótese
da porta será discriminada pelos casos determinísticos. Nenhuma repetição HQL
adicional se os dados não trouxerem hipótese nova: manter inconclusivo e especificar
próxima captura lenta. Gate40s inalterado; observação além dele é diagnóstica.

Preservar README,29 históricos,16 migrations, pacote/inputs antigos, provas e
falhas. Aceites anteriores só reabrem por impacto concreto. Nenhuma auditoria
remota ou ação de adoção/sucessora é autorizada pelo teste local.

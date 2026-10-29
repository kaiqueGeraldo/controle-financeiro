# Matriz da revalidação

Base434e293f..candidato 193916a1. Fotografia datada; tarefas canônicas mantêm os
estados integrais anteriores. Nenhum resultado antigo foi reescrito.

| Requisito | Prova independente | Decisão / limite |
|---|---|---|
| Alvo explícito sem fallback do host | Probes inválidos/ausentes; Linux real dentro de Docker, Windows real no estágio | Atendido linux/win32; aliases de runner não são aliases do seletor |
| Não depender só do nome conhecido | Fixtures OtherWindowsTest/DifferentLinuxTest | Atendido no contrato lexical restrito |
| Condição por classe, método e formas não suportadas | Diff da anotação, inventário atual e probes | Atendido para forma em uso; sem garantia de parser Java composto/herdado genérico |
| Preservar todas as identidades | Arrays anteriores à correção versus união atual; unicidade; mutanteDateUtil | Atendido101/116, Linux 100/115+Windows 1;15 históricos, sem falta/extra/duplicação |
| Windows obrigatório no fluxo previsto | YAML parseado, eventos/needs e estágioWindows real | Atendido estaticamente no caminho de execução; não Actions |
| Relatórios obrigatórios e zero skips |23 contratos + probes independentes + SurefireWindows + JUnitLinux | Atendido; falha/erro/skip/ausência/vazio/reuso rejeitados nos caminhos examinados |
| Antiga seleção realmente falha pelo defeito | Verificador original intacto em Windows e JVM Linux real com seleção antiga |1skip/rejeição; não erro de import/ambiente |
| Comuns corrigidos executam em Linux | DateUtilTest real3/3 e condiçãoWindows removida da seleção | Atendido dirigido; não100/115 classes executadas |
| Required não aprova Windows falho/skipped | Modelo local de needs + semântica oficial | **CPA-01/R1/P2 aberto**: required propaga skip; pacote bloqueado, contexto único pode ser insuficiente |
| Smoke não se confunde com expanded | Eventos/condição preservados;15 históricos presentes | Seleção preservada, execução ampliada pendente |
| Produto/pacote/aceites anteriores preservados |39 caminhos iniciais,42 referências anteriores,470 inputs,16 migrations eJAR | Atendido no escopo; sem novo pacote ou aceites remotos |

CPA-01/P2 permanece aberto **somente por R1**; o defeito original de seleção está
encerrado. Cobertura aceita, prontidão estática parcial e parecer C mantido.

Pendências independentes preservadas: zoom nativo 200%; CF034 integral/matriz/runner
remotos; configuração de hospedagem; CF017/P01/P02 e adoção real; produção.
Startup de 40s/HQL histórico, TCP/reuso, RVPLA/audit ePG16/17 não foram reabertos.

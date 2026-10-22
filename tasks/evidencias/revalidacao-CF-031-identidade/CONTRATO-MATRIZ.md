# Contrato de identidade e consumidores

SPEC-001 §4: Ref exige kind próprio de tipo admitido e exatamente um UUID próprio:
id persistido ou tempId da sessão. LINK/INITIALIZE requerem id; referências a posições
selecionadas podem usar tempId. Ambos próprios, mesmo um null, são inválidos, sem
precedência. Ausência, null, número e string não UUID são rejeitados na fronteira.
Herança não supre membro obrigatório nem substitui o membro próprio válido.
UUID temporário é único por sessão; persistidos duplicados são proibidos no mesmo
tipo (§4, DUPLICATE_REFERENCE). A chave kind+UUID não impõe unicidade global entre
ACCOUNT e INVESTMENT. Mapping contém tempId e id em papéis distintos e não é Ref.

ownReferenceIdentity resolve presença XOR e tipo string; não promete validar UUID
isoladamente. input.refRule e result.reference aplicam uuid à mesma escolha.
refKey exige kind próprio/identidade resolvida e usa essa identidade, eliminando
`id ?? tempId`. Retornar o objeto original deixa de causar a divergência porque
os consumidores afetados ignoram o membro herdado. Metadados próprios permitidos
na leitura são preservados; escrita continua com seu schema fechado.

| Caminho | Inspeção e prova |
|---|---|
| model.ts / result.ts, duplicatas | RefKey compartilhado em partes CONFIRMED, CANDIDATES, UNBOUNDED, fontes/cartões/metas e decisões. Dois probes originais passam;22 controles incluem fontes distintas com mesmo id herdado e mesmo UUID persistido em tipos diferentes. |
| input.ts, persistidas | RefRule exige own id quando persistent=true. Controle adicional rejeita tempId próprio+id herdado e aceita id próprio+tempId herdado; os dois próprios continuam inválidos. |
| result.ts, canonical | Recursão copia chaves próprias antes de ordenar. Nested source/ref usam resolvedor; acessos diretos a id/tempId nos demais ramos têm hasOwn. Vetores de hash e controle adicional de ordem em tipos persistidos distintos passam. |
| Fields.tsx | Seleção atual usa resolvedor; aliases/label persistido exigem own id. Controle independente dispara change no select e recebe exatamente kind/tempId próprio, sem id herdado. |
| Fields.tsx, metas LINK | availableRefs conserva rótulo da meta MONETARY persistida, exclui a opção persistida duplicada por alias e emite a referência temporária do item selecionado. Controle adicional passa com tempId herdado no vínculo persistido. |
| Review.tsx | RefKey para rótulos, decisões e keys. Own tempId explícito para anexar prazo/unidade da meta do draft; não toma prazo de outra meta via herança. Testes de rótulo e prazo nos22 passam. AnswerValue distingue referência/categoria por membros próprios. |
| Mapping e outros IDs planos | existingId em result.ts é lido com ownRecord(id), após parseInterview. IDs de mappings, SourceSnapshot e operações têm papéis/campos próprios obrigatórios, sem fallback; não se deve aplicar XOR de Ref a mapping. |

Busca dirigida nos serviços e telas onboarding não encontrou resolução paralela
id/tempId herdada remanescente nesses consumidores. Nenhum backend, flow, client,
hook, protocolo, soma ou representação monetária foi alterado. Sem novo efeito,
estado, consulta ou request. Não houve refatoração fora do escopo.

O resolvedor é O(1) em tempo/memória para DTOs ordinários. Consumidores percorrem
linhas/partes e usam Sets/Maps: identidade/deduplicação O(n+p), memória linear.
Ordenação canônica permanece O(n log n); seleção contém buscas preexistentes e
renderização tem custo proporcional ao conteúdo. Não extrapolar O(1) para o fluxo.
Não há novo N+1 ou caminho quadrático introduzido. Precisão/valores/vínculos próprios
não mudam. Trade-off: resolvedor comum evita clonar/normalizar toda resposta e
preserva metadados/hashes, mas exige seu uso consistente em futuros consumidores.

## Regressões e limites

Os160 incluem138 anteriores+22 do saneamento;149 excluem11 testes de tela, mas
incluem componentes hospedados no arquivo de serviço. Os nove probes são executados
diretamente da pasta anterior, sem cópia editada. Os sete probes mais antigos
incluem RC031-01 e os controles diagnósticos já aceitos. Os quatro novos exercitam
lacunas concretas: escrita persistida, evento change, alias monetário e objeto sem
protótipo/ordem entre tipos. JSON/__proto__ e duplicatas comuns continuam nos controles.

Não repetimos as12 jornadas reais por rotina. O diff não altera recuperação,
transporte, operação preparada, persistência ou efeito financeiro. Para JSON válido,
a identidade selecionada permanece a mesma; vetores de hash e testes de seleção,
apresentação, complete/GET inválidos e replay foram reexecutados. O teste novo do
implementador usa parser real com get em memória: rejeita duplicata antes de adotar
sucesso e recupera recibo válido sem prepare/complete. Não é HTTP/SQL.
Assim, a prova anterior12/12+SQL, recibo950 e efeito único é reutilizada explicitamente;
não se reivindica nova rodada real nem certificação visual/zoom nesta revalidação.
Não há evidência nova que justifique reabrir as três falhas amplas preexistentes.

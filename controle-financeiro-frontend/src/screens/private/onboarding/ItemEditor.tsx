"use client";
import { ownRecord } from "@/services/ownRecord";
import { setPath } from "@/services/onboarding/input";
import { newItem, type Item, type Json, type Obj, type SectionName } from "@/services/onboarding/model";
import { buttonClass, CompetenceField, FactField, Field, Grid, RefField, type FieldsProps } from "./Fields";
export type ConfirmChange = (message: string, action: () => void) => void;
type Props = FieldsProps & { name: SectionName; item: Item; path: string; onChange: (item: Item) => void; confirm: ConfirmChange };
const options = (pairs: string[][]) => pairs.map(([value, label]) => ({ value, label }));
export function ItemEditor({ name, item, path, onChange, confirm, ...props }: Props) {
  const set = (key: string, value: Json | undefined) => onChange({ ...setPath(item, key.split("/"), value), tempId: item.tempId });
  const field = (key: string, label: string, type: "text" | "money" | "quantity" | "date" | "number" | "checkbox" = "text", help?: string) => <Field label={label} path={path + "/" + key} value={item[key]} onChange={v => set(key, v)} issues={props.issues} type={type} help={help} />;
  const fact = (key: string, label: string, type: "money" | "quantity" | "date" | "text" = "money") => <FactField label={label} path={path + "/" + key} value={item[key]} onChange={v => set(key, v)} issues={props.issues} type={type} />;
  const select = (key: string, label: string, pairs: string[][], change?: (v: Json | undefined) => void) => <Field label={label} path={path + "/" + key} value={item[key]} onChange={change ?? (v => set(key, v))} issues={props.issues} options={options(pairs)} />;
  const kind = { accounts: "ACCOUNT", cards: "CARD", investments: "INVESTMENT", goals: "GOAL", allocations: "", forecasts: "" }[name];
  const changeAction = (v: Json | undefined) => { if (typeof v !== "string" || v === item.action) return; confirm("Trocar a forma de cadastro remove os campos deste item. As reservas que o referenciam continuarão disponíveis para correção.", () => {
    if (v === "CREATE") onChange({ ...newItem(name), tempId: item.tempId });
    else onChange({ tempId: item.tempId, action: v, ...(v === "INITIALIZE_DEFAULT" ? { deficitAcknowledged: false } : v === "INITIALIZE_EMPTY" ? { opening: { futureInstallments: [], creditNotNettedAcknowledged: false } } : {}) });
  }); };
  const action = kind && select("action", "Como incluir este registro", [["CREATE", "Cadastrar posição existente fora do app"], ["LINK", "Usar cadastro já existente no app"], ...(name === "accounts" ? [["INITIALIZE_DEFAULT", "Informar abertura da carteira automática"]] : name === "cards" ? [["INITIALIZE_EMPTY", "Informar abertura de cartão ainda não usado"]] : [])], changeAction);
  const existing = kind && item.action !== "CREATE" ? <RefField label="Cadastro existente" path={path + "/ref"} value={item.ref} onChange={v => set("ref", v)} {...props} kinds={[kind]} persistent /> : null;
  if (item.action === "LINK") return <div className="space-y-4">{action}{existing}<p className="text-sm text-text-muted">O vínculo conserva os valores existentes. Não reaplica abertura nem cria outro registro.</p></div>;
  if (name === "accounts") return <div className="space-y-4">{action}{existing}
    {item.action === "CREATE" && <Grid>{field("name", "Nome da conta")}{select("type", "Tipo da conta", [["CHECKING", "Conta corrente"], ["SAVINGS", "Poupança"], ["INVESTMENT", "Caixa de corretora"], ["CASH", "Dinheiro em espécie"]])}</Grid>}
    {fact("balance", "Saldo na data-base")}{field("deficitAcknowledged", "Estou ciente do saldo negativo, quando informado", "checkbox")}
    {item.action === "CREATE" && field("distinctCashConfirmed", "Se for dinheiro em espécie, confirmo que é distinto da carteira automática", "checkbox")}
    {item.action === "INITIALIZE_DEFAULT" && <p className="text-sm text-text-muted">Selecione a carteira automática. O servidor só permite abertura se sua identidade for comprovada e ela nunca tiver sido usada; nome ou saldo zero não provam isso.</p>}
  </div>;
  if (name === "cards") return <div className="space-y-4">{action}{existing}
    {item.action === "CREATE" && <><Grid>{field("name", "Nome do cartão")}{field("last4Digits", "Últimos quatro dígitos (opcional)")}{field("brand", "Bandeira (opcional)")}{fact("limit", "Limite do cartão")}{field("closingDay", "Dia de fechamento", "number")}{field("dueDay", "Dia de vencimento", "number")}</Grid></>}
    <CardOpening value={ownRecord(item.opening, ["futureInstallments"]) ? item.opening as Obj : { futureInstallments: [] }} path={path + "/opening"} onChange={v => set("opening", v)} confirm={confirm} {...props} />
  </div>;
  if (name === "investments") {
    const valuation = ownRecord(item.valuation, []) ? item.valuation as Obj : {};
    const valueMode = valuation.state === "UNKNOWN" ? "UNKNOWN" : valuation.basis;
    return <div className="space-y-4">{action}<Grid>{field("name", "Nome do investimento")}{select("type", "Tipo do investimento", [["FIXED_INCOME", "Renda fixa"], ["TREASURY", "Tesouro"], ["STOCK", "Ação"], ["FII", "Fundo imobiliário"], ["CRYPTO", "Criptoativo"], ["OTHER", "Outro"]])}{field("institution", "Instituição (opcional)")}{field("identifier", "Identificador ou ticker (opcional)")}</Grid>
      {select("positionMode", "Forma da posição", [["MONETARY", "Posição monetária sem unidades"], ["UNIT", "Quantidade de unidades"]], v => { if (v && v !== item.positionMode) confirm("Trocar a forma da posição remove quantidade e avaliação incompatíveis. Nenhuma unidade será inventada.", () => { const next: Item = { ...item, positionMode: v, ...(v === "MONETARY" ? { quantity: { state: "NOT_APPLICABLE" } } : {}) }; if (v === "UNIT") delete next.quantity; delete next.valuation; onChange(next); }); })}
      {item.positionMode === "UNIT" ? fact("quantity", "Quantidade", "quantity") : <p className="text-sm text-text-muted">Quantidade: não se aplica. Posição monetária é permitida para renda fixa, Tesouro ou outro.</p>}
      <Field label="Avaliação da posição" path={path + "/valuation"} value={valueMode} issues={props.issues} options={options([["UNKNOWN", "Não sei o valor atual"], ["TOTAL", "Informar valor total"], ...(item.positionMode === "UNIT" ? [["PRICE", "Informar preço por unidade"]] : [])])} onChange={v => set("valuation", v === "UNKNOWN" ? { state: "UNKNOWN" } : v ? { state: "KNOWN", basis: v, source: "USER_DECLARED" } : undefined)} />
      {valuation.state === "KNOWN" && <Grid><Field label={valuation.basis === "PRICE" ? "Preço por unidade" : "Valor total da posição"} path={path + "/valuation/" + (valuation.basis === "PRICE" ? "price" : "amount")} type={valuation.basis === "PRICE" ? "quantity" : "money"} value={valuation.basis === "PRICE" ? valuation.price : valuation.amount} issues={props.issues} onChange={v => set("valuation/" + (valuation.basis === "PRICE" ? "price" : "amount"), v)} /><Field label="Data da avaliação" type="date" path={path + "/valuation/date"} value={valuation.date} onChange={v => set("valuation/date", v)} issues={props.issues} /></Grid>}
      <Grid>{fact("cost", "Custo de aquisição")}{fact("acquisitionDate", "Data de aquisição", "date")}{fact("historicalSource", "Origem comprovada da aquisição", "text")}</Grid>
      <p className="text-sm text-text-muted">Avaliação declarada agora não comprova aquisição histórica. Custo desconhecido não é zero; não haverá compra, débito em conta ou rendimento fictício.</p>
    </div>;
  }
  if (name === "goals") return <div className="space-y-4">{action}<Grid>{field("title", "Nome da meta")}{select("type", "Tipo da meta", [["MONETARY", "Financeira: progresso por reservas"], ["NUMERIC", "Numérica: progresso em unidades"]], v => { if (v && v !== item.type) confirm("Trocar o tipo conserva título, alvo e prazo, e remove unidade/progresso incompatíveis. Reservas vinculadas não serão apagadas.", () => { const next: Item = { ...item, type: v }; delete next.unit; delete next.initialProgress; onChange(next); }); })}{field("target", "Alvo da meta", item.type === "NUMERIC" ? "quantity" : "money")}{field("deadline", "Prazo original", "date")}
    {item.type === "NUMERIC" && <>{field("unit", "Unidade da meta")}{field("initialProgress", "Progresso numérico inicial", "quantity")}</>}</Grid><p className="text-sm text-text-muted">O prazo original pode estar vencido. Uma meta financeira progride pelas fontes vinculadas na próxima etapa; não some o alvo ao patrimônio.</p></div>;
  if (name === "allocations") return <Grid><RefField label="Meta financeira" path={path + "/goal"} value={item.goal} onChange={v => set("goal", v)} {...props} kinds={["GOAL"]} monetaryOnly /><RefField label="Fonte da reserva" path={path + "/source"} value={item.source} onChange={v => set("source", v)} {...props} kinds={["ACCOUNT", "INVESTMENT"]} />{field("amount", "Valor final destinado", "money", "Não é acréscimo. Zero só libera um vínculo já existente. A revisão verifica capacidade e origem da fonte.")}</Grid>;
  const categories = props.choices.filter(c => c.kind === "CATEGORY" && (!item.direction || c.type === item.direction));
  return <div className="space-y-4"><Grid>{field("description", "Descrição da previsão")}{select("direction", "Direção", [["INCOME", "Receita"], ["EXPENSE", "Despesa"]])}{field("amount", "Valor previsto", "money")}{field("dueDate", "Vencimento previsto", "date")}
    <RefField label="Conta da previsão" path={path + "/account"} value={item.account} onChange={v => set("account", v)} {...props} kinds={["ACCOUNT"]} /><Field label="Categoria" path={path + "/category"} value={ownRecord(item.category, []) && typeof item.category.id === "string" ? item.category.id : undefined} issues={props.issues} options={categories.map(c => ({ value: c.id, label: c.label }))} onChange={v => set("category", v ? { id: v } : undefined)} />{field("recurrenceLabel", "Descrição da recorrência (opcional)")}</Grid>
    <p className="text-sm text-text-muted">Esta é uma ocorrência pendente, inclusive se vencida. Não será paga automaticamente nem gerará uma série de lançamentos.</p></div>;
}
function CardOpening({ value, onChange, path, confirm, ...props }: FieldsProps & { value: Obj; path: string; onChange: (v: Obj) => void; confirm: ConfirmChange }) {
  const set = (key: string, v: Json | undefined) => onChange(setPath(value, key.split("/"), v));
  const future = Array.isArray(value.futureInstallments) ? value.futureInstallments.filter((v): v is Obj => ownRecord(v, [])) : [];
  return <fieldset className="min-w-0 space-y-4 rounded-lg border border-border-divider p-3"><legend className="px-1 font-medium">Dívida na abertura</legend><Grid>
    <CompetenceField label="Competência da fatura corrente" path={path + "/currentCompetence"} value={value.currentCompetence} issues={props.issues} onChange={v => set("currentCompetence", v)} />
    <Field label="Restante a pagar da fatura corrente" path={path + "/currentOutstanding"} type="money" value={value.currentOutstanding} onChange={v => set("currentOutstanding", v)} issues={props.issues} help="Já inclui a parcela corrente e desconta os pagamentos anteriores." />
    <FactField label="Principal corrente" path={path + "/currentPrincipal"} value={value.currentPrincipal} onChange={v => set("currentPrincipal", v)} issues={props.issues} />
    <FactField label="Encargos correntes" path={path + "/currentCharges"} value={value.currentCharges} onChange={v => set("currentCharges", v)} issues={props.issues} />
    <Field label="Vencimento declarado do extrato (opcional)" path={path + "/dueDateOverride"} type="date" value={value.dueDateOverride} onChange={v => set("dueDateOverride", v)} issues={props.issues} />
    <Field label="Crédito não compensado" path={path + "/credit"} type="money" value={value.credit} onChange={v => set("credit", v)} issues={props.issues} />
  </Grid><Field label="Confirmo que o crédito informado não foi descontado do restante a pagar" path={path + "/creditNotNettedAcknowledged"} type="checkbox" value={value.creditNotNettedAcknowledged} onChange={v => set("creditNotNettedAcknowledged", v)} issues={props.issues} />
  <p className="text-sm text-text-muted">Principal e encargos devem ser ambos conhecidos e somar o total, ou ambos desconhecidos. Não repita a parcela corrente nas futuras. Crédito não aumenta limite.</p>
  {future.map((row, i) => <fieldset key={String(row.tempId)} className="min-w-0 space-y-3 rounded-lg border border-border-divider p-3"><legend>Parcela futura {i + 1}</legend><Grid>
    <CompetenceField label={`Competência futura ${i + 1}`} path={`${path}/futureInstallments/${i}/competence`} value={row.competence} issues={props.issues} onChange={v => { const next = [...future]; next[i] = setPath(row, ["competence"], v); onChange({ ...value, futureInstallments: next }); }} />
    {(["amount", "principal", "charges", "description", "dueDateOverride"] as const).map(key => {
      const common = { label: `${{ amount: "Valor", principal: "Principal", charges: "Encargos", description: "Descrição", dueDateOverride: "Vencimento declarado" }[key]} da futura ${i + 1}`, path: `${path}/futureInstallments/${i}/${key}`, value: row[key], issues: props.issues, onChange: (v: Json | undefined) => { const next = [...future]; next[i] = setPath(row, [key], v); onChange({ ...value, futureInstallments: next }); } };
      return key === "principal" || key === "charges" ? <FactField key={key} {...common} /> : <Field key={key} {...common} type={key === "amount" ? "money" : key === "dueDateOverride" ? "date" : "text"} />;
    })}</Grid><button type="button" className={buttonClass} onClick={() => confirm("Remover esta parcela futura do rascunho?", () => onChange({ ...value, futureInstallments: future.filter((_, index) => index !== i) }))}>Remover futura {i + 1}</button></fieldset>)}
  <button type="button" className={buttonClass} disabled={future.length >= 120} onClick={() => onChange({ ...value, futureInstallments: [...future, { tempId: crypto.randomUUID() }] })}>Adicionar parcela futura</button></fieldset>;
}

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { hash } from "/work/s/.github/scripts/source.mjs";
const root = "/work/s/controle-financeiro-frontend";
const names = ["tests/component/cards-invoices-planning.test.tsx", "src/screens/private/onboarding/screen.test.tsx"];
// Discover the cards filename from its committed title rather than assume its basename.
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
names[0] = path.relative(root, walk(path.join(root,"tests/component")).find(p => p.endsWith(".test.tsx") && fs.readFileSync(p,"utf8").includes('lista longa mantém a ação de pagamento fora da área rolável'))).split(path.sep).join("/");
const deltas = [];
const insert = (text, needle, replacement) => { assert.equal(text.split(needle).length,2,needle); return text.replace(needle,replacement); };
for (const name of names) {
  const file = path.join(root,name), raw = fs.readFileSync(file), original = raw.toString().replaceAll("\r\n","\n");
  let text = original;
  const mark = name => ' cfMark("' + name + '");';
  if (name === names[0]) {
    const title = 'test("lista longa mantém a ação de pagamento fora da área rolável", () => {';
    assert.ok(text.includes(title));
    const begin = text.indexOf(title), end = text.indexOf("\n  });",begin);
    assert.ok(end > begin);
    let body = text.slice(begin,end);
    body = insert(body,title,title + mark("body-entry"));
    body = insert(body,'    renderInvoice("CLOSED", transactions);',mark("fixture-complete") + '\n    renderInvoice("CLOSED", transactions);' + mark("render-complete"));
    body = insert(body,'    expect(paymentAction.parentElement?.className).toContain("shrink-0");',mark("query-complete") + '\n    expect(paymentAction.parentElement?.className).toContain("shrink-0");');
    body += mark("assertions-complete");
    text = text.slice(0,begin) + body + text.slice(end);
  } else {
    text = insert(text,'async function loaded() { render(<OnboardingScreen />); await screen.findByRole("heading", { name: "Etapa 1 de 8: Contexto" }); return userEvent.setup(); }',
      'async function loaded() {' + mark("render-start") + ' render(<OnboardingScreen />);' + mark("render-complete") + ' await screen.findByRole("heading", { name: "Etapa 1 de 8: Contexto" });' + mark("initial-heading-ready") + ' return userEvent.setup(); }');
    const title = 'it("compares conflict snapshots and does not silently choose the server", async () => {';
    const begin = text.indexOf(title), end = text.indexOf("\n});",begin);
    assert.ok(begin >= 0 && end > begin);
    let body = text.slice(begin,end);
    body = insert(body,title,title + mark("body-entry"));
    for (const [needle,stage] of [
      ['const user = await loaded();',"loaded-complete"],
      ['await user.type(screen.getByRole("textbox", { name: "Nome preferido (opcional)" }), "Resposta local");',"typing-complete"],
      ['await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));',"save-click-complete"],
      ['await user.click(screen.getByRole("button", { name: "Verificar salvamento" }));',"check-click-complete"],
      ['const compare = await screen.findByRole("region", { name: "Comparar rascunhos" });',"comparison-ready"],
      ['expect(onboardingClient.save).toHaveBeenCalledTimes(1);',"assertions-complete"]
    ]) body = insert(body,needle,needle+mark(stage));
    text = text.slice(0,begin)+body+text.slice(end);
  }
  // All inserted statements use one form, allowing exact inverse proof.
  const restored = text.replace(/ cfMark\("[a-z-]+"\);/g,"").replace(/\n(?=    renderInvoice|\s*expect\(paymentAction)/g,"\n");
  // Cards insertions above may add whitespace-only prefixes; compare tokens without whitespace outside literals.
  // Stronger proof: remove each addition using the recorded insertion delta via an explicit reverse transform below.
  const importLine = 'import { mark as cfMark } from "/work/obs/marks.mjs";\n';
  // Added standalone marker lines leave one extra newline each.
  let inverse = text.replace(/ cfMark\("[a-z-]+"\);/g,"");
  if (name === names[0]) inverse = inverse.replace(/\n\n    renderInvoice/,"\n    renderInvoice").replace(/\n\n    expect\(paymentAction/,"\n    expect(paymentAction");
  assert.equal(inverse,original,"Only synchronous observation statements may differ: "+name);
  text = importLine + text;
  fs.writeFileSync(file,text);
  deltas.push({path:"controle-financeiro-frontend/"+name,before:hash(raw),after:hash(Buffer.from(text)),inverseExactNormalizedEol:true,addedImport:importLine.trim(),observedText:text});
}
fs.writeFileSync("/evidence/instrumentation.json",JSON.stringify(deltas,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify(deltas.map(({observedText,...rest})=>rest)));

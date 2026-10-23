"""Read-only CF032 remediation audit: Decimal and stored OOXML, no product helpers.
Financial literals preserve the independent review's oracle. Canonical wall time
is required here; the original review's truncation-characterization file is intact.
"""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path

run, dest = map(Path, sys.argv[1:3])
def read(name):
    return json.loads((run / name).read_text(encoding="utf-8-sig"))
def money(value):
    return D(str(value))

checks = []
for prefix in ["B", "C"]:
    expected = [
        ("cash", D("1300") + D("250.10") - D("40.20") - D("2"), D("350"), D("501"), D("350")),
        ("purchase", D("1507.90"), D("350") + D("120"), D("501"), D("350")),
        ("payment", D("1507.90") - D("200"), D("470") - D("200"), D("501"), D("350")),
        ("final", D("1307.90") - D("21"), D("270"), D("500") + (D("1") / 3 * 5).quantize(D(".01"), rounding=ROUND_HALF_UP), D("450")),
    ]
    for name, accounts, debt, investments, reserved in expected:
        state = read(f"{prefix}-{name}-sql.json")
        actual = (
            sum(money(a["balance"]) for a in state["accounts"]),
            sum(money(a["amount"]) - money(a["paid_amount"]) - money(a["refunded_amount"]) for a in state["cardLines"]),
            sum(money(a["valuation_amount"]) for a in state["investments"]),
            sum(money(a["amount"]) for a in state["allocations"] if a["account_id"]),
        )
        assert actual == (accounts, debt, investments, reserved), (prefix, name, actual)
        checks.append(dict(checkpoint=f"{prefix}-{name}", accounts=str(accounts), debt=str(debt), investments=str(investments), reservedAccounts=str(reserved), netWorth=str(accounts + investments - debt), freeCash=str(accounts - reserved)))
    final = read(f"{prefix}-final-sql.json")
    stock = next(i for i in final["investments"] if i["position_mode"] == "UNIT")
    assert money(stock["total_cost"]) == D(".60") + 2 * D("10") + D("1")
    assert money(stock["quantity"]) == 5
    fixed = next(i for i in final["investments"] if i["position_mode"] == "MONETARY")
    assert fixed["total_cost"] is None and fixed["quantity"] is None
assert read("B-final-sql.json") == read("B-new-session-sql.json")

ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
books = []
for file in run.glob("*.xlsx"):
    with zipfile.ZipFile(file) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        xfs = ET.fromstring(archive.read("xl/styles.xml")).find("s:cellXfs", ns)
        sheets = []
        for part in archive.namelist():
            if not part.startswith("xl/worksheets/sheet") or not part.endswith(".xml"):
                continue
            cells = []
            for cell in ET.fromstring(archive.read(part)).findall(".//s:c", ns):
                raw, typ = cell.findtext("s:v", None, ns), cell.get("t", "n")
                value = strings[int(raw)] if typ == "s" else "".join(cell.find("s:is", ns).itertext()) if typ == "inlineStr" else raw
                style = cell.get("s", "0")
                cells.append(dict(cell=cell.get("r"), type=typ, value=value, style=style, numFmtId=xfs[int(style)].get("numFmtId"), xml=ET.tostring(cell, encoding="unicode")))
            sheets.append(dict(part=part, cells=cells))
        books.append(dict(file=file.name, sha256=hashlib.sha256(file.read_bytes()).hexdigest(), sheets=sheets))

def at_description(book, description, column):
    cells = book["sheets"][0]["cells"]
    match = next(c for c in cells if c["value"] == description)
    row = "".join(c for c in match["cell"] if c.isdigit())
    return next(c for c in cells if c["cell"] == column + row)

october = next(b for b in books if b["file"] == "C-october.xlsx")
time = at_description(october, "CF032 receita", "B")
assert time["value"] == "12:34:56" and time["type"] in ("s", "inlineStr")
sql_time = next(t["time"] for t in read("C-final-sql.json")["transactions"] if t["description"] == "CF032 receita")
assert sql_time == "12:34:56"
report = dict(income=str(D("250.10")), consumption=str(D("40.20") + D("2") + D("120")), result=str(D("250.10") - D("40.20") - D("2") - D("120")), cash=str(D("250.10") - D("40.20") - D("2") - D("200") - D("21")))
for value in [report["income"], report["consumption"], report["result"]]:
    assert any(c["value"] == value for c in october["sheets"][0]["cells"])

borders = []
if any(b["file"] == "S4-time.xlsx" for b in books):
    book = next(b for b in books if b["file"] == "S4-time.xlsx")
    state = read("S4-time-sql.json")
    for description, expected in [("S4 exact seconds", "12:34:56"), ("S4 zero seconds", "12:34:00"), ("S4 missing time", None)]:
        cell = at_description(book, description, "B")
        sql_value = next(t["time"] for t in state["transactions"] if t["description"] == description)
        assert sql_value == expected
        assert cell["value"] == (expected if expected is not None else "—")
        assert cell["type"] in ("s", "inlineStr") and cell["numFmtId"] == "0"
        assert at_description(book, description, "A")["value"] == "22/10/2026"
        borders.append(dict(description=description, database=sql_value, cell=cell))

result = dict(run=str(run), checkpoints=checks, report=report, time=dict(database=sql_time, cell=time, precisionPreserved=True), borders=borders, workbooks=books)
dest.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(dict(checkpoints=len(checks), workbooks=len(books), temporalBorders=len(borders), precisionPreserved=True, report=report)))

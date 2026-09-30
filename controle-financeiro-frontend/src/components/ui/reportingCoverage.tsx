import { PrivacyBlur } from "./privacyBlur";
import { formatCalendarDate } from "@/utils/date";
import type { ReportingCoverage } from "@/types";

export function formatObservedMoney(value: string) {
  const [integer, fraction = ""] = value.split(".");
  return `R$ ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction.padEnd(2, "0")}`;
}

export function ReportingCoverageNotice({coverage, observed}: {
  coverage?: ReportingCoverage;
  observed?: Record<string, string | null | undefined>;
}) {
  if (!coverage) return null;
  return <div className="mt-3 space-y-2 text-xs text-text-muted [overflow-wrap:anywhere]" role="status">
    <p><b>{coverage.state === "COMPLETE" ? "Cobertura completa" : "Total do período indisponível"}</b>: {coverage.reason}</p>
    <p>Base conhecida: {coverage.knownFrom?formatCalendarDate(coverage.knownFrom):"Indisponível"}. Referência: {formatCalendarDate(coverage.knownThrough)}.</p>
    {coverage.state !== "COMPLETE" && observed && <div className="space-y-1">
      <p>Subtotais observados nos registros (não representam o total completo):</p>
      {Object.entries(observed).map(([label, value]) => <p key={label}>{label}: <PrivacyBlur>{value == null ? "Indisponível" : formatObservedMoney(value)}</PrivacyBlur></p>)}
    </div>}
  </div>;
}

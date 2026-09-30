import { ReportingCoverageNotice } from "@/components/ui/reportingCoverage";
import { useDashboard } from "@/hooks/useDashboard";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/utils/format";
import { Loader2 } from "lucide-react";
import { DataLoadError } from "./dataLoadError";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const compactAmount = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function WealthChart() {
  const { user } = useUser();
  const { chartData, fetchChartData, isChartLoading, chartError } = useDashboard();
  const [period, setPeriod] = useState<"30D" | "6M" | "1Y">("6M");

  useEffect(() => {
    fetchChartData(period);
  }, [period, fetchChartData]);

  return (
    <div className="lg:col-span-2 bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm min-h-87.5 flex flex-col transition-colors">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          Fluxo de caixa acumulado no período
        </h3>
        
        <div className="flex bg-bg-base p-1 rounded-xl border border-border-divider transition-colors shrink-0">
          {(["30D", "6M", "1Y"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 md:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                period === p ? "bg-bg-surface text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
              }`}
            >
              {p === "30D" ? "30 Dias" : p === "6M" ? "6 Meses" : "1 Ano"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-text-muted">Movimentos de contas desde o início do intervalo; abertura e posição patrimonial não incluídas.</p>

      <div className="w-full h-62.5 md:h-75 mt-2 relative">
        {chartError ? (
          <DataLoadError
            onRetry={() => fetchChartData(period, true)}
            isRetrying={isChartLoading}
          />
        ) : isChartLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/50 backdrop-blur-sm z-10 rounded-xl">
             <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : null}

        {chartData.length>0 && chartData.every(p=>p.valor===null) ? <ReportingCoverageNotice coverage={chartData.at(-1)?.coverage} observed={{"Fluxo registrado":chartData.at(-1)?.observedValue}}/> : <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" vertical={false} />
            
            <XAxis dataKey="label" stroke="var(--text-muted)" tickLine={false} axisLine={false} tickMargin={10} style={{ fontSize: '10px' }} />
            
            <YAxis 
                stroke="var(--text-muted)" 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => user?.privacyMode ? '***' : `R$${compactAmount.format(value)}`}
                style={{ fontSize: '10px' }} 
                width={64}
            />
            
            <Tooltip
              contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-divider)", borderRadius: "8px", color: "var(--text-main)", fontSize: '12px' }}
              itemStyle={{ color: "#10b981", fontWeight: 'bold' }}
              formatter={(value: unknown) => [user?.privacyMode ? 'R$ ***' : formatCurrency(Number(value)), "Fluxo de caixa"]}
            />
            
            <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
          </AreaChart>
        </ResponsiveContainer>}
      </div>
    </div>
  );
}

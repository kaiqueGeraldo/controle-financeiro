import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/format";
import { useUser } from "@/hooks/useUser";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2 } from "lucide-react";

export function WealthChart() {
  const { user } = useUser();
  const { chartData, fetchChartData, isChartLoading } = useDashboard();
  const [period, setPeriod] = useState<"30D" | "6M" | "1Y">("6M");

  useEffect(() => {
    fetchChartData(period);
  }, [period, fetchChartData]);

  return (
    <div className="lg:col-span-2 bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm min-h-87.5 flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          Evolução Patrimonial
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

      <div className="w-full h-62.5 md:h-75 mt-2 relative">
        {isChartLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/50 backdrop-blur-sm z-10 rounded-xl">
             <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
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
                tickFormatter={(value) => user?.privacyMode ? '***' : `R$${value >= 1000 ? value / 1000 + 'k' : value}`} 
                style={{ fontSize: '10px' }} 
                width={50}
            />
            
            <Tooltip
              contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-divider)", borderRadius: "8px", color: "var(--text-main)", fontSize: '12px' }}
              itemStyle={{ color: "#10b981", fontWeight: 'bold' }}
              formatter={(value: any) => [user?.privacyMode ? 'R$ ***' : formatCurrency(Number(value)), "Patrimônio"]}
            />
            
            <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
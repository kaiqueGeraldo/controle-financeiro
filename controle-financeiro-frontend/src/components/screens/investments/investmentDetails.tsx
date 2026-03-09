import { Investment, InvestTransaction } from "@/types";
import { formatCurrency } from "@/utils/format";
import { AnimatePresence, motion } from "framer-motion";
import { History, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import React from "react";
import { BadgeTipo, getAssetColor, getAssetIcon } from "./investmentItem";

interface InvestmentDetailsProps {
  isOpen: boolean;
  asset: Investment | undefined;
  history: InvestTransaction[];
  isHistoryLoading: boolean;
  onClose: () => void;
  onOperation: (asset: Investment) => void;
  onDeleteAsset: (id: string) => void;
  onDeleteHistory: (id: string) => void;
}

export function InvestmentDetails({
  isOpen,
  asset,
  history,
  isHistoryLoading,
  onClose,
  onOperation,
  onDeleteAsset,
  onDeleteHistory,
}: InvestmentDetailsProps) {
  if (!asset) return null;

  const saldoAtual = asset.quantity * asset.currentPrice;
  const custoTotal = asset.quantity * asset.averagePrice;
  const variacao = custoTotal > 0 ? saldoAtual - custoTotal : 0;
  const variacaoPerc = custoTotal > 0 ? (variacao / custoTotal) * 100 : 0;
  const isPositivo = variacao >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (Fade) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Card Modal (Shared Element) */}
          <motion.div
            layoutId={`card-ativo-${asset.id}`}
            className="w-full max-w-lg bg-bg-surface border border-border-divider rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col z-10"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button
                onClick={() => onDeleteAsset(asset.id)}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-full text-rose-500 transition cursor-pointer"
                title="Excluir Ativo"
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-text-main transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Header */}
            <div className="p-8 pb-6 border-b border-border-divider bg-bg-surface z-10">
              <div className="flex gap-5 mb-8">
                <motion.div
                  layoutId={`icon-${asset.id}`}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getAssetColor(asset.type)}`}
                >
                  {React.cloneElement(
                    getAssetIcon(asset.type) as React.ReactElement<any>,
                    { size: 32 },
                  )}
                </motion.div>
                <div>
                  <BadgeTipo tipo={asset.type} />
                  <motion.h3
                    layoutId={`ticker-${asset.id}`}
                    className="text-3xl font-bold text-text-main leading-tight mt-1"
                  >
                    {asset.ticker}
                  </motion.h3>
                  <p className="text-text-muted text-sm">{asset.name}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50">
                  <p className="text-text-muted text-[10px] uppercase font-bold">
                    Saldo Atual
                  </p>
                  <p className="text-xl font-bold text-text-main">
                    {formatCurrency(saldoAtual)}
                  </p>
                </div>

                {asset.type === "FIXED_INCOME" ? (
                  <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50">
                    <p className="text-text-muted text-[10px] uppercase font-bold">
                      Valor Aplicado
                    </p>
                    <p className="text-lg font-medium text-text-main">
                      {formatCurrency(custoTotal)}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`bg-bg-base/50 p-3 rounded-xl border ${isPositivo ? "border-emerald-500/20" : "border-rose-500/20"}`}
                  >
                    <p className="text-text-muted text-[10px] uppercase font-bold">
                      Rentabilidade
                    </p>
                    <p
                      className={`text-xl font-bold ${isPositivo ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {isPositivo ? "+" : ""}
                      {variacaoPerc.toFixed(2)}%
                    </p>
                  </div>
                )}

                {asset.type !== "FIXED_INCOME" && (
                  <>
                    <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50">
                      <p className="text-text-muted text-[10px] uppercase font-bold">
                        Preço Médio
                      </p>
                      <p className="text-text-main font-medium">
                        {formatCurrency(asset.averagePrice)}
                      </p>
                    </div>
                    <div className="bg-bg-base/50 p-3 rounded-xl border border-border-divider/50">
                      <p className="text-text-muted text-[10px] uppercase font-bold">
                        Cotação Atual
                      </p>
                      <p className="text-text-main font-medium">
                        {formatCurrency(asset.currentPrice)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {asset.type === "FIXED_INCOME" ? (
                  <button
                    onClick={() => onOperation(asset)}
                    className="flex-1 flex items-center justify-center gap-2 bg-bg-surface-hover hover:bg-bg-button-hover text-text-main py-3 rounded-xl font-bold text-sm transition cursor-pointer"
                  >
                    <RefreshCw size={16} /> Atualizar Saldo
                  </button>
                ) : (
                  <button
                    onClick={() => onOperation(asset)}
                    className="flex-1 flex items-center justify-center gap-2 bg-bg-surface-hover hover:bg-zinc-700 text-text-main py-3 rounded-xl font-bold text-sm transition cursor-pointer"
                  >
                    Vender / Resgatar
                  </button>
                )}

                <button
                  onClick={() => onOperation(asset)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition cursor-pointer"
                >
                  <Plus size={18} /> Aportar
                </button>
              </div>
            </div>

            {/* Histórico Scrollable */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-base p-6 flex-1 overflow-y-auto custom-scroll"
            >
              <div className="flex items-center gap-2 mb-4 text-text-muted">
                <History size={14} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Histórico de Movimentações
                </h4>
              </div>

              <div className="space-y-3">
                {isHistoryLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-emerald-500" />
                  </div>
                ) : history.length > 0 ? (
                  history.map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex justify-between items-center p-3 rounded-xl bg-bg-surface/50 border border-border-divider hover:bg-bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border
                                    ${
                                      transacao.type === "BUY"
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : transacao.type === "SELL"
                                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    }`}
                        >
                          {transacao.type === "BUY"
                            ? "C"
                            : transacao.type === "SELL"
                              ? "V"
                              : transacao.type === "INTEREST"
                                ? "R"
                                : "D"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-main capitalize leading-none mb-1">
                            {transacao.type === "INTEREST"
                              ? "Rendimento"
                              : transacao.type === "BUY"
                                ? "Compra"
                                : transacao.type === "SELL"
                                  ? "Venda"
                                  : "Dividendo"}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {new Date(transacao.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p
                            className={`text-sm font-bold ${transacao.type === "BUY" ? "text-text-main" : "text-emerald-400"}`}
                          >
                            {formatCurrency(transacao.totalValue)}
                          </p>
                          {transacao.type !== "INTEREST" && (
                            <p className="text-[10px] text-text-muted">
                              {transacao.quantity} un. @{" "}
                              {formatCurrency(transacao.price)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteHistory(transacao.id)}
                          className="text-text-muted hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition cursor-pointer"
                          title="Excluir Movimentação"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-text-muted text-xs py-4">
                    Nenhum registro encontrado.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

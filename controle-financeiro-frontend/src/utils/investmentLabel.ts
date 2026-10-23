/** Presentation only. Operational identity remains the investment UUID. */
export function investmentLabel(asset: { ticker?: string | null; name?: string | null }): string {
  return asset.ticker?.trim() || asset.name?.trim() || "Investimento sem identificação";
}

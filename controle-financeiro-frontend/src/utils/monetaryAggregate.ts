/** API amounts have at most two decimals. Sum cents exactly before applying the product range. */
export function monetaryAggregate(values: number[]): number | null {
  let cents=BigInt(0);
  for(const value of values) {
    if(!Number.isFinite(value)||Math.abs(value)>999999999999.99)return null;
    const decimal=value.toFixed(2);
    if(Number(decimal)!==value)return null;
    const [integer,fraction]=decimal.split(".");
    cents+=BigInt(integer)*BigInt(100)+(value<0?BigInt(-1):BigInt(1))*BigInt(fraction);
  }
  if(cents>BigInt("99999999999999")||cents< -BigInt("99999999999999"))return null;
  return Number(cents)/100;
}

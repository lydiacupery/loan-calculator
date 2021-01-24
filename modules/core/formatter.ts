export const formatUSD: (value: number) => string = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format;

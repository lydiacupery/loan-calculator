export const formatUSD: (value: number) => string = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format;

export const formatPercentage: (value: number) => string = value =>
  Number(value).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
  });

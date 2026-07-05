export const formatCurrency = (val: number | null | undefined, decimals = 2) => {
  if (val == null) return "—";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
};

export const formatNumber = (val: number | null | undefined, decimals = 2) => {
  if (val == null) return "—";
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
};

export const formatPercent = (val: number | null | undefined, decimals = 2) => {
  if (val == null) return "—";
  return `${val >= 0 ? '+' : ''}${formatNumber(val, decimals)}%`;
};

export const formatCompactNumber = (val: number | null | undefined) => {
  if (val == null) return "—";
  return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val);
};

export const getColorClass = (val: number | null | undefined) => {
  if (val == null || val === 0) return "text-muted-foreground";
  return val > 0 ? "text-up" : "text-down";
};

export const getBgColorClass = (val: number | null | undefined) => {
  if (val == null || val === 0) return "bg-muted text-muted-foreground";
  return val > 0 ? "bg-up-muted" : "bg-down-muted";
};

import { useGetQuotes } from "@workspace/api-client-react";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/formatters";

const TOP_SYMBOLS = "AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,BRK-A,LLY,JPM,V,UNH,XOM,JNJ,WMT";

export function TickerTape() {
  const { data, isLoading } = useGetQuotes(
    { symbols: TOP_SYMBOLS },
    { query: { refetchInterval: 15000, enabled: true, queryKey: ["ticker-quotes"] } }
  );

  return (
    <div className="h-10 border-b bg-card flex items-center overflow-hidden whitespace-nowrap text-xs font-mono">
      <div className="flex animate-marquee min-w-full">
        {isLoading ? (
          <div className="px-4 text-muted-foreground">Loading live quotes...</div>
        ) : (
          data?.quotes?.map((q, i) => (
            <div key={`${q.symbol}-${i}`} className="flex items-center space-x-2 px-4 border-r border-border">
              <span className="font-bold text-white">{q.symbol}</span>
              <span>{formatCurrency(q.price)}</span>
              <span className={getColorClass(q.changePct)}>
                {formatPercent(q.changePct)}
              </span>
            </div>
          ))
        )}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

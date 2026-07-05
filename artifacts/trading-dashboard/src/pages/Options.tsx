import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetOptionsChain } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Activity } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";

export default function Options() {
  const [symbolInput, setSymbolInput] = useState("SPY");
  const [symbol, setSymbol] = useState("SPY");

  const { data: chain, isLoading } = useGetOptionsChain(symbol, undefined, { query: { enabled: !!symbol, queryKey: ["options-chain", symbol] } });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) setSymbol(symbolInput.trim().toUpperCase());
  };

  const calls = chain?.calls || [];
  const puts = chain?.puts || [];
  
  // Try to pair calls and puts by strike
  const strikes = Array.from(new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])).sort((a, b) => (a || 0) - (b || 0));

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Options Chain</h1>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                placeholder="Symbol (e.g. TSLA)"
                className="pl-9 font-mono uppercase bg-background border-border focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" variant="secondary">Load Chain</Button>
          </form>
        </div>

        {/* Info Strip */}
        {chain && (
          <div className="px-4 py-2 border-b border-border bg-muted/20 flex flex-wrap items-center gap-6 text-sm">
            <div className="font-bold text-white">{chain.symbol}</div>
            <div className="font-mono text-muted-foreground">Underlying: <span className="text-white font-bold">{formatCurrency(chain.underlyingPrice)}</span></div>
            {chain.expirationDates && chain.expirationDates.length > 0 && (
              <div className="font-mono text-muted-foreground">Exp: <span className="text-primary">{chain.expirationDates[0]}</span></div>
            )}
          </div>
        )}

        {/* Chain Table */}
        <div className="flex-1 overflow-auto bg-background p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm animate-pulse">Loading Options Chain...</div>
          ) : strikes.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_1fr] bg-card text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div className="p-2 border-b border-r border-border text-center bg-primary/5 text-primary/80">Calls</div>
                <div className="p-2 border-b border-border w-24 text-center">Strike</div>
                <div className="p-2 border-b border-l border-border text-center bg-destructive/5 text-destructive/80">Puts</div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase">
                {/* Calls Header */}
                <div className="grid grid-cols-5 p-2 border-b border-r border-border text-right">
                  <div>Bid</div><div>Ask</div><div>Vol</div><div>OI</div><div>IV</div>
                </div>
                <div className="p-2 border-b border-border w-24"></div>
                {/* Puts Header */}
                <div className="grid grid-cols-5 p-2 border-b border-l border-border text-right">
                  <div>Bid</div><div>Ask</div><div>Vol</div><div>OI</div><div>IV</div>
                </div>
              </div>
              
              <div className="divide-y divide-border/50 font-mono text-xs">
                {strikes.map(strike => {
                  if (strike == null) return null;
                  const call = calls.find(c => c.strike === strike);
                  const put = puts.find(p => p.strike === strike);
                  
                  return (
                    <div key={strike} className="grid grid-cols-[1fr_auto_1fr] hover:bg-muted/50 transition-colors">
                      {/* Calls */}
                      <div className={`grid grid-cols-5 p-2 border-r border-border text-right ${call?.inTheMoney ? 'bg-primary/10' : ''}`}>
                        <div>{formatNumber(call?.bid)}</div>
                        <div>{formatNumber(call?.ask)}</div>
                        <div className="text-muted-foreground">{call?.volume || 0}</div>
                        <div className="text-muted-foreground">{call?.openInterest || 0}</div>
                        <div className="text-primary/70">{formatPercent((call?.impliedVol || 0) * 100, 1)}</div>
                      </div>
                      
                      {/* Strike */}
                      <div className="p-2 w-24 flex items-center justify-center font-bold text-white bg-card border-x border-border/50">
                        {formatNumber(strike)}
                      </div>
                      
                      {/* Puts */}
                      <div className={`grid grid-cols-5 p-2 border-l border-border text-right ${put?.inTheMoney ? 'bg-destructive/10' : ''}`}>
                        <div>{formatNumber(put?.bid)}</div>
                        <div>{formatNumber(put?.ask)}</div>
                        <div className="text-muted-foreground">{put?.volume || 0}</div>
                        <div className="text-muted-foreground">{put?.openInterest || 0}</div>
                        <div className="text-destructive/70">{formatPercent((put?.impliedVol || 0) * 100, 1)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">Search a valid symbol to view options chain.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

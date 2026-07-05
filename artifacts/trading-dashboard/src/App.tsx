import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { SidekickProvider } from "@/context/SidekickContext";
import { SidekickKeyboardShortcut } from "@/components/SidekickKeyboardShortcut";
import { SidekickPanel } from "@/components/SidekickPanel";
import NotFound from "@/pages/not-found";

import Overview from "@/pages/Overview";
import Market from "@/pages/Market";
import ETFScreener from "@/pages/ETFScreener";
import StockScreener from "@/pages/StockScreener";
import Crypto from "@/pages/Crypto";
import Forex from "@/pages/Forex";
import Macro from "@/pages/Macro";
import News from "@/pages/News";
import Options from "@/pages/Options";
import Finance from "@/pages/Finance";
import Watchlist from "@/pages/Watchlist";
import Heatmap from "@/pages/Heatmap";
import EconomicCalendar from "@/pages/EconomicCalendar";
import Futures from "@/pages/Futures";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/market" component={Market} />
      <Route path="/etf" component={ETFScreener} />
      <Route path="/stock-screener" component={StockScreener} />
      <Route path="/crypto" component={Crypto} />
      <Route path="/forex" component={Forex} />
      <Route path="/macro" component={Macro} />
      <Route path="/news" component={News} />
      <Route path="/options" component={Options} />
      <Route path="/finance" component={Finance} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/heatmap" component={Heatmap} />
      <Route path="/calendar" component={EconomicCalendar} />
      <Route path="/futures" component={Futures} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WatchlistProvider>
          <SidekickProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <SidekickKeyboardShortcut />
              <Router />
            </WouterRouter>
            <SidekickPanel />
            <Toaster />
          </SidekickProvider>
        </WatchlistProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

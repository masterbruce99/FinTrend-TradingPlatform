import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetNews, useGetFaangNews } from "@workspace/api-client-react";
import { Newspaper, Clock, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function News() {
  const [activeTab, setActiveTab] = useState("market");
  
  const { data: marketNews, isLoading: marketLoading } = useGetNews({ count: 50 }, { query: { queryKey: ["news-market"] } });
  const { data: faangNews, isLoading: faangLoading } = useGetFaangNews({ query: { queryKey: ["news-faang"] } });

  const newsItems = activeTab === "market" ? marketNews?.news : faangNews?.news;
  const isLoading = activeTab === "market" ? marketLoading : faangLoading;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background">
        <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Market News</h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="market" className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General Market</TabsTrigger>
              <TabsTrigger value="faang" className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">FAANG / Tech</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto p-4 max-w-5xl mx-auto w-full">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-mono">Fetching latest news...</div>
          ) : newsItems && newsItems.length > 0 ? (
            <div className="grid gap-4">
              {newsItems.map(item => (
                <a 
                  key={item.id} 
                  href={item.url || "#"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors flex gap-4 group"
                >
                  {item.thumbnail && (
                    <div className="hidden sm:block flex-shrink-0 w-32 h-32 rounded bg-muted overflow-hidden border border-border">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {item.publisher}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Recent"}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                      {item.headline}
                    </h2>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.summary}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {item.symbols?.map(sym => (
                          <span key={sym} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-muted text-white rounded border border-border">
                            {sym}
                          </span>
                        ))}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">No news available at the moment.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

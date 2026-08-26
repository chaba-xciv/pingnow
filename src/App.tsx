import React, { useState, useEffect } from 'react';
import { Moon, Sun, Play, Loader2, CheckCircle2, XCircle, Globe, History, Trash2, ChevronRight, Terminal } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { ServerGraph } from '@/src/components/ServerGraph';
import { SERVERS, pingEndpoint, delay, calculateDistance } from '@/src/utils/ping';
import { translations, type Language } from '@/src/i18n';
import type { PingResult, TestHistory, NetworkIntel } from '@/src/types';
import { format } from 'date-fns';

export default function App() {
  const [lang, setLang] = useState<Language>('th');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isTesting, setIsTesting] = useState(false);
  const [activeServerIndex, setActiveServerIndex] = useState<number>(-1);
  const [currentResults, setCurrentResults] = useState<PingResult[]>([]);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [liveLatencies, setLiveLatencies] = useState<{ ping: number; latency: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [networkIntel, setNetworkIntel] = useState<NetworkIntel | null>(null);
  const [sortedServers, setSortedServers] = useState([...SERVERS]);

  const t = translations[lang];

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        
        let connectionType = 'UNKNOWN';
        // @ts-ignore
        if (navigator.connection && navigator.connection.effectiveType) {
          // @ts-ignore
          connectionType = navigator.connection.effectiveType.toUpperCase();
        }

        const intel: NetworkIntel = {
          ip: data.ip || 'UNKNOWN',
          isp: data.org || 'UNKNOWN',
          city: data.city || 'UNKNOWN',
          country: data.country_name || 'UNKNOWN',
          lat: data.latitude || 0,
          lon: data.longitude || 0,
          connectionType,
        };
        
        setNetworkIntel(intel);

        if (intel.lat && intel.lon) {
          const sorted = [...SERVERS].map(s => {
            if (s.anycast) return { ...s, distance: 0 };
            return { ...s, distance: calculateDistance(intel.lat, intel.lon, s.lat, s.lon) };
          }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
          setSortedServers(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch network intel', err);
      }
    };
    fetchIntel();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    const savedLang = localStorage.getItem('lang') as Language | null;
    if (savedLang) setLang(savedLang);
    const savedHistory = localStorage.getItem('pingHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }

    // Initialize empty results based on sortedServers
    setCurrentResults(sortedServers.map(s => ({
      serverName: s.name,
      provider: s.provider,
      region: s.region,
      countryCode: s.countryCode,
      endpoint: s.endpoint,
      latencies: [],
      averagePing: 0,
      jitter: 0,
      packetLoss: 0,
      status: 'idle',
      distance: (s as any).distance,
    })));
  }, [sortedServers]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'th' : 'en');

  const startTest = async () => {
    setShowHistory(false);
    setIsTesting(true);
    setActiveServerIndex(0);
    
    const results = sortedServers.map(s => ({
      serverName: s.name,
      provider: s.provider,
      region: s.region,
      countryCode: s.countryCode,
      endpoint: s.endpoint,
      latencies: [],
      averagePing: 0,
      jitter: 0,
      packetLoss: 0,
      status: 'idle' as const,
      distance: (s as any).distance,
    }));
    setCurrentResults(results);
    
    let finalResults = [...results];

    for (let i = 0; i < sortedServers.length; i++) {
      setActiveServerIndex(i);
      const server = sortedServers[i];
      
      setCurrentResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'testing' } : r));
      setLiveLatencies([]);
      
      const latencies: number[] = [];
      let lost = 0;
      const PINGS_PER_SERVER = 10; // 10 pings per server
      
      for (let p = 0; p < PINGS_PER_SERVER; p++) {
        try {
          const latency = await pingEndpoint(server.endpoint);
          latencies.push(latency);
          setLiveLatencies(prev => {
            const next = [...prev, { ping: p + 1, latency }];
            // Keep graph looking continuous if we want, or just grow
            return next;
          });
        } catch (e) {
          lost++;
          setLiveLatencies(prev => [...prev, { ping: p + 1, latency: 0 }]);
        }
        await delay(200);
      }
      
      const packetLoss = (lost / PINGS_PER_SERVER) * 100;
      const validLatencies = latencies.filter(l => l > 0);
      const averagePing = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
      
      let jitterSum = 0;
      for (let j = 1; j < validLatencies.length; j++) {
        jitterSum += Math.abs(validLatencies[j] - validLatencies[j - 1]);
      }
      const jitter = validLatencies.length > 1 ? Math.round(jitterSum / (validLatencies.length - 1)) : 0;

      const updatedResult = {
        ...finalResults[i],
        latencies,
        averagePing,
        jitter,
        packetLoss,
        status: lost === PINGS_PER_SERVER ? 'failed' as const : 'completed' as const,
      };
      finalResults[i] = updatedResult;

      setCurrentResults([...finalResults]);
      await delay(500);
    }
    
    setIsTesting(false);
    setActiveServerIndex(-1);
    
    // Save history
    const newHistoryEntry: TestHistory = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      results: finalResults,
    };
    
    setHistory(prev => {
      const updated = [newHistoryEntry, ...prev].slice(0, 10);
      localStorage.setItem('pingHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pingHistory');
  };

  const calculateOverallStats = (results: PingResult[]) => {
    const completed = results.filter(r => r.status === 'completed');
    if (completed.length === 0) return { avgPing: 0, totalLoss: 0 };
    
    const avgPing = Math.round(completed.reduce((sum, r) => sum + r.averagePing, 0) / completed.length);
    const totalLoss = Math.round(results.reduce((sum, r) => sum + r.packetLoss, 0) / results.length);
    return { avgPing, totalLoss };
  };

  const overallStats = calculateOverallStats(currentResults);
  const isComplete = currentResults.length > 0 && currentResults.every(r => r.status === 'completed' || r.status === 'failed');

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black font-mono transition-colors duration-200 dark:bg-gray-900 dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="mx-auto max-w-5xl p-2 sm:p-4">
        {/* Header */}
        <header className="mb-4 flex flex-col gap-2 border-2 border-black bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center bg-black dark:bg-white">
              <div className="h-3 w-3 bg-white dark:bg-black"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tighter uppercase leading-none">{t.title}</h1>
              <p className="text-[9px] font-bold uppercase opacity-50 mt-1">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="mr-1" size={14} />
              <span className="hidden sm:inline-block">{t.history}</span>
            </Button>
            <div className="flex border-2 border-black dark:border-white">
              <button className={cn("px-2 py-1 text-[10px] font-bold transition-colors uppercase", lang === 'en' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-800")} onClick={() => setLang('en')}>EN</button>
              <button className={cn("border-l-2 border-black px-2 py-1 text-[10px] font-bold transition-colors uppercase dark:border-white", lang === 'th' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-800")} onClick={() => setLang('th')}>TH</button>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme} title="Toggle Theme" className="bg-[#F0F0F0] dark:bg-gray-800">
              <span className="hidden sm:inline-block mr-1 uppercase text-[10px]">THEME: {theme}</span>
              {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
            </Button>
          </div>
        </header>

        {networkIntel && (
          <div className="mb-4 border-2 border-black bg-black p-2 text-white dark:border-white dark:bg-white dark:text-black flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <span className="flex items-center gap-1 text-emerald-400 dark:text-emerald-600"><Terminal size={12} /> NET_INTEL // </span>
            <span>{t.ip}: {networkIntel.ip}</span>
            <span>{t.isp}: {networkIntel.isp}</span>
            <span>{t.location}: {networkIntel.city}, {networkIntel.country}</span>
            <span>{t.connection}: {networkIntel.connectionType}</span>
          </div>
        )}

        {showHistory ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 dark:border-white">
              <h2 className="text-xs font-bold uppercase tracking-widest">{t.history}</h2>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory} className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                  <Trash2 className="mr-2" size={14} />
                  {t.clearHistory}
                </Button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center border-2 border-dashed border-black text-gray-500 dark:border-white">
                <History size={32} className="mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase">{t.noHistory}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => {
                  const stats = calculateOverallStats(entry.results);
                  return (
                    <Card key={entry.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-bold opacity-50">{format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss')}</p>
                            <div className="mt-2 flex gap-6">
                              <div>
                                <p className="text-[10px] font-bold uppercase mb-1">{t.globalAverage}</p>
                                <p className="text-2xl font-black">{stats.avgPing} <span className="text-sm">MS</span></p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase mb-1">{t.totalLoss}</p>
                                <p className="text-2xl font-black">{stats.totalLoss} <span className="text-sm">%</span></p>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            setCurrentResults(entry.results);
                            setShowHistory(false);
                          }}>
                            {t.latestTest} <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Hero / Graph Section */}
            <section className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="mb-4 flex flex-col gap-2 border-b-2 border-black pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-white">
                <h2 className="text-[10px] font-bold uppercase tracking-widest">
                  {isTesting ? t.currentTest : (isComplete ? t.overallStats : t.latestTest)}
                </h2>
                <Button onClick={startTest} disabled={isTesting} className="w-full sm:w-auto text-[10px] h-8">
                  {isTesting ? (
                    <><Loader2 className="mr-2 animate-spin" size={14} /> {t.testing}</>
                  ) : (
                    <><Play className="mr-2" size={14} /> {t.startTest}</>
                  )}
                </Button>
              </div>

              {isTesting && activeServerIndex >= 0 ? (
                <div className="animate-in fade-in duration-500 h-[120px] sm:h-[150px] overflow-hidden">
                  <ServerGraph 
                    data={liveLatencies} 
                    title={`${sortedServers[activeServerIndex].name} // ${sortedServers[activeServerIndex].region.toUpperCase()}`} 
                  />
                </div>
              ) : (
                <div className="flex min-h-[120px] flex-col items-center justify-center border-2 border-dashed border-black bg-gray-50 p-4 dark:border-white dark:bg-gray-900">
                  {isComplete ? (
                    <div className="flex w-full max-w-md flex-col gap-4 text-center animate-in zoom-in-95 duration-500">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center justify-center border-2 border-black bg-white p-4 dark:border-white dark:bg-black">
                          <span className="mb-1 text-[9px] font-bold uppercase opacity-50">{t.globalAverage}</span>
                          <span className="text-3xl font-black">{overallStats.avgPing}<span className="text-sm ml-1">MS</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center border-2 border-black bg-white p-4 dark:border-white dark:bg-black">
                          <span className="mb-1 text-[9px] font-bold uppercase opacity-50">{t.totalLoss}</span>
                          <span className="text-3xl font-black">{overallStats.totalLoss}<span className="text-sm ml-1">%</span></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                      <Globe size={32} className="mb-2 opacity-50" />
                      <p className="text-[10px] font-bold uppercase">{t.idle}</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Server Grid */}
            <section>
              <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-1 dark:border-white">
                <h3 className="text-[10px] font-bold uppercase tracking-widest">{t.server}</h3>
                <span className="text-[9px] font-bold uppercase opacity-50">
                  {isTesting ? `[${(activeServerIndex + 1).toString().padStart(2, '0')}/${sortedServers.length.toString().padStart(2, '0')}]` : `[${sortedServers.length.toString().padStart(2, '0')} TARGETS]`}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {currentResults.map((res, i) => (
                  <Card 
                    key={i} 
                    className={cn(
                      "transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-xs",
                      res.status === 'idle' ? 'opacity-70' : ''
                    )}
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 mb-1">
                            {res.countryCode === 'global' ? (
                              <Globe size={12} className="inline-block" />
                            ) : (
                              <img src={`https://flagcdn.com/w20/${res.countryCode}.png`} alt={res.countryCode} className="inline-block h-2 object-contain" />
                            )}
                            <span className="bg-black text-white px-1 text-[8px] font-bold dark:bg-white dark:text-black uppercase leading-tight">{res.provider}</span>
                          </div>
                          <span className="text-[9px] font-bold opacity-60 uppercase flex items-center justify-between">
                            {res.region}
                            {res.distance !== undefined && (
                              <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                                {res.distance === 0 ? 'ANYCAST' : `${Math.round(res.distance)} KM`}
                              </span>
                            )}
                          </span>
                          <CardTitle className="mt-1 text-[10px] leading-tight">{res.serverName}</CardTitle>
                        </div>
                        {res.status === 'completed' && <div className="h-1.5 w-1.5 bg-green-500"></div>}
                        {res.status === 'failed' && <div className="h-1.5 w-1.5 bg-red-500"></div>}
                        {res.status === 'testing' && <div className="h-1.5 w-1.5 bg-black dark:bg-white animate-pulse"></div>}
                        {res.status === 'idle' && <div className="h-1.5 w-1.5 border border-black dark:border-white"></div>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2 flex justify-between">
                        <div className="flex flex-col">
                          <span className="mb-0.5 text-[9px] font-bold uppercase opacity-50">{t.ping} (ms)</span>
                          <span className={cn(
                            "text-xl font-black tracking-tighter",
                            res.averagePing > 200 ? "text-red-600 dark:text-red-400" : res.averagePing > 100 ? "text-yellow-600 dark:text-yellow-400" : ""
                          )}>
                            {res.status === 'idle' || res.status === 'testing' ? '--' : res.averagePing}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="mb-0.5 text-[9px] font-bold uppercase opacity-50">{t.loss} (%)</span>
                          <span className={cn(
                            "text-xl font-black tracking-tighter",
                            res.packetLoss > 0 ? "text-red-600 dark:text-red-400" : ""
                          )}>
                            {res.status === 'idle' || res.status === 'testing' ? '--' : res.packetLoss.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Jitter Details */}
                      {res.status === 'completed' || res.status === 'failed' ? (
                        <div className="mt-2 text-[9px] font-bold border-t border-dashed border-black dark:border-white pt-2 flex justify-between items-center opacity-80">
                          <span className="uppercase">{t.jitter}</span>
                          <span>{res.jitter} MS</span>
                        </div>
                      ) : null}

                      {/* Mini progress bar / sparkline visual equivalent */}
                      {res.status === 'testing' && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-800">
                            <div 
                              className="h-full bg-black transition-all duration-200 dark:bg-white" 
                              style={{ width: `${(liveLatencies.length / 10) * 100}%` }} 
                            />
                          </div>
                          <span className="text-[9px] font-bold">TESTING</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

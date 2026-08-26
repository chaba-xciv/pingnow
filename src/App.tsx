import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Play, 
  Square, 
  Globe, 
  History, 
  Trash2, 
  ChevronRight, 
  Terminal, 
  Share2, 
  Zap, 
  Wifi, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';
import { ServerGraph } from '@/src/components/ServerGraph';
import { ShareModal } from '@/src/components/ShareModal';
import { SERVERS, pingEndpoint, delay, calculateDistance } from '@/src/utils/ping';
import { translations, type Language } from '@/src/i18n';
import type { PingResult, TestHistory, NetworkIntel } from '@/src/types';
import { format } from 'date-fns';

export default function App() {
  const [lang, setLang] = useState<Language>('th');
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isTesting, setIsTesting] = useState(false);
  const [activeServerIndex, setActiveServerIndex] = useState<number>(-1);
  const [currentResults, setCurrentResults] = useState<PingResult[]>([]);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [liveLatencies, setLiveLatencies] = useState<{ ping: number; latency: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [networkIntel, setNetworkIntel] = useState<NetworkIntel | null>(null);
  const [sortedServers, setSortedServers] = useState([...SERVERS]);
  const stopRequestedRef = useRef(false);

  const t = translations[lang];

  // Device / System theme automatic detection & synchronization
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let active: 'light' | 'dark' = 'light';
      if (themeMode === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = themeMode;
      }
      setResolvedTheme(active);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(active);
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeMode]);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        
        if (!data.success) {
          console.warn('IP API returned false success', data);
          return;
        }

        let connectionType = 'BROADBAND / FIBER';
        let rttEstimate: number | undefined;

        // @ts-ignore
        const navConn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (navConn) {
          if (navConn.type) {
            const rawType = String(navConn.type).toUpperCase();
            if (rawType === 'ETHERNET') connectionType = 'ETHERNET (FIBER)';
            else if (rawType === 'WIFI') connectionType = 'WI-FI';
            else if (rawType === 'CELLULAR') connectionType = 'CELLULAR';
            else connectionType = rawType;
          } else if (navConn.effectiveType) {
            const eff = navConn.effectiveType.toUpperCase();
            if (eff === '4G') {
              connectionType = 'HIGH-SPEED BROADBAND';
            } else {
              connectionType = `MOBILE ${eff}`;
            }
          }
          if (navConn.rtt) rttEstimate = navConn.rtt;
        }

        const rawIp = data.ip || 'UNKNOWN';
        const isV6 = rawIp.includes(':');

        const intel: NetworkIntel = {
          ip: rawIp,
          ipVersion: isV6 ? 'IPv6' : 'IPv4',
          isp: data.connection?.isp || data.connection?.org || 'UNKNOWN',
          asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
          org: data.connection?.org,
          city: data.city || 'UNKNOWN',
          region: data.region,
          country: data.country || 'UNKNOWN',
          countryCode: data.country_code,
          lat: data.latitude || 0,
          lon: data.longitude || 0,
          timezone: data.timezone?.id || data.timezone?.abbr,
          connectionType,
          downlink: undefined,
          rttEstimate,
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
        console.warn('Failed to fetch network intel, continuing without it.', err);
      }
    };
    fetchIntel();
  }, []);

  useEffect(() => {
    const savedThemeMode = localStorage.getItem('themeMode') as 'system' | 'light' | 'dark' | null;
    if (savedThemeMode) {
      setThemeMode(savedThemeMode);
    } else {
      const legacyTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (legacyTheme) setThemeMode(legacyTheme);
    }

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
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const cycleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const handleToggleTest = () => {
    if (isTesting) {
      stopRequestedRef.current = true;
      return;
    }
    startTest();
  };

  const startTest = async () => {
    stopRequestedRef.current = false;
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
      if (stopRequestedRef.current) break;

      setActiveServerIndex(i);
      const server = sortedServers[i];
      
      setCurrentResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'testing' } : r));
      setLiveLatencies([]);
      
      const latencies: number[] = [];
      let lost = 0;
      const PINGS_PER_SERVER = 10;

      // Warm-up request (discarded)
      try {
        if (!stopRequestedRef.current) {
          await pingEndpoint(server.endpoint);
        }
      } catch (e) {
        // ignore warm-up failure
      }

      if (stopRequestedRef.current) {
        setCurrentResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'idle' } : r));
        break;
      }

      await delay(80);

      for (let p = 0; p < PINGS_PER_SERVER; p++) {
        if (stopRequestedRef.current) break;

        try {
          const latency = await pingEndpoint(server.endpoint);
          latencies.push(latency);
          setLiveLatencies(prev => [...prev, { ping: p + 1, latency }]);
        } catch (e) {
          lost++;
          setLiveLatencies(prev => [...prev, { ping: p + 1, latency: 0 }]);
        }
        await delay(120);
      }
      
      if (stopRequestedRef.current) {
        if (latencies.length > 0) {
          const validLatencies = latencies.filter(l => l > 0);
          const averagePing = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
          let jitterSum = 0;
          for (let j = 1; j < validLatencies.length; j++) {
            jitterSum += Math.abs(validLatencies[j] - validLatencies[j - 1]);
          }
          const jitter = validLatencies.length > 1 ? Math.round(jitterSum / (validLatencies.length - 1)) : 0;
          const packetLoss = (lost / (latencies.length + lost)) * 100;
          finalResults[i] = {
            ...finalResults[i],
            latencies,
            averagePing,
            jitter,
            packetLoss,
            status: 'completed' as const,
          };
          setCurrentResults([...finalResults]);
        } else {
          setCurrentResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'idle' } : r));
        }
        break;
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
      await delay(150);
    }

    setIsTesting(false);
    setActiveServerIndex(-1);
    
    const completedCount = finalResults.filter(r => r.status === 'completed').length;
    if (completedCount > 0) {
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
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pingHistory');
  };

  const calculateOverallStats = (results: PingResult[]) => {
    const completed = results.filter(r => r.status === 'completed');
    if (completed.length === 0) return { avgPing: 0, totalLoss: 0, bestServer: null };
    
    const avgPing = Math.round(completed.reduce((sum, r) => sum + r.averagePing, 0) / completed.length);
    const totalLoss = Math.round(results.reduce((sum, r) => sum + r.packetLoss, 0) / results.length);
    const bestServer = [...completed].sort((a, b) => a.averagePing - b.averagePing)[0];
    return { avgPing, totalLoss, bestServer };
  };

  const overallStats = calculateOverallStats(currentResults);
  const isComplete = currentResults.length > 0 && currentResults.every(r => r.status === 'completed' || r.status === 'failed');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans transition-colors duration-200 dark:bg-[#09090B] dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        
        {/* Navigation & Header */}
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200/80 bg-white/90 p-3 sm:p-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Zap size={22} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">pingnow</h1>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  v3.0
                </span>
                {isTesting && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Testing
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {isComplete && !isTesting && (
              <Button 
                variant="emerald" 
                size="sm" 
                onClick={() => setShowShareModal(true)}
                className="font-medium text-xs h-9 px-3"
              >
                <Share2 className="mr-1.5" size={14} />
                <span>{t.shareResults}</span>
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)} 
              className="text-xs h-9 px-3 font-medium"
            >
              <History className="mr-1.5" size={14} />
              <span>{showHistory ? t.latestTest : t.history}</span>
            </Button>

            {/* Language Switcher */}
            <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
              <button 
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all", 
                  lang === 'en' ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )} 
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button 
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all", 
                  lang === 'th' ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                )} 
                onClick={() => setLang('th')}
              >
                TH
              </button>
            </div>

            {/* Theme Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cycleTheme} 
              title={`Theme: ${themeMode} (${resolvedTheme})`} 
              className="text-xs h-9 px-3 font-medium"
            >
              <span className="hidden sm:inline-block mr-1.5 text-xs capitalize text-zinc-600 dark:text-zinc-400">
                {themeMode === 'system' ? `Auto` : themeMode}
              </span>
              {themeMode === 'system' ? <Monitor size={14} /> : themeMode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
          </div>
        </header>

        {/* Network Intelligence Pill Bar (NET_INTEL) */}
        {networkIntel && !showHistory && (
          <div className="mb-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:px-5 sm:py-3 dark:border-zinc-800/80 dark:bg-[#141417] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Client IP & Version */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Terminal size={14} />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 block leading-none">{t.ip}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{networkIntel.ip}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {networkIntel.ipVersion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <Globe size={14} />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 block leading-none">{t.location}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                    {networkIntel.city}, {networkIntel.countryCode || networkIntel.country}
                  </span>
                </div>
              </div>

              {/* ISP & ASN */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 block leading-none">{t.isp}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px] sm:max-w-[200px]">
                      {networkIntel.isp}
                    </span>
                    {networkIntel.asn && (
                      <span className="text-[10px] font-mono text-zinc-400">({networkIntel.asn})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connection Type */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Wifi size={14} />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 block leading-none">{t.connection}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                    {networkIntel.connectionType}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {showHistory ? (
          /* History View */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800/80 dark:bg-[#141417]">
              <div className="flex items-center gap-2">
                <History className="text-emerald-500" size={18} />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t.history}</h2>
              </div>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs">
                  <Trash2 className="mr-1.5" size={14} />
                  {t.clearHistory}
                </Button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-400 dark:border-zinc-800">
                <History size={36} className="mb-2 opacity-40" />
                <p className="text-sm font-medium">{t.noHistory}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((entry) => {
                  const stats = calculateOverallStats(entry.results);
                  return (
                    <Card key={entry.id} className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-zinc-400">{format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss')}</p>
                            <div className="mt-3 flex gap-6">
                              <div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.globalAverage}</p>
                                <p className="text-2xl font-black font-mono mt-0.5">{stats.avgPing} <span className="text-xs font-sans text-zinc-400">ms</span></p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.totalLoss}</p>
                                <p className="text-2xl font-black font-mono mt-0.5">{stats.totalLoss} <span className="text-xs font-sans text-zinc-400">%</span></p>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => {
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
          /* Main Dashboard Split (Left Control Panel + Right Server Matrix) */
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
            
            {/* Left Column (lg: 4.5 cols): Main Controller, Global Benchmark Stats & Live Graph */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Primary Controller Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 dark:border-zinc-800/80 dark:bg-[#141417] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-emerald-500" />
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {isTesting ? t.currentTest : (isComplete ? t.overallStats : t.latestTest)}
                      </h2>
                    </div>

                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      isTesting ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : isComplete ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {isTesting ? `RUNNING (${activeServerIndex + 1}/${sortedServers.length})` : isComplete ? 'BENCHMARK COMPLETE' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Big Action Button */}
                  <Button 
                    onClick={handleToggleTest} 
                    variant={isTesting ? "danger" : "emerald"}
                    className="w-full text-sm h-11 font-bold tracking-wide transition-all shadow-md mb-4"
                  >
                    {isTesting ? (
                      <><Square className="mr-2 fill-current" size={15} /> {t.stopTest}</>
                    ) : (
                      <><Play className="mr-2 fill-current" size={15} /> {t.startTest}</>
                    )}
                  </Button>

                  {/* Dual Global Metrics */}
                  {isTesting && activeServerIndex >= 0 ? (
                    /* Active Live Telemetry Graph Box */
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-900 p-3 text-white dark:border-zinc-800 h-[190px] flex flex-col justify-between">
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-400 border-b border-zinc-800 pb-1.5">
                        <span className="truncate pr-2 flex items-center gap-1">
                          <Activity size={13} className="animate-spin" />
                          {sortedServers[activeServerIndex].name}
                        </span>
                        <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
                          {sortedServers[activeServerIndex].region.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 my-1">
                        <ServerGraph data={liveLatencies} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                        <span>PINGS: {liveLatencies.length} / 10 BURSTS</span>
                        <span>LIVE RTT SAMPLING</span>
                      </div>
                    </div>
                  ) : (
                    /* Stat Cards */
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/60">
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">{t.globalAverage}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black font-mono text-zinc-900 dark:text-white">{overallStats.avgPing}</span>
                            <span className="text-xs font-bold text-zinc-400">ms</span>
                          </div>
                        </div>
                        
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/60">
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">{t.totalLoss}</span>
                          <div className="flex items-baseline gap-1">
                            <span className={cn("text-3xl font-black font-mono", overallStats.totalLoss > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-white")}>
                              {overallStats.totalLoss}
                            </span>
                            <span className="text-xs font-bold text-zinc-400">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Best Performing Server Highlight */}
                      {overallStats.bestServer && isComplete && (
                        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles size={12} /> {t.bestServer}
                              </span>
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                                {overallStats.bestServer.serverName} ({overallStats.bestServer.region})
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                                {overallStats.bestServer.averagePing} ms
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Quick Actions Footer */}
                {isComplete && !isTesting && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowShareModal(true)} 
                      className="w-full text-xs h-9 font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border-emerald-300 dark:border-emerald-800/80"
                    >
                      <Share2 className="mr-1.5" size={14} />
                      {t.shareResults} (SVG / PNG)
                    </Button>
                  </div>
                )}
              </div>

              {/* Telemetry info badge */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 text-xs dark:border-zinc-800/80 dark:bg-[#141417] shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <Sparkles size={14} /> BURST TELEMETRY ENGINE
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Performs 10 consecutive zero-cache burst latency samples per edge target with automated warm-up TLS handshake discard.
                </p>
              </div>
            </div>

            {/* Right Column (lg: 8 cols): Clean, Responsive Grid of Server Target Cards */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 dark:border-zinc-800/80 dark:bg-[#141417] shadow-xs flex-1">
                
                {/* Section Header */}
                <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-zinc-600 dark:text-zinc-300" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {t.server} Targets
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-400">
                    {isTesting ? `${activeServerIndex + 1} of ${sortedServers.length} Active` : `${sortedServers.length} Endpoints`}
                  </span>
                </div>

                {/* Clean, Modern Server Target Cards Grid: 3 or 4 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {currentResults.map((res, i) => {
                    const isActive = isTesting && activeServerIndex === i;
                    const isDone = res.status === 'completed';
                    const isFailed = res.status === 'failed';

                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded-xl border p-3 transition-all duration-200 flex flex-col justify-between relative overflow-hidden",
                          isActive 
                            ? "border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20 dark:bg-emerald-950/20" 
                            : isDone
                              ? "border-zinc-200/80 bg-zinc-50/40 hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:hover:border-zinc-700"
                              : "border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900/10 opacity-75"
                        )}
                      >
                        {/* Server Card Header */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {res.countryCode === 'global' ? (
                                <Globe size={14} className="text-zinc-500 shrink-0" />
                              ) : (
                                <img 
                                  src={`https://flagcdn.com/w20/${res.countryCode}.png`} 
                                  alt={res.countryCode} 
                                  className="h-3 w-auto object-contain rounded-2xs shrink-0" 
                                />
                              )}
                              <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-tight truncate">
                                {res.provider}
                              </span>
                            </div>

                            {/* Status Indicator */}
                            <div className="shrink-0">
                              {isDone && <CheckCircle2 size={13} className="text-emerald-500" />}
                              {isFailed && <AlertCircle size={13} className="text-rose-500" />}
                              {isActive && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
                              {res.status === 'idle' && <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />}
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug" title={res.serverName}>
                            {res.serverName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {res.region}
                          </p>
                        </div>

                        {/* Latency & Loss Metrics */}
                        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                          <div className="flex items-baseline justify-between">
                            <span className={cn(
                              "text-base font-black font-mono tracking-tight",
                              res.averagePing > 180 ? "text-rose-600 dark:text-rose-400" : res.averagePing > 90 ? "text-amber-600 dark:text-amber-400" : res.averagePing > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                            )}>
                              {res.status === 'idle' || res.status === 'testing' ? '--' : `${res.averagePing}ms`}
                            </span>

                            <span className={cn(
                              "text-[10px] font-medium",
                              res.packetLoss > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-zinc-400"
                            )}>
                              {res.status === 'idle' || res.status === 'testing' ? '' : `${res.packetLoss.toFixed(0)}% loss`}
                            </span>
                          </div>

                          {isDone && (
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mt-0.5">
                              <span>Jitter</span>
                              <span>±{res.jitter}ms</span>
                            </div>
                          )}

                          {/* Live mini progress bar */}
                          {isActive && (
                            <div className="mt-2 h-1 w-full bg-zinc-200 rounded-full dark:bg-zinc-800 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-150 rounded-full" 
                                style={{ width: `${(liveLatencies.length / 10) * 100}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Share Modal Dialog */}
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          results={currentResults}
          networkIntel={networkIntel}
          overallStats={overallStats}
          lang={lang}
          theme={resolvedTheme}
        />
      </div>
    </div>
  );
}

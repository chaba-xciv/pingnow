import React, { useRef, useState } from 'react';
import { Download, Copy, Check, X, Share2, Sparkles, Terminal, Activity, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import type { PingResult, NetworkIntel } from '@/src/types';
import type { Language } from '@/src/i18n';
import { translations } from '@/src/i18n';
import { format } from 'date-fns';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: PingResult[];
  networkIntel: NetworkIntel | null;
  overallStats: { avgPing: number; totalLoss: number };
  lang: Language;
  theme: 'light' | 'dark';
}

export function ShareModal({
  isOpen,
  onClose,
  results,
  networkIntel,
  overallStats,
  lang,
  theme,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const t = translations[lang];

  if (!isOpen) return null;

  // Find best and completed servers
  const completedServers = results.filter(r => r.status === 'completed' || r.latencies.length > 0);
  const bestServer = completedServers.length > 0
    ? [...completedServers].sort((a, b) => a.averagePing - b.averagePing)[0]
    : null;

  // Grade calculate
  let networkGrade = t.gradeExcellent;
  let gradeBadgeColor = '#10b981';
  if (overallStats.avgPing > 180 || overallStats.totalLoss > 5) {
    networkGrade = t.gradePoor;
    gradeBadgeColor = '#ef4444';
  } else if (overallStats.avgPing > 100 || overallStats.totalLoss > 1) {
    networkGrade = t.gradeFair;
    gradeBadgeColor = '#f59e0b';
  } else if (overallStats.avgPing > 60) {
    networkGrade = t.gradeGood;
    gradeBadgeColor = '#3b82f6';
  }

  const timestampStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  // Text summary copy
  const handleCopyText = () => {
    const lines = [
      `🎮 [pingnow - Global Latency Report]`,
      `🕒 ${timestampStr}`,
      `🌐 IP: ${networkIntel?.ip || 'N/A'} (${networkIntel?.ipVersion || 'IPv4'}) | ISP: ${networkIntel?.isp || 'Unknown'}`,
      `📍 Location: ${networkIntel?.city || 'Unknown'}, ${networkIntel?.country || ''} ${networkIntel?.asn ? `| ASN: ${networkIntel.asn}` : ''}`,
      `⚡ Global Avg Ping: ${overallStats.avgPing} ms | Loss: ${overallStats.totalLoss}%`,
      bestServer ? `🏆 Best Server: ${bestServer.serverName} (${bestServer.averagePing} ms - ${bestServer.region})` : '',
      `--- Detailed Pings ---`,
      ...completedServers.map(s => `• ${s.serverName} (${s.provider}): ${s.averagePing}ms | Jitter: ${s.jitter}ms | Loss: ${s.packetLoss.toFixed(1)}%`),
      `\n🔗 Verified with pingnow`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `pingnow-report-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Download PNG (rasterized from SVG via canvas)
  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1200, 630);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `pingnow-report-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-[#141417] dark:text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Share2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{t.shareCardTitle}</h2>
              <p className="text-xs text-zinc-400">{t.sharePrompt}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* SVG Telemetry Card Preview Container */}
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-950 p-2 sm:p-4 dark:border-zinc-800 overflow-hidden flex items-center justify-center shadow-inner">
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 630"
            width="100%"
            height="auto"
            className="max-h-[380px] w-auto rounded-lg font-mono shadow-md"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            {/* Background & Cyber Grid */}
            <rect width="1200" height="630" fill="#09090B" />
            <defs>
              <pattern id="cardGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>
              <linearGradient id="cyberGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#cardGrid)" />

            {/* Top Bar / Header */}
            <rect x="40" y="35" width="1120" height="55" fill="#141417" stroke="#27272A" strokeWidth="1.5" rx="8" />
            <text x="65" y="70" fill="#10B981" fontSize="20" fontWeight="900" letterSpacing="1">⚡ PINGNOW</text>
            <text x="210" y="70" fill="#A1A1AA" fontSize="14" fontWeight="700">// TELEMETRY BENCHMARK REPORT</text>
            <text x="1135" y="70" fill="#71717A" fontSize="13" textAnchor="end">{timestampStr}</text>

            {/* Left Column: Client Intel & Overall Score */}
            <g transform="translate(40, 110)">
              {/* Intel Panel */}
              <rect width="540" height="230" fill="#111114" stroke="#27272A" strokeWidth="1.5" rx="8" />
              <rect x="0" y="0" width="540" height="36" fill="#18181D" rx="8" />
              <text x="20" y="24" fill="#06B6D4" fontSize="12" fontWeight="800" letterSpacing="1">📡 NET_INTEL // CLIENT TELEMETRY</text>

              <text x="25" y="65" fill="#71717A" fontSize="12">IP ADDRESS:</text>
              <text x="150" y="65" fill="#FFFFFF" fontSize="13" fontWeight="700">{networkIntel?.ip || 'N/A'}</text>
              <rect x="450" y="49" width="65" height="22" fill="#27272A" rx="4" />
              <text x="482" y="65" fill="#10B981" fontSize="11" fontWeight="800" textAnchor="middle">{networkIntel?.ipVersion || 'IPv4'}</text>

              <text x="25" y="98" fill="#71717A" fontSize="12">ISP / ROUTING:</text>
              <text x="150" y="98" fill="#E4E4E7" fontSize="13" fontWeight="700">{networkIntel?.isp?.slice(0, 32) || 'N/A'}</text>

              <text x="25" y="131" fill="#71717A" fontSize="12">ASN CODE:</text>
              <text x="150" y="131" fill="#38BDF8" fontSize="13" fontWeight="700">{networkIntel?.asn || 'AS_UNKNOWN'}</text>

              <text x="25" y="164" fill="#71717A" fontSize="12">GEO LOCATION:</text>
              <text x="150" y="164" fill="#E4E4E7" fontSize="13" fontWeight="700">{networkIntel?.city || 'Global'}, {networkIntel?.country || ''}</text>

              <text x="25" y="197" fill="#71717A" fontSize="12">LINK TYPE:</text>
              <text x="150" y="197" fill="#A1A1AA" fontSize="13">{networkIntel?.connectionType || 'BROADBAND / FIBER'}</text>
            </g>

            {/* Left Bottom: Benchmark summary cards */}
            <g transform="translate(40, 360)">
              {/* Avg Ping Card */}
              <rect width="255" height="130" fill="#111114" stroke="#27272A" strokeWidth="1.5" rx="8" />
              <text x="20" y="32" fill="#A1A1AA" fontSize="11" fontWeight="700">GLOBAL AVG PING</text>
              <text x="20" y="85" fill="#FFFFFF" fontSize="42" fontWeight="900">{overallStats.avgPing}</text>
              <text x="130" y="85" fill="#10B981" fontSize="18" fontWeight="800">MS</text>
              <text x="20" y="112" fill="#71717A" fontSize="10">Aggregated across all targets</text>

              {/* Packet Loss Card */}
              <rect x="285" y="0" width="255" height="130" fill="#111114" stroke="#27272A" strokeWidth="1.5" rx="8" />
              <text x="305" y="32" fill="#A1A1AA" fontSize="11" fontWeight="700">PACKET LOSS RATE</text>
              <text x="305" y="85" fill={overallStats.totalLoss > 0 ? '#EF4444' : '#10B981'} fontSize="42" fontWeight="900">{overallStats.totalLoss}</text>
              <text x="400" y="85" fill="#A1A1AA" fontSize="18" fontWeight="800">%</text>
              <text x="305" y="112" fill="#71717A" fontSize="10">Drop rate during 10x bursts</text>
            </g>

            {/* Right Column: Server Leaderboard Matrix */}
            <g transform="translate(610, 110)">
              <rect width="550" height="380" fill="#111114" stroke="#27272A" strokeWidth="1.5" rx="8" />
              <rect x="0" y="0" width="550" height="36" fill="#18181D" rx="8" />
              <text x="20" y="24" fill="#E4E4E7" fontSize="12" fontWeight="800" letterSpacing="1">🎯 TARGET LATENCY BENCHMARK</text>
              <text x="530" y="24" fill="#71717A" fontSize="11" textAnchor="end">RTT (AVG / JITTER)</text>

              {/* Server Rows */}
              {results.slice(0, 7).map((s, idx) => {
                const yPos = 70 + (idx * 42);
                const isTop = s.serverName === bestServer?.serverName;
                const pingColor = s.averagePing === 0 ? '#71717A' : s.averagePing > 180 ? '#EF4444' : s.averagePing > 90 ? '#F59E0B' : '#10B981';

                return (
                  <g key={s.serverName}>
                    {isTop && (
                      <rect x="10" y={yPos - 22} width="530" height="34" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeWidth="1" rx="4" />
                    )}
                    <text x="20" y={yPos} fill="#71717A" fontSize="11" fontWeight="700">0{idx + 1}</text>
                    <text x="48" y={yPos} fill="#FFFFFF" fontSize="13" fontWeight="800">{s.serverName.slice(0, 20)}</text>
                    <text x="250" y={yPos} fill="#A1A1AA" fontSize="11">{s.region}</text>
                    
                    <text x="430" y={yPos} fill={pingColor} fontSize="14" fontWeight="900" textAnchor="end">
                      {s.averagePing > 0 ? `${s.averagePing} ms` : '--'}
                    </text>
                    <text x="530" y={yPos} fill="#71717A" fontSize="11" textAnchor="end">
                      ±{s.jitter}ms
                    </text>
                    {idx < 6 && <line x1="20" y1={yPos + 14} x2="530" y2={yPos + 14} stroke="#1F1F23" strokeWidth="1" />}
                  </g>
                );
              })}
            </g>

            {/* Bottom Status Ribbon */}
            <g transform="translate(40, 510)">
              <rect width="1120" height="75" fill="#141417" stroke="#27272A" strokeWidth="1.5" rx="8" />
              
              <text x="30" y="44" fill="#A1A1AA" fontSize="12" fontWeight="700">NETWORK GRADE:</text>
              <rect x="160" y="22" width="180" height="32" fill={gradeBadgeColor} rx="6" />
              <text x="250" y="43" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle">{networkGrade}</text>

              {bestServer && (
                <>
                  <text x="380" y="44" fill="#71717A" fontSize="12">OPTIMAL GATEWAY:</text>
                  <text x="530" y="44" fill="#10B981" fontSize="13" fontWeight="800">
                    {bestServer.serverName} ({bestServer.averagePing} MS)
                  </text>
                </>
              )}

              <text x="1090" y="44" fill="#52525B" fontSize="12" textAnchor="end">pingnow • global-latency-check</text>
            </g>
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyText}
            className="flex-1 sm:flex-none text-xs h-9 px-4"
          >
            {copied ? <Check className="mr-2 text-emerald-500" size={14} /> : <Copy className="mr-2" size={14} />}
            {copied ? t.copied : t.copySummary}
          </Button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              variant="emerald"
              size="sm" 
              onClick={handleDownloadSvg}
              className="flex-1 sm:flex-none text-xs h-9 px-4"
            >
              <Download className="mr-2" size={14} />
              {t.downloadSvg}
            </Button>
            <Button 
              variant="default"
              size="sm" 
              onClick={handleDownloadPng}
              className="flex-1 sm:flex-none text-xs h-9 px-4"
            >
              <Download className="mr-2" size={14} />
              {t.downloadPng}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ServerGraphProps {
  data: { ping: number; latency: number }[];
  title?: string;
}

export function ServerGraph({ data, title }: ServerGraphProps) {
  return (
    <div className="w-full h-full min-h-[140px] flex flex-col font-mono">
      {title && <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-zinc-500">{title}</h3>}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="currentColor" />
            <XAxis dataKey="ping" hide />
            <YAxis 
              dataKey="latency" 
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }} 
              stroke="transparent"
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: '10px', 
                backgroundColor: 'rgba(18, 18, 20, 0.95)', 
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`${value} ms`, 'LATENCY']}
            />
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

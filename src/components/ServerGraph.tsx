import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ServerGraphProps {
  data: { ping: number; latency: number }[];
  title: string;
}

export function ServerGraph({ data, title }: ServerGraphProps) {
  return (
    <div className="w-full h-[250px] sm:h-[300px] flex flex-col font-mono">
      <h3 className="text-xs font-bold uppercase mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" />
            <XAxis dataKey="ping" hide />
            <YAxis dataKey="latency" tick={{ fontSize: 10, fill: 'currentColor' }} stroke="currentColor" />
            <Tooltip
              contentStyle={{ borderRadius: 0, backgroundColor: '#000', color: '#fff', border: '2px solid #000' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`${value} ms`, 'PING']}
            />
            <Line
              type="stepAfter"
              dataKey="latency"
              stroke="currentColor"
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: 'currentColor', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

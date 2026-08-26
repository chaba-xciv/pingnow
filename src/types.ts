export interface PingResult {
  serverName: string;
  provider: string;
  region: string;
  countryCode: string;
  endpoint: string;
  latencies: number[];
  averagePing: number;
  jitter: number;
  packetLoss: number;
  status: 'idle' | 'testing' | 'completed' | 'failed';
  distance?: number;
}

export interface TestHistory {
  id: string;
  timestamp: number;
  results: PingResult[];
}

export interface NetworkIntel {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  isp: string;
  asn?: string;
  org?: string;
  city: string;
  region?: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
  timezone?: string;
  connectionType: string;
  downlink?: number; // Mbps
  rttEstimate?: number; // ms
}

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
  isp: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  connectionType: string;
}

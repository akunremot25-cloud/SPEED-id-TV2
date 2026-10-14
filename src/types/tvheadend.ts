export interface Channel {
  id: string;
  number: number;
  name: string;
  category: 'Nasional' | 'Berita' | 'Olahraga' | 'Hiburan' | 'Mancanegara' | 'Religi' | 'Test';
  logo: string;
  streamUrl: string;
  backupUrls?: string[];
  quality: '1080p' | '720p' | '480p' | 'Auto';
  fps?: number;
  bitrateKbps?: number;
  audioCodec?: string;
  videoCodec?: string;
  epgCurrent?: {
    title: string;
    description: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    progress: number;  // 0 - 100
  };
  epgNext?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  };
  isFavorite?: boolean;
}

export interface StreamProfile {
  id: string;
  name: string;
  description: string;
  resolution: string;
  targetBitrateKbps: number;
  container: 'hls' | 'matroska' | 'pass';
  isMobileOptimized: boolean;
}

export interface TunerStatus {
  id: string;
  name: string;
  type: 'IPTV Tuner' | 'DVB-T2' | 'DVB-S2';
  status: 'active' | 'idle' | 'scanning';
  activeChannel?: string;
  clientCount: number;
  signalStrength: number; // 0 - 100%
  snrDb: number;
  bitrateMbps: number;
}

export interface TvheadendServerConfig {
  mode: 'standalone' | 'connected';
  host: string;
  port: number;
  username: string;
  password?: string;
  streamProfile: string;
  useProxy: boolean;
  transcodingEnabled: boolean;
  bufferSeconds: number;
  lowLatencyMode: boolean;
}

export interface StreamHealth {
  bitrateKbps: number;
  fps: number;
  droppedFrames: number;
  bufferSeconds: number;
  latencySeconds: number;
  resolution: string;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

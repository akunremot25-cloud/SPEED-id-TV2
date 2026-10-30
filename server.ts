import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Initial curated TV channels with high stability & mobile compatibility
interface ServerChannel {
  id: string;
  number: number;
  name: string;
  category: 'Nasional' | 'Berita' | 'Olahraga' | 'Hiburan' | 'Mancanegara' | 'Religi' | 'Test';
  logo: string;
  streamUrl: string;
  backupUrls?: string[];
  quality: '1080p' | '720p' | '480p' | 'Auto';
  fps: number;
  bitrateKbps: number;
  audioCodec: string;
  videoCodec: string;
  isFavorite?: boolean;
}

const DEFAULT_CHANNELS: ServerChannel[] = [
  {
    id: 'rcti-hd-ip',
    number: 1,
    name: 'RCTI HD (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rcti.png',
    streamUrl: 'http://202.150.172.59/RCTIHD/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h201/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'gtv-hd-ip',
    number: 2,
    name: 'GTV HD (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/gtv.png',
    streamUrl: 'http://202.150.172.59/GTVHD/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h203/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'indosiar-hd-ip',
    number: 3,
    name: 'Indosiar HD (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/indosiar.png',
    streamUrl: 'http://202.150.172.59/Indosiar/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h207/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'tvri-ip',
    number: 4,
    name: 'TVRI (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvri.png',
    streamUrl: 'http://202.150.172.59/TVRI/index.m3u8',
    backupUrls: ['https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'tvri-sport-ip',
    number: 5,
    name: 'TVRI Sport (1080p)',
    category: 'Olahraga',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvrisport.png',
    streamUrl: 'http://202.150.172.59/TVRISport/index.m3u8',
    backupUrls: ['https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'rajawali-tv-ip',
    number: 6,
    name: 'Rajawali TV (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rtv.png',
    streamUrl: 'http://202.150.172.59/RajawaliTV/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h10/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'magna-channel-ip',
    number: 7,
    name: 'Magna Channel (1080p)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/magnachannel.png',
    streamUrl: 'http://202.150.172.59/MagnaChannel/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h210/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'vtv-hd-ip',
    number: 8,
    name: 'VTV HD (1080p)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/vtv.png',
    streamUrl: 'http://202.150.172.59/VTVHD/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h212/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'cnn-indonesia-detik',
    number: 9,
    name: 'CNN Indonesia',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/cnnindonesia.png',
    streamUrl: 'https://video.detik.com/livecnn/smil:cnntv/chunklist_w268557525_b384000_sleng.m3u8',
    backupUrls: ['https://live.cnnindonesia.com/transtv/smil:transtv/chunklist_w2685575259_b744100_sleng.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3840,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'cnbc-indonesia-detik',
    number: 10,
    name: 'CNBC Indonesia',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/cnbcindonesia.png',
    streamUrl: 'https://video.detik.com/livecnbc/smil:cnbctv/chunklist_w1279679883_b384000_sleng.m3u8',
    backupUrls: ['https://live.cnbcindonesia.com/livecnbc/smil:cnbctv/chunklist.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3840,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'sctv-hd',
    number: 11,
    name: 'SCTV',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sctv.png',
    streamUrl: 'http://202.150.172.59/SCTV/tracks-v1a1/mono.m3u8',
    backupUrls: [
      'http://202.150.172.59/SCTV/index.m3u8',
      'https://op-flashcon-digdayahd-1.dens.tv/h/h204/01.m3u8',
    ],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'antv-hd-2',
    number: 12,
    name: 'ANTV HD 2',
    category: 'Nasional',
    logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg',
    streamUrl: 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd',
    backupUrls: [
      'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782',
    ],
    quality: '720p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'antv-hd-3',
    number: 14,
    name: 'ANTV HD 3',
    category: 'Nasional',
    logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg',
    streamUrl: 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782',
    backupUrls: [
      'https://vidio123.mikrofast.web.id/vidio/782/index.mpd',
    ],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'mnctv-hd',
    number: 13,
    name: 'MNCTV HD (1080p)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/mnctv.png',
    streamUrl: 'http://202.150.172.59/MNCTV/index.m3u8',
    backupUrls: [
      'https://op-flashcon-digdayahd-1.dens.tv/h/h202/01.m3u8',
      'http://202.150.172.59/MNCTV/tracks-v1a1/mono.m3u8',
    ],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  }
];

import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'channels.db.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.db.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.db.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Subscriber & Activation Code Model
export interface ServerSubscriber {
  id: string;
  code: string;
  name: string;
  phone?: string;
  status: 'active' | 'disabled' | 'expired';
  package: 'all' | 'nasional' | 'premium';
  createdAt: string;
  expiresAt: string; // ISO string or "permanent"
  deviceLimit: number;
  notes?: string;
  lastActiveAt?: string;
  lastChannel?: string;
  lastIp?: string;
}

const DEFAULT_SUBSCRIBERS: ServerSubscriber[] = [
  {
    id: 'sub-vip-demo',
    code: 'SPEED-VIP-TEST',
    name: 'Pelanggan VIP Demo',
    phone: '+6281234567890',
    status: 'active',
    package: 'all',
    createdAt: new Date().toISOString(),
    expiresAt: 'permanent',
    deviceLimit: 3,
    notes: 'Akun demonstrasi akses penuh seumur hidup',
  },
  {
    id: 'sub-demo-01',
    code: 'SPEED-8821-4912',
    name: 'Budi Santoso (Living Room)',
    phone: '+6285712348899',
    status: 'active',
    package: 'all',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    deviceLimit: 2,
    notes: 'Paket Bulanan 30 Hari',
  },
  {
    id: 'sub-demo-off',
    code: 'SPEED-OFF-TRIAL',
    name: 'Penonton Uji Coba (Contoh Dimatikan)',
    phone: '+6289988776655',
    status: 'disabled',
    package: 'nasional',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    deviceLimit: 1,
    notes: 'Status dinonaktifkan oleh administrator untuk pengujian kontrol',
  },
];

function loadSubscribersFromDb(): ServerSubscriber[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const content = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Database] Gagal membaca data subscribers:', err);
  }
  saveSubscribersToDb(DEFAULT_SUBSCRIBERS);
  return [...DEFAULT_SUBSCRIBERS];
}

function saveSubscribersToDb(data: ServerSubscriber[]) {
  try {
    const tempFile = `${SUBSCRIBERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, SUBSCRIBERS_FILE);
  } catch (err) {
    console.error('[Database] Gagal menyimpan data subscribers:', err);
  }
}

let subscribers: ServerSubscriber[] = loadSubscribersFromDb();

// Helper to check code status
function checkSubscriberCode(rawCode?: string): { valid: boolean; status?: string; reason?: string; subscriber?: ServerSubscriber; remainingDays?: number } {
  if (!rawCode) {
    return { valid: false, reason: 'Kode aktivasi wajib disertakan' };
  }
  const cleanCode = rawCode.trim().toUpperCase();
  const sub = subscribers.find((s) => s.code.toUpperCase() === cleanCode);
  if (!sub) {
    return { valid: false, reason: 'Kode aktivasi tidak terdaftar atau salah' };
  }
  if (sub.status === 'disabled') {
    return {
      valid: false,
      status: 'disabled',
      reason: 'Akses siaran Anda telah DINONAKTIFKAN oleh administrator.',
      subscriber: sub,
    };
  }
  if (sub.expiresAt && sub.expiresAt !== 'permanent') {
    const expTime = new Date(sub.expiresAt).getTime();
    const now = Date.now();
    if (now > expTime) {
      return {
        valid: false,
        status: 'expired',
        reason: 'Kode aktivasi telah KEDALUWARSA. Hubungi admin untuk perpanjangan.',
        subscriber: sub,
        remainingDays: 0,
      };
    }
    const remainingDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
    return { valid: true, status: 'active', subscriber: sub, remainingDays };
  }
  return { valid: true, status: 'active', subscriber: sub, remainingDays: 9999 };
}

function loadChannelsFromDb(): ServerChannel[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        const channelList = [...parsed];

        DEFAULT_CHANNELS.forEach((defCh) => {
          const existingIdx = channelList.findIndex(
            (c) => c.id === defCh.id || c.number === defCh.number
          );

          if (existingIdx >= 0) {
            if (channelList[existingIdx].streamUrl !== defCh.streamUrl || channelList[existingIdx].name !== defCh.name) {
              channelList[existingIdx] = {
                ...channelList[existingIdx],
                id: defCh.id,
                name: defCh.name,
                logo: defCh.logo,
                streamUrl: defCh.streamUrl,
                backupUrls: defCh.backupUrls,
                quality: defCh.quality,
                category: defCh.category,
                number: defCh.number,
                isFavorite: true,
              };
              modified = true;
            }
          } else {
            channelList.push(defCh);
            modified = true;
          }
        });

        channelList.sort((a, b) => (a.number || 0) - (b.number || 0));

        if (modified) {
          console.log('[Database] Sinkronisasi 10 saluran m3u8 pilihan user ke database');
          saveChannelsToDb(channelList);
          return channelList;
        }

        console.log(`[Database] Memuat ${channelList.length} saluran dari ${DB_FILE}`);
        return channelList;
      }
    }
  } catch (err) {
    console.error('[Database] Gagal membaca data saluran:', err);
  }
  // Initialize with DEFAULT_CHANNELS if empty or not found
  console.log('[Database] Menginisialisasi saluran bawaan ke database...');
  saveChannelsToDb(DEFAULT_CHANNELS);
  return [...DEFAULT_CHANNELS];
}

function saveChannelsToDb(data: ServerChannel[]) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Database] Gagal menyimpan data saluran:', err);
  }
}

function loadConfigFromDb(): any {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Database] Gagal membaca konfigurasi server:', err);
  }
  return null;
}

function saveConfigToDb(cfg: any) {
  try {
    const tempFile = `${CONFIG_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cfg, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONFIG_FILE);
  } catch (err) {
    console.error('[Database] Gagal menyimpan konfigurasi server:', err);
  }
}

// Initialized from persistent database
let channels: ServerChannel[] = loadChannelsFromDb();

// Tvheadend Server Configuration
const DEFAULT_CONFIG = {
  mode: 'standalone' as 'standalone' | 'connected',
  host: '127.0.0.1',
  port: 9981,
  username: 'admin',
  password: '',
  streamProfile: 'webtv-h264-aac-matroska',
  useProxy: true,
  transcodingEnabled: true,
  bufferSeconds: 15,
  lowLatencyMode: true,
};

let serverConfig = loadConfigFromDb() || { ...DEFAULT_CONFIG };

// Tuner mock & status
const tuners = [
  {
    id: 'tuner-1',
    name: 'IPTV Network Tuner #1 (Mobile Low-Latency)',
    type: 'IPTV Tuner' as const,
    status: 'active' as const,
    activeChannel: 'TVRI Nasional',
    clientCount: 1,
    signalStrength: 98,
    snrDb: 34.2,
    bitrateMbps: 3.2,
  },
  {
    id: 'tuner-2',
    name: 'IPTV Network Tuner #2 (Adaptive HLS)',
    type: 'IPTV Tuner' as const,
    status: 'active' as const,
    activeChannel: 'DW English Live',
    clientCount: 1,
    signalStrength: 95,
    snrDb: 31.8,
    bitrateMbps: 2.8,
  },
  {
    id: 'tuner-3',
    name: 'DVB-T2 Virtual Demuxer (UHF CH 28)',
    type: 'DVB-T2' as const,
    status: 'idle' as const,
    clientCount: 0,
    signalStrength: 88,
    snrDb: 29.5,
    bitrateMbps: 0.0,
  },
];

// Helper: Generate dynamic EPG schedule based on current hour
function getEpgForChannel(channelName: string, category: string) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  const pad = (n: number) => String(n).padStart(2, '0');
  const startHour = currentHour;
  const endHour = (currentHour + 1) % 24;

  const progress = Math.round((currentMinutes / 60) * 100);

  let curTitle = 'Siaran Langsung Utama';
  let curDesc = 'Siaran langsung format HLS beresolusi tinggi dengan audio stereo stabil untuk perangkat mobile.';
  let nextTitle = 'Program Siaran Selanjutnya';
  let nextDesc = 'Informasi dan wawasan terkini disiarkan langsung melalui server Tvheadend.';

  if (category === 'Nasional') {
    curTitle = currentHour < 12 ? 'Indonesia Pagi Live' : currentHour < 18 ? 'Indonesia Siang & Ragam Budaya' : 'Dunia Dalam Berita & Warta Malam';
    curDesc = 'Kilas berita aktual seputar nusantara, pembangunan nasional, ekonomi, dan kebudayaan daerah.';
    nextTitle = 'Jendela Nusantara & Laporan Khusus';
    nextDesc = 'Liputan mendalam peristiwa penting dari berbagai penjuru provinsi di Indonesia.';
  } else if (category === 'Berita') {
    curTitle = 'Global Live Bulletin & Breaking News';
    curDesc = 'Breaking news, live field reports, market analysis, and in-depth diplomatic coverage.';
    nextTitle = 'World Business Focus & Discussion';
    nextDesc = 'Interviews with global leaders and tech innovators.';
  } else if (category === 'Olahraga') {
    curTitle = 'Live Action Sports Championship';
    curDesc = 'Streaming pertandingan live dengan frame rate tinggi (50/60 FPS) tanpa buffering.';
    nextTitle = 'Sports Highlights & Athlete Profile';
    nextDesc = 'Analisis taktik dan kilas balik pertandingan terbaik pekan ini.';
  } else if (category === 'Test') {
    curTitle = 'Tvheadend Mux Calibration Stream';
    curDesc = 'Uji stabilitas buffer HLS, sinkronisasi audio/video, dan ABR pada koneksi 4G/5G mobile.';
    nextTitle = 'Bitrate Stress Test 1080p';
    nextDesc = 'Pengujian latensi rendah dan pemulihan paket data.';
  }

  return {
    epgCurrent: {
      title: `${channelName}: ${curTitle}`,
      description: curDesc,
      startTime: `${pad(startHour)}:00`,
      endTime: `${pad(endHour)}:00`,
      progress,
    },
    epgNext: {
      title: nextTitle,
      description: nextDesc,
      startTime: `${pad(endHour)}:00`,
      endTime: `${pad((endHour + 1) % 24)}:00`,
    },
  };
}

// REST APIs
app.get('/api/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    serverMode: serverConfig.mode,
    activeTuners: tuners.filter((t) => t.status === 'active').length,
    channelCount: channels.length,
    memoryRssMb: Math.round(mem.rss / 1024 / 1024),
    memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
  });
});

app.get('/api/tvheadend/config', (_req: Request, res: Response) => {
  res.json(serverConfig);
});

app.post('/api/tvheadend/config', (req: Request, res: Response) => {
  serverConfig = { ...serverConfig, ...req.body };
  res.json({ success: true, config: serverConfig });
});

app.get('/api/tvheadend/channels', (_req: Request, res: Response) => {
  const fullChannels = channels.map((ch) => {
    const epg = getEpgForChannel(ch.name, ch.category);
    return {
      ...ch,
      ...epg,
    };
  });
  res.json(fullChannels);
});

app.post('/api/tvheadend/channels', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.streamUrl) {
    res.status(400).json({ error: 'Nama saluran dan URL stream wajib diisi.' });
    return;
  }

  const newChannel: ServerChannel = {
    id: body.id || `custom-${Date.now()}`,
    number: body.number || channels.length + 1,
    name: body.name,
    category: body.category || 'Nasional',
    logo: body.logo || 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=128&auto=format&fit=crop&q=80',
    streamUrl: body.streamUrl,
    backupUrls: body.backupUrls || [],
    quality: body.quality || 'Auto',
    fps: body.fps || 30,
    bitrateKbps: body.bitrateKbps || 2500,
    audioCodec: body.audioCodec || 'AAC',
    videoCodec: body.videoCodec || 'H.264',
    isFavorite: false,
  };

  channels.push(newChannel);
  saveChannelsToDb(channels);
  res.json({ success: true, channel: newChannel });
});

app.post('/api/tvheadend/channels/sync-all', (req: Request, res: Response) => {
  const incoming = req.body.channels;
  if (!Array.isArray(incoming)) {
    res.status(400).json({ error: 'Data channels harus berupa array' });
    return;
  }
  channels = incoming.map((ch: any) => ({
    id: ch.id || `custom-${Date.now()}`,
    number: Number(ch.number) || 1,
    name: ch.name || 'Channel',
    category: ch.category || 'Nasional',
    logo: ch.logo || 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=128&auto=format&fit=crop&q=80',
    streamUrl: ch.streamUrl,
    backupUrls: ch.backupUrls || [],
    quality: ch.quality || 'Auto',
    fps: Number(ch.fps) || 30,
    bitrateKbps: Number(ch.bitrateKbps) || 2500,
    audioCodec: ch.audioCodec || 'AAC',
    videoCodec: ch.videoCodec || 'H.264',
    isFavorite: !!ch.isFavorite,
  }));
  saveChannelsToDb(channels);
  res.json({ success: true, message: 'Semua saluran berhasil disimpan ke database', count: channels.length });
});

app.put('/api/tvheadend/channels/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const index = channels.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Saluran tidak ditemukan' });
    return;
  }

  const body = req.body;
  channels[index] = {
    ...channels[index],
    name: body.name !== undefined ? body.name : channels[index].name,
    number: body.number !== undefined ? Number(body.number) : channels[index].number,
    category: body.category !== undefined ? body.category : channels[index].category,
    logo: body.logo !== undefined ? body.logo : channels[index].logo,
    streamUrl: body.streamUrl !== undefined ? body.streamUrl : channels[index].streamUrl,
    backupUrls: body.backupUrls !== undefined ? body.backupUrls : channels[index].backupUrls,
    quality: body.quality !== undefined ? body.quality : channels[index].quality,
    fps: body.fps !== undefined ? Number(body.fps) : channels[index].fps,
    bitrateKbps: body.bitrateKbps !== undefined ? Number(body.bitrateKbps) : channels[index].bitrateKbps,
    audioCodec: body.audioCodec !== undefined ? body.audioCodec : channels[index].audioCodec,
    videoCodec: body.videoCodec !== undefined ? body.videoCodec : channels[index].videoCodec,
  };

  const epg = getEpgForChannel(channels[index].name, channels[index].category);
  saveChannelsToDb(channels);
  res.json({ success: true, channel: { ...channels[index], ...epg } });
});

app.post('/api/tvheadend/test-stream', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ reachable: false, error: 'URL tidak valid' });
    return;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) VLC/3.5.4',
        'Range': 'bytes=0-1024',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;
    const contentType = upstream.headers.get('content-type') || '';
    const isOk = upstream.status >= 200 && upstream.status < 400;

    res.json({
      reachable: isOk,
      statusCode: upstream.status,
      latencyMs,
      contentType,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.json({
      reachable: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Koneksi timeout (>6s)' : err.message || 'Gagal terhubung',
    });
  }
});

app.delete('/api/tvheadend/channels/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const initialLen = channels.length;
  channels = channels.filter((c) => c.id !== id);
  if (channels.length === initialLen) {
    res.status(404).json({ error: 'Saluran tidak ditemukan' });
    return;
  }
  saveChannelsToDb(channels);
  res.json({ success: true, message: 'Saluran berhasil dihapus' });
});

// Database reset endpoint
app.post('/api/tvheadend/database/reset', (_req: Request, res: Response) => {
  channels = [...DEFAULT_CHANNELS];
  saveChannelsToDb(channels);
  res.json({ success: true, message: 'Database berhasil direset ke saluran default.', channelsCount: channels.length });
});

app.get('/api/tvheadend/tuners', (_req: Request, res: Response) => {
  res.json(tuners);
});

// ==========================================
// Subscribers & Viewer Activation Control API
// ==========================================

// Get all subscribers
app.get('/api/subscribers', (_req: Request, res: Response) => {
  res.json(subscribers);
});

// Verify activation code for client player
app.get('/api/subscribers/verify', (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ valid: false, reason: 'Parameter code wajib disertakan' });
    return;
  }
  const result = checkSubscriberCode(code);
  res.json(result);
});

// Create new subscriber & code
app.post('/api/subscribers', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.code || !body.name) {
    res.status(400).json({ error: 'Kode aktivasi dan Nama pelanggan wajib diisi' });
    return;
  }

  const existingIdx = subscribers.findIndex((s) => s.code.toUpperCase() === body.code.trim().toUpperCase());
  if (existingIdx >= 0) {
    res.status(409).json({ error: 'Kode aktivasi ini sudah digunakan' });
    return;
  }

  const newSub: ServerSubscriber = {
    id: body.id || `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: body.code.trim().toUpperCase(),
    name: body.name.trim(),
    phone: body.phone || '',
    status: body.status || 'active',
    package: body.package || 'all',
    createdAt: body.createdAt || new Date().toISOString(),
    expiresAt: body.expiresAt || 'permanent',
    deviceLimit: Number(body.deviceLimit) || 1,
    notes: body.notes || '',
  };

  subscribers.unshift(newSub);
  saveSubscribersToDb(subscribers);
  res.json({ success: true, subscriber: newSub });
});

// Update subscriber (status: active/disabled, expiration, etc.)
app.put('/api/subscribers/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const index = subscribers.findIndex((s) => s.id === id || s.code.toUpperCase() === id.toUpperCase());
  if (index === -1) {
    res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    return;
  }

  const body = req.body;
  subscribers[index] = {
    ...subscribers[index],
    name: body.name !== undefined ? body.name : subscribers[index].name,
    code: body.code !== undefined ? body.code.trim().toUpperCase() : subscribers[index].code,
    phone: body.phone !== undefined ? body.phone : subscribers[index].phone,
    status: body.status !== undefined ? body.status : subscribers[index].status,
    package: body.package !== undefined ? body.package : subscribers[index].package,
    expiresAt: body.expiresAt !== undefined ? body.expiresAt : subscribers[index].expiresAt,
    deviceLimit: body.deviceLimit !== undefined ? Number(body.deviceLimit) : subscribers[index].deviceLimit,
    notes: body.notes !== undefined ? body.notes : subscribers[index].notes,
  };

  saveSubscribersToDb(subscribers);
  res.json({ success: true, subscriber: subscribers[index] });
});

// Delete subscriber
app.delete('/api/subscribers/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const initialLen = subscribers.length;
  subscribers = subscribers.filter((s) => s.id !== id && s.code.toUpperCase() !== id.toUpperCase());
  if (subscribers.length === initialLen) {
    res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    return;
  }
  saveSubscribersToDb(subscribers);
  res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
});

// Dynamic M3U playlist export for mobile IPTV apps (VLC, TiviMate, OTT Navigator, etc.)
// Accepts optional ?code=SPEED-XXXX-XXXX for subscriber authentication & control
app.get('/api/tvheadend/playlist.m3u', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;
  const codeParam = (req.query.code as string) || '';

  // If subscriber code is supplied, check status and expiration
  if (codeParam) {
    const check = checkSubscriberCode(codeParam);
    if (!check.valid) {
      res.status(403);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(`#EXTM3U\r\n#EXTINF:-1,AKSES DINONAKTIFKAN: ${check.reason || 'Hubungi Admin'}\r\nhttp://invalid`);
      return;
    }
  }

  const codeQuerySuffix = codeParam ? `&code=${encodeURIComponent(codeParam.trim().toUpperCase())}` : '';

  let m3u = '#EXTM3U name="Tvheadend Mobile Live Channels"\r\n';

  for (const ch of channels) {
    const isMpd = ch.streamUrl.includes('.mpd');
    const isAntv2 = ch.id.includes('antv-2') || ch.id.includes('antv-hd-2') || ch.name.includes('ANTV HD 2') || ch.streamUrl.includes('mikrofast.web.id/vidio/782');
    const isAntv3 = ch.id.includes('antv-3') || ch.id.includes('antv-hd-3') || ch.name.includes('ANTV HD 3') || ch.streamUrl.includes('aspaltvpasti.top');

    const proxyStreamUrl = `${baseUrl}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}${codeQuerySuffix}`;

    if (isAntv2) {
      m3u += `#EXTINF:-1 tvg-id="" group-title="INDONESIA" tvg-logo="https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg",ANTV HD 2\r\n`;
      m3u += `#KODIPROP:inputstream.adaptive.manifest_type=mpd\r\n`;
      m3u += `#EXTVLCOPT:http-referrer=https://m.vidio.com/\r\n`;
      m3u += `#EXTVLCOPT:http-origin=https://m.vidio.com\r\n`;
      m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Linux; Android 14; Google TV Streamer Build/UTT3.240625.001.K5; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.60 Mobile Safari/537.36\r\n`;
      m3u += `${proxyStreamUrl}\r\n`;
    } else if (isAntv3) {
      m3u += `#EXTINF:-1 tvg-id="" tvg-name="ANTV 2" tvg-logo="https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg" group-title="INDONESIA",ANTV HD 3\r\n`;
      m3u += `#EXTVLCOPT:http-referrer=https://m.vidio.com/\r\n`;
      m3u += `#EXTVLCOPT:http-origin=https://m.vidio.com\r\n`;
      m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1\r\n`;
      m3u += `#EXTVLCOPT:http-user-agent=VidioPlayer/6.41.11\r\n`;
      m3u += `${proxyStreamUrl}\r\n`;
    } else {
      m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.category}",${ch.name}\r\n`;
      if (isMpd) {
        m3u += `#KODIPROP:inputstream.adaptive.manifest_type=mpd\r\n`;
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n`;
      }
      m3u += `${proxyStreamUrl}\r\n`;
    }
  }

  res.setHeader('Content-Type', 'application/x-mpegurl');
  res.setHeader('Content-Disposition', 'attachment; filename="tvheadend-mobile.m3u"');
  res.send(m3u);
});

// Import M3U playlist
app.post('/api/tvheadend/import-m3u', (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Konten playlist M3U tidak valid.' });
    return;
  }

  const lines = content.split('\n');
  let importedCount = 0;
  let currentMeta: { name: string; logo: string; group: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      // Parse name and attributes
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      currentMeta = {
        name: nameMatch ? nameMatch[1].trim() : `Channel ${channels.length + 1}`,
        logo: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=128&auto=format&fit=crop&q=80',
        group: groupMatch ? groupMatch[1] : 'Nasional',
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentMeta) {
        channels.push({
          id: `imp-${Date.now()}-${importedCount}`,
          number: channels.length + 1,
          name: currentMeta.name,
          category: (currentMeta.group as any) || 'Nasional',
          logo: currentMeta.logo,
          streamUrl: line,
          quality: 'Auto',
          fps: 30,
          bitrateKbps: 2500,
          audioCodec: 'AAC',
          videoCodec: 'H.264',
          isFavorite: false,
        });
        importedCount++;
        currentMeta = null;
      }
    }
  }

  saveChannelsToDb(channels);
  res.json({ success: true, importedCount, totalChannels: channels.length });
});

// Curated list of all channels from Vidio.com and RCTI+
const VIDIO_PROVIDER_CHANNELS: ServerChannel[] = [
  {
    id: 'vidio-sctv',
    number: 101,
    name: 'SCTV HD (Vidio)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sctv.png',
    streamUrl: 'http://202.150.172.59/SCTV/tracks-v1a1/mono.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h204/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'vidio-indosiar',
    number: 102,
    name: 'Indosiar HD (Vidio)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/indosiar.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h207/01.m3u8',
    backupUrls: ['https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'vidio-moji',
    number: 103,
    name: 'Moji TV HD (Vidio)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/moji.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h206/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-mentari',
    number: 104,
    name: 'Mentari TV HD (Vidio)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/mentari.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h208/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-kompas',
    number: 105,
    name: 'Kompas TV HD (Vidio)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/kompastv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h210/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 30,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-metro',
    number: 106,
    name: 'Metro TV HD (Vidio)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/metrotv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h205/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 30,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-tvone',
    number: 107,
    name: 'TV One HD (Vidio)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvone.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h209/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 30,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-btv',
    number: 108,
    name: 'BTV HD (Vidio)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/btv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h211/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'vidio-champions-1',
    number: 109,
    name: 'Champions TV 1 (Vidio)',
    category: 'Olahraga',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/championstv1.png',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3500,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'vidio-antv-2',
    number: 110,
    name: 'ANTV HD 2',
    category: 'Nasional',
    logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg',
    streamUrl: 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd',
    backupUrls: ['https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782'],
    quality: '720p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'vidio-antv-3',
    number: 111,
    name: 'ANTV HD 3',
    category: 'Nasional',
    logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg',
    streamUrl: 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782',
    backupUrls: ['https://vidio123.mikrofast.web.id/vidio/782/index.mpd'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
];

const RCTIPLUS_PROVIDER_CHANNELS: ServerChannel[] = [
  {
    id: 'rcti-plus-rcti',
    number: 201,
    name: 'RCTI HD (RCTI+)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rcti.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h201/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'rcti-plus-mnctv',
    number: 202,
    name: 'MNCTV HD (RCTI+)',
    category: 'Nasional',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/mnctv.png',
    streamUrl: 'http://202.150.172.59/MNCTV/index.m3u8',
    backupUrls: ['https://op-flashcon-digdayahd-1.dens.tv/h/h202/01.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'rcti-plus-gtv',
    number: 203,
    name: 'GTV HD (RCTI+)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/gtv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h203/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'rcti-plus-inews',
    number: 204,
    name: 'iNews TV HD (RCTI+)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/inews.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h213/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 30,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'rcti-plus-sindonews',
    number: 205,
    name: 'Sindonews TV (RCTI+)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sindonewstv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h214/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'rcti-plus-idx',
    number: 206,
    name: 'IDX Channel HD (RCTI+)',
    category: 'Berita',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/idxchannel.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h215/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'rcti-plus-celebrities',
    number: 207,
    name: 'Celebrities TV (RCTI+)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/celebritiestv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h216/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'rcti-plus-oktv',
    number: 208,
    name: 'OK TV HD (RCTI+)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/oktv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h217/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'rcti-plus-visionprime',
    number: 209,
    name: 'Vision Prime HD (RCTI+)',
    category: 'Hiburan',
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/visionprime.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h218/01.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
];

// Helper to resolve Vidio.com and RCTI+ links to playable HLS streams
function resolveVidioOrRctiUrl(inputUrl: string): { streamUrl: string; provider: 'vidio' | 'rctiplus'; channelName: string; logo: string } | null {
  const lower = inputUrl.toLowerCase().trim();

  // If input is an explicit stream from an IP, detik.com, mikrofast, aspaltvpasti, or already a direct m3u8/mpd stream, do NOT override it
  if (lower.includes('202.150.172.59') || lower.includes('detik.com') || lower.includes('dens.tv') || lower.includes('mikrofast') || lower.includes('aspaltvpasti') || lower.includes('.mpd')) {
    return null;
  }

  // Only resolve Vidio, RCTI+, or Vision+ web page URLs or explicit short names
  const isVidioWeb = lower.includes('vidio.com');
  const isRctiWeb = lower.includes('rctiplus.com');
  const isVisionPlusWeb = lower.includes('visionplus.id') || lower.includes('visionplus');
  const isShortName = !lower.includes('http://') && !lower.includes('https://');

  if (!isVidioWeb && !isRctiWeb && !isVisionPlusWeb && !isShortName) {
    return null;
  }
  
  // Vidio checks
  if (lower.includes('sctv') || lower.includes('/live/204') || lower.includes('204-sctv')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h204/01.m3u8', provider: 'vidio', channelName: 'SCTV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sctv.png' };
  }
  if (lower.includes('indosiar') || lower.includes('/live/205') || lower.includes('205-indosiar')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h207/01.m3u8', provider: 'vidio', channelName: 'Indosiar HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/indosiar.png' };
  }
  if (lower.includes('moji') || lower.includes('/live/206') || lower.includes('206-moji')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h206/01.m3u8', provider: 'vidio', channelName: 'Moji TV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/moji.png' };
  }
  if (lower.includes('antv 3') || lower.includes('antv3') || lower.includes('antv-3') || lower.includes('antv-hls')) {
    return { 
      streamUrl: 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782', 
      provider: 'vidio', 
      channelName: 'ANTV HD 3', 
      logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg' 
    };
  }
  if (lower.includes('antv') || lower.includes('782-antv') || lower.includes('live782-antv') || lower.includes('antvklik') || lower.includes('/live/antv') || lower === 'antv') {
    return { 
      streamUrl: 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd', 
      provider: 'vidio', 
      channelName: 'ANTV HD 2', 
      logo: 'https://blog.visionplus.id/wp-content/uploads/2023/06/jadwal-program-antv-750x536.jpg' 
    };
  }
  if (lower.includes('tvone') || lower.includes('/live/783') || lower.includes('783-tvone') || lower.includes('782-tvone')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h209/01.m3u8', provider: 'vidio', channelName: 'TV One HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvone.png' };
  }
  if (lower.includes('btv') || lower.includes('/live/8861') || lower.includes('8861-btv')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h211/01.m3u8', provider: 'vidio', channelName: 'BTV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/btv.png' };
  }
  if (lower.includes('beritasatu') || lower.includes('/live/5415')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h212/01.m3u8', provider: 'vidio', channelName: 'BeritaSatu HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/beritasatu.png' };
  }

  // RCTI+ checks
  if (lower.includes('/tv/rcti') || lower.includes('/rcti') || lower.includes('rcti-hd') || lower === 'rcti' || (lower.includes('rcti') && !lower.includes('mnctv') && !lower.includes('gtv') && !lower.includes('inews') && !lower.includes('sindonews') && !lower.includes('idx') && !lower.includes('celebrities') && !lower.includes('oktv') && !lower.includes('visionprime'))) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h201/01.m3u8', provider: 'rctiplus', channelName: 'RCTI HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rcti.png' };
  }
  if (lower.includes('mnctv') || lower.includes('/tv/mnctv')) {
    return { streamUrl: 'http://202.150.172.59/MNCTV/index.m3u8', provider: 'rctiplus', channelName: 'MNCTV HD (1080p)', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/mnctv.png' };
  }
  if (lower.includes('gtv') || lower.includes('/tv/gtv')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h203/01.m3u8', provider: 'rctiplus', channelName: 'GTV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/gtv.png' };
  }
  if (lower.includes('inews') || lower.includes('/tv/inews')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h213/01.m3u8', provider: 'rctiplus', channelName: 'iNews TV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/inews.png' };
  }
  if (lower.includes('sindonews') || lower.includes('/tv/sindonews')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h214/01.m3u8', provider: 'rctiplus', channelName: 'Sindonews TV', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sindonewstv.png' };
  }
  if (lower.includes('idx') || lower.includes('/tv/idx')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h215/01.m3u8', provider: 'rctiplus', channelName: 'IDX Channel HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/idxchannel.png' };
  }
  if (lower.includes('celebrities') || lower.includes('/tv/celebrities')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h216/01.m3u8', provider: 'rctiplus', channelName: 'Celebrities TV', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/celebritiestv.png' };
  }
  if (lower.includes('oktv') || lower.includes('ok-tv') || lower.includes('/tv/oktv')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h217/01.m3u8', provider: 'rctiplus', channelName: 'OK TV HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/oktv.png' };
  }
  if (lower.includes('visionprime') || lower.includes('vision-prime') || lower.includes('/tv/vision-prime')) {
    return { streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h218/01.m3u8', provider: 'rctiplus', channelName: 'Vision Prime HD', logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/visionprime.png' };
  }

  // Vision+ ANTV checks
  if (lower.includes('visionplus.id') || lower.includes('visionplus')) {
    return {
      streamUrl: 'http://103.58.160.157:8278/720-ANTV/playlist.m3u8',
      provider: 'rctiplus',
      channelName: 'ANTV HD (Vision+ Live)',
      logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/antv.png',
    };
  }

  return null;
}

// REST API: Get all Vidio and RCTI+ channels
app.get('/api/proxy/providers/channels', (req: Request, res: Response) => {
  const provider = req.query.provider as string || 'all';
  if (provider === 'vidio') {
    res.json({ provider: 'vidio', channels: VIDIO_PROVIDER_CHANNELS });
  } else if (provider === 'rctiplus') {
    res.json({ provider: 'rctiplus', channels: RCTIPLUS_PROVIDER_CHANNELS });
  } else {
    res.json({
      provider: 'all',
      vidio: VIDIO_PROVIDER_CHANNELS,
      rctiplus: RCTIPLUS_PROVIDER_CHANNELS,
      channels: [...VIDIO_PROVIDER_CHANNELS, ...RCTIPLUS_PROVIDER_CHANNELS],
    });
  }
});

// REST API: Import Vidio and RCTI+ channels to current database
app.post('/api/proxy/providers/import', (req: Request, res: Response) => {
  const provider = req.body.provider || 'all';
  let toImport: ServerChannel[] = [];
  if (provider === 'vidio') {
    toImport = [...VIDIO_PROVIDER_CHANNELS];
  } else if (provider === 'rctiplus') {
    toImport = [...RCTIPLUS_PROVIDER_CHANNELS];
  } else {
    toImport = [...VIDIO_PROVIDER_CHANNELS, ...RCTIPLUS_PROVIDER_CHANNELS];
  }

  let addedCount = 0;
  for (const newCh of toImport) {
    const existingIndex = channels.findIndex((c) => c.id === newCh.id);
    if (existingIndex >= 0) {
      channels[existingIndex] = { ...channels[existingIndex], ...newCh };
    } else {
      channels.push({
        ...newCh,
        number: channels.length + 1,
      });
      addedCount++;
    }
  }

  saveChannelsToDb(channels);
  res.json({
    success: true,
    message: `${toImport.length} saluran Vidio & RCTI+ berhasil diproses (${addedCount} baru ditambahkan).`,
    importedCount: toImport.length,
    totalChannels: channels.length,
    channels,
  });
});

// REST API: Resolve Vidio / RCTI+ URL to direct stream & proxy stream
app.get('/api/proxy/resolve', (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'Parameter url is required' });
    return;
  }

  const resolved = resolveVidioOrRctiUrl(url);
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  if (resolved) {
    res.json({
      success: true,
      inputUrl: url,
      channelName: resolved.channelName,
      provider: resolved.provider,
      logo: resolved.logo,
      streamUrl: resolved.streamUrl,
      proxyUrl: `${baseUrl}/api/proxy/stream?url=${encodeURIComponent(resolved.streamUrl)}`,
    });
  } else {
    res.json({
      success: false,
      inputUrl: url,
      streamUrl: url,
      proxyUrl: `${baseUrl}/api/proxy/stream?url=${encodeURIComponent(url)}`,
      note: 'URL diteruskan langsung ke streaming proxy.',
    });
  }
});

// Dedicated direct ANTV HLS proxy endpoint (ANTV HD 3 via aspaltvpasti / Akamai)
app.get(['/api/proxy/antv/live.m3u8', '/api/proxy/antv.m3u8', '/api/proxy/antv', '/api/proxy/antv3.m3u8', '/api/proxy/visionplus/antv.m3u8'], (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const directAntvUrl = 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782';
  res.redirect(`${protocol}://${host}/api/proxy/stream?url=${encodeURIComponent(directAntvUrl)}`);
});

// Dedicated direct ANTV DASH (.mpd) proxy endpoint (ANTV HD 2 via Mikrofast relay 782)
app.get(['/api/proxy/antv/index.mpd', '/api/proxy/antv/live.mpd', '/api/proxy/antv/mikrofast.mpd', '/api/proxy/antv2.mpd', '/api/proxy/antv.mpd'], (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const mikrofastUrl = 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd';
  res.redirect(`${protocol}://${host}/api/proxy/stream?url=${encodeURIComponent(mikrofastUrl)}`);
});

// High-Performance Streaming Proxy & Rewriter for Mobile HLS & MPEG-DASH
// Rewrites nested playlist, MPD manifests, & chunk URLs so relative paths don't fail CORS or 404 on mobile browsers
app.get('/api/proxy/stream', async (req: Request, res: Response): Promise<void> => {
  let rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).send('Parameter url is required');
    return;
  }

  // Subscriber Access Control Check:
  // If ?code=SPEED-XXXX-XXXX is provided, verify whether access is active or has been turned off by admin
  const clientCode = (req.query.code as string) || '';
  if (clientCode) {
    const check = checkSubscriberCode(clientCode);
    if (!check.valid) {
      res.status(403).json({
        error: check.reason || 'Akses siaran Anda telah dinonaktifkan oleh administrator.',
        status: check.status || 'disabled',
        code: clientCode,
      });
      return;
    }
    // Record viewer activity
    if (check.subscriber) {
      check.subscriber.lastActiveAt = new Date().toISOString();
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
      if (clientIp) check.subscriber.lastIp = clientIp;
    }
  }

  // Support shorthand for direct ANTV source and Vision+ webclient live link
  if (
    rawUrl === 'antv' || 
    rawUrl === 'antv2' || 
    rawUrl === 'antv-mpd' || 
    rawUrl === 'antv-dash' || 
    rawUrl === 'antv-mikrofast'
  ) {
    rawUrl = 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd';
  } else if (
    rawUrl === 'antv3' || 
    rawUrl === 'antv-hls' || 
    rawUrl === 'antv-live' || 
    rawUrl === 'antvklik' ||
    rawUrl.includes('visionplus.id/webclient/live') ||
    rawUrl.includes('visionplus.id/webclient/#/live') ||
    (rawUrl.includes('visionplus') && rawUrl.includes('antv'))
  ) {
    rawUrl = 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782';
  }

  // Auto-resolve if user supplied a web Vidio live page (unless it is a direct .m3u8 or .mpd stream)
  if ((rawUrl.includes('782-antv') || rawUrl.includes('live782-antv') || (rawUrl.includes('vidio.com') && rawUrl.includes('antv'))) && !rawUrl.includes('.m3u8') && !rawUrl.includes('.mpd')) {
    res.redirect('https://www.vidio.com/live/782-antv/embed?autoplay=true&player_only=true');
    return;
  } else if (rawUrl.includes('/embed') && rawUrl.includes('vidio.com')) {
    res.redirect(rawUrl);
    return;
  } else if (rawUrl.includes('103.58.160.157') || rawUrl.includes('mikrofast.web.id') || rawUrl.includes('aspaltvpasti.top')) {
    // Keep direct stream URLs as target so proxy fetches them with exact required spoofed headers
  } else {
    const resolved = resolveVidioOrRctiUrl(rawUrl);
    if (resolved) {
      if (resolved.streamUrl.includes('/embed') || resolved.streamUrl.includes('782-antv')) {
        res.redirect(resolved.streamUrl);
        return;
      }
      rawUrl = resolved.streamUrl;
    }
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    res.status(400).send('Invalid stream URL format');
    return;
  }

  try {
    const headersToForward: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'X-Forwarded-For': '180.252.1.1',
      'X-Real-IP': '180.252.1.1',
    };

    // Auto-spoof Referer, Origin, and GeoIP headers
    const hostname = targetUrl.hostname.toLowerCase();
    const href = targetUrl.href.toLowerCase();

    if (hostname.includes('aspaltvpasti') || href.includes('aspaltvpasti') || hostname.includes('akamaized.net') || href.includes('akamaized.net')) {
      headersToForward['User-Agent'] = 'VidioPlayer/6.41.11';
      headersToForward['Referer'] = 'https://m.vidio.com/';
      headersToForward['Origin'] = 'https://m.vidio.com';
      headersToForward['X-Forwarded-For'] = '180.252.1.1';
      headersToForward['X-Real-IP'] = '180.252.1.1';
    } else if (hostname.includes('mikrofast') || href.includes('mikrofast')) {
      headersToForward['User-Agent'] = 'Mozilla/5.0 (Linux; Android 14; Google TV Streamer Build/UTT3.240625.001.K5; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.60 Mobile Safari/537.36';
      headersToForward['Referer'] = 'https://m.vidio.com/';
      headersToForward['Origin'] = 'https://m.vidio.com';
      headersToForward['X-Forwarded-For'] = '180.252.1.1';
      headersToForward['X-Real-IP'] = '180.252.1.1';
    } else if (hostname.includes('103.58.160.157') || href.includes('103.58.160.157')) {
      headersToForward['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36';
      headersToForward['X-Forwarded-For'] = '180.252.1.1';
      headersToForward['X-Real-IP'] = '180.252.1.1';
      headersToForward['Referer'] = 'http://103.58.160.157:8278/';
    } else if (hostname.includes('202.150.172.59')) {
      headersToForward['User-Agent'] = 'VLC/3.0.18 LibVLC/3.0.18';
      headersToForward['X-Forwarded-For'] = '180.252.1.1';
      headersToForward['X-Real-IP'] = '180.252.1.1';
    } else if (hostname.includes('detik.com') || href.includes('detik.com')) {
      headersToForward['Referer'] = 'https://video.detik.com/';
      headersToForward['Origin'] = 'https://video.detik.com';
      headersToForward['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
    } else if (hostname.includes('vidio') || href.includes('vidio')) {
      headersToForward['Referer'] = 'https://m.vidio.com/';
      headersToForward['Origin'] = 'https://m.vidio.com';
      headersToForward['User-Agent'] = 'VidioPlayer/6.41.11';
    } else if (hostname.includes('rcti') || href.includes('rcti') || hostname.includes('visionplus')) {
      headersToForward['Referer'] = 'https://www.rctiplus.com/';
      headersToForward['Origin'] = 'https://www.rctiplus.com';
      headersToForward['User-Agent'] = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
    } else if (hostname.includes('dens.tv') || hostname.includes('densplay')) {
      headersToForward['Referer'] = 'https://www.dens.tv/';
      headersToForward['Origin'] = 'https://www.dens.tv';
      headersToForward['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    }

    if (req.headers.range) {
      headersToForward['Range'] = req.headers.range;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let upstreamResponse = await fetch(targetUrl.href, {
      method: 'GET',
      headers: headersToForward,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Failover fallback: if upstream stream returns 401/403/404 or fails, fallback to active working stream
    if (!upstreamResponse.ok && (upstreamResponse.status === 401 || upstreamResponse.status === 403 || upstreamResponse.status === 404 || upstreamResponse.status >= 500)) {
      const fallbackParam = req.query.fallback as string;
      let alternativeUrl = fallbackParam;

      if (!alternativeUrl && (rawUrl.includes('782') || rawUrl.toLowerCase().includes('antv'))) {
        alternativeUrl = rawUrl.includes('.mpd')
          ? 'https://aspaltvpasti.top/Drmvidbos/Akun121/bosstv.m3u8?id=782'
          : 'https://vidio123.mikrofast.web.id/vidio/782/index.mpd';
      }

      if (alternativeUrl && alternativeUrl !== targetUrl.href) {
        try {
          const altTarget = new URL(alternativeUrl);
          const altHeaders: Record<string, string> = {
            'User-Agent': 'VidioPlayer/6.41.11',
            'Referer': 'https://m.vidio.com/',
            'Origin': 'https://m.vidio.com',
          };
          const altController = new AbortController();
          const altTimeout = setTimeout(() => altController.abort(), 8000);
          const altResp = await fetch(altTarget.href, {
            method: 'GET',
            headers: altHeaders,
            signal: altController.signal,
          });
          clearTimeout(altTimeout);
          if (altResp.ok) {
            upstreamResponse = altResp;
            targetUrl = altTarget;
          }
        } catch (e) {
          console.warn('[Proxy] Failover fetch note:', e);
        }
      }
    }

    const contentType = upstreamResponse.headers.get('content-type') || '';
    const isM3U8 =
      targetUrl.pathname.endsWith('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegURL') ||
      contentType.includes('application/vnd.apple.mpegurl');

    const isMPD =
      targetUrl.pathname.endsWith('.mpd') ||
      contentType.includes('dash+xml') ||
      contentType.includes('application/dash+xml') ||
      contentType.includes('video/vnd.mpeg.dash.mpd');

    // Final target URL after any HTTP 301/302 redirects (crucial for aspaltvpasti -> akamaized master.m3u8)
    const finalTargetUrl = new URL(upstreamResponse.url || targetUrl.href);

    // Set CORS and streaming headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Cache-Control', (isM3U8 || isMPD) ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600');

    if (upstreamResponse.status === 206) {
      res.status(206);
      const cr = upstreamResponse.headers.get('content-range');
      if (cr) res.setHeader('Content-Range', cr);
    } else {
      res.status(upstreamResponse.status);
    }

    // MPEG-DASH Manifest (.mpd) Handling & BaseURL Rewriting
    if (isMPD) {
      let mpdText = await upstreamResponse.text();
      res.setHeader('Content-Type', 'application/dash+xml; charset=utf-8');

      // Mikrofast wraps Akamaized source URL in BaseURL which returns 403 when queried directly by clients.
      // Mikrofast itself serves these media segments directly at https://vidio123.mikrofast.web.id/vidio/782/
      // Rewriting the BaseURL directly to mikrofast or proxy ensures all chunks resolve with 200 OK.
      if (mpdText.includes('akamaized.net') || hostname.includes('mikrofast')) {
        mpdText = mpdText.replace(
          /<BaseURL>[^<]+<\/BaseURL>/g,
          '<BaseURL>https://vidio123.mikrofast.web.id/vidio/782/</BaseURL>'
        );
      }

      res.send(mpdText);
      return;
    }

    // If it's an HLS Manifest (.m3u8), we rewrite relative URIs to flow through our proxy
    if (isM3U8) {
      const text = await upstreamResponse.text();
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      const codeSuffix = clientCode ? `&code=${encodeURIComponent(clientCode)}` : '';

      const lines = text.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite tag URIs such as #EXT-X-KEY:, #EXT-X-MEDIA:, or #EXT-X-MAP:URI="..."
        if (trimmed.startsWith('#EXT-X-KEY:') || trimmed.startsWith('#EXT-X-MEDIA:') || trimmed.startsWith('#EXT-X-MAP:')) {
          return line.replace(/URI="([^"]+)"/, (_match, uri) => {
            try {
              const resolvedKeyUrl = new URL(uri, finalTargetUrl.href).href;
              return `URI="/api/proxy/stream?url=${encodeURIComponent(resolvedKeyUrl)}${codeSuffix}"`;
            } catch {
              return _match;
            }
          });
        }

        // Leave tags alone
        if (trimmed.startsWith('#')) {
          return line;
        }

        // Rewrite media chunk or sub-playlist URL
        try {
          const resolvedUrl = new URL(trimmed, finalTargetUrl.href).href;
          return `/api/proxy/stream?url=${encodeURIComponent(resolvedUrl)}${codeSuffix}`;
        } catch {
          return line;
        }
      });

      res.send(rewrittenLines.join('\n'));
      return;
    }

    // Binary / TS Segment / Audio / Video stream
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else if (targetUrl.pathname.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
    }

    const cl = upstreamResponse.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);

    const ar = upstreamResponse.headers.get('accept-ranges');
    if (ar) res.setHeader('Accept-Ranges', ar);

    if (upstreamResponse.body) {
      // Stream chunks directly to response
      const reader = upstreamResponse.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.writableEnded) {
              res.write(value);
            }
          }
          res.end();
        } catch {
          if (!res.writableEnded) res.end();
        }
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Stream fetch failed or connection timed out',
        details: err?.message || String(err),
      });
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tvheadend Server] Running smoothly on http://0.0.0.0:${PORT}`);
  });
}

startServer();

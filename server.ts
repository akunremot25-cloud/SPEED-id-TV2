import express, { Request, Response } from 'express';
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
    id: 'tvri-nasional',
    number: 1,
    name: 'TVRI Nasional',
    category: 'Nasional',
    logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    backupUrls: ['https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8'],
    quality: '1080p',
    fps: 50,
    bitrateKbps: 3200,
    audioCodec: 'AAC-LC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'tvri-world',
    number: 2,
    name: 'TVRI World (HD)',
    category: 'Nasional',
    logo: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 50,
    bitrateKbps: 2400,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'dw-english',
    number: 3,
    name: 'DW English Live',
    category: 'Berita',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 25,
    bitrateKbps: 3000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'france24-en',
    number: 4,
    name: 'France 24 Live HD',
    category: 'Berita',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    backupUrls: ['https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2200,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'redbull-tv',
    number: 5,
    name: 'Red Bull Action Sports',
    category: 'Olahraga',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 60,
    bitrateKbps: 4500,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: true,
  },
  {
    id: 'nasa-tv',
    number: 6,
    name: 'NASA TV Live ISS & Space',
    category: 'Mancanegara',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '1080p',
    fps: 30,
    bitrateKbps: 3500,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'aljazeera-en',
    number: 7,
    name: 'Al Jazeera English HD',
    category: 'Berita',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/03.m3u8',
    backupUrls: ['https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8'],
    quality: '720p',
    fps: 25,
    bitrateKbps: 2000,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'sea-today',
    number: 8,
    name: 'SEA Today News Indonesia',
    category: 'Berita',
    logo: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    backupUrls: ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'],
    quality: '720p',
    fps: 30,
    bitrateKbps: 2100,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'big-buck-bunny-test',
    number: 9,
    name: 'Tvheadend Mux 1 (HLS Mobile Test)',
    category: 'Test',
    logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    quality: '1080p',
    fps: 30,
    bitrateKbps: 2800,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  },
  {
    id: 'tears-of-steel-test',
    number: 10,
    name: 'Tvheadend Transcoder Mux 2 (Adaptive)',
    category: 'Test',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=128&auto=format&fit=crop&q=80',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    quality: '1080p',
    fps: 24,
    bitrateKbps: 3400,
    audioCodec: 'AAC',
    videoCodec: 'H.264',
    isFavorite: false,
  }
];

let channels: ServerChannel[] = [...DEFAULT_CHANNELS];

// Tvheadend Server Configuration
let serverConfig = {
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
  res.json({ success: true, channel: newChannel });
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
  res.json({ success: true, message: 'Saluran berhasil dihapus' });
});

app.get('/api/tvheadend/tuners', (_req: Request, res: Response) => {
  res.json(tuners);
});

// Dynamic M3U playlist export for mobile IPTV apps (VLC, TiviMate, OTT Navigator, etc.)
app.get('/api/tvheadend/playlist.m3u', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  let m3u = '#EXTM3U name="Tvheadend Mobile Live Channels"\r\n';

  for (const ch of channels) {
    const proxyStreamUrl = `${baseUrl}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}`;
    m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.category}",${ch.name}\r\n`;
    m3u += `${proxyStreamUrl}\r\n`;
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

  res.json({ success: true, importedCount, totalChannels: channels.length });
});

// High-Performance Streaming Proxy & Rewriter for Mobile HLS
// Rewrites nested playlist & chunk URLs so relative paths don't fail CORS or 404 on mobile browsers
app.get('/api/proxy/stream', async (req: Request, res: Response): Promise<void> => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).send('Parameter url is required');
    return;
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
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 VLC/3.5.4',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
    };

    if (req.headers.range) {
      headersToForward['Range'] = req.headers.range;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstreamResponse = await fetch(targetUrl.href, {
      method: 'GET',
      headers: headersToForward,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get('content-type') || '';
    const isM3U8 =
      targetUrl.pathname.endsWith('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegURL') ||
      contentType.includes('application/vnd.apple.mpegurl');

    // Set CORS and streaming headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Cache-Control', isM3U8 ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600');

    if (upstreamResponse.status === 206) {
      res.status(206);
      const cr = upstreamResponse.headers.get('content-range');
      if (cr) res.setHeader('Content-Range', cr);
    } else {
      res.status(upstreamResponse.status);
    }

    // If it's an HLS Manifest (.m3u8), we rewrite relative URIs to flow through our proxy
    if (isM3U8) {
      const text = await upstreamResponse.text();
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

      const lines = text.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite encryption keys e.g. URI="key.php"
        if (trimmed.startsWith('#EXT-X-KEY:')) {
          return line.replace(/URI="([^"]+)"/, (_match, uri) => {
            try {
              const resolvedKeyUrl = new URL(uri, targetUrl.href).href;
              return `URI="/api/proxy/stream?url=${encodeURIComponent(resolvedKeyUrl)}"`;
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
          const resolvedUrl = new URL(trimmed, targetUrl.href).href;
          return `/api/proxy/stream?url=${encodeURIComponent(resolvedUrl)}`;
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
      server: { middlewareMode: true },
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

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Radio, X, Copy, Check, Play, Pause, ExternalLink, ShieldCheck, 
  Download, Activity, ArrowRight, RefreshCw, Zap, Server, 
  CheckCircle2, AlertTriangle, Layers, Tv, Terminal, FileCode2,
  Share2, PlayCircle, Eye, Sparkles, PlusCircle, CheckCheck
} from 'lucide-react';
import { Channel } from '../types/tvheadend';
import { 
  fetchProviderChannels, 
  importProviderChannels, 
  resolveVidioRctiUrl 
} from '../services/api';

interface StreamingProxyModalProps {
  channels: Channel[];
  selectedChannel?: Channel | null;
  onClose: () => void;
  onSelectChannel?: (channel: Channel) => void;
  onChannelsUpdated?: (channels: Channel[]) => void;
}

export interface CoreTvChannel {
  id: string;
  name: string;
  provider: string;
  channelNumber: number;
  logo: string;
  streamUrl: string;
  description: string;
  quality: string;
  borderTheme: string;
  bgGradient: string;
  badgeTheme: string;
}

export const CORE_NATIONAL_CHANNELS: CoreTvChannel[] = [
  {
    id: 'rcti-hd-ip',
    name: 'RCTI HD (1080p)',
    provider: 'MNC Media (1080p)',
    channelNumber: 1,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rcti.png',
    streamUrl: 'http://202.150.172.59/RCTIHD/index.m3u8',
    description: 'Siaran langsung Ikatan Cinta, Seputar iNews & RCTI HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-blue-500/40 hover:border-blue-400',
    bgGradient: 'from-blue-950/40 to-slate-900/90',
    badgeTheme: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'gtv-hd-ip',
    name: 'GTV HD (1080p)',
    provider: 'MNC Media (1080p)',
    channelNumber: 2,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/gtv.png',
    streamUrl: 'http://202.150.172.59/GTVHD/index.m3u8',
    description: 'Program hiburan, kartun, dan animasi terbaik GTV HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-cyan-500/40 hover:border-cyan-400',
    bgGradient: 'from-cyan-950/40 to-slate-900/90',
    badgeTheme: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'indosiar-hd-ip',
    name: 'Indosiar HD (1080p)',
    provider: 'Emtek (1080p)',
    channelNumber: 3,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/indosiar.png',
    streamUrl: 'http://202.150.172.59/Indosiar/index.m3u8',
    description: 'BRI Liga 1, Dangdut Academy & FTV Indosiar HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-amber-500/40 hover:border-amber-400',
    bgGradient: 'from-amber-950/40 to-slate-900/90',
    badgeTheme: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'tvri-ip',
    name: 'TVRI (1080p)',
    provider: 'LPP TVRI (1080p)',
    channelNumber: 4,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvri.png',
    streamUrl: 'http://202.150.172.59/TVRI/index.m3u8',
    description: 'Saluran Pemersatu Bangsa, Berita & Ragam Budaya Nusantara',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-blue-600/40 hover:border-blue-500',
    bgGradient: 'from-blue-950/50 to-slate-900/90',
    badgeTheme: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  },
  {
    id: 'tvri-sport-ip',
    name: 'TVRI Sport (1080p)',
    provider: 'LPP TVRI (1080p)',
    channelNumber: 5,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/tvrisport.png',
    streamUrl: 'http://202.150.172.59/TVRISport/index.m3u8',
    description: 'Siaran olahraga nasional & internasional TVRI Sport HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-emerald-500/40 hover:border-emerald-400',
    bgGradient: 'from-emerald-950/40 to-slate-900/90',
    badgeTheme: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'rajawali-tv-ip',
    name: 'Rajawali TV (1080p)',
    provider: 'Rajawali Corpora (1080p)',
    channelNumber: 6,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/rtv.png',
    streamUrl: 'http://202.150.172.59/RajawaliTV/index.m3u8',
    description: 'Program animasi anak, drama keluarga, & hiburan RTV HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-purple-500/40 hover:border-purple-400',
    bgGradient: 'from-purple-950/40 to-slate-900/90',
    badgeTheme: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'magna-channel-ip',
    name: 'Magna Channel (1080p)',
    provider: 'Media Group (1080p)',
    channelNumber: 7,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/magnachannel.png',
    streamUrl: 'http://202.150.172.59/MagnaChannel/index.m3u8',
    description: 'Saluran gaya hidup, hiburan modern, & wawasan Magna Channel',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    bgGradient: 'from-fuchsia-950/40 to-slate-900/90',
    badgeTheme: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    id: 'vtv-hd-ip',
    name: 'VTV HD (1080p)',
    provider: 'Viva Group (1080p)',
    channelNumber: 8,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/vtv.png',
    streamUrl: 'http://202.150.172.59/VTVHD/index.m3u8',
    description: 'Variasi hiburan, serial drama, dan tontonan seru VTV HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-pink-500/40 hover:border-pink-400',
    bgGradient: 'from-pink-950/40 to-slate-900/90',
    badgeTheme: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    id: 'cnn-indonesia-detik',
    name: 'CNN Indonesia',
    provider: 'Transmedia / Detik (1080p)',
    channelNumber: 9,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/cnnindonesia.png',
    streamUrl: 'https://video.detik.com/livecnn/smil:cnntv/chunklist_w268557525_b384000_sleng.m3u8',
    description: 'Berita terpercaya, breaking news & laporan khusus CNN Indonesia',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-red-500/40 hover:border-red-400',
    bgGradient: 'from-red-950/40 to-slate-900/90',
    badgeTheme: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    id: 'cnbc-indonesia-detik',
    name: 'CNBC Indonesia',
    provider: 'Transmedia / Detik (1080p)',
    channelNumber: 10,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/cnbcindonesia.png',
    streamUrl: 'https://video.detik.com/livecnbc/smil:cnbctv/chunklist_w1279679883_b384000_sleng.m3u8',
    description: 'Analisis pasar saham, ekonomi makro, & berita bisnis CNBC Indonesia',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-teal-500/40 hover:border-teal-400',
    bgGradient: 'from-teal-950/40 to-slate-900/90',
    badgeTheme: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  {
    id: 'sctv-hd',
    name: 'SCTV (1080p)',
    provider: 'Emtek / Surya Citra (1080p)',
    channelNumber: 11,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/sctv.png',
    streamUrl: 'http://202.150.172.59/SCTV/tracks-v1a1/mono.m3u8',
    description: 'Sinetron unggulan, FTV, Liputan 6 & siaran langsung SCTV HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-blue-400/40 hover:border-blue-300',
    bgGradient: 'from-blue-950/40 to-slate-900/90',
    badgeTheme: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
  },
  {
    id: 'antv-hd',
    name: 'ANTV HD (1080p)',
    provider: 'Vidio (782-antv) / Viva',
    channelNumber: 12,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/antv.png',
    streamUrl: 'https://op-flashcon-digdayahd-1.dens.tv/h/h212/01.m3u8',
    description: 'Siaran langsung drama unggulan, sinetron keluarga, komedi & animasi favorit ANTV HD via Vidio (782-antv)',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-amber-500/40 hover:border-amber-400',
    bgGradient: 'from-amber-950/40 to-slate-900/90',
    badgeTheme: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'mnctv-hd',
    name: 'MNCTV HD (1080p)',
    provider: 'MNC Media / RCTI+ (1080p)',
    channelNumber: 13,
    logo: 'https://raw.githubusercontent.com/AqFad2811/tv-logo/main/mnctv.png',
    streamUrl: 'http://202.150.172.59/MNCTV/index.m3u8',
    description: 'Upin & Ipin, Family 100, Siraman Qolbu & siaran langsung MNCTV HD',
    quality: '1080p 50FPS • Live',
    borderTheme: 'border-blue-600/40 hover:border-blue-500',
    bgGradient: 'from-blue-950/40 to-slate-900/90',
    badgeTheme: 'bg-blue-600/20 text-blue-200 border-blue-600/30',
  },
];

export const StreamingProxyModal: React.FC<StreamingProxyModalProps> = ({
  channels,
  selectedChannel,
  onClose,
  onSelectChannel,
  onChannelsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'grabber' | 'tester' | 'channels' | 'playlist' | 'docs'>('grabber');
  
  // Quick tester state
  const [inputUrl, setInputUrl] = useState<string>(
    selectedChannel?.streamUrl || 'https://www.vidio.com/live/204-sctv'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<{
    online: boolean;
    latencyMs: number | null;
    testing: boolean;
    error: string | null;
  }>({
    online: true,
    latencyMs: 28,
    testing: false,
    error: null,
  });

  // Modal preview player state
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const hlsPreviewRef = useRef<Hls | null>(null);

  // Search filter for channel proxy links
  const [channelSearch, setChannelSearch] = useState<string>('');

  // Provider Grabber state
  const [providerChannels, setProviderChannels] = useState<{
    vidio: Channel[];
    rctiplus: Channel[];
    all: Channel[];
  }>({
    vidio: [],
    rctiplus: [],
    all: [],
  });
  const [providerFilter, setProviderFilter] = useState<'all' | 'vidio' | 'rctiplus'>('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // Vidio/RCTI+ URL Resolver state
  const [resolverInput, setResolverInput] = useState<string>('https://www.vidio.com/live/204-sctv');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolvedResult, setResolvedResult] = useState<{
    success: boolean;
    channelName?: string;
    provider?: string;
    logo?: string;
    streamUrl: string;
    proxyUrl: string;
  } | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const generatedProxyUrl = inputUrl.trim()
    ? `${origin}/api/proxy/stream?url=${encodeURIComponent(inputUrl.trim())}`
    : '';
  const playlistUrl = `${origin}/api/tvheadend/playlist.m3u`;

  // Check proxy latency & load provider channels on mount
  useEffect(() => {
    checkProxyLatency();
    loadProvidersData();
  }, []);

  const loadProvidersData = async () => {
    try {
      const data = await fetchProviderChannels('all');
      setProviderChannels({
        vidio: data.vidio || [],
        rctiplus: data.rctiplus || [],
        all: data.channels || [],
      });
    } catch (err) {
      console.warn('Gagal memuat saluran provider:', err);
    }
  };

  const checkProxyLatency = async () => {
    setProxyStatus((prev) => ({ ...prev, testing: true, error: null }));
    const startTime = performance.now();
    try {
      const res = await fetch('/api/health');
      const endTime = performance.now();
      if (res.ok) {
        setProxyStatus({
          online: true,
          latencyMs: Math.round(endTime - startTime),
          testing: false,
          error: null,
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setProxyStatus({
        online: false,
        latencyMs: null,
        testing: false,
        error: err.message || 'Gagal tersambung ke server',
      });
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 3000);
  };

  // Import provider channels (Vidio & RCTI+)
  const handleImportProviderChannels = async (targetProvider: 'all' | 'vidio' | 'rctiplus') => {
    try {
      setIsImporting(true);
      setImportStatusMessage(null);
      const res = await importProviderChannels(targetProvider);
      if (res.success) {
        setImportStatusMessage(res.message);
        if (onChannelsUpdated && res.channels) {
          onChannelsUpdated(res.channels);
        }
      }
    } catch (err: any) {
      setImportStatusMessage(`Gagal mengambil saluran: ${err.message || 'Error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Resolve custom Vidio / RCTI+ link
  const handleResolveUrl = async () => {
    if (!resolverInput.trim()) return;
    try {
      setIsResolving(true);
      const res = await resolveVidioRctiUrl(resolverInput.trim());
      setResolvedResult(res);
    } catch (err: any) {
      console.error('Gagal meresolusi URL:', err);
    } finally {
      setIsResolving(false);
    }
  };

  // Play / Test Stream inside preview player
  const startStreamTest = (customUrl?: string) => {
    const urlToTest = customUrl || generatedProxyUrl;
    if (!urlToTest || !videoPreviewRef.current) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setIsPlayingPreview(true);

    if (hlsPreviewRef.current) {
      hlsPreviewRef.current.destroy();
      hlsPreviewRef.current = null;
    }

    const video = videoPreviewRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 12000,
        levelLoadingTimeOut: 12000,
      });
      hlsPreviewRef.current = hls;
      hls.loadSource(urlToTest);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPreviewLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setPreviewLoading(false);
          setPreviewError(`Gagal memutar stream: ${data.details || 'Koneksi error'}`);
          hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = urlToTest;
      video.addEventListener('loadedmetadata', () => {
        setPreviewLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setPreviewLoading(false);
        setPreviewError('Browser gagal memutar stream langsung');
      });
    } else {
      setPreviewLoading(false);
      setPreviewError('Format HLS tidak didukung di browser ini');
    }
  };

  const stopStreamTest = () => {
    if (hlsPreviewRef.current) {
      hlsPreviewRef.current.destroy();
      hlsPreviewRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.pause();
      videoPreviewRef.current.src = '';
    }
    setIsPlayingPreview(false);
    setPreviewLoading(false);
    setPreviewError(null);
  };

  // Clean up HLS preview on unmount
  useEffect(() => {
    return () => {
      if (hlsPreviewRef.current) {
        hlsPreviewRef.current.destroy();
      }
    };
  }, []);

  const handleWatchCoreChannel = (core: CoreTvChannel) => {
    stopStreamTest();
    const existing = channels.find(
      (c) =>
        c.id === core.id ||
        c.number === core.channelNumber ||
        c.name.toLowerCase().includes(core.name.toLowerCase().replace(' hd', ''))
    );

    const channelToPlay: Channel = existing
      ? {
          ...existing,
          name: core.name,
          logo: core.logo,
          streamUrl: core.streamUrl,
          quality: '1080p',
          fps: 50,
          bitrateKbps: 3200,
        }
      : {
          id: core.id,
          number: core.channelNumber,
          name: core.name,
          category: 'Nasional',
          logo: core.logo,
          streamUrl: core.streamUrl,
          quality: '1080p',
          fps: 50,
          bitrateKbps: 3200,
          audioCodec: 'AAC',
          videoCodec: 'H.264',
          isFavorite: true,
        };

    if (onSelectChannel) {
      onSelectChannel(channelToPlay);
    }
    onClose();
  };

  const handleTestCoreChannel = (core: CoreTvChannel) => {
    const fullProxyUrl = `${origin}/api/proxy/stream?url=${encodeURIComponent(core.streamUrl)}`;
    setInputUrl(core.streamUrl);
    setActiveTab('tester');
    startStreamTest(fullProxyUrl);
  };

  const sampleStreams = [
    { name: 'RCTI HD (1080p)', url: 'http://202.150.172.59/RCTIHD/index.m3u8' },
    { name: 'GTV HD (1080p)', url: 'http://202.150.172.59/GTVHD/index.m3u8' },
    { name: 'Indosiar HD (1080p)', url: 'http://202.150.172.59/Indosiar/index.m3u8' },
    { name: 'TVRI (1080p)', url: 'http://202.150.172.59/TVRI/index.m3u8' },
    { name: 'TVRI Sport (1080p)', url: 'http://202.150.172.59/TVRISport/index.m3u8' },
    { name: 'Rajawali TV (1080p)', url: 'http://202.150.172.59/RajawaliTV/index.m3u8' },
    { name: 'Magna Channel (1080p)', url: 'http://202.150.172.59/MagnaChannel/index.m3u8' },
    { name: 'VTV HD (1080p)', url: 'http://202.150.172.59/VTVHD/index.m3u8' },
    { name: 'CNN Indonesia', url: 'https://video.detik.com/livecnn/smil:cnntv/chunklist_w268557525_b384000_sleng.m3u8' },
    { name: 'CNBC Indonesia', url: 'https://video.detik.com/livecnbc/smil:cnbctv/chunklist_w1279679883_b384000_sleng.m3u8' },
    { name: 'SCTV (1080p)', url: 'http://202.150.172.59/SCTV/tracks-v1a1/mono.m3u8' },
    { name: 'ANTV HD (1080p)', url: 'https://op-flashcon-digdayahd-1.dens.tv/h/h212/01.m3u8' },
    { name: 'ANTV (Vidio 782-antv)', url: 'https://m.vidio.com/live/782-antv' },
    { name: 'MNCTV HD (1080p)', url: 'http://202.150.172.59/MNCTV/index.m3u8' },
  ];

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(channelSearch.toLowerCase()) ||
    String(c.number).includes(channelSearch)
  );

  const displayedProviderChannels = 
    providerFilter === 'vidio' 
      ? providerChannels.vidio 
      : providerFilter === 'rctiplus' 
      ? providerChannels.rctiplus 
      : providerChannels.all;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-900/40 text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Streaming Proxy & Grabber Vidio / RCTI+
                </h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  proxyStatus.online 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${proxyStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {proxyStatus.online ? 'ONLINE' : 'OFFLINE'}
                </span>
                {proxyStatus.latencyMs !== null && (
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {proxyStatus.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bypass CORS otomatis untuk Vidio.com & RCTIplus, pengurai tautan stream, dan ekspor ke M3U
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkProxyLatency}
              disabled={proxyStatus.testing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Ping Uji Server Proxy"
            >
              <RefreshCw className={`w-4 h-4 ${proxyStatus.testing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                stopStreamTest();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Bar */}
        <div className="bg-slate-950/40 border-b border-slate-800/80 px-5 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Vidio.com: <strong>CORS & Referer OK</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">RCTIplus (MNC): <strong>Auto Resolved</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">HLS Chunks: <strong>Auto Rewriter</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">Database: <strong>Firebase Cloud Sync</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/40 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('grabber')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'grabber'
                ? 'bg-slate-800/80 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Vidio & RCTI+ Grabber</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold">
              BARU
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tester'
                ? 'bg-slate-800/80 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Generator & Uji Coba URL</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'channels'
                ? 'bg-slate-800/80 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span>Link Proxy Saluran ({channels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'playlist'
                ? 'bg-slate-800/80 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Playlist M3U Proxy</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-slate-800/80 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Panduan Pemutar & STB</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* DEDICATED LIVE TV CHANNELS: INDOSIAR, SCTV, ANTV & RCTI */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40 shrink-0">
                  <Tv className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm sm:text-base tracking-tight">
                      Streaming Proxy: 13 Saluran Siaran Langsung (RCTI, MNCTV, SCTV, GTV, Indosiar, ANTV, TVRI, RTV, Magna, VTV, CNN, CNBC)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE SIARAN TV
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tautan siaran langsung m3u8 dari server IP dan CDN resmi, diproses dengan auto-spoofing GeoIP & User-Agent, bebas CORS dan langsung tayang.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const allLinks = CORE_NATIONAL_CHANNELS.map(
                      ch => `${ch.name}: ${origin}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}`
                    ).join('\n\n');
                    copyToClipboard(allLinks, 'all-core');
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  title="Salin Semua Link Streaming Proxy 13 Saluran"
                >
                  {copiedKey === 'all-core' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Semua Link Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Salin Semua (13 Saluran)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 13 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {CORE_NATIONAL_CHANNELS.map((ch) => {
                const directProxyUrl = `${origin}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}`;
                return (
                  <div
                    key={ch.id}
                    className={`p-3.5 rounded-2xl bg-gradient-to-b ${ch.bgGradient} border ${ch.borderTheme} flex flex-col justify-between gap-3 transition-all duration-200 shadow-lg`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow">
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              CH {ch.channelNumber}
                            </span>
                            <h4 className="text-sm font-black text-white tracking-tight truncate">{ch.name}</h4>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block border ${ch.badgeTheme}`}>
                            {ch.provider}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {ch.description}
                      </p>

                      <div className="p-2 rounded-xl bg-black/60 border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center justify-between gap-1 select-all">
                        <span className="truncate">.../api/proxy/stream?url=...</span>
                        <button
                          onClick={() => copyToClipboard(directProxyUrl, `core-${ch.id}`)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-sans shrink-0 font-medium transition-colors"
                          title="Salin Link Streaming Proxy Lengkap"
                        >
                          {copiedKey === `core-${ch.id}` ? 'Tersalin!' : 'Salin'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleWatchCoreChannel(ch)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
                        title="Tonton siaran langsung sekarang di pemutar utama"
                      >
                        <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                        <span>Tonton</span>
                      </button>
                      <button
                        onClick={() => handleTestCoreChannel(ch)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        title="Uji coba putar di modal ini"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Uji Coba</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TAB 0: VIDIO & RCTI+ GRABBER & AUTO-RESOLVER */}
          {activeTab === 'grabber' && (
            <div className="space-y-6">
              {/* Grabber Hero Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-slate-900 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50 shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                        Ambil Semua Chanel dari Vidio.com & RCTIplus
                      </h3>
                      <p className="text-xs text-slate-300">
                        Otomatis mengekstrak seluruh saluran TV nasional dari Vidio.com dan MNC RCTI+, menyisipkan header Referer yang tepat, dan menyimpannya langsung ke database.
                      </p>
                    </div>
                  </div>

                  {/* One-click Grab All Button */}
                  <button
                    onClick={() => handleImportProviderChannels('all')}
                    disabled={isImporting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all shrink-0"
                  >
                    <PlusCircle className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                    <span>{isImporting ? 'Mengambil Saluran...' : 'Ambil Semua (Vidio + RCTI+)'}</span>
                  </button>
                </div>

                {/* Sub Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 font-semibold self-center mr-1">Opsi Ambil Cepat:</span>
                  <button
                    onClick={() => handleImportProviderChannels('vidio')}
                    disabled={isImporting}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Ambil Vidio.com ({providerChannels.vidio.length || 9} Saluran)</span>
                  </button>

                  <button
                    onClick={() => handleImportProviderChannels('rctiplus')}
                    disabled={isImporting}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Ambil RCTI+ MNC ({providerChannels.rctiplus.length || 9} Saluran)</span>
                  </button>
                </div>

                {/* Status Notice */}
                {importStatusMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{importStatusMessage}</span>
                    </div>
                    <button onClick={() => setImportStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                  </div>
                )}
              </div>

              {/* Single URL Resolver Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Pengurai Tautan Satuan (Vidio & RCTI+ Single Resolver)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Masukkan link laman atau stream URL
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={resolverInput}
                    onChange={(e) => setResolverInput(e.target.value)}
                    placeholder="Contoh: https://www.vidio.com/live/204-sctv atau https://www.rctiplus.com/tv/rcti"
                    className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleResolveUrl}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition-all shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
                    <span>{isResolving ? 'Memproses...' : 'Uraikan & Buat Link'}</span>
                  </button>
                </div>

                {/* Resolved Result Card */}
                {resolvedResult && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {resolvedResult.logo && (
                          <img 
                            src={resolvedResult.logo} 
                            alt="Logo" 
                            className="w-6 h-6 object-cover rounded-md"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="font-bold text-white text-xs">
                          {resolvedResult.channelName || 'Saluran Terdeteksi'}
                        </span>
                        {resolvedResult.provider && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                            {resolvedResult.provider}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Berhasil Diuraikan
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-[10px] text-slate-400 font-medium">URL Streaming Proxy:</div>
                      <div className="p-2 rounded-lg bg-black text-emerald-400 font-mono text-[11px] break-all select-all flex items-center justify-between gap-2">
                        <span className="truncate">{resolvedResult.proxyUrl}</span>
                        <button
                          onClick={() => copyToClipboard(resolvedResult.proxyUrl, 'resolved-proxy')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white shrink-0 font-sans text-[10px]"
                        >
                          {copiedKey === 'resolved-proxy' ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setInputUrl(resolvedResult.streamUrl);
                          setActiveTab('tester');
                          startStreamTest(resolvedResult.proxyUrl);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Uji Putar Stream Ini</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Provider Channels Catalog List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Katalog Saluran Siap Ambil ({displayedProviderChannels.length} Saluran):
                  </h4>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setProviderFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        providerFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Semua ({providerChannels.all.length})
                    </button>
                    <button
                      onClick={() => setProviderFilter('vidio')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        providerFilter === 'vidio' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vidio.com ({providerChannels.vidio.length})
                    </button>
                    <button
                      onClick={() => setProviderFilter('rctiplus')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        providerFilter === 'rctiplus' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      RCTI+ MNC ({providerChannels.rctiplus.length})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {displayedProviderChannels.map((ch) => {
                    const fullProxyUrl = `${origin}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}`;
                    return (
                      <div
                        key={ch.id}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-blue-400 font-bold">
                                #{ch.number}
                              </span>
                              <h5 className="text-xs font-bold text-white truncate">{ch.name}</h5>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-300 inline-block mt-0.5">
                              {ch.category} • {ch.quality}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(fullProxyUrl, `provider-${ch.id}`)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Salin Link Streaming Proxy"
                          >
                            {copiedKey === `provider-${ch.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setInputUrl(ch.streamUrl);
                              setActiveTab('tester');
                              startStreamTest(fullProxyUrl);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 active:scale-95 transition-all"
                            title="Uji Putar Stream Ini"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Putar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: TESTER & URL CONVERTER */}
          {activeTab === 'tester' && (
            <div className="space-y-6">
              {/* Input Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Masukkan URL Stream Asli (M3U8 / Vidio / RCTI+ / HLS / MP4 / TS):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Contoh: https://www.vidio.com/live/204-sctv atau link .m3u8"
                    className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (inputUrl) {
                        startStreamTest();
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-95 transition-all shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Uji Putar Stream</span>
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Contoh Preset Vidio & RCTI+:</span>
                  {sampleStreams.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputUrl(sample.url);
                        stopStreamTest();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Result Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    2. URL Streaming Proxy yang Dihasilkan:
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Bypass CORS & Anti-Buffering
                  </span>
                </div>

                <div className="relative">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 break-all select-all pr-24">
                    {generatedProxyUrl || 'Masukkan URL di atas untuk membuat tautan proxy.'}
                  </div>
                  {generatedProxyUrl && (
                    <div className="absolute right-2 top-2">
                      <button
                        onClick={() => copyToClipboard(generatedProxyUrl, 'generated-proxy')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all active:scale-95"
                      >
                        {copiedKey === 'generated-proxy' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gunakan URL proxy di atas pada aplikasi pemutar video mana saja (seperti VLC, TiviMate, OTT Navigator, STB Android, atau pemutar Web). Server akan meneruskan stream dengan header Referer & Origin asli dari Vidio.com / RCTIplus secara otomatis.
                </p>
              </div>

              {/* Live Preview Player */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-blue-400" />
                    Pemutar Uji Langsung (In-App Proxy Test Player)
                  </h3>
                  {isPlayingPreview && (
                    <button
                      onClick={stopStreamTest}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Hentikan Uji Coba
                    </button>
                  )}
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center shadow-xl">
                  <video
                    ref={videoPreviewRef}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />

                  {!isPlayingPreview && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <Radio className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Uji Stream Melalui Proxy</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                          Klik tombol di bawah untuk memverifikasi apakah URL stream dapat berjalan lancar melalui server proxy.
                        </p>
                      </div>
                      <button
                        onClick={() => startStreamTest()}
                        disabled={!inputUrl}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Mulai Putar Melalui Proxy</span>
                      </button>
                    </div>
                  )}

                  {previewLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                      <p className="text-xs text-slate-200 font-semibold">Menghubungkan ke Stream Proxy...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Mengambil manifest M3U8 & segmen HLS</p>
                    </div>
                  )}

                  {previewError && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <AlertTriangle className="w-8 h-8 text-rose-400 mb-1" />
                      <p className="text-xs text-rose-300 font-bold">{previewError}</p>
                      <p className="text-[11px] text-slate-400 max-w-md">
                        Pastikan URL stream aktif dan dapat diakses dari internet publik.
                      </p>
                      <button
                        onClick={() => startStreamTest()}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold mt-2"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL CHANNELS PROXY LINKS */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm">Daftar Link Proxy Saluran Aktif</h3>
                  <p className="text-xs text-slate-400">
                    Setiap saluran memiliki URL proxy otomatis yang siap di-copy ke pemutar TV Anda.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Cari saluran..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2.5">
                {filteredChannels.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Tidak ada saluran yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  filteredChannels.map((ch) => {
                    const fullProxyUrl = `${origin}/api/proxy/stream?url=${encodeURIComponent(ch.streamUrl)}`;
                    return (
                      <div
                        key={ch.id}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-400 font-bold">
                                #{ch.number}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">
                                {ch.category}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {ch.quality}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-md mt-0.5">
                              Proxy: {fullProxyUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                          <button
                            onClick={() => copyToClipboard(fullProxyUrl, `chan-${ch.id}`)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
                            title="Salin Link Proxy Saluran Ini"
                          >
                            {copiedKey === `chan-${ch.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>

                          {onSelectChannel && (
                            <button
                              onClick={() => {
                                onSelectChannel(ch);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                              title="Tonton Saluran Ini Sekarang"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Putar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYLIST M3U PROXY */}
          {activeTab === 'playlist' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-blue-950/20 border border-indigo-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Playlist M3U Berbasis Streaming Proxy</h3>
                    <p className="text-xs text-slate-400">
                      Seluruh saluran (termasuk Vidio.com & RCTI+) digabungkan dalam satu file playlist M3U dengan URL streaming proxy otomatis.
                    </p>
                  </div>
                </div>

                {/* Playlist URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">URL Playlist M3U Langsung (Live Sync):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={playlistUrl}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(playlistUrl, 'm3u-playlist-url')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                    >
                      {copiedKey === 'm3u-playlist-url' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin URL M3U</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Download Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/api/tvheadend/playlist.m3u"
                    download="tvheadend-mobile.m3u"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File (tvheadend-mobile.m3u)</span>
                  </a>

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(playlistUrl, '_blank');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Teks M3U di Tab Baru</span>
                  </button>
                </div>
              </div>

              {/* Compatible Apps Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dukungan Pemutar Video & Aplikasi IPTV:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      VLC Media Player
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Buka menu <code>Media -&gt; Open Network Stream</code> lalu tempel URL Playlist atau URL Proxy.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      TiviMate / OTT Navigator
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cocok untuk Android TV Box & STB. Tambahkan playlist M3U melalui URL untuk sinkronisasi otomatis.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      IPTV Smarters / Kodi
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pilih &quot;Load Your Playlist or File/URL&quot; dan masukkan URL M3U proxy dari server ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCS & ARCHITECTURE */}
          {activeTab === 'docs' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Spesifikasi & Cara Kerja Streaming Proxy Vidio & RCTI+
                </h4>
                <p className="leading-relaxed text-slate-300">
                  Streaming Proxy pada SPEED-id-TV dirancang khusus untuk mengatasi perlindungan CORS dan anti-hotlinking dari Vidio.com dan RCTIplus (MNC Group):
                </p>

                <ul className="space-y-2 list-disc list-inside text-slate-400">
                  <li>
                    <strong className="text-slate-200">Spoofing Referer & Origin Otomatis:</strong> Setiap permintaan stream ke domain Vidio disisipkan <code>Referer: https://www.vidio.com/</code>, dan ke domain RCTI+ disisipkan <code>Referer: https://www.rctiplus.com/</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">Bypass CORS:</strong> Browser memblokir streaming video jika server CDN asal tidak mengizinkan origin lain. Server proxy menyisipkan header <code>Access-Control-Allow-Origin: *</code>.
                  </li>
                  <li>
                    <strong className="text-slate-200">M3U8 Manifest Rewriter:</strong> File index <code>.m3u8</code> berisi link relatif atau absolut untuk segmen potongan video <code>.ts</code>. Server proxy otomatis menulis ulang link segmen agar tetap diarahkan melalui proxy tanpa terjadi error 404.
                  </li>
                  <li>
                    <strong className="text-slate-200">User-Agent Spoofing:</strong> Memperdaya deteksi bot dengan User-Agent pemutar resmi Android 14 / VLC.
                  </li>
                  <li>
                    <strong className="text-slate-200">Sinkronisasi Cloud Firestore:</strong> Setiap kali saluran baru diambil, data langsung disimpan ke Firestore database sehingga tidak akan hilang saat aplikasi dimuat ulang.
                  </li>
                </ul>
              </div>

              {/* Endpoint API Schema */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="text-slate-400 font-bold uppercase">Endpoint Streaming Proxy & Resolver:</div>
                <div className="p-2.5 rounded-lg bg-black text-emerald-400 space-y-1">
                  <div>GET /api/proxy/stream?url=https%3A%2F%2Fwww.vidio.com%2Flive%2F204-sctv</div>
                  <div className="text-blue-400">GET /api/proxy/providers/channels?provider=all</div>
                  <div className="text-amber-400">POST /api/proxy/providers/import (body: {`{"provider":"all"}`})</div>
                  <div className="text-purple-400">GET /api/proxy/resolve?url=https://www.rctiplus.com/tv/rcti</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Streaming Proxy Aktif di Port 3000 • Vidio & RCTI+ Ready</span>
          </div>
          <button
            onClick={() => {
              stopStreamTest();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

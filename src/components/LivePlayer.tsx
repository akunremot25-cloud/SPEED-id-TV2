import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  RotateCcw, ShieldCheck, Zap, Sun, Lock, Unlock, Moon,
  Radio, AlertTriangle, Layers, ChevronRight, ChevronLeft, Tv,
  Activity, Sparkles, Check, RotateCw, Maximize2, Minimize2,
  Smartphone, MonitorPlay, Search, X, CornerDownRight
} from 'lucide-react';
import { Channel, StreamHealth } from '../types/tvheadend';
import { getProxyStreamUrl } from '../services/api';

interface LivePlayerProps {
  channel: Channel;
  channels?: Channel[];
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onSelectChannel?: (channel: Channel) => void;
  onOpenChannelDrawer?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenStreamingProxy?: () => void;
  isClientMode?: boolean;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  channel,
  channels = [],
  onNextChannel,
  onPrevChannel,
  onSelectChannel,
  onOpenChannelDrawer,
  onOpenDiagnostics,
  onOpenStreamingProxy,
  isClientMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(1.0); // 0.2 to 1.0
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isForceLandscape, setIsForceLandscape] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STB & TV OSD (On-Screen Display) State
  const [showOsd, setShowOsd] = useState<boolean>(true);
  const [osdCustomText, setOsdCustomText] = useState<string | null>(null);
  const [isLandscapeChannelDrawerOpen, setIsLandscapeChannelDrawerOpen] = useState<boolean>(false);
  const [drawerSearch, setDrawerSearch] = useState<string>('');
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // STB Numeric Remote Keypad buffer
  const numBufferRef = useRef<string>('');
  const numTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Settings & modes
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [lowLatency, setLowLatency] = useState<boolean>(true);
  const [dataSaver, setDataSaver] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'cover' | '16-9' | '4-3'>('fit');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // Stream Quality Levels from HLS
  const [levels, setLevels] = useState<{ id: number; name: string; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  // Touch gesture HUD popups
  const [gestureHUD, setGestureHUD] = useState<{ type: 'volume' | 'brightness' | 'seek'; value: number | string } | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stream Diagnostics
  const [health, setHealth] = useState<StreamHealth>({
    bitrateKbps: channel.bitrateKbps || 2500,
    fps: channel.fps || 30,
    droppedFrames: 0,
    bufferSeconds: 0,
    latencySeconds: 0,
    resolution: channel.quality || 'Auto',
    networkQuality: 'excellent',
  });

  // Touch gesture tracking coordinates
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchSideRef = useRef<'left' | 'right' | null>(null);
  const initialBrightnessRef = useRef<number>(1.0);
  const initialVolumeRef = useRef<number>(1.0);

  const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const isForceLandscapeActive = isForceLandscape && isPortrait;

  const showGesturePopup = useCallback((type: 'volume' | 'brightness' | 'seek', value: number | string) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setGestureHUD({ type, value });
    gestureTimeoutRef.current = setTimeout(() => {
      setGestureHUD(null);
    }, 1500);
  }, []);

  // Show TV OSD banner with auto-hide timer
  const showOsdTemporary = useCallback((customText?: string) => {
    if (customText) {
      setOsdCustomText(customText);
    } else {
      setOsdCustomText(null);
    }
    setShowOsd(true);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => {
      setShowOsd(false);
      setOsdCustomText(null);
    }, 4500);
  }, []);

  // Show OSD banner whenever active channel changes
  useEffect(() => {
    showOsdTemporary();
  }, [channel.id, showOsdTemporary]);

  // Handle STB numeric keypad (e.g. user presses 1, 5, etc.)
  const handleNumberInput = useCallback((digit: string) => {
    numBufferRef.current += digit;
    const currentNum = numBufferRef.current;
    showOsdTemporary(`Memilih Saluran #${currentNum}...`);

    if (numTimeoutRef.current) clearTimeout(numTimeoutRef.current);
    numTimeoutRef.current = setTimeout(() => {
      const targetNumber = parseInt(numBufferRef.current, 10);
      numBufferRef.current = '';
      if (channels && channels.length > 0) {
        const match = channels.find((c) => c.number === targetNumber);
        if (match && onSelectChannel) {
          onSelectChannel(match);
          showOsdTemporary();
        } else {
          showGesturePopup('seek', `Saluran #${targetNumber} Tidak Ditemukan`);
        }
      }
    }, 1200);
  }, [channels, onSelectChannel, showGesturePopup, showOsdTemporary]);

  // Fullscreen Landscape (Mode Miring untuk Android & STB)
  const enterLandscape = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Enter native fullscreen
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Native fullscreen not available:', err);
    }

    // 2. Lock screen orientation to landscape (Android)
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // If locked orientation is blocked (iframe or system lock), force CSS landscape
      if (window.innerHeight > window.innerWidth) {
        setIsForceLandscape(true);
      }
    }

    // If still in portrait orientation, force CSS 90deg landscape rotation
    if (window.innerHeight > window.innerWidth) {
      setIsForceLandscape(true);
    }

    showGesturePopup('seek', 'LAYAR PENUH MIRING (LANDSCAPE)');
    showOsdTemporary();
  }, [showGesturePopup, showOsdTemporary]);

  const exitLandscape = useCallback(async () => {
    setIsForceLandscape(false);
    setIsLandscapeChannelDrawerOpen(false);

    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }

    try {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    } catch {}

    setIsFullscreen(false);
  }, []);

  const toggleLandscapeMode = useCallback(() => {
    if (isFullscreen || isForceLandscape) {
      exitLandscape();
    } else {
      enterLandscape();
    }
  }, [isFullscreen, isForceLandscape, enterLandscape, exitLandscape]);

  // Synchronize fullscreen state from document events
  useEffect(() => {
    const onFullscreenChange = () => {
      const isNowFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isNowFs);
      if (!isNowFs && isForceLandscape) {
        setIsForceLandscape(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [isForceLandscape]);

  // Auto-detect physical rotation: if user rotates phone horizontally, disable forced CSS transform
  useEffect(() => {
    const handleOrientationCheck = () => {
      if (window.innerWidth >= window.innerHeight && isForceLandscape) {
        setIsForceLandscape(false);
      }
    };
    window.addEventListener('resize', handleOrientationCheck);
    window.addEventListener('orientationchange', handleOrientationCheck);
    return () => {
      window.removeEventListener('resize', handleOrientationCheck);
      window.removeEventListener('orientationchange', handleOrientationCheck);
    };
  }, [isForceLandscape]);

  // Listen to external toggle landscape events (e.g. from App header)
  useEffect(() => {
    const handleToggleEvent = () => {
      toggleLandscapeMode();
    };
    window.addEventListener('tvh:toggle-landscape', handleToggleEvent);
    return () => window.removeEventListener('tvh:toggle-landscape', handleToggleEvent);
  }, [toggleLandscapeMode]);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimeRemaining(null);
      return;
    }

    let secondsLeft = sleepTimerMinutes * 60;
    setSleepTimeRemaining(secondsLeft);

    const timer = setInterval(() => {
      secondsLeft -= 1;
      setSleepTimeRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimerMinutes(null);
        setSleepTimeRemaining(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerMinutes]);

  // Controls auto-hide
  const triggerShowControls = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSettingsMenu(false);
    }, 4500);
  }, [isLocked]);

  // Playback handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerShowControls();
  }, [triggerShowControls]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    showGesturePopup('volume', video.muted ? 'Bisu (Mute)' : `${Math.round(volume * 100)}%`);
    triggerShowControls();
  }, [volume, showGesturePopup, triggerShowControls]);

  const handleVolumeChange = useCallback((newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
    showGesturePopup('volume', `${Math.round(clamped * 100)}%`);
  }, [showGesturePopup]);

  const handleBrightnessChange = useCallback((newBri: number) => {
    const clamped = Math.max(0.2, Math.min(1.0, newBri));
    setBrightness(clamped);
    showGesturePopup('brightness', `${Math.round(clamped * 100)}%`);
  }, [showGesturePopup]);

  // STB Remote Control & Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      // STB numeric keys (0 - 9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(e.key);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ChannelUp':
        case 'PageUp':
          e.preventDefault();
          onPrevChannel?.();
          showOsdTemporary();
          break;

        case 'ArrowDown':
        case 'ChannelDown':
        case 'PageDown':
          e.preventDefault();
          onNextChannel?.();
          showOsdTemporary();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          handleVolumeChange(volume - 0.05);
          break;

        case 'ArrowRight':
          e.preventDefault();
          handleVolumeChange(volume + 0.05);
          break;

        case 'Enter':
        case 'Select':
        case 'Ok':
          e.preventDefault();
          if (isLandscapeChannelDrawerOpen) {
            setIsLandscapeChannelDrawerOpen(false);
          } else {
            showOsdTemporary();
            triggerShowControls();
          }
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          toggleLandscapeMode();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;

        case 'i':
        case 'I':
        case 'Info':
        case 'ContextMenu':
          e.preventDefault();
          setShowOsd((prev) => !prev);
          break;

        case 'Escape':
        case 'Back':
        case 'BrowserBack':
          if (isLandscapeChannelDrawerOpen) {
            e.preventDefault();
            setIsLandscapeChannelDrawerOpen(false);
          } else if (isForceLandscape || isFullscreen) {
            e.preventDefault();
            exitLandscape();
          }
          break;

        case ' ':
        case 'k':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onPrevChannel,
    onNextChannel,
    volume,
    isFullscreen,
    isForceLandscape,
    isLandscapeChannelDrawerOpen,
    handleNumberInput,
    handleVolumeChange,
    showOsdTemporary,
    toggleLandscapeMode,
    toggleMute,
    exitLandscape,
    togglePlay,
    triggerShowControls,
  ]);

  // Initialize or re-initialize player on channel / proxy / dataSaver change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLevels([]);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamTargetUrl = useProxy ? getProxyStreamUrl(channel.streamUrl) : channel.streamUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: lowLatency && !dataSaver,
        backBufferLength: 10,
        maxBufferLength: dataSaver ? 8 : 15,
        maxMaxBufferLength: dataSaver ? 15 : 25,
        maxBufferSize: dataSaver ? 15 * 1000 * 1000 : 35 * 1000 * 1000,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 15000,
        startLevel: -1, // Auto
      });

      hlsRef.current = hls;

      hls.loadSource(streamTargetUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        const parsedLevels = data.levels.map((lvl, index) => ({
          id: index,
          name: `${lvl.height || 720}p (${Math.round(lvl.bitrate / 1000)}k)`,
          bitrate: lvl.bitrate,
        }));
        setLevels(parsedLevels);

        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentLevel(data.level);
        const lvl = hls.levels[data.level];
        if (lvl) {
          setHealth(prev => ({
            ...prev,
            bitrateKbps: Math.round(lvl.bitrate / 1000),
            resolution: `${lvl.width}x${lvl.height}`,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error. Mencoba memulihkan koneksi...', data);
              if (channel.backupUrls && channel.backupUrls.length > 0 && !useProxy) {
                setUseProxy(true);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error. Memulihkan stream media...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS unrecoverable error:', data);
              setErrorMsg('Koneksi siaran terputus. Menghubungkan ulang...');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamTargetUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setErrorMsg('Gagal memuat siaran langsung pada pemutar native.');
      });
    } else {
      setErrorMsg('Format streaming tidak didukung oleh browser ini.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.streamUrl, useProxy, lowLatency, dataSaver, channel.backupUrls]);

  // Buffer health polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      let bufSec = 0;
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
            bufSec = Math.max(0, video.buffered.end(i) - video.currentTime);
            break;
          }
        }
      }

      const qualityObj = (video as any).getVideoPlaybackQuality?.();
      const dropped = qualityObj?.droppedVideoFrames || 0;

      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
      if (bufSec < 2) quality = 'poor';
      else if (bufSec < 5) quality = 'fair';
      else if (bufSec < 10) quality = 'good';

      setHealth(prev => ({
        ...prev,
        bufferSeconds: Number(bufSec.toFixed(1)),
        droppedFrames: dropped,
        networkQuality: quality,
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Touch Gesture handlers for mobile swipe volume/brightness
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    initialBrightnessRef.current = brightness;
    initialVolumeRef.current = volume;

    const halfWidth = rect.left + rect.width / 2;
    touchSideRef.current = touch.clientX < halfWidth ? 'left' : 'right';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLocked || !touchSideRef.current) return;
    const touch = e.touches[0];
    const sensitivity = 220;

    if (isForceLandscapeActive) {
      // Rotated 90 deg: deltaX on screen maps to touch movement
      const deltaX = touchStartXRef.current - touch.clientX;
      const diff = deltaX / sensitivity;
      if (touchSideRef.current === 'left') {
        handleBrightnessChange(initialBrightnessRef.current + diff);
      } else {
        handleVolumeChange(initialVolumeRef.current + diff);
      }
    } else {
      const deltaY = touchStartYRef.current - touch.clientY;
      const diff = deltaY / sensitivity;
      if (touchSideRef.current === 'left') {
        handleBrightnessChange(initialBrightnessRef.current + diff);
      } else {
        handleVolumeChange(initialVolumeRef.current + diff);
      }
    }
  };

  const handleTouchEnd = () => {
    touchSideRef.current = null;
  };

  const jumpToLiveEdge = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.buffered.length > 0) {
      video.currentTime = video.buffered.end(video.buffered.length - 1) - 0.5;
      showGesturePopup('seek', 'SIARAN LANGSUNG');
    }
  };

  const selectLevel = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
    setShowSettingsMenu(false);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'cover': return 'object-cover w-full h-full';
      case '16-9': return 'aspect-video object-contain w-full h-full';
      case '4-3': return 'aspect-[4/3] object-contain w-full h-full';
      default: return 'object-contain w-full h-full';
    }
  };

  // Container styling dynamically supporting forced 90° landscape rotation
  const containerStyle: React.CSSProperties = isForceLandscapeActive
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vh',
        height: '100vw',
        transform: 'rotate(90deg) translateY(-100%)',
        transformOrigin: 'top left',
        zIndex: 99999,
        maxWidth: 'none',
        maxHeight: 'none',
        borderRadius: 0,
      }
    : isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
        maxWidth: 'none',
        maxHeight: 'none',
        borderRadius: 0,
      }
    : {};

  // Filter channels for in-player landscape drawer
  const filteredDrawerChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(drawerSearch.toLowerCase()) ||
    String(c.number).includes(drawerSearch)
  );

  return (
    <div 
      ref={containerRef}
      style={containerStyle}
      className={`relative w-full bg-black overflow-hidden flex items-center justify-center select-none shadow-2xl transition-all duration-200 ${
        isFullscreen || isForceLandscapeActive
          ? 'fixed inset-0 h-screen w-screen'
          : 'aspect-video md:aspect-[16/9] max-h-[80vh] rounded-2xl'
      }`}
      onClick={() => {
        triggerShowControls();
        showOsdTemporary();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        webkit-playsinline="true"
        x5-video-player-type="h5-page"
        className={`transition-all duration-300 ${getAspectClass()}`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Dim overlay for brightness gesture */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-75"
        style={{ opacity: 1 - brightness }}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none z-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
            <Tv className="w-5 h-5 text-blue-400 absolute inset-0 m-auto" />
          </div>
          <span className="text-xs text-blue-200 mt-3 font-medium tracking-wide flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Memuat Siaran Langsung Tvheadend...
          </span>
        </div>
      )}

      {/* Error Banner with Reconnect Action */}
      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30 p-4 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
          <p className="text-sm font-semibold text-white mb-1">Gangguan Stream Siaran</p>
          <p className="text-xs text-slate-300 max-w-sm mb-4">{errorMsg}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setUseProxy(!useProxy);
                setErrorMsg(null);
                setIsLoading(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {useProxy ? 'Ganti Mode Direct' : 'Aktifkan Proxy Server'}
            </button>
            <button 
              onClick={() => {
                setErrorMsg(null);
                setIsLoading(true);
                if (hlsRef.current) hlsRef.current.startLoad();
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium active:scale-95"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Touch Gesture HUD Display */}
      {gestureHUD && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl px-5 py-4 flex flex-col items-center gap-2 shadow-2xl text-white min-w-32 animate-in fade-in zoom-in-95 duration-100">
            {gestureHUD.type === 'volume' && (
              <>
                <Volume2 className="w-7 h-7 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Volume</span>
                <span className="text-lg font-bold text-blue-400">{gestureHUD.value}</span>
              </>
            )}
            {gestureHUD.type === 'brightness' && (
              <>
                <Sun className="w-7 h-7 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Kecerahan</span>
                <span className="text-lg font-bold text-amber-400">{gestureHUD.value}</span>
              </>
            )}
            {gestureHUD.type === 'seek' && (
              <>
                <RotateCw className="w-7 h-7 text-blue-400 animate-spin" />
                <span className="text-sm font-bold text-blue-300 tracking-wider text-center">{gestureHUD.value}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Screen Lock Toggle Button */}
      {isLocked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked(false);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-blue-500/50 text-blue-400 shadow-xl active:scale-90 transition-all"
          title="Buka Kunci Layar"
        >
          <Lock className="w-5 h-5 text-amber-400 animate-pulse" />
        </button>
      )}

      {/* TV & STB On-Screen Display (OSD) Banner */}
      {showOsd && !isLocked && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 sm:bottom-20 left-2 right-2 md:left-6 md:right-6 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-3 sm:p-4 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
        >
          {osdCustomText ? (
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-black text-sm">
                STB REMOTE
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-300 animate-pulse">
                {osdCustomText}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Huge Channel Number Badge for STB & TV */}
                  <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg sm:text-2xl font-mono shadow-md shadow-blue-900/50 flex items-center justify-center shrink-0">
                    CH {String(channel.number).padStart(2, '0')}
                  </div>

                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-sm sm:text-lg truncate">
                        {channel.name}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse shrink-0">
                        LIVE
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {channel.quality || '1080p'}
                      </span>
                    </div>
                    {channel.epgCurrent && (
                      <p className="text-xs sm:text-sm font-semibold text-blue-300 truncate mt-0.5">
                        {channel.epgCurrent.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right quick buttons in OSD */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsLandscapeChannelDrawerOpen(!isLandscapeChannelDrawerOpen)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1 border border-slate-700 active:scale-95 transition-all"
                    title="Buka Daftar Saluran TV"
                  >
                    <Tv className="w-4 h-4" />
                    <span className="hidden sm:inline">Daftar Saluran</span>
                  </button>
                  <button
                    onClick={() => setShowOsd(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Tutup Banner"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Current show EPG progress bar */}
              {channel.epgCurrent && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-slate-300">{channel.epgCurrent.startTime} - {channel.epgCurrent.endTime}</span>
                    {channel.epgNext && (
                      <span className="truncate max-w-[55%]">
                        Selanjutnya: <strong className="text-slate-200">{channel.epgNext.title}</strong>
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${channel.epgCurrent.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Remote STB Key Legend */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 overflow-x-auto no-scrollbar gap-2">
                <span className="flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px] border border-slate-700">▲/▼</kbd>
                  Ganti Saluran
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px] border border-slate-700">◄/►</kbd>
                  Volume
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px] border border-slate-700">OK / F</kbd>
                  Layar Miring
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[9px] border border-slate-700">0 - 9</kbd>
                  Nomor TV
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Channel Selector Drawer (when inside Landscape Fullscreen) */}
      {isLandscapeChannelDrawerOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-950/95 border-l border-slate-700/80 shadow-2xl backdrop-blur-2xl z-50 flex flex-col p-3 animate-in slide-in-from-right duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Pilih Saluran TV</h4>
            </div>
            <button
              onClick={() => setIsLandscapeChannelDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari saluran..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredDrawerChannels.map((ch) => {
              const isCur = ch.id === channel.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    onSelectChannel?.(ch);
                    setIsLandscapeChannelDrawerOpen(false);
                    showOsdTemporary();
                  }}
                  className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-95 ${
                    isCur
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                      isCur ? 'bg-blue-700 text-white' : 'bg-slate-800 text-blue-400'
                    }`}>
                      #{ch.number}
                    </span>
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-7 h-7 rounded-lg object-cover bg-slate-950 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-xs truncate">{ch.name}</span>
                  </div>
                  <span className={`text-[9px] px-1 rounded shrink-0 ${
                    isCur ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ch.quality}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Overlays & Controls Bar */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between p-3 md:p-4 z-30 transition-opacity duration-300 ${
          showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent -mx-3 -mt-3 md:-mx-4 md:-mt-4 p-3 md:p-4">
          <div className="flex items-center gap-3 min-w-0">
            {onOpenChannelDrawer && (
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenChannelDrawer(); }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm active:scale-95 transition-colors"
                title="Daftar Saluran"
              >
                <Tv className="w-4 h-4 text-blue-400" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600/80 text-white tracking-wide">
                  CH {channel.number}
                </span>
                <h2 className="text-white font-semibold text-sm md:text-base truncate max-w-[150px] sm:max-w-md">
                  {channel.name}
                </h2>
                <div className="flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  LIVE
                </div>
              </div>
              {channel.epgCurrent && (
                <p className="text-[11px] text-slate-300 truncate max-w-[180px] sm:max-w-md">
                  {channel.epgCurrent.title}
                </p>
              )}
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Exit Landscape Button (if currently in landscape/fullscreen) */}
            {(isFullscreen || isForceLandscapeActive) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exitLandscape();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-1 active:scale-95 transition-all"
                title="Kembali ke Tampilan Normal"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar Miring</span>
              </button>
            )}

            {/* Sleep Timer Indicator */}
            {sleepTimeRemaining !== null && (
              <div className="flex items-center gap-1 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs px-2 py-1 rounded-full">
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>{Math.floor(sleepTimeRemaining / 60)}m</span>
              </div>
            )}

            {/* Diagnostics HUD Toggle (Only in Admin / Debug Mode) */}
            {!isClientMode && onOpenDiagnostics && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDiagnostics();
                }}
                className="p-2 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
                title="Statistik Stream & Buffer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            {/* Lock Screen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLocked(true);
                setShowControls(false);
              }}
              className="p-2 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
              title="Kunci Layar Sentuh"
            >
              <Unlock className="w-4 h-4" />
            </button>

            {/* Settings Dropdown Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsMenu(!showSettingsMenu);
              }}
              className="p-2 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white backdrop-blur-sm transition-colors"
              title="Pengaturan Siaran"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Quick Channel Flip Buttons (on Left / Right) */}
        <div className="flex items-center justify-between px-1 pointer-events-none">
          {onPrevChannel && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPrevChannel(); }}
              className="pointer-events-auto p-2.5 rounded-full bg-black/50 hover:bg-blue-600/80 text-white backdrop-blur-md active:scale-90 transition-all"
              title="Saluran Sebelumnya (Remote ▲)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div />
          {onNextChannel && (
            <button 
              onClick={(e) => { e.stopPropagation(); onNextChannel(); }}
              className="pointer-events-auto p-2.5 rounded-full bg-black/50 hover:bg-blue-600/80 text-white backdrop-blur-md active:scale-90 transition-all"
              title="Saluran Selanjutnya (Remote ▼)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent -mx-3 -mb-3 md:-mx-4 md:-mt-4 p-3 md:p-4 flex flex-col gap-2">
          {/* Stream Buffer Status Indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                health.networkQuality === 'excellent' ? 'bg-emerald-400' :
                health.networkQuality === 'good' ? 'bg-blue-400' :
                health.networkQuality === 'fair' ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
              <span>Buffer: {health.bufferSeconds}s</span>
              <span className="hidden sm:inline">| Bitrate: {health.bitrateKbps} kbps</span>
              {onOpenStreamingProxy ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStreamingProxy();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 hover:text-white hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors"
                  title="Klik untuk membuka Streaming Proxy Hub & Playlist M3U"
                >
                  <Radio className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Proxy: {useProxy ? 'Aktif (CORS OK)' : 'Direct'}</span>
                </button>
              ) : (
                <span className="hidden sm:inline">| {useProxy ? 'Proxy Stabilizer' : 'Direct'}</span>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); jumpToLiveEdge(); }}
              className="text-rose-400 font-semibold hover:underline flex items-center gap-1 active:scale-95"
            >
              <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
              Sinkron Live
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause */}
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-90 transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
              </button>

              {/* Volume / Mute */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(parseFloat(e.target.value));
                  }}
                  className="w-16 md:w-24 h-1.5 bg-slate-700 rounded-lg cursor-pointer hidden sm:block"
                />
              </div>
            </div>

            {/* Right: Aspect ratio, PiP, Mode Fullscreen Miring Android & STB */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Aspect Ratio cycle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const modes: ('fit' | 'cover' | '16-9' | '4-3')[] = ['fit', 'cover', '16-9', '4-3'];
                  const nextIndex = (modes.indexOf(aspectRatio) + 1) % modes.length;
                  setAspectRatio(modes[nextIndex]);
                }}
                className="px-2 py-1 text-xs font-semibold rounded bg-white/10 hover:bg-white/20 text-slate-300 uppercase"
                title="Rasio Aspek Layar"
              >
                {aspectRatio}
              </button>

              {/* Picture in Picture */}
              {document.pictureInPictureEnabled && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                      } else {
                        await videoRef.current.requestPictureInPicture();
                      }
                    }
                  }}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title="Picture in Picture (PiP)"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}

              {/* DEDICATED LANDSCAPE / MODE FULL SCREEN MIRING BUTTON (ANDROID & STB) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLandscapeMode();
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isForceLandscapeActive || isFullscreen
                    ? 'bg-blue-600 text-white shadow-blue-900/50'
                    : 'bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white border border-blue-400/40'
                }`}
                title="Mode Full Screen Miring untuk Android & STB (Tekan F pada Remote STB)"
              >
                <RotateCw className={`w-3.5 h-3.5 text-blue-200 transition-transform ${isForceLandscapeActive ? 'rotate-90' : ''}`} />
                <span>
                  {isForceLandscapeActive || isFullscreen ? 'Keluar Miring' : 'Layar Miring'}
                </span>
              </button>

              {/* Standard Fullscreen Toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLandscapeMode(); }}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Layar Penuh"
              >
                {isFullscreen || isForceLandscapeActive ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal Sheet */}
      {showSettingsMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-14 bottom-14 w-72 max-w-[85vw] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-4 z-40 overflow-y-auto text-white flex flex-col gap-4 animate-in slide-in-from-right-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-sm flex items-center gap-1.5 text-blue-400">
              <Settings className="w-4 h-4" />
              Pengaturan Siaran Mobile & STB
            </span>
            <button 
              onClick={() => setShowSettingsMenu(false)}
              className="text-xs text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Mode Layar Miring Android & STB */}
          <button
            onClick={() => {
              toggleLandscapeMode();
              setShowSettingsMenu(false);
            }}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-between active:scale-95 transition-all shadow-md"
          >
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-white" />
              <span>Layar Penuh Miring (STB / Android)</span>
            </div>
            <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded text-blue-200">
              {isForceLandscapeActive || isFullscreen ? 'Aktif' : 'Pilih'}
            </span>
          </button>

          {/* Proxy Stabilizer Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60">
            <div>
              <p className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Tvheadend Proxy Relay
              </p>
              <p className="text-[10px] text-slate-400">Menghindari blokir CORS & buffering</p>
            </div>
            <input 
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Dedicated Streaming Proxy Hub Button */}
          {onOpenStreamingProxy && (
            <button
              onClick={() => {
                setShowSettingsMenu(false);
                onOpenStreamingProxy();
              }}
              className="p-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-indigo-200 hover:text-white font-semibold text-xs flex items-center justify-between active:scale-95 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Buka Streaming Proxy Hub</span>
              </div>
              <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-500/20">
                Uji & Link
              </span>
            </button>
          )}

          {/* Mode Hemat Data Mobile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60">
            <div>
              <p className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mode Hemat Kuota (Mobile)
              </p>
              <p className="text-[10px] text-slate-400">Buffer ringkas untuk 4G/LTE</p>
            </div>
            <input 
              type="checkbox"
              checked={dataSaver}
              onChange={(e) => setDataSaver(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Low Latency Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60">
            <div>
              <p className="text-xs font-medium text-slate-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                Latensi Rendah (Real-Time)
              </p>
              <p className="text-[10px] text-slate-400">Meminimalkan jeda waktu siaran</p>
            </div>
            <input 
              type="checkbox"
              checked={lowLatency}
              onChange={(e) => setLowLatency(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* HLS Resolution / Quality Picker */}
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Kualitas Resolusi:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => selectLevel(-1)}
                className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between ${
                  currentLevel === -1 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Otomatis (ABR)</span>
                {currentLevel === -1 && <Check className="w-3.5 h-3.5" />}
              </button>
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => selectLevel(lvl.id)}
                  className={`py-1.5 px-2 rounded-lg text-left flex items-center justify-between ${
                    currentLevel === lvl.id ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{lvl.name}</span>
                  {currentLevel === lvl.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Timer Picker */}
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Sleep Timer (Matikan Otomatis):
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[null, 15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins ?? 'off'}
                  onClick={() => {
                    setSleepTimerMinutes(mins);
                    setShowSettingsMenu(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center ${
                    sleepTimerMinutes === mins ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mins === null ? 'Nonaktif' : `${mins} mnt`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

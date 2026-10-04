import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, X, Headphones } from 'lucide-react';

export default function AudioPlayer({ resource, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [resumeNotice, setResumeNotice] = useState(null);

  const storageKey = resource ? (resource.itemId ? `audio_pos_${resource.productId}_${resource.itemId}` : `audio_pos_${resource.productId}`) : null;

  // Cargar punto guardado en localStorage
  useEffect(() => {
    if (!resource || !audioRef.current) return;

    const audio = audioRef.current;
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);

      const savedTime = localStorage.getItem(storageKey);
      if (savedTime && Number(savedTime) > 2) {
        const timeNum = Number(savedTime);
        if (timeNum < audio.duration) {
          audio.currentTime = timeNum;
          setCurrentTime(timeNum);
          const mins = Math.floor(timeNum / 60);
          const secs = Math.floor(timeNum % 60).toString().padStart(2, '0');
          setResumeNotice(`Reanudando en ${mins}:${secs}`);
          setTimeout(() => setResumeNotice(null), 4000);
        }
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [resource, storageKey]);

  // Guardar posición en localStorage al actualizar tiempo
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);
    if (storageKey && curr > 0) {
      localStorage.setItem(storageKey, curr.toString());
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTo = Number(e.target.value);
    audioRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
    if (storageKey) {
      localStorage.setItem(storageKey, seekTo.toString());
    }
  };

  const skipSeconds = (seconds) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    if (!audioRef.current) return;
    const vol = Number(e.target.value);
    audioRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 0.8];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!resource) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#0A0D0A] via-[#0A0D0A]/95 to-transparent backdrop-blur-md">
      <div className="max-w-4xl mx-auto bg-[#141a14] border border-[#8EB486]/30 rounded-2xl p-4 shadow-2xl">
        <audio
          ref={audioRef}
          src={resource.signedUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Notificación de reanudación de timestamp */}
        {resumeNotice && (
          <div className="text-center text-xs text-[#8EB486] bg-[#8EB486]/10 py-1 px-3 rounded-full mb-2 inline-block mx-auto">
            {resumeNotice}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Info Producto */}
          <div className="flex items-center gap-3 w-full md:w-1/3">
            <div className="w-10 h-10 rounded-xl bg-[#8EB486]/20 border border-[#8EB486]/30 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#8EB486]" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-[#E2E8F0] truncate">{resource.titulo}</h4>
              <p className="text-xs text-[#8F9B8D] truncate">{resource.productTitle || 'Audioguía Terapéutica'}</p>
            </div>
          </div>

          {/* Controles Centrales */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => skipSeconds(-15)}
                title="Retroceder 15s"
                className="text-[#8F9B8D] hover:text-[#E2E8F0] transition p-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] flex items-center justify-center shadow-lg transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => skipSeconds(15)}
                title="Adelantar 15s"
                className="text-[#8F9B8D] hover:text-[#E2E8F0] transition p-1 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={cycleSpeed}
                title="Velocidad de reproducción"
                className="text-xs font-mono text-[#8EB486] bg-[#8EB486]/10 px-2 py-0.5 rounded border border-[#8EB486]/20 hover:bg-[#8EB486]/20 transition cursor-pointer"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Barra de Progreso */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-[11px] font-mono text-[#8F9B8D] w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-[#232f23] rounded-lg appearance-none cursor-pointer accent-[#8EB486]"
              />
              <span className="text-[11px] font-mono text-[#8F9B8D] w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volumen y Cerrar */}
          <div className="flex items-center justify-end gap-3 w-full md:w-auto">
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#8F9B8D] hover:text-[#E2E8F0] transition cursor-pointer">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1.5 bg-[#232f23] rounded-lg appearance-none cursor-pointer accent-[#8EB486]"
              />
            </div>

            <button
              onClick={onClose}
              title="Cerrar reproductor"
              className="p-1.5 rounded-lg text-[#8F9B8D] hover:text-[#E2E8F0] hover:bg-[#232f23] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

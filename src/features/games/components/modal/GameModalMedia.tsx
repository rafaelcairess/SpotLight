import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { GameData } from "@/types/game";

export function GameModalMedia({ game, loading = false }: { game: GameData; loading?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenshots = useMemo(() => game.screenshots?.slice(0, 6) ?? [], [game.screenshots]);
  const selectedIndex = selectedScreenshot ? screenshots.indexOf(selectedScreenshot) : -1;
  const moveScreenshot = useCallback((direction: number) => {
    if (!screenshots.length || selectedIndex < 0) return;
    setSelectedScreenshot(screenshots[(selectedIndex + direction + screenshots.length) % screenshots.length]);
  }, [screenshots, selectedIndex]);

  useEffect(() => {
    if (!playing || !game.trailerUrl || !videoRef.current) return;
    const video = videoRef.current;
    const isHls = game.trailerUrl.includes(".m3u8");
    let destroy: (() => void) | undefined;
    let active = true;

    if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = game.trailerUrl;
      void video.play().catch(() => undefined);
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (!active || !Hls.isSupported() || !videoRef.current) return;
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(game.trailerUrl!);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => void videoRef.current?.play().catch(() => undefined));
        destroy = () => hls.destroy();
      });
    }

    return () => {
      active = false;
      destroy?.();
    };
  }, [playing, game.trailerUrl]);

  useEffect(() => {
    if (!selectedScreenshot) return;
    const handleGalleryKey = (event: KeyboardEvent) => {
      if (!["Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") setSelectedScreenshot(null);
      if (event.key === "ArrowLeft") moveScreenshot(-1);
      if (event.key === "ArrowRight") moveScreenshot(1);
    };
    document.addEventListener("keydown", handleGalleryKey, true);
    return () => document.removeEventListener("keydown", handleGalleryKey, true);
  }, [selectedScreenshot, moveScreenshot]);

  if (loading && !game.trailerUrl && !screenshots.length) {
    return <section className="space-y-3" aria-busy="true"><h3 className="text-sm font-medium text-muted-foreground">Mídia</h3><div className="aspect-video animate-pulse rounded-lg bg-secondary/60" /><div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((item) => <div key={item} className="aspect-video animate-pulse rounded-md bg-secondary/40" />)}</div></section>;
  }
  if (!game.trailerUrl && !screenshots.length) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Mídia</h3>
      {game.trailerUrl && (
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          {playing ? (
            <video ref={videoRef} controls playsInline preload="none" className="h-full w-full" poster={game.trailerThumbnail} />
          ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group relative h-full w-full" aria-label="Reproduzir trailer">
              <img src={game.trailerThumbnail || game.image} alt="" fetchPriority="high" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-60" />
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-black/70 text-white"><Play className="ml-1 h-6 w-6 fill-current" /></span></span>
            </button>
          )}
        </div>
      )}
      {!!screenshots.length && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {screenshots.map((url, index) => <button key={url} type="button" onClick={() => setSelectedScreenshot(url)} className="overflow-hidden rounded-md bg-black/20" aria-label={`Ampliar captura de tela ${index + 1}`}><img src={url} alt={`Captura de tela ${index + 1}`} loading="lazy" decoding="async" className="aspect-video h-full w-full object-cover transition-transform hover:scale-[1.03]" /></button>)}
        </div>
      )}
      {selectedScreenshot && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Captura de tela ampliada" className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4 backdrop-blur-[1px]" onClick={() => setSelectedScreenshot(null)}>
          <button type="button" onClick={() => setSelectedScreenshot(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white hover:bg-black" aria-label="Fechar imagem"><X className="h-5 w-5" /></button>
          {screenshots.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); moveScreenshot(-1); }} className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-black/65 text-white hover:bg-black sm:left-6" aria-label="Imagem anterior"><ChevronLeft className="h-6 w-6" /></button>}
          <img src={selectedScreenshot} alt={`Captura de tela ${selectedIndex + 1} ampliada`} className="max-h-[82vh] max-w-[90vw] rounded-lg object-contain shadow-2xl ring-1 ring-white/20" onClick={(event) => event.stopPropagation()} />
          {screenshots.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); moveScreenshot(1); }} className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-black/65 text-white hover:bg-black sm:right-6" aria-label="Próxima imagem"><ChevronRight className="h-6 w-6" /></button>}
          <span className="absolute bottom-5 rounded-full bg-black/65 px-3 py-1 text-xs text-white">{selectedIndex + 1} / {screenshots.length}</span>
        </div>,
        document.body,
      )}
    </section>
  );
}

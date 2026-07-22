import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { GameData } from "@/types/game";

export function GameModalMedia({ game, loading = false }: { game: GameData; loading?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenshots = game.screenshots?.slice(0, 6) ?? [];

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
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setSelectedScreenshot(null);
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [selectedScreenshot]);

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
        <div role="dialog" aria-modal="true" aria-label="Captura de tela ampliada" className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setSelectedScreenshot(null)}>
          <button type="button" onClick={() => setSelectedScreenshot(null)} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white hover:bg-black" aria-label="Fechar imagem"><X className="h-5 w-5" /></button>
          <img src={selectedScreenshot} alt="Captura de tela ampliada" className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>,
        document.body,
      )}
    </section>
  );
}

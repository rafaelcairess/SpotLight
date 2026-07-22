import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { GameData } from "@/types/game";

export function GameModalMedia({ game }: { game: GameData }) {
  const [playing, setPlaying] = useState(false);
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
              <img src={game.trailerThumbnail || game.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-60" />
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-black/70 text-white"><Play className="ml-1 h-6 w-6 fill-current" /></span></span>
            </button>
          )}
        </div>
      )}
      {!!screenshots.length && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {screenshots.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md bg-black/20"><img src={url} alt={`Captura de tela ${index + 1}`} loading="lazy" decoding="async" className="aspect-video h-full w-full object-cover transition-transform hover:scale-[1.03]" /></a>)}
        </div>
      )}
    </section>
  );
}

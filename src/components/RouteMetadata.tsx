import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "SpotLight";
const DEFAULT_DESCRIPTION =
  "Organize sua biblioteca, acompanhe conquistas e compartilhe sua história gamer.";
const SITE_ORIGIN = "https://spot-light-xi.vercel.app";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og.png`;

const routeMetadata: Array<{
  matches: (pathname: string) => boolean;
  title: string;
  description: string;
}> = [
  {
    matches: (pathname) => pathname === "/",
    title: "Descubra, organize e compartilhe seus jogos",
    description: "Explore jogos, rankings, coleções e recomendações em um só lugar.",
  },
  {
    matches: (pathname) => pathname === "/collections",
    title: "Coleções de jogos",
    description: "Encontre jogos por temas, estilos e experiências selecionadas.",
  },
  {
    matches: (pathname) => pathname === "/top",
    title: "Top Games",
    description: "Veja os jogos mais bem avaliados pela comunidade SpotLight.",
  },
  {
    matches: (pathname) => pathname === "/mais-jogados",
    title: "Mais jogados da Steam",
    description: "Acompanhe os jogos com mais jogadores ativos na Steam.",
  },
  {
    matches: (pathname) => pathname === "/promocoes",
    title: "Promoções",
    description: "Descubra jogos em promoção e acompanhe seus alertas de preço.",
  },
  {
    matches: (pathname) => pathname === "/comunidade" || pathname === "/friends",
    title: "Comunidade gamer",
    description: "Encontre jogadores, acompanhe perfis e compartilhe sua jornada gamer.",
  },
  {
    matches: (pathname) => pathname === "/profile" || pathname.startsWith("/u/"),
    title: "Perfil gamer",
    description: "Biblioteca, platinas, horas jogadas e avaliações reunidas em um perfil.",
  },
  {
    matches: (pathname) => pathname.startsWith("/game/"),
    title: "Detalhes do jogo",
    description: "Informações, mídia, avaliações e atividade da comunidade.",
  },
];

function setMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
}

/** Keeps SPA navigation reflected in browser and social metadata. */
export function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = routeMetadata.find((route) => route.matches(pathname));
    const title = metadata?.title ? `${metadata.title} | ${SITE_NAME}` : SITE_NAME;
    const description = metadata?.description ?? DEFAULT_DESCRIPTION;

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', `${SITE_ORIGIN}${pathname}`);
    setMeta('meta[property="og:image"]', DEFAULT_IMAGE);
    setMeta('meta[property="og:image:width"]', "1200");
    setMeta('meta[property="og:image:height"]', "630");
    setMeta('meta[property="og:image:alt"]', "SpotLight — Sua história gamer em um só lugar");
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', DEFAULT_IMAGE);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", `${SITE_ORIGIN}${pathname}`);
  }, [pathname]);

  return null;
}

import { useEffect } from "react";

const SITE_NAME = "SpotLight";
const DEFAULT_DESCRIPTION =
  "Organize sua biblioteca, acompanhe conquistas e compartilhe sua história gamer.";

function setMeta(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
}

type PageMetadataInput = {
  title?: string;
  description?: string | null;
  image?: string | null;
};

export function usePageMetadata({ title, description, image }: PageMetadataInput) {
  useEffect(() => {
    if (!title) return;

    const fullTitle = `${title} | ${SITE_NAME}`;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    document.title = fullTitle;
    setMeta('meta[name="description"]', resolvedDescription);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', resolvedDescription);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', resolvedDescription);

    if (image) {
      setMeta('meta[property="og:image"]', image);
      setMeta('meta[property="og:image:width"]', "");
      setMeta('meta[property="og:image:height"]', "");
      setMeta('meta[property="og:image:alt"]', title);
      setMeta('meta[name="twitter:image"]', image);
    } else {
      setMeta('meta[property="og:image"]', "");
      setMeta('meta[property="og:image:width"]', "");
      setMeta('meta[property="og:image:height"]', "");
      setMeta('meta[property="og:image:alt"]', "");
      setMeta('meta[name="twitter:image"]', "");
    }
  }, [description, image, title]);
}

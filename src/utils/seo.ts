import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
}

export function useSeoMetadata({ title, description, path = '/', type = 'website' }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('ZyvoMovie') ? title : `${title} – ZyvoMovie`;
    document.title = fullTitle;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', type);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);

    const canonicalHref = `${window.location.origin}${path}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, [title, description, path, type]);
}

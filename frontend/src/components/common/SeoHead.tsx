import { useEffect } from 'react';

export interface SeoHeadProps {
  title: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'event';
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

export function SeoHead({
  title,
  description = 'Eventum — Plataforma premium para gestão de casamentos e eventos exclusivos. RSVP inteligente, lista de presentes via PIX, mesas e financeiro.',
  keywords = ['gestão de eventos', 'rsvp digital', 'organização de casamento', 'lista de presentes pix', 'eventum'],
  canonicalUrl,
  ogImage = '/assets/hero-eventum-BDHPGFJ9.jpg',
  ogType = 'website',
  noIndex = false,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title.includes('Eventum') ? title : `${title} | Eventum`;
    document.title = formattedTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);
    if (keywords.length > 0) {
      setMetaTag('name', 'keywords', keywords.join(', '));
    }
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // 3. Open Graph
    const currentUrl = canonicalUrl || window.location.href;
    setMetaTag('property', 'og:site_name', 'Eventum');
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType === 'event' ? 'website' : ogType);
    setMetaTag('property', 'og:url', currentUrl);
    
    // Resolve full OG image URL if relative
    const absoluteOgImage = ogImage.startsWith('http')
      ? ogImage
      : `${window.location.origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
    setMetaTag('property', 'og:image', absoluteOgImage);

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', absoluteOgImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 6. Structured JSON-LD Data
    let scriptTag = document.getElementById('eventum-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'eventum-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Cleanup if unmounted or changed
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, noIndex, jsonLd]);

  return null;
}

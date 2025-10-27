/**
 * Utility helpers for embedding remote font stylesheets before rendering
 * to an image. This avoids relying on `document.styleSheets`, which Safari
 * blocks when styles originate from another domain (e.g. Google Fonts).
 */

const stylesheetCache = new Map<string, string>();
const fontDataCache = new Map<string, string>();

const FONT_URL_PATTERN = /url\((['"]?)([^"')]+)\1\)/g;

const isLikelyRemoteFontStylesheet = (href: string | null): href is string =>
  Boolean(href && /fonts\.googleapis\.com/.test(href));

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch stylesheet: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const fetchAsDataURL = async (url: string): Promise<string> => {
  const cached = fontDataCache.get(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch font file: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read font blob'));
    reader.readAsDataURL(blob);
  });

  fontDataCache.set(url, dataUrl);
  return dataUrl;
};

const inlineFontUrls = async (cssText: string, baseUrl: string): Promise<string> => {
  const replacements: Promise<void>[] = [];
  let mutableCss = cssText;

  cssText.replace(FONT_URL_PATTERN, (fullMatch, _quote, rawUrl) => {
    if (rawUrl.startsWith('data:')) {
      return fullMatch;
    }

    const absoluteUrl = rawUrl.startsWith('http')
      ? rawUrl
      : new URL(rawUrl, baseUrl).toString();

    replacements.push(
      fetchAsDataURL(absoluteUrl)
        .then((dataUrl) => {
          mutableCss = mutableCss.replace(fullMatch, `url(${dataUrl})`);
        })
        .catch((error) => {
          console.error('Failed to inline font url', { absoluteUrl, error });
        }),
    );

    return fullMatch;
  });

  if (replacements.length) {
    await Promise.all(replacements);
  }

  return mutableCss;
};

const inlineRemoteStylesheet = async (href: string): Promise<string> => {
  const cached = stylesheetCache.get(href);
  if (cached) {
    return cached;
  }

  try {
    const cssText = await fetchText(href);
    const inlined = await inlineFontUrls(cssText, href);
    stylesheetCache.set(href, inlined);
    return inlined;
  } catch (error) {
    console.error('Failed to inline stylesheet for export', { href, error });
    stylesheetCache.set(href, '');
    return '';
  }
};

export const buildFontEmbedCss = async (): Promise<string> => {
  const linkElements = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  ).filter((link) => isLikelyRemoteFontStylesheet(link.href));

  if (!linkElements.length) {
    return '';
  }

  const chunks = await Promise.all(linkElements.map((link) => inlineRemoteStylesheet(link.href)));
  return chunks.filter(Boolean).join('\n');
};

/**
 * Icon resolution for a bookmark.
 *
 * The chain is brand icon, then the site's own favicon, then a coloured
 * monogram. Only the first step is guaranteed to work offline, so every spec
 * carries a monogram the view can fall back to at render time.
 */
import { KNOWN_SITES, type KnownSite } from "../data/known-sites";
import { baseDomain, hostname } from "./domains";
import { parseUrl } from "./urls";

export type BrandIcon = {
  title: string;
  /** SVG path data on a 24x24 viewBox. */
  path: string;
  /** Brand colour as a bare hex string, no leading hash. */
  hex: string;
  /**
   * Whether the brand colour disappears against one of the themes.
   * GitHub is nearly black and Rust is black, so on a charcoal background they
   * have to be drawn in the text colour instead of their own.
   */
  tone: "dim" | "bright" | "normal";
};

export type Monogram = {
  letter: string;
  /** Hue in degrees, derived from the domain so a site always looks the same. */
  hue: number;
};

export type IconSpec = {
  brand: BrandIcon | null;
  /** Direct favicon URL on the site's own origin, or null if unresolvable. */
  faviconUrl: string | null;
  monogram: Monogram;
};

/**
 * Look a URL up in the registry, matching the exact hostname before the
 * registrable domain.
 */
export function knownSite(url: string): KnownSite | null {
  const host = hostname(url);
  if (host && KNOWN_SITES[host]) return KNOWN_SITES[host];

  const base = baseDomain(url);
  if (base && KNOWN_SITES[base]) return KNOWN_SITES[base];

  return null;
}

export function resolveIcon(url: string): IconSpec {
  const site = knownSite(url);
  const parsed = parseUrl(url);

  return {
    brand: site
      ? {
          title: site.icon.title,
          path: site.icon.path,
          hex: site.icon.hex,
          tone: toneOf(site.icon.hex),
        }
      : null,
    // Requested from the site itself rather than a third-party icon service,
    // so browsing habits are not handed to anyone.
    faviconUrl: parsed ? `${parsed.origin}/favicon.ico` : null,
    monogram: monogramFor(url),
  };
}

/**
 * Classify a brand colour by how bright it is.
 *
 * The thresholds are deliberately generous: an icon that is merely dark still
 * reads fine on charcoal, so only the near-black and near-white ones get
 * swapped for the text colour.
 */
function toneOf(hex: string): BrandIcon["tone"] {
  const value = luminance(hex);
  if (value < 0.06) return "dim";
  if (value > 0.88) return "bright";
  return "normal";
}

/** Relative luminance, per WCAG, from a bare six-digit hex string. */
function luminance(hex: string): number {
  const channels = [0, 2, 4].map((offset) => {
    const part = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function monogramFor(url: string): Monogram {
  const base = baseDomain(url) || hostname(url) || url;
  const letter = (base.match(/[a-z0-9]/i)?.[0] ?? "?").toUpperCase();
  return { letter, hue: hueFrom(base) };
}

/** Small deterministic string hash, mapped onto the colour wheel. */
function hueFrom(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

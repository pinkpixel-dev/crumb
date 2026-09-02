/**
 * URL parsing, validation and normalisation.
 *
 * Everything the app accepts as a link goes through here, so "github.com" typed
 * into the form and a full URL pasted from the clipboard end up in the same
 * shape on disk.
 */

/** Only these schemes are ever opened or stored. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Turn loose user input into a URL object, or return null if it cannot be one.
 *
 * A missing scheme defaults to https. Paths, query strings and fragments are
 * left exactly as typed, because those often carry the meaning of the link.
 */
export function parseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
  // "https://" alone parses successfully but has nothing to open.
  if (!url.hostname) return null;
  // A bare word like "notes" is almost certainly not meant to be a link.
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;

  return url;
}

export function isValidUrl(input: string): boolean {
  return parseUrl(input) !== null;
}

/** Canonical string form used for storage and comparison. */
export function normalizeUrl(input: string): string | null {
  const url = parseUrl(input);
  return url ? url.toString() : null;
}

/**
 * Compare two URLs the way a person would: ignoring the scheme, a leading
 * "www.", a trailing slash and letter case. Used for duplicate detection only,
 * never for what gets stored.
 */
export function sameLink(a: string, b: string): boolean {
  return duplicateKey(a) === duplicateKey(b);
}

function duplicateKey(input: string): string {
  const url = parseUrl(input);
  if (!url) return input.trim().toLowerCase();

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");
  return `${host}${path}${url.search}${url.hash}`;
}

/**
 * A short, readable version of a URL for the secondary line of a bookmark row:
 * "github.com/pinkpixel-dev/crumb" rather than the full thing.
 */
export function displayUrl(input: string, maxLength = 46): string {
  const url = parseUrl(input);
  if (!url) return input;

  const host = url.hostname.replace(/^www\./, "");
  const rest = `${url.pathname}${url.search}`.replace(/\/$/, "");
  const full = `${host}${rest}`;

  if (full.length <= maxLength) return full;
  return `${full.slice(0, maxLength - 1)}…`;
}

/**
 * Best-guess title for a freshly pasted link, used before the user types their
 * own. Prefers a readable last path segment, and falls back to the hostname.
 */
export function suggestTitleFromUrl(input: string): string {
  const url = parseUrl(input);
  if (!url) return "";

  const host = url.hostname.replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];

  if (!last) return host;

  // Skip segments that are clearly identifiers rather than words.
  const cleaned = last.replace(/\.(html?|php|aspx?)$/i, "");
  if (!/[a-z]/i.test(cleaned) || cleaned.length > 48) return host;

  const words = cleaned.replace(/[-_+]+/g, " ").trim();
  if (words.length < 3) return host;

  return words.charAt(0).toUpperCase() + words.slice(1);
}

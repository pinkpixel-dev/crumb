/**
 * Base-domain resolution.
 *
 * Site recognition has to treat gist.github.com and docs.github.com as GitHub,
 * while still keeping example.co.uk intact. tldts carries the public suffix
 * list, which is the only reliable way to tell those two cases apart.
 */
import { getDomain, getHostname } from "tldts";

import { parseUrl } from "./urls";

/**
 * The registrable domain for a URL, lowercased.
 *
 * tldts returns null for hosts that have no public suffix, such as localhost or
 * a bare IP address. Those still deserve a stable key, so the hostname is used
 * as-is in that case.
 */
export function baseDomain(input: string): string {
  const url = parseUrl(input);
  const host = url ? url.hostname : getHostname(input);
  if (!host) return "";

  return (getDomain(host) ?? host).toLowerCase();
}

/** The full hostname, minus a leading "www.". */
export function hostname(input: string): string {
  const url = parseUrl(input);
  if (!url) return "";
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

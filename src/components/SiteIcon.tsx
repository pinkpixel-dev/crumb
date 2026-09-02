import { useEffect, useState } from "react";

import { resolveIcon } from "../lib/icons";

type Props = {
  url: string;
  size?: number;
  className?: string;
};

type Stage = "brand" | "favicon" | "monogram";

/**
 * A bookmark's icon, walking the fallback chain as each step succeeds or fails.
 *
 * Brand icons are inline SVG paths from Simple Icons, so recognised sites need
 * no network at all. Anything else tries the site's own favicon and settles on
 * a coloured monogram if that does not load.
 */
export function SiteIcon({ url, size = 18, className = "" }: Props) {
  const spec = resolveIcon(url);
  const initial: Stage = spec.brand ? "brand" : spec.faviconUrl ? "favicon" : "monogram";
  const [stage, setStage] = useState<Stage>(initial);

  // Editing a bookmark's URL changes which chain applies, so restart it.
  useEffect(() => setStage(initial), [url, initial]);

  if (stage === "brand" && spec.brand) {
    return (
      <svg
        role="img"
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`shrink-0 brand-${spec.brand.tone} ${className}`}
        style={{ "--brand": `#${spec.brand.hex}` } as React.CSSProperties}
      >
        <path d={spec.brand.path} />
      </svg>
    );
  }

  if (stage === "favicon" && spec.faviconUrl) {
    return (
      <img
        src={spec.faviconUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        className={`shrink-0 rounded-[3px] object-contain ${className}`}
        style={{ width: size, height: size }}
        onError={() => setStage("monogram")}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-[5px] font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.55),
        color: `oklch(0.96 0.03 ${spec.monogram.hue})`,
        background: `oklch(0.55 0.13 ${spec.monogram.hue})`,
      }}
    >
      {spec.monogram.letter}
    </span>
  );
}

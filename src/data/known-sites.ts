/**
 * Sites Crumb recognises by name and brand icon.
 *
 * Keys are matched against the full hostname first and then against the
 * registrable domain, so `docs.google.com` gets the Docs icon while
 * `gist.github.com` falls through to the GitHub entry.
 *
 * A few well-known brands are deliberately absent (CodePen, Canva, OpenAI,
 * LinkedIn, Slack, Amazon). Simple Icons removed them after trademark
 * requests, so they use the favicon step of the fallback chain instead.
 */
import {
  siAirtable, siAnthropic, siArchiveofourown, siAsana, siAstro, siBehance,
  siBitbucket, siBluesky, siBuymeacoffee, siClaude, siCloudflare,
  siCodesandbox, siDigitalocean, siDiscord, siDocker, siDribbble,
  siEbay, siEtsy, siFacebook, siFigma, siFirebase, siFlydotio, siGithub,
  siGitlab, siGmail, siGoogle, siGoogledocs, siGoogledrive, siGooglemaps,
  siHashnode, siHuggingface, siInstagram, siInternetarchive, siItchdotio,
  siJira, siKaggle, siKofi, siKubernetes, siLinear, siMastodon, siMdnwebdocs,
  siMedium, siMongodb, siNeon, siNetflix, siNetlify, siNextdotjs,
  siNodedotjs, siNotion, siNpm, siObsidian, siPatreon, siPaypal,
  siPerplexity, siPinterest, siPlanetscale, siPostgresql, siProducthunt,
  siPypi, siPython, siRailway, siReact, siReddit, siRedis, siRender,
  siReplit, siRust, siSteam, siStripe, siSubstack, siSupabase, siSvelte,
  siTailwindcss, siTauri, siTelegram, siThreads, siTrello, siTwitch,
  siTypescript, siUnsplash, siVercel, siVimeo, siVite, siVuedotjs,
  siWhatsapp, siWikipedia, siX, siYcombinator, siYoutube,
  type SimpleIcon,
} from "simple-icons";

export type KnownSite = {
  /** Human name used to prefill the title field. */
  name: string;
  icon: SimpleIcon;
};

export const KNOWN_SITES: Record<string, KnownSite> = {
  // Code and collaboration
  "github.com": { name: "GitHub", icon: siGithub },
  "gitlab.com": { name: "GitLab", icon: siGitlab },
  "bitbucket.org": { name: "Bitbucket", icon: siBitbucket },
  "codesandbox.io": { name: "CodeSandbox", icon: siCodesandbox },
  "replit.com": { name: "Replit", icon: siReplit },
  "npmjs.com": { name: "npm", icon: siNpm },
  "crates.io": { name: "crates.io", icon: siRust },
  "pypi.org": { name: "PyPI", icon: siPypi },
  "news.ycombinator.com": { name: "Hacker News", icon: siYcombinator },

  // AI
  "huggingface.co": { name: "Hugging Face", icon: siHuggingface },
  "claude.ai": { name: "Claude", icon: siClaude },
  "anthropic.com": { name: "Anthropic", icon: siAnthropic },
  "perplexity.ai": { name: "Perplexity", icon: siPerplexity },
  "kaggle.com": { name: "Kaggle", icon: siKaggle },

  // Design
  "figma.com": { name: "Figma", icon: siFigma },
  "dribbble.com": { name: "Dribbble", icon: siDribbble },
  "behance.net": { name: "Behance", icon: siBehance },
  "unsplash.com": { name: "Unsplash", icon: siUnsplash },
  "pinterest.com": { name: "Pinterest", icon: siPinterest },

  // Media
  "youtube.com": { name: "YouTube", icon: siYoutube },
  "twitch.tv": { name: "Twitch", icon: siTwitch },
  "vimeo.com": { name: "Vimeo", icon: siVimeo },
  "netflix.com": { name: "Netflix", icon: siNetflix },
  "steampowered.com": { name: "Steam", icon: siSteam },
  "itch.io": { name: "itch.io", icon: siItchdotio },

  // Social
  "reddit.com": { name: "Reddit", icon: siReddit },
  "x.com": { name: "X", icon: siX },
  "twitter.com": { name: "X", icon: siX },
  "bsky.app": { name: "Bluesky", icon: siBluesky },
  "mastodon.social": { name: "Mastodon", icon: siMastodon },
  "threads.net": { name: "Threads", icon: siThreads },
  "instagram.com": { name: "Instagram", icon: siInstagram },
  "facebook.com": { name: "Facebook", icon: siFacebook },
  "discord.com": { name: "Discord", icon: siDiscord },
  "telegram.org": { name: "Telegram", icon: siTelegram },
  "whatsapp.com": { name: "WhatsApp", icon: siWhatsapp },

  // Notes and planning
  "notion.so": { name: "Notion", icon: siNotion },
  "notion.com": { name: "Notion", icon: siNotion },
  "obsidian.md": { name: "Obsidian", icon: siObsidian },
  "trello.com": { name: "Trello", icon: siTrello },
  "linear.app": { name: "Linear", icon: siLinear },
  "asana.com": { name: "Asana", icon: siAsana },
  "atlassian.net": { name: "Jira", icon: siJira },
  "airtable.com": { name: "Airtable", icon: siAirtable },

  // Google
  "docs.google.com": { name: "Google Docs", icon: siGoogledocs },
  "drive.google.com": { name: "Google Drive", icon: siGoogledrive },
  "maps.google.com": { name: "Google Maps", icon: siGooglemaps },
  "mail.google.com": { name: "Gmail", icon: siGmail },
  "firebase.google.com": { name: "Firebase", icon: siFirebase },
  "google.com": { name: "Google", icon: siGoogle },

  // Reference
  "wikipedia.org": { name: "Wikipedia", icon: siWikipedia },
  "archive.org": { name: "Internet Archive", icon: siInternetarchive },
  "archiveofourown.org": { name: "AO3", icon: siArchiveofourown },
  "developer.mozilla.org": { name: "MDN Web Docs", icon: siMdnwebdocs },

  // Writing
  "medium.com": { name: "Medium", icon: siMedium },
  "substack.com": { name: "Substack", icon: siSubstack },
  "hashnode.com": { name: "Hashnode", icon: siHashnode },
  "producthunt.com": { name: "Product Hunt", icon: siProducthunt },

  // Commerce and funding
  "ebay.com": { name: "eBay", icon: siEbay },
  "etsy.com": { name: "Etsy", icon: siEtsy },
  "stripe.com": { name: "Stripe", icon: siStripe },
  "paypal.com": { name: "PayPal", icon: siPaypal },
  "ko-fi.com": { name: "Ko-fi", icon: siKofi },
  "buymeacoffee.com": { name: "Buy Me a Coffee", icon: siBuymeacoffee },
  "patreon.com": { name: "Patreon", icon: siPatreon },

  // Hosting and infrastructure
  "vercel.com": { name: "Vercel", icon: siVercel },
  "netlify.com": { name: "Netlify", icon: siNetlify },
  "cloudflare.com": { name: "Cloudflare", icon: siCloudflare },
  "railway.app": { name: "Railway", icon: siRailway },
  "render.com": { name: "Render", icon: siRender },
  "fly.io": { name: "Fly.io", icon: siFlydotio },
  "digitalocean.com": { name: "DigitalOcean", icon: siDigitalocean },
  "supabase.com": { name: "Supabase", icon: siSupabase },
  "neon.tech": { name: "Neon", icon: siNeon },
  "planetscale.com": { name: "PlanetScale", icon: siPlanetscale },
  "mongodb.com": { name: "MongoDB", icon: siMongodb },
  "postgresql.org": { name: "PostgreSQL", icon: siPostgresql },
  "redis.io": { name: "Redis", icon: siRedis },
  "docker.com": { name: "Docker", icon: siDocker },
  "kubernetes.io": { name: "Kubernetes", icon: siKubernetes },

  // Languages and frameworks
  "tauri.app": { name: "Tauri", icon: siTauri },
  "rust-lang.org": { name: "Rust", icon: siRust },
  "python.org": { name: "Python", icon: siPython },
  "typescriptlang.org": { name: "TypeScript", icon: siTypescript },
  "nodejs.org": { name: "Node.js", icon: siNodedotjs },
  "react.dev": { name: "React", icon: siReact },
  "vite.dev": { name: "Vite", icon: siVite },
  "vuejs.org": { name: "Vue", icon: siVuedotjs },
  "svelte.dev": { name: "Svelte", icon: siSvelte },
  "astro.build": { name: "Astro", icon: siAstro },
  "nextjs.org": { name: "Next.js", icon: siNextdotjs },
  "tailwindcss.com": { name: "Tailwind CSS", icon: siTailwindcss },
};

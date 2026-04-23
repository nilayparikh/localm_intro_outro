const outfitLatinWoff2 = new URL(
  "../assets/fonts/outfit-latin.woff2",
  import.meta.url,
).toString();
const shareTechMonoLatinWoff2 = new URL(
  "../assets/fonts/share-tech-mono-latin.woff2",
  import.meta.url,
).toString();

export const LOCAL_FONT_EMBED_CSS = [
  "@font-face {",
  "  font-family: 'Outfit';",
  "  font-style: normal;",
  "  font-weight: 300;",
  "  font-display: swap;",
  `  src: url('${outfitLatinWoff2}') format('woff2');`,
  "}",
  "@font-face {",
  "  font-family: 'Outfit';",
  "  font-style: normal;",
  "  font-weight: 400;",
  "  font-display: swap;",
  `  src: url('${outfitLatinWoff2}') format('woff2');`,
  "}",
  "@font-face {",
  "  font-family: 'Outfit';",
  "  font-style: normal;",
  "  font-weight: 600;",
  "  font-display: swap;",
  `  src: url('${outfitLatinWoff2}') format('woff2');`,
  "}",
  "@font-face {",
  "  font-family: 'Share Tech Mono';",
  "  font-style: normal;",
  "  font-weight: 400;",
  "  font-display: swap;",
  `  src: url('${shareTechMonoLatinWoff2}') format('woff2');`,
  "}",
].join("\n");

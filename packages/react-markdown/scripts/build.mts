import { Build } from "@assistant-ui/tsbuildutils";

await Build.start()
  .transpileCSS({
    tailwindEntrypoints: ["src/styles/tailwindcss/markdown.css"],
  })
  .transpileTypescript();

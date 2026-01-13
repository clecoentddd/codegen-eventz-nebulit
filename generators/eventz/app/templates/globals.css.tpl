@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
  }

  html {
    font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  body {
    @apply text-slate-800 antialiased;
    min-height: 100vh;
    background:
      radial-gradient(900px 500px at 10% -10%, #ffe6bf 0%, transparent 60%),
      radial-gradient(800px 500px at 90% 10%, #cce9ff 0%, transparent 55%),
      #f7f3ee;
  }

  code,
  pre {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  }
}

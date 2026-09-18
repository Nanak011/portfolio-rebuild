FROM node:22-bookworm-slim

# --- Install tectonic (single static binary, no full TeX Live needed) ---
# Pulls the latest linux-musl x86_64 release from GitHub. Pin a specific
# version tag here once you've confirmed it compiles your template cleanly.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates xz-utils \
    libgraphite2-3 libharfbuzz0b libfontconfig1 libicu72 \
    libssl3 zlib1g libfreetype6 libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz" \
    -o /tmp/tectonic.tar.gz \
    && tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin \
    && chmod +x /usr/local/bin/tectonic \
    && rm /tmp/tectonic.tar.gz

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=8080
EXPOSE 8080

# Pre-warm tectonic's package cache at build time so the first real request
# isn't slow downloading LaTeX packages. Uses a tiny throwaway document.
RUN echo '\\documentclass{article}\\begin{document}warm\\end{document}' > /tmp/warm.tex \
    && tectonic --outdir /tmp /tmp/warm.tex || true

CMD ["node", "src/index.js"]

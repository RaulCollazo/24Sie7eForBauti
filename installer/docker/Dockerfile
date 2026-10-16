# Thin image with Wine + Windows tooling prerequisites.
# The Windows toolchain (Python, Inno Setup) is installed at runtime by
# wine_toolchain.sh, because it needs `--security-opt seccomp=unconfined`
# (Docker's default seccomp profile blocks a syscall that Wine 9 requires).
#
# Usage: docker build -t 24sie7e-winbuilder installer/docker
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/root \
    WINEPREFIX=/wine \
    WINEARCH=win64 \
    WINEDEBUG=-all \
    WINEDLLOVERRIDES=mscoree,mshtml= \
    WINEPATH='C:\Python312;C:\Python312\Scripts;C:\InnoSetup6'

RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        wine wine64 wine32 xvfb cabextract winbind \
        wget ca-certificates unzip \
        imagemagick pngquant && \
    rm -rf /var/lib/apt/lists/*

COPY wine_toolchain.sh optimize_images.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wine_toolchain.sh /usr/local/bin/optimize_images.sh

WORKDIR /work

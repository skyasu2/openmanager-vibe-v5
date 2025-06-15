# OpenManager Vibe v5 개발 컨테이너
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# 시스템 업데이트 및 기본 패키지 설치
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    build-essential \
    curl \
    git \
    gnupg2 \
    jq \
    less \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    postgresql-client \
    redis-tools \
    ca-certificates \
    fonts-liberation \
    libu2f-udev \
    libvulkan1 \
    xdg-utils \
    wget \
    unzip \
    vim \
    nano \
    htop

# 한국어 로케일 설정
RUN apt-get -y install locales \
    && echo "ko_KR.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen

# Node.js 및 npm 글로벌 도구 설치
RUN npm install -g \
    @modelcontextprotocol/server-filesystem \
    @smithery/cli \
    tsx \
    concurrently \
    cross-env \
    vercel \
    lighthouse \
    @lhci/cli

# Playwright 브라우저 설치
RUN npx playwright install --with-deps chromium

# 작업 디렉토리 설정
WORKDIR /workspace

# 컨테이너 사용자 설정
USER node

# 셸 설정 (.bashrc 커스터마이징)
RUN echo 'export PS1="\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$ "' >> ~/.bashrc \
    && echo 'alias ll="ls -alF"' >> ~/.bashrc \
    && echo 'alias la="ls -A"' >> ~/.bashrc \
    && echo 'alias l="ls -CF"' >> ~/.bashrc \
    && echo 'alias npm-dev="npm run dev"' >> ~/.bashrc \
    && echo 'alias npm-test="npm run test"' >> ~/.bashrc \
    && echo 'alias npm-build="npm run build"' >> ~/.bashrc \
    && echo 'alias db-reset="npm run db:migrate"' >> ~/.bashrc \
    && echo 'alias redis-cli="redis-cli -h redis"' >> ~/.bashrc \
    && echo 'alias psql-dev="psql -h postgres -U postgres -d openmanager_dev"' >> ~/.bashrc

# Git 설정을 위한 스크립트 준비
RUN echo '#!/bin/bash\nif [ -z "$(git config --global user.name)" ]; then\n  echo "Git 사용자 정보를 설정해주세요:"\n  echo "git config --global user.name \"Your Name\""\n  echo "git config --global user.email \"your.email@example.com\""\nfi' > ~/.git-setup.sh \
    && chmod +x ~/.git-setup.sh

# 개발 환경 환경변수
ENV NODE_ENV=development
ENV TZ=Asia/Seoul
ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

# 포트 노출
EXPOSE 3000 3001 3100 3200 3201 6006 9229

CMD ["sleep", "infinity"] 
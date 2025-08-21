# BitSub Dockerfile
FROM ubuntu:22.04

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (version 18 LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create app user and directory
RUN useradd -m -s /bin/bash bitsub
WORKDIR /home/bitsub/app

# Copy package.json first for better caching
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

# Install DFX (Internet Computer SDK) as bitsub user
USER bitsub

# Set home directory
ENV HOME=/home/bitsub

# Create necessary directories
RUN mkdir -p /home/bitsub/bin /home/bitsub/.cache/dfinity

# Download and install DFX manually - detect architecture
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then ARCH="aarch64"; else ARCH="x86_64"; fi && \
    echo "Downloading DFX for architecture: $ARCH" && \
    curl -fL https://github.com/dfinity/sdk/releases/download/0.29.0/dfx-0.29.0-${ARCH}-linux.tar.gz \
    -o /tmp/dfx.tar.gz && \
    tar -xzf /tmp/dfx.tar.gz -C /home/bitsub/bin && \
    rm /tmp/dfx.tar.gz && \
    chmod +x /home/bitsub/bin/dfx

# Add DFX to PATH
ENV PATH="/home/bitsub/bin:${PATH}"

# Verify DFX installation
RUN dfx --version

# Copy the entire project
USER root
COPY . .
RUN chown -R bitsub:bitsub /home/bitsub/app

# Switch back to app user
USER bitsub

# Make scripts executable
RUN chmod +x scripts/*.sh

# Expose ports
# 4943 - DFX local replica
# 8080 - Frontend (if needed for development)
EXPOSE 4943 8080

# Set working directory
WORKDIR /home/bitsub/app

# Default command - start DFX and deploy
CMD ["./scripts/auto-deploy.sh"]
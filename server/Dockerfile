# Use the official Golang image to create a build artifact.
FROM golang:1.24 AS builder
WORKDIR /app

# Copy go mod and sum files to leverage Docker cache
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the source code into the container
COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# ---

# Use a specific Node.js version for the dependencies stage
FROM node:22 AS node-deps
WORKDIR /app/scraper
COPY scraper/package*.json ./
# Install only production dependencies
RUN npm ci

# ---

# Use the same Node.js version for the final image for consistency
FROM node:22

WORKDIR /app

# Install system dependencies required by Chromium
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chromium-sandbox \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libgconf-2-4 \
    # Clean up the apt cache to reduce image size
    && apt-get clean autoclean \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to tell Puppeteer/Playwright to use the system-installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Copy the compiled Go binary from the builder stage
COPY --from=builder /app/main .
COPY --from=builder /app/.env .
COPY --from=builder /app/easy-apply.json .

# Copy Node.js application and its installed dependencies
COPY --from=node-deps /app/scraper/node_modules ./scraper/node_modules
COPY scraper/ ./scraper/


# Create a non-root user and group.
# The -m flag creates a home directory for the user at /home/nodejs
RUN groupadd -r nodejs && useradd --no-log-init -r -g nodejs -m nodejs

# Change ownership of the app directory to the new user
RUN chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

# --- FIX ENDS HERE ---

# Expose the application port
EXPOSE 8080

# The command to run when the container starts
CMD ["./main"]

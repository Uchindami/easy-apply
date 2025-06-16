FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with platform-specific flags
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

ENV PORT=5173
EXPOSE 5173

CMD ["npm", "start"]
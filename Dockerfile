# Production Dockerfile for Local OCR Workbench
# Multi-stage build: Build React app → Serve with nginx

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_OCR_BASE_URL=/api/proxy
ARG VITE_OCR_ENDPOINT=/api/generate
ARG VITE_OCR_MODEL=glm-ocr

# Set build-time environment variables
ENV VITE_OCR_BASE_URL=$VITE_OCR_BASE_URL
ENV VITE_OCR_ENDPOINT=$VITE_OCR_ENDPOINT
ENV VITE_OCR_MODEL=$VITE_OCR_MODEL

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

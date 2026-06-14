# Development stage - for hot-reload with Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (will be mounted as volume in dev mode)
COPY . .

# Build argument for API URL
ARG VITE_API_URL=https://crm.visionplusapps.com/api
ENV VITE_API_URL=$VITE_API_URL

# Expose Vite dev server port
EXPOSE 5173

# Default command for development (overridden by docker-compose)
CMD ["npm", "run", "dev"]

# Production stage
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx config for SPA
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# --- Build Stage ---
FROM node:22-slim AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker's cache layer
COPY package*.json ./

# Install all dependencies (including devDependencies) for the build step
RUN npm ci --ignore-scripts

# Copy the rest of the application source code
COPY . .

# Accept build arguments for Vite environment variables (Vite embeds these at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the production application
RUN npm run build

# --- Production Runner Stage ---
FROM node:22-slim AS runner

WORKDIR /app

# Set Node environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Expose the Cloud Run default port
EXPOSE 8080

# Install ONLY production dependencies to optimize image size and build speed
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built application and server code from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Start the application
CMD ["npm", "run", "start"]

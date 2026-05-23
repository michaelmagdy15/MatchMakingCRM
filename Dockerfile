# --- Build Stage ---
FROM node:22-slim AS builder

WORKDIR /app

# Copy package descriptors first to leverage Docker's cache layer
COPY package*.json ./

# Install all dependencies (including devDependencies) for the build step
RUN npm ci --ignore-scripts

# Copy the rest of the application source code
COPY . .

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

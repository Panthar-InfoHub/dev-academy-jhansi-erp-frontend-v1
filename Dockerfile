# Base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

# Install only production dependencies
RUN npm install --force --only=production

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
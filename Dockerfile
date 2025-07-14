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

# Expose port
EXPOSE 3000



# Command to run the application
CMD ["npm", "start"]

# Base image
FROM node:18-alpine AS base

# Set environment variables
ENV AUTH_SECRET="WQTt+n7ZY7svqdEVOeLo4WgS2jzJ+bsiad9inMCBHbg="
ENV NEXT_PUBLIC_BACKEND_SERVER_URL="https://school-erp-backend-v1-dev-academy-545461602013.asia-south1.run.app"
ENV NEXT_PUBLIC_CHECK_IN_LAT="25.452176286026976"
ENV NEXT_PUBLIC_CHECK_IN_LNG="78.45625714416494"
ENV NEXT_PUBLIC_CHECK_IN_RADIUS="500"
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyD1l57Jr7ZVtMbzOvyZBhCdeH6oqZ2e5aM"
ENV NEXT_PUBLIC_SCHOOL_NAME="Dev Academy"

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

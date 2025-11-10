# Use a lightweight Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json first (for caching)
COPY app/src/package*.json ./

# Install dependencies
RUN npm install

# Copy all source code including public folder
COPY app/src/ . 

# Set environment variable for the app
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the server
CMD ["node", "server.js"]


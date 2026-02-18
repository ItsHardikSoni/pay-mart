# Use a Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install expo-cli globally
RUN npm install -g expo-cli

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8081

# Command to start the application for web
CMD ["npx", "expo", "start", "--web"]

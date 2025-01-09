# Base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the application code
COPY . .

# Start the application
CMD ["node", "index.js"]

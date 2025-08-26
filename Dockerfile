# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared libraries
COPY cognitive-core/ ./cognitive-core/

# Copy service source
ARG SERVICE_PATH
COPY ${SERVICE_PATH} ./${SERVICE_PATH}

# Install dependencies
RUN npm install

# Build shared libraries first
RUN cd cognitive-core/shared-libraries && npm run build

# Build the service
RUN cd ${SERVICE_PATH} && npm run build

# Expose port
EXPOSE 3000

# Start the service
CMD cd ${SERVICE_PATH} && npm start
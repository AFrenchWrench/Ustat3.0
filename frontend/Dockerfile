# Example Dockerfile for frontend (Next.js)
FROM node:20

WORKDIR /app

# Install dependencies
COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

# Copy the rest of the code
COPY . /app/

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]

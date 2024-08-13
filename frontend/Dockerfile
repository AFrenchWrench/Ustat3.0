# Use the official Node.js image as a base image
FROM node:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of the application code to the working directory
COPY . .

# Install dependencies
RUN npm install

# Build the Next.js application
RUN npm run build

# Expose the port on which the application will run
EXPOSE 3000

# Define the command to run the application in production mode
CMD ["npm", "run" , "dev"]
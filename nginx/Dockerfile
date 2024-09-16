# Use an official Nginx image as a base
FROM nginx:latest

# Copy your Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the necessary ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

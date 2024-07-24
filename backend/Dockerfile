# Use the official Python image from the Docker Hub
FROM python:3.12

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the project files into the container
COPY . .

RUN apt-get update && apt-get upgrade -y && apt-get install -y netcat-openbsd

# Install the dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt



RUN chmod +x /app/scripts/start.sh
RUN chmod +x /app/scripts/start-celery.sh

# Create a directory for uWSGI logs
RUN mkdir -p /var/log/uwsgi

EXPOSE 8000

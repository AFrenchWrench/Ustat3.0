# Use the official Python image from the Docker Hub
FROM python:3.12

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt /app/

RUN apt-get update && apt-get install -y netcat-openbsd

# Install the dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files into the container
COPY . /app/

# Ensure entrypoint.sh is executable
RUN chmod +x /app/entrypoint.sh
RUN chmod +x /app/scripts/start.sh
RUN chmod +x /app/scripts/start-celery.sh


# Set the entrypoint to the entrypoint.sh script
ENTRYPOINT ["/app/entrypoint.sh"]
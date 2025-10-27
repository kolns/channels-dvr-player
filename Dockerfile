# Use an official Python runtime as a parent image
FROM python:3.13-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 7734

# Command to run the application using Gunicorn and the app factory
CMD ["gunicorn", "--bind", "0.0.0.0:7734", "--workers", "4", "app:create_app()"]
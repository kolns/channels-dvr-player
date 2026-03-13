FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=run.py
ENV PORT=7734
ENV HOST=0.0.0.0

# Set the working directory
WORKDIR /app

# Install system dependencies (if any are needed later, they go here)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application codebase
COPY . .

# Expose the application port
EXPOSE 7734

# Use Gunicorn for production server serving
CMD ["gunicorn", "--bind", "0.0.0.0:7734", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "run:app"]

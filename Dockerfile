# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install system build dependencies (if any are needed for your specific pip packages)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev

COPY requirements.txt .
# Create wheels for dependencies to speed up final build
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Final Runtime
FROM python:3.11-slim

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Install Gunicorn for production server
RUN pip install --no-cache-dir gunicorn

# Copy wheels from builder and install
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Copy application code
COPY . .

# Ensure the config directory exists and is writable by our non-root user
# We assume 'config' is where channels.db and setup.flag live
RUN mkdir -p /app/config && chown -R appuser:appuser /app/config

# Switch to non-root user
USER appuser

# Expose the port
EXPOSE 7734

# Healthcheck to ensure the container is responsive
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7734/ || exit 1

# Production entrypoint
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:7734", "app:app"]

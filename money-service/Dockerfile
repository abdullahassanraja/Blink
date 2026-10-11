FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR $HOME/app

# Copy dependency specifications and install
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt || \
    pip install --no-cache-dir --user fastapi==0.115.0 uvicorn[standard]==0.30.6 pillow==10.4.0 numpy==1.26.4 python-multipart==0.0.9 tflite-runtime

# Copy application source code and model artifacts
COPY --chown=user app.py $HOME/app/app.py
COPY --chown=user model $HOME/app/model

EXPOSE 7860

# Run FastAPI via Uvicorn on port 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

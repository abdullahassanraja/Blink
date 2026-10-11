---
title: Blink Money
sdk: docker
app_port: 7860
---

# Blink Money Identifier Service

Inference service for Pakistani Rupee banknote classification using TensorFlow Lite, built with FastAPI and packaged for deployment to a Hugging Face Docker Space.

---

## 1. Overview & Model Contract

- **Model format:** TensorFlow Lite (`money_model.tflite`, 8.9 MB)
- **Input:** `[1, 224, 224, 3] float32`, raw pixel values `0-255` (no normalization required).
- **Output:** Softmax probabilities over 15 classes mapped dynamically via `classes.json`.
- **Group Aggregation:** Front and back classes for each denomination are merged using `groups.json`.
  - Groups: `1000Rs`, `100Rs`, `10Rs`, `20Rs`, `5000Rs`, `500Rs`, `50Rs`, `others`.
  - Group score = sum of member class probabilities.
  - The group `others` designates "not a note".
- **File size limit:** Maximum 1 MB per upload. Larger files are rejected with HTTP 413.
- **Privacy:** Images are processed in-memory as byte streams and discarded immediately. No images are stored to disk or logged.

---

## 2. Local Setup & Execution

### Prerequisites
- Python 3.10 or 3.11

### Step 1: Create Virtual Environment and Install Dependencies
```bash
cd money-service
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Start the Service
```bash
uvicorn app:app --host 0.0.0.0 --port 7860
```

The service is accessible at `http://localhost:7860`.
Interactive API docs are available at `http://localhost:7860/docs`.

---

## 3. Hugging Face Spaces Deployment

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** as the Space SDK (Blank template).
3. Set Space visibility to **Public** (or Private with an access token).
4. Clone your new Space repository or push the contents of `money-service/`:
   ```bash
   cd money-service
   git init
   git remote add origin https://huggingface.co/spaces/<your-username>/<your-space-name>
   git add .
   git commit -m "Deploy Blink money inference service"
   git push origin main
   ```
5. Hugging Face will automatically build the Docker container using `Dockerfile` and expose the service on port `7860`.
6. Once deployed, configure your Blink web application's `.env`:
   ```bash
   VITE_MONEY_URL=https://<your-username>-<your-space-name>.hf.space
   ```

---

## 4. API Endpoints

### `GET /health`
Returns service readiness and model metadata.

**Response (200 OK):**
```json
{
  "status": "ok",
  "model_loaded": true,
  "classes_count": 15,
  "groups_count": 8
}
```

### `POST /predict`
Accepts a multipart image upload (`file: UploadFile`) and returns classification results.

**Request:**
```bash
curl -X POST "http://localhost:7860/predict" \
  -F "file=@samples/sample_note_1000.jpg"
```

**Response (200 OK):**
```json
{
  "scores": {
    "1000Rs": 0.0001,
    "100Rs": 0.0173,
    "10Rs": 0.0001,
    "20Rs": 0.0001,
    "5000Rs": 0.0,
    "500Rs": 0.0001,
    "50Rs": 0.0,
    "others": 0.9825
  },
  "top": "others",
  "top_p": 0.9825,
  "second_p": 0.0173,
  "latency_ms": 14.85
}
```

---

## 5. Testing with Sample Images

Three test samples are provided in `samples/`:
1. `samples/sample_note_1000.jpg`
2. `samples/sample_note_100.jpg`
3. `samples/sample_others.jpg`

Test all three via curl:
```bash
# Test 1: Health check
curl -s http://localhost:7860/health

# Test 2: Sample Note 1000
curl -s -X POST http://localhost:7860/predict -F "file=@samples/sample_note_1000.jpg"

# Test 3: Sample Note 100
curl -s -X POST http://localhost:7860/predict -F "file=@samples/sample_note_100 cerebral.jpg"

# Test 4: Sample Others
curl -s -X POST http://localhost:7860/predict -F "file=@samples/sample_others.jpg"
```

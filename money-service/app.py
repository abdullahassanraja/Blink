import io
import json
import os
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "money_model.tflite")
CLASSES_PATH = os.path.join(MODEL_DIR, "classes.json")
GROUPS_PATH = os.path.join(MODEL_DIR, "groups.json")

# 1 MB max file size
MAX_FILE_SIZE = 1 * 1024 * 1024

# Global runtime state (loaded once at startup)
model_state: Dict[str, Any] = {
    "interpreter": None,
    "input_index": None,
    "output_index": None,
    "classes": [],
    "groups": [],
    "members": {},
}


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    if not os.path.exists(CLASSES_PATH):
        raise FileNotFoundError(f"classes.json not found at {CLASSES_PATH}")
    if not os.path.exists(GROUPS_PATH):
        raise FileNotFoundError(f"groups.json not found at {GROUPS_PATH}")

    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        classes = json.load(f)

    with open(GROUPS_PATH, "r", encoding="utf-8") as f:
        groups_data = json.load(f)

    # Interpreter import fallback
    interpreter = None
    try:
        from ai_edge_litert.interpreter import Interpreter, OpResolverType
        try:
            interpreter = Interpreter(
                model_path=MODEL_PATH,
                experimental_op_resolver_type=OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES,
            )
        except Exception:
            interpreter = Interpreter(model_path=MODEL_PATH)
    except ImportError:
        try:
            import tflite_runtime.interpreter as tflite
            interpreter = tflite.Interpreter(model_path=MODEL_PATH)
        except ImportError:
            import tensorflow as tf
            interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)

    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    model_state["interpreter"] = interpreter
    model_state["input_index"] = input_details[0]["index"]
    model_state["output_index"] = output_details[0]["index"]
    model_state["classes"] = classes
    model_state["groups"] = groups_data.get("groups", [])
    model_state["members"] = groups_data.get("members", {})
    print(f"Money model loaded successfully. Classes: {len(classes)}, Groups: {len(model_state['groups'])}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(
    title="Blink Money Identifier Service",
    description="FastAPI service for Pakistani Rupee banknote classification on Hugging Face Spaces",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration from ALLOWED_ORIGINS env variable
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").strip()
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Health check endpoint to wake the Space and report model readiness."""
    is_ready = model_state["interpreter"] is not None
    return {
        "status": "ok" if is_ready else "loading",
        "model_loaded": is_ready,
        "classes_count": len(model_state["classes"]),
        "groups_count": len(model_state["groups"]),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Run inference on an uploaded banknote JPEG image.
    Enforces <= 1 MB size, converts to RGB 224x224 float32 without normalization,
    and returns grouped probabilities, top group, top_p, second_p, and latency_ms.
    Never stores or logs the image.
    """
    if model_state["interpreter"] is None:
        raise HTTPException(status_code=503, detail="Model is still initializing")

    # Read image with 1 MB limit enforcement
    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of 1 MB (received {len(contents)} bytes)",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    start_time = time.perf_counter()

    # Convert to RGB, resize to 224x224, float32 (values 0-255, no normalization)
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image = image.resize((224, 224), Image.Resampling.BILINEAR)
        input_data = np.array(image, dtype=np.float32)
        input_data = np.expand_dims(input_data, axis=0)  # Shape: [1, 224, 224, 3]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    # Model inference
    interpreter = model_state["interpreter"]
    input_index = model_state["input_index"]
    output_index = model_state["output_index"]

    interpreter.set_tensor(input_index, input_data)
    interpreter.invoke()
    output_probs = interpreter.get_tensor(output_index)[0]  # Shape: [15]

    # Calculate group scores by summing member class probabilities
    scores: Dict[str, float] = {}
    members = model_state["members"]
    groups = model_state["groups"]

    for group in groups:
        member_indices = members.get(group, [])
        group_score = float(np.sum([output_probs[i] for i in member_indices if i < len(output_probs)]))
        scores[group] = round(group_score, 4)

    # Sort groups descending
    sorted_groups = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_group = sorted_groups[0][0] if sorted_groups else "others"
    top_p = float(sorted_groups[0][1]) if sorted_groups else 0.0
    second_p = float(sorted_groups[1][1]) if len(sorted_groups) > 1 else 0.0

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "scores": scores,
        "top": top_group,
        "top_p": top_p,
        "second_p": second_p,
        "latency_ms": latency_ms,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)

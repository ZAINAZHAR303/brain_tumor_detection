from io import BytesIO

import cv2
import httpx
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from transformers import AutoImageProcessor, AutoModelForImageClassification


MODEL_NAME = "prithivMLmods/BrainTumor-Classification-Mini"

LONGCAT_API_KEY = "ak_2Qd1zB7Mf3fn7wL5c01Bw9lK4hj8B"
LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions"
LONGCAT_MODEL = "LongCat-Flash-Chat"

MEDICAL_SYSTEM_PROMPT = (
    "You are a highly knowledgeable medical AI assistant specializing in neurology, "
    "brain tumors, and general medical topics. You provide accurate, detailed, and "
    "compassionate responses about:\n"
    "- Brain tumor types (glioma, meningioma, pituitary tumors, etc.)\n"
    "- Neurological symptoms, diagnosis methods, and treatment options\n"
    "- MRI scans and medical imaging interpretation\n"
    "- General medical questions and health guidance\n\n"
    "Guidelines:\n"
    "- Always be empathetic and supportive in your tone\n"
    "- Provide evidence-based information when possible\n"
    "- Use clear, accessible language avoiding excessive jargon\n"
    "- When discussing serious conditions, encourage consulting a healthcare professional\n"
    "- Always end responses about serious medical conditions with a brief disclaimer: "
    "'Please consult a qualified healthcare professional for personalized medical advice.'\n"
    "- Format responses with clear structure using paragraphs for readability\n"
    "- If you are unsure about something, say so rather than providing inaccurate information"
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

app = FastAPI(title="Brain Tumor Classification API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()


def prettify_label(label: str) -> str:
    return label.replace("_", " ").replace("-", " ").strip().title()


def get_label_name(index: int) -> str:
    id2label = getattr(model.config, "id2label", {})
    if isinstance(id2label, dict):
        if index in id2label:
            return str(id2label[index])
        string_key = str(index)
        if string_key in id2label:
            return str(id2label[string_key])
    return f"class_{index}"


def load_image(contents: bytes) -> Image.Image:
    np_buffer = np.frombuffer(contents, dtype=np.uint8)
    image_data = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if image_data is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
    image_rgb = cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB)
    return Image.fromarray(image_rgb)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, object]:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    image = load_image(contents)
    inputs = processor(images=image, return_tensors="pt")
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    if logits.shape[-1] == 1:
        probabilities = torch.sigmoid(logits)[0]
        confidence = float(probabilities.item())
        predicted_index = int(confidence >= 0.5)
        top_scores = [
            {"label": get_label_name(0), "display_label": prettify_label(get_label_name(0)), "confidence": round((1 - confidence) * 100, 2)},
            {"label": get_label_name(1), "display_label": prettify_label(get_label_name(1)), "confidence": round(confidence * 100, 2)},
        ]
    else:
        probabilities = torch.softmax(logits, dim=-1)[0]
        top_indices = torch.argsort(probabilities, descending=True)
        predicted_index = int(top_indices[0].item())
        confidence = float(probabilities[predicted_index].item())
        top_scores = [
            {
                "label": get_label_name(int(index.item())),
                "display_label": prettify_label(get_label_name(int(index.item()))),
                "confidence": round(float(probabilities[int(index.item())].item()) * 100, 2),
            }
            for index in top_indices[:3]
        ]

    label = get_label_name(predicted_index)
    return {
        "filename": file.filename,
        "prediction": {
            "label": label,
            "display_label": prettify_label(label),
            "confidence": round(confidence * 100, 2),
        },
        "top_predictions": top_scores,
    }


@app.post("/chat")
async def chat(request: ChatRequest) -> dict[str, str]:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    messages = [{"role": "system", "content": MEDICAL_SYSTEM_PROMPT}]

    for msg in request.history[-20:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    headers = {
        "Authorization": f"Bearer {LONGCAT_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": LONGCAT_MODEL,
        "messages": messages,
        "max_tokens": 2000,
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                LONGCAT_API_URL, headers=headers, json=payload
            )

        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="AI service is temporarily busy. Please try again in a moment.",
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Failed to get a response from the AI service.",
            )

        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return {"reply": reply}

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The AI service took too long to respond. Please try again.",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the AI service. Please try again later.",
        )

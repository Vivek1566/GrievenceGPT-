from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

ROOT = Path(__file__).resolve().parents[3]

def get_model_dir():
    candidates = [
        ROOT / "export" / "models" / "best_transformer_augmented",
        ROOT / "models" / "best_transformer_augmented",
        Path(__file__).resolve().parents[2] / "export" / "models" / "best_transformer_augmented",
        Path(__file__).resolve().parents[2] / "models" / "best_transformer_augmented",
    ]
    for c in candidates:
        safetensors = c / "model.safetensors"
        if safetensors.exists() and safetensors.stat().st_size > 1000:
            return c
    for c in candidates:
        if c.exists():
            return c
    return ROOT / "export" / "models" / "best_transformer_augmented"

MODEL_DIR = get_model_dir()
_tokenizer = None
_model = None
_device = None

def load_classifier():
    global _tokenizer, _model, _device
    if _model is None:
        if not MODEL_DIR.exists():
            raise FileNotFoundError(f"Model folder not found: {MODEL_DIR}")
        _device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR), local_files_only=True)
        _model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR), local_files_only=True)
        _model.to(_device)
        _model.eval()
    return _tokenizer, _model, _device


def predict_department(complaint: str):

    tokenizer, model, device = load_classifier()

    inputs = tokenizer(
        complaint,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    # DistilBERT does not use token_type_ids
    inputs.pop("token_type_ids", None)

    inputs = {
        key: value.to(device)
        for key, value in inputs.items()
    }

    with torch.inference_mode():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)[0]

    values, indices = torch.topk(
        probs,
        k=min(3, probs.shape[0])
    )

    mapping = model.config.id2label

    def label_for(i):
        return mapping.get(
            int(i),
            mapping.get(str(int(i)), f"Class {int(i)}")
        )

    predicted_id = int(torch.argmax(probs).item())

    top = [
        {
            "department": label_for(int(i)),
            "confidence": round(float(v) * 100, 2)
        }
        for v, i in zip(values, indices)
    ]

    return (
        label_for(predicted_id),
        round(float(probs[predicted_id]) * 100, 2),
        top
    )

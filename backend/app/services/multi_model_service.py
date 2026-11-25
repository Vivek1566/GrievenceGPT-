import json
import time
from pathlib import Path
import joblib
import torch
import torch.nn as nn

from app.services.classifier import predict_department, load_classifier

ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]

def _resolve_model_file(filename: str):
    candidates = [
        ROOT / "export" / "models" / filename,
        ROOT / "models" / filename,
        BACKEND_ROOT / "models" / filename,
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

# --- Global caches ---
_tfidf_data = None
_bilstm_model = None
_bilstm_vocab = None
_bilstm_labels = None


# --- Bi-LSTM Architecture ---
class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim=48, hidden_dim=48, num_classes=14):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(hidden_dim * 2, 48),
            nn.ReLU(),
            nn.Linear(48, num_classes)
        )
    def forward(self, x):
        emb = self.embedding(x)
        out, (hn, _) = self.lstm(emb)
        feat = torch.cat([hn[-2], hn[-1]], dim=1)
        return self.fc(feat)


def load_tfidf():
    global _tfidf_data
    if _tfidf_data is None:
        p = _resolve_model_file("tfidf_model.joblib")
        if not p.exists():
            return None
        _tfidf_data = joblib.load(p)
    return _tfidf_data


def load_bilstm():
    global _bilstm_model, _bilstm_vocab, _bilstm_labels
    if _bilstm_model is None:
        model_path = _resolve_model_file("bilstm_model.pt")
        vocab_path = _resolve_model_file("bilstm_vocab.json")
        if not model_path.exists() or not vocab_path.exists():
            return None, None, None
        with open(vocab_path, "r", encoding="utf-8") as f:
            vdata = json.load(f)
        _bilstm_vocab = vdata["vocab"]
        _bilstm_labels = vdata["labels"]
        model = BiLSTMClassifier(len(_bilstm_vocab), num_classes=len(_bilstm_labels))
        model.load_state_dict(torch.load(model_path, map_location="cpu"))
        model.eval()
        _bilstm_model = model
    return _bilstm_model, _bilstm_vocab, _bilstm_labels


def predict_tfidf(text: str):
    data = load_tfidf()
    if data is None:
        return predict_department(text)
    vec = data["vectorizer"]
    clf = data["classifier"]
    labels = data["labels"]

    t0 = time.time()
    X = vec.transform([text])
    probs = clf.predict_proba(X)[0]
    latency = round((time.time() - t0) * 1000, 2)

    top_indices = probs.argsort()[::-1][:3]
    top = [
        {"department": labels[i], "confidence": round(float(probs[i]) * 100, 2)}
        for i in top_indices
    ]
    pred_idx = top_indices[0]
    return labels[pred_idx], round(float(probs[pred_idx]) * 100, 2), top, latency


def predict_bilstm(text: str, max_len=48):
    model, vocab, labels = load_bilstm()
    if model is None:
        return predict_department(text)

    t0 = time.time()
    tokens = text.lower().split()[:max_len]
    seq = [vocab.get(w, 1) for w in tokens]
    if len(seq) < max_len:
        seq += [0] * (max_len - len(seq))

    x = torch.tensor([seq], dtype=torch.long)
    with torch.no_grad():
        out = model(x)
        probs = torch.softmax(out, dim=1)[0].numpy()
    latency = round((time.time() - t0) * 1000, 2)

    top_indices = probs.argsort()[::-1][:3]
    top = [
        {"department": labels[i], "confidence": round(float(probs[i]) * 100, 2)}
        for i in top_indices
    ]
    pred_idx = top_indices[0]
    return labels[pred_idx], round(float(probs[pred_idx]) * 100, 2), top, latency


def predict_any(text: str, model_type: str = "transformer"):
    model_type = (model_type or "transformer").lower()
    t0 = time.time()

    if model_type == "tfidf":
        dept, conf, top, lat = predict_tfidf(text)
        return {
            "model_used": "TF-IDF + Logistic Regression Baseline",
            "model_id": "tfidf",
            "department": dept,
            "confidence": conf,
            "top_predictions": top,
            "latency_ms": lat
        }
    elif model_type in ["bilstm", "lstm"]:
        dept, conf, top, lat = predict_bilstm(text)
        return {
            "model_used": "Bidirectional LSTM (Bi-LSTM)",
            "model_id": "bilstm",
            "department": dept,
            "confidence": conf,
            "top_predictions": top,
            "latency_ms": lat
        }
    else:
        # Default transformer
        dept, conf, top = predict_department(text)
        lat = round((time.time() - t0) * 1000, 2)
        return {
            "model_used": "Fine-Tuned MuRIL Transformer",
            "model_id": "transformer",
            "department": dept,
            "confidence": conf,
            "top_predictions": top,
            "latency_ms": lat
        }


def compare_all_models(text: str):
    t_res = predict_any(text, "transformer")
    b_res = predict_any(text, "bilstm")
    f_res = predict_any(text, "tfidf")

    all_agree = (
        t_res["department"] == b_res["department"] == f_res["department"]
    )
    return {
        "consensus": all_agree,
        "models": {
            "transformer": t_res,
            "bilstm": b_res,
            "tfidf": f_res
        }
    }


def get_benchmarks_data():
    p = _resolve_model_file("model_benchmarks.json")
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


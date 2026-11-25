from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[3]

def get_corpus_path():
    candidates = [
        ROOT / "export" / "data" / "processed" / "complaints_corpus.csv",
        ROOT / "data" / "processed" / "complaints_corpus.csv",
        Path(__file__).resolve().parents[2] / "export" / "data" / "processed" / "complaints_corpus.csv",
        Path(__file__).resolve().parents[2] / "data" / "processed" / "complaints_corpus.csv",
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

def get_embeddings_path():
    candidates = [
        ROOT / "export" / "models" / "complaint_embeddings.npy",
        ROOT / "models" / "complaint_embeddings.npy",
        Path(__file__).resolve().parents[2] / "export" / "models" / "complaint_embeddings.npy",
        Path(__file__).resolve().parents[2] / "models" / "complaint_embeddings.npy",
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

CORPUS_PATH = get_corpus_path()
EMBEDDINGS_PATH = get_embeddings_path()
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model = None
_corpus = None
_embeddings = None

def load_similarity():
    global _model, _corpus, _embeddings
    if _model is None:
        if not CORPUS_PATH.exists() or not EMBEDDINGS_PATH.exists():
            return None, None, None
        _model = SentenceTransformer(MODEL_NAME)
        _corpus = pd.read_csv(CORPUS_PATH)
        _embeddings = np.load(EMBEDDINGS_PATH)
        norms = np.linalg.norm(_embeddings, axis=1, keepdims=True)
        _embeddings = _embeddings / np.maximum(norms, 1e-12)
    return _model, _corpus, _embeddings

def find_similar(text: str, top_n: int = 5):
    model, corpus, embeddings = load_similarity()
    if model is None:
        return []
    query = model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
    scores = embeddings @ query
    indices = np.argsort(scores)[::-1][:top_n]
    rows = []
    for idx in indices:
        row = corpus.iloc[int(idx)]
        rows.append({
            "grievance_id": str(row.get("grievance_id", f"GRV-{idx}")),
            "text": str(row["text"]),
            "category": str(row["category"]),
            "similarity": round(float(scores[idx]) * 100, 2)
        })
    return rows

import json
import os
from pathlib import Path
import faiss
import numpy as np
from google import genai
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[3]

def _resolve_asset_path(path_str: str) -> str:
    p = Path(path_str)
    if p.exists():
        return str(p)
    # Check export directory at repo root
    export_p = ROOT / "export" / path_str
    if export_p.exists():
        return str(export_p)
    # Check relative to backend directory
    backend_p = Path(__file__).resolve().parents[2] / path_str
    if backend_p.exists():
        return str(backend_p)
    # Check relative to project root
    repo_p = ROOT / path_str
    if repo_p.exists():
        return str(repo_p)
    return path_str


class ProjectRAGService:
    def __init__(self, index_path="models/project_rag.index", chunks_path="models/project_chunks.json"):
        resolved_index = _resolve_asset_path(index_path)
        resolved_chunks = _resolve_asset_path(chunks_path)

        self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.index = faiss.read_index(resolved_index)
        with open(resolved_chunks, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

        api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def answer(self, question: str, top_k: int = 3) -> dict:
        q_emb = self.embedder.encode([question], normalize_embeddings=True).astype("float32")
        scores, indices = self.index.search(q_emb, top_k)
        retrieved = [self.chunks[i] for i in indices[0] if i != -1]
        context = "\n- ".join(retrieved)
        prompt = (
            "You are the Citizen Redressal Sahayak, an official AI guidance assistant for the Centralised Public Grievance Redress and Monitoring System (CPGRAMS).\n"
            "Your duty is to assist citizens, applicants, and residents regarding public grievance lodging, departmental jurisdictions (Water Supply, Electricity, Sanitation, Police, Roads, Ration/PDS, Healthcare, Pensions, Revenue, Municipal Certificates), "
            "official citizen charter SLAs and resolution timeframes, how to draft effective complaints, and how to escalate delayed or unresolved cases.\n"
            "Always be courteous, clear, informative, and actionable. Do NOT mention internal machine learning models, training algorithms, code files, or technical architecture.\n\n"
            f"Official Public Redressal Guidelines & Jurisdictions:\n- {context}\n\n"
            f"Citizen Inquiry: {question}\n\n"
            "Helpful guidance for the citizen:"
        )

        if not self.client:
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                try:
                    self.client = genai.Client(api_key=api_key)
                except Exception:
                    self.client = None

        if self.client:
            try:
                resp = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                return {"answer": resp.text, "sources": retrieved}
            except Exception as e:
                return {
                    "answer": f"**Official Redressal Guidelines:**\n\n" + "\n\n".join(retrieved),
                    "sources": retrieved
                }
        else:
            return {
                "answer": f"**CPGRAMS Public Redressal Guidelines:**\n\n" + "\n\n".join(retrieved) + "\n\n*(Tip: Set the GEMINI_API_KEY environment variable before launching to enable full conversational LLM replies via Gemini 2.5 Flash)*",
                "sources": retrieved
            }

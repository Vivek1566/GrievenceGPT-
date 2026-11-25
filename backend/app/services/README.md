The classifier loads the saved Hugging Face model from `models/best_transformer_augmented`.
Semantic search expects `models/complaint_embeddings.npy` and `data/processed/complaints_corpus.csv`.
If semantic assets are missing, analysis still works and returns an empty `similar_complaints` list.
from typing import List
from pinecone import Pinecone
import os
import clip
import torch
from PIL import Image
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file

# env variables should be loaded in upstream code
if not os.getenv("PINECONE_API_KEY"):
    raise ValueError("PINECONE_API_KEY environment variable not set")

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

pinecone = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY"),
)

index_name = "htv2025"
index = pinecone.Index(index_name)

def query_pinecone(vector, top_k=5, namespace=None) -> List[dict]:
    """
    Query Pinecone index with a vector and return top_k results
    """
    response = index.query(vector=vector, top_k=top_k, include_metadata=True, namespace=namespace)
    return response['matches']

def query_pinecone_with_image(image: Image.Image, top_k=5, namespace=None) -> List[dict]:
    """
    Embed image and query Pinecone index
    """
    image_input = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        vector = model.encode_image(image_input).tolist()
    return query_pinecone(vector, top_k=top_k, namespace=namespace)

def query_pinecone_with_text(text: str, top_k=5, namespace=None) -> List[dict]:
    """
    Embed text and query Pinecone index
    """
    text_input = clip.tokenize([text]).to(device)
    with torch.no_grad():
        vector = model.encode_text(text_input).tolist()
    return query_pinecone(vector, top_k=top_k, namespace=namespace)


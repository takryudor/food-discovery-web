import sys
import os
import json

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Place
from app.services.search_service import search_places

client = TestClient(app)

def test_ai_chatbox():
    print("Testing AI Chatbox endpoint...")
    
    with SessionLocal() as db:
        # Check Bún Bò Huế count
        total, results = search_places(
            db=db, 
            query="bún bò huế",
            location=None,
            radius_km=None,
            concept_ids=[],
            purpose_ids=[],
            amenity_ids=[]
        )
        print(f"Total 'bún bò huế' search results in DB: {total}")
    
    payload = {
        "message": "Thèm bún bò huế quá"
    }
    
    response = client.post("/ai/chatbox", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Returned {len(data['recommendations'])} recommendations.")
    else:
        print(f"Error: {response.status_code}")

if __name__ == "__main__":
    test_ai_chatbox()

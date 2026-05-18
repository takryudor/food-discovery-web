import sys
import os
import json

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Place

client = TestClient(app)

def test_ai_chatbox():
    print("Testing AI Chatbox endpoint...")
    
    # First, check if we have any data in the DB
    try:
        with SessionLocal() as db:
            count = db.query(Place).count()
            print(f"Total places in DB: {count}")
            if count == 0:
                print("WARNING: No places in DB. AI might not return good results.")
    except Exception as e:
        print(f"Error connecting to DB: {e}")
    
    payload = {
        "message": "Tìm cho tôi quán bún bò huế ở TP.HCM có phục vụ nhiệt tình"
    }
    
    print(f"Sending request: {payload}")
    try:
        response = client.post("/ai/chatbox", json=payload)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response data:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            if data.get("recommendations"):
                print(f"\nSUCCESS: AI returned {len(data['recommendations'])} recommendations.")
                for rec in data["recommendations"]:
                    print(f"- {rec['name']}: {rec['reason']}")
            else:
                print(f"\nNOTICE: AI returned no recommendations. Message: {data.get('message')}")
        else:
            print(f"FAILED: Request failed with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error calling endpoint: {e}")

if __name__ == "__main__":
    test_ai_chatbox()

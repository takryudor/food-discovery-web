import sys
import os
import json
import logging

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SCENARIOS = [
    {
        "id": "A1",
        "name": "Intent Extraction - Basic",
        "message": "Tìm quán bún bò ở Quận 1",
    },
    {
        "id": "B3",
        "name": "Strict Filtering - Unsupported Location",
        "message": "Quán bánh đa cua ở Hải Phòng",
    },
    {
        "id": "B4",
        "name": "Edge Case - Bún Bò Huế",
        "message": "Thèm bún bò huế quá",
    }
]

def run_scenarios():
    print("=" * 60)
    print("ID    | Scenario Name                       | Count | Result")
    print("-" * 60)
    
    passed = 0
    for scenario in SCENARIOS:
        print(f"{scenario['id']:5} | {scenario['name']:35} | ", end="", flush=True)
        
        try:
            response = client.post("/ai/chatbox", json={"message": scenario["message"]})
            if response.status_code == 200:
                data = response.json()
                recs = data.get("recommendations", [])
                count = len(recs)
                print(f"{count:5} | ", end="")
                
                # Basic check: should have recommendations or a message
                if count > 0 or data.get("message"):
                    print("PASSED")
                    passed += 1
                else:
                    print("FAILED (Empty)")
            else:
                print(f"0     | FAILED (HTTP {response.status_code})")
        except Exception as e:
            print(f"0     | ERROR: {e}")
            
    print("-" * 60)
    print(f"Result: {passed}/{len(SCENARIOS)} scenarios passed.")
    print("=" * 60)

if __name__ == "__main__":
    logging.getLogger("uvicorn").setLevel(logging.ERROR)
    run_scenarios()

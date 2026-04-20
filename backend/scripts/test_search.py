import httpx
import json
import asyncio

async def test_search():
    url = "http://localhost:8000/api/v1/search"
    
    # Test cases: (query, expected_place_name)
    test_cases = [
        ("bún", "Phở Nam Sài Gòn"),
        ("cam", "Cafe Sân Thượng"),
        ("bánh mì", "Bánh mì Góc Phố")
    ]
    
    async with httpx.AsyncClient() as client:
        for query, expected_name in test_cases:
            print(f"Testing query: '{query}'...")
            try:
                response = await client.post(url, json={"query": query})
                response.raise_for_status()
                data = response.json()
                
                items = data.get("items", [])
                if not items:
                    print(f"  ❌ FAILED: No results found for '{query}'")
                    continue
                    
                top_item_name = items[0].get("name")
                # Check if expected name is in top results
                found = any(expected_name in item["name"] for item in items[:3])
                
                if found:
                    print(f"  ✅ SUCCESS: Found '{expected_name}' in top results!")
                else:
                    print(f"  ⚠️  PARTIAL: Found '{top_item_name}' instead of '{expected_name}'")
                    
            except Exception as e:
                print(f"  ❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_search())

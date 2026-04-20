from app.db.session import SessionLocal
from app.db.models import Dish, Place

def debug():
    db = SessionLocal()
    dishes = db.query(Dish).all()
    print(f"Total dishes: {len(dishes)}")
    for d in dishes:
        print(f" - {d.name} (slug: {d.slug})")
        
    places = db.query(Place).all()
    print(f"\nTotal places: {len(places)}")
    for p in places:
        pd = [d.name for d in p.dishes]
        print(f" - {p.name}: dishes={pd}")

if __name__ == "__main__":
    debug()

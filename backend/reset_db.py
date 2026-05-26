from database import engine, Base, SessionLocal
from seed import seed_data

def reset():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding database...")
    db = SessionLocal()
    seed_data(db)
    db.close()
    print("Database reset and seeded successfully!")

if __name__ == "__main__":
    reset()

from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models, auth
import datetime

def seed_data(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # 1. Seed Users (Admin, Core, Student)
    users_to_seed = [
        {
            "username": "admin",
            "email": "admin@gfgcoe.codingclub.in",
            "full_name": "GFGCOE Admin Officer",
            "role": "admin",
            "password": "admin123",
            "points": 0,
            "certificates": None
        },
        {
            "username": "core_member",
            "email": "core@gfgcoe.codingclub.in",
            "full_name": "GFGCOE Core Lead",
            "role": "core",
            "password": "core123",
            "points": 0,
            "certificates": None
        },
        {
            "username": "student_member",
            "email": "student@gfgcoe.codingclub.in",
            "full_name": "GFGCOE Student Member",
            "role": "student",
            "password": "student123",
            "points": 180,
            "certificates": "ByteCraft 2026 Participation Certificate, Web React Bootcamp Completion"
        }
    ]
    
    for user_info in users_to_seed:
        existing = db.query(models.User).filter(models.User.username == user_info["username"]).first()
        if not existing:
            new_user = models.User(
                username=user_info["username"],
                email=user_info["email"],
                full_name=user_info["full_name"],
                role=user_info["role"],
                hashed_password=auth.get_password_hash(user_info["password"]),
                is_active=True,
                points=user_info["points"],
                certificates=user_info["certificates"]
            )
            db.add(new_user)
            db.commit()
            print(f"Seeded User: {user_info['username']} / {user_info['password']} ({user_info['role']})")

    # 2. Seed Committee Members if empty
    if db.query(models.Committee).count() == 0:
        members = [
            models.Committee(
                name="Prof. Rajesh K. Sharma",
                role="Faculty Advisor",
                image_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Dr. Sandeep J. Patil",
                role="Faculty Coordinator",
                image_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Siddharth Mehta",
                role="President",
                image_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Ananya Iyer",
                role="Vice President",
                image_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Rohan Deshmukh",
                role="Technical Lead - Open Source",
                image_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Amit Patel",
                role="Technical Lead - Web Architect",
                image_url="https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Neha Gupta",
                role="Event Coordinator - Competitions Lead",
                image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Karan Malhotra",
                role="Event Coordinator - Logistics Coordinator",
                image_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Shreya Rao",
                role="Core Team Member - Competitive Coding",
                image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Aditya Verma",
                role="Core Team Member - Android Dev",
                image_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
            models.Committee(
                name="Meera Sen",
                role="Core Team Member - PR Outreach",
                image_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250",
                linkedin_url="https://linkedin.com",
                github_url="https://github.com",
                year="2026"
            ),
        ]
        db.add_all(members)
        db.commit()
        print("Committee members seeded.")

    # 3. Seed Events if empty
    if db.query(models.Event).count() == 0:
        events = [
            models.Event(
                title="ByteCraft 2026 Hackathon",
                description="The ultimate annual 24-hour hackathon of GFGCOE. Bring your ideas, build prototypes, pitch to industry veterans, and win exciting cash prizes up to INR 50,000!",
                date=datetime.datetime.now() + datetime.timedelta(days=15),
                location="Main Campus Seminar Hall & Lab 5",
                image_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
                registration_link="https://bytecraft2026.example.com",
                category="Hackathon"
            ),
            models.Event(
                title="Full-Stack Web Boot Camp",
                description="A hands-on coding workshop on building modern single-page applications with React.js, Tailwind CSS, and FastAPI. Zero pre-requisites! Code templates will be shared.",
                date=datetime.datetime.now() + datetime.timedelta(days=7),
                location="Computer Center - Lab 3",
                image_url="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600",
                registration_link="https://forms.example.com/webbootcamp",
                category="Workshop"
            ),
            models.Event(
                title="Mastering DSA: Trees & Graphs",
                description="Join our senior coding mentors to crack the most popular interview topics. Learn traversal algorithms, shortest paths, and how to write clean, optimized code.",
                date=datetime.datetime.now() - datetime.timedelta(days=5),
                location="Online (YouTube Live)",
                image_url="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=600",
                registration_link="",
                category="Workshop"
            ),
            models.Event(
                title="Inaugural Tech Talk: Career in BigTech",
                description="An interactive session with GFGCOE Alumni working at Amazon, Google, and Microsoft. Learn strategies for off-campus placements, building resumes, and passing technical interviews.",
                date=datetime.datetime.now() - datetime.timedelta(days=20),
                location="Auditorium - Block A",
                image_url="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
                registration_link="",
                category="Seminar"
            ),
        ]
        db.add_all(events)
        db.commit()
        print("Events seeded.")

    # 4. Seed Projects if empty
    if db.query(models.Project).count() == 0:
        projects = [
            models.Project(
                title="GFGCOE Coding Arena",
                description="A customized real-time competitive programming platform designed specifically for college students. Supports sandboxed code evaluation, auto-plagiarism checking, and interactive real-time college leaderboards.",
                tech_stack="React, Node.js, Express, Docker, PostgreSQL",
                github_link="https://github.com",
                live_link="https://arena.gfgcoe.org",
                image_url="https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&q=80&w=600"
            ),
            models.Project(
                title="Smart Placement Tracker",
                description="An analytical student dashboard that parses resumes, suggests relevant job roles, tracks active campus drives, and sends immediate Slack/WhatsApp notifications to eligible candidates.",
                tech_stack="React, FastAPI, Python, SQLAlchemy, PostgreSQL",
                github_link="https://github.com",
                live_link="https://placement.gfgcoe.org",
                image_url="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600"
            ),
            models.Project(
                title="Club Website & Admin Suite",
                description="A beautiful, interactive, and responsive coding club management website featuring dark/light mode toggle, dynamic statistics counts, comprehensive event listings, and secure CRUD operations.",
                tech_stack="React.js, Tailwind CSS v4, FastAPI, SQLite",
                github_link="https://github.com",
                live_link="https://gfgcoe.org",
                image_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600"
            ),
        ]
        db.add_all(projects)
        db.commit()
        print("Projects seeded.")

    # 5. Seed Resources if empty
    if db.query(models.Resource).count() == 0:
        resources = [
            models.Resource(
                title="Comprehensive DSA Crack Sheet",
                description="A handpicked collection of 150+ essential coding questions across arrays, strings, dynamic programming, and graphs. Ideal for technical interviews.",
                category="DSA",
                link="https://gfgcoe.org/resources/dsa-sheet",
                tags="DSA, C++, Python, Interviews"
            ),
            models.Resource(
                title="Full-Stack Web Pathway Roadmap",
                description="A step-by-step master roadmap covering frontend, backend, APIs, system design, databases, security, and deployment guides for 2026.",
                category="Web Dev",
                link="https://gfgcoe.org/resources/web-roadmap",
                tags="Frontend, Backend, HTML, React, Node.js"
            ),
            models.Resource(
                title="Machine Learning & Deep Learning Guide",
                description="Free notebooks and datasets covering Linear Regression, Decision Trees, Neural Networks, PyTorch tutorials, and practical deployment scripts.",
                category="AI/ML",
                link="https://gfgcoe.org/resources/ml-guide",
                tags="Python, NumPy, Pandas, PyTorch, Scikit-Learn"
            ),
            models.Resource(
                title="Competitive Coding Cheatsheet",
                description="Quick reference templates for C++ STL containers, common bitwise hacks, fast IO, and segment tree implementations for speed programming.",
                category="Competitive Programming",
                link="https://gfgcoe.org/resources/cp-sheet",
                tags="CP, STL, Algorithms, Speed-Code"
            ),
        ]
        db.add_all(resources)
        db.commit()
        print("Resources seeded.")

    # 6. Seed Announcements if empty
    if db.query(models.Announcement).count() == 0:
        announcements = [
            models.Announcement(
                title="ByteCraft 2026 Registration Open!",
                content="Registrations for GFGCOE's premier annual hackathon ByteCraft 2026 are now officially open! Form a team of up to 4, lock in your ideas, and win cash prizes up to INR 50,000. Access details on the Events page.",
                is_pinned=True
            ),
            models.Announcement(
                title="Weekly DSA Meetup - Graph Traversals",
                content="Our weekly competitive programming lab will take place this Wednesday at 4:00 PM in Lab 3. We will cover BFS, DFS, and shortest path algorithms. Check out the resources page for graph study guides!",
                is_pinned=False
            ),
            models.Announcement(
                title="System Design Lecture Series",
                content="Next month, GFGCOE Coding Club will host guest lectures by senior system architects from Amazon and Microsoft. Topics include scalability, load balancing, caching architectures, and SQL vs NoSQL. RSVP on the Events tab.",
                is_pinned=False
            )
        ]
        db.add_all(announcements)
        db.commit()
        print("Announcements seeded.")

    # 7. Seed Student Mock Event RSVP Registration
    student = db.query(models.User).filter(models.User.username == "student_member").first()
    first_event = db.query(models.Event).first()
    if student and first_event:
        existing_rsvp = db.query(models.EventRegistration).filter(
            models.EventRegistration.user_id == student.id,
            models.EventRegistration.event_id == first_event.id
        ).first()
        if not existing_rsvp:
            rsvp = models.EventRegistration(user_id=student.id, event_id=first_event.id)
            db.add(rsvp)
            db.commit()
            print("Student mock event RSVP seeded.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_data(db)
    db.close()

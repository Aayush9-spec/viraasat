import os
import sys

# Tests must never touch the production database. Route every storage read
# through the in-memory backend before any module imports `app.services.storage`.
os.environ["DATABASE_URL"] = "memory://"
os.environ.pop("SQLITE_PATH", None)
os.environ.pop("FIREBASE_SERVICE_ACCOUNT_JSON", None)
os.environ.pop("CLERK_SECRET_KEY", None)

BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
SERVICES_DIR = os.path.join(BACKEND_DIR, "app", "services")
if SERVICES_DIR not in sys.path:
    sys.path.insert(0, SERVICES_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

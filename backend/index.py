import sys
import types
from pathlib import Path

# Ensure backend directory and repo root are in sys.path
backend_dir = Path(__file__).resolve().parent
repo_dir = backend_dir.parent

for p in (str(backend_dir), str(repo_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

# If 'backend' package is not directly importable (e.g. running inside backend/ as root on Vercel),
# create virtual 'backend' package mapping so all `from backend.app...` imports resolve seamlessly.
if "backend" not in sys.modules:
    try:
        import backend
    except ImportError:
        import app
        backend_pkg = types.ModuleType("backend")
        backend_pkg.app = app
        sys.modules["backend"] = backend_pkg
        sys.modules["backend.app"] = app

from backend.app.main import app

__all__ = ["app"]
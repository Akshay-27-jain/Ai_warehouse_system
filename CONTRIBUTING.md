# Contributing to AI Warehouse Optimization System

Thank you for considering contributing to the AI Warehouse Optimization System!

## Development Workflow

1. **Fork & Clone**: Fork the repository and clone it locally.
2. **Branching**: Create a topic branch (`git checkout -b feature/amazing-feature`).
3. **Environment Setup**:
   - Backend: Create a virtual environment (`python -m venv .venv`) and install dependencies (`pip install -r services/api/requirements.txt`).
   - Frontend: Install Node modules (`npm install --prefix apps/web`).
4. **Code Quality & Testing**:
   - Run Python tests: `pytest services/api/app/tests`
   - Run TypeScript type checking: `npm --prefix apps/web run build` or `npx tsc --noEmit`
5. **Security Verification**:
   - Ensure NO credentials, secrets, or `.env` files are tracked by Git.
6. **Pull Request**: Push your branch and open a PR against `main`.

## Code Style

- Python: Follow PEP 8 guidelines.
- TypeScript/React: Use ESLint/Prettier defaults, strict type annotations, and Framer Motion for smooth animations.

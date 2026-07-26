"""
Script to import Google OAuth client credentials from a downloaded client_secret.json file directly into .env
Usage:
  python scripts/load_client_secret.py /path/to/client_secret.json
"""
import json
import os
import sys
from pathlib import Path


def import_client_secret(json_path):
    path = Path(json_path).resolve()
    if not path.exists():
        print(f"Error: File not found at {path}")
        sys.exit(1)

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    payload = data.get('web') or data.get('installed') or data
    client_id = payload.get('client_id')
    client_secret = payload.get('client_secret')
    redirect_uris = payload.get('redirect_uris', [])
    redirect_uri = redirect_uris[0] if redirect_uris else 'http://localhost:5000/api/v1/auth/google/callback'

    if not client_id or not client_secret:
        print("Error: Could not find client_id or client_secret in JSON file.")
        sys.exit(1)

    # Locate target .env file
    api_dir = Path(__file__).resolve().parents[1]
    env_file = api_dir.parent / '.env'
    if not env_file.exists():
        env_file = api_dir / '.env'

    lines = []
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

    updates = {
        'GOOGLE_CLIENT_ID': client_id,
        'GOOGLE_CLIENT_SECRET': client_secret,
        'GOOGLE_REDIRECT_URI': redirect_uri,
        'GMAIL_CLIENT_ID': client_id,
        'GMAIL_CLIENT_SECRET': client_secret,
    }

    new_lines = []
    seen = set()
    for line in lines:
        stripped = line.strip()
        matched = False
        for key, val in updates.items():
            if stripped.startswith(f"{key}="):
                new_lines.append(f"{key}={val}\n")
                seen.add(key)
                matched = True
                break
        if not matched:
            new_lines.append(line)

    for key, val in updates.items():
        if key not in seen:
            new_lines.append(f"{key}={val}\n")

    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"Successfully imported OAuth credentials into {env_file}!")
    print(f"  GOOGLE_CLIENT_ID: {client_id[:15]}...")
    print(f"  GOOGLE_REDIRECT_URI: {redirect_uri}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/load_client_secret.py <path_to_client_secret.json>")
        sys.exit(1)

    import_client_secret(sys.argv[1])

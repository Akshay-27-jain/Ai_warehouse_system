import json
import os
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

ROOT = Path(__file__).resolve().parents[1]
CLIENT_SECRET_PATH = ROOT / "scripts" / "client_secret.json"


def ensure_client_secret_file():
    if CLIENT_SECRET_PATH.exists():
        return CLIENT_SECRET_PATH

    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")

    payload = {
        "installed": {
            "client_id": client_id,
            "project_id": "ai-warehouse-system",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost", "http://localhost:8080"],
        }
    }
    CLIENT_SECRET_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return CLIENT_SECRET_PATH


if __name__ == "__main__":
    ensure_client_secret_file()
    print(f"Using client secrets file: {CLIENT_SECRET_PATH}")
    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_PATH), SCOPES)
    creds = flow.run_console()

    print("\n========== SUCCESS ==========")
    print("Refresh Token:")
    print(creds.refresh_token)
    print("=============================")

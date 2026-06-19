import argparse
import os

import httpx


def main() -> None:
    parser = argparse.ArgumentParser(description="CTRL SEA authentication smoke test")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000/api")
    parser.add_argument("--email", default=os.getenv("CTRL_SEA_SMOKE_EMAIL"))
    parser.add_argument("--password", default=os.getenv("CTRL_SEA_SMOKE_PASSWORD"))
    args = parser.parse_args()
    if not args.email or not args.password:
        raise SystemExit("Provide --email/--password or CTRL_SEA_SMOKE_EMAIL/CTRL_SEA_SMOKE_PASSWORD for an existing user")

    with httpx.Client(base_url=args.base_url, timeout=10) as client:
        login = client.post("/auth/login", json={"email": args.email, "password": args.password})
        login.raise_for_status()
        token = login.json()["access_token"]

        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        me.raise_for_status()

        dashboard = client.get("/dashboard", headers={"Authorization": f"Bearer {token}"})
        dashboard.raise_for_status()

        invalid_password = client.post("/auth/login", json={"email": args.email, "password": "WrongPass123!"})
        assert invalid_password.status_code == 401, invalid_password.text

    print(f"Auth smoke test passed for {args.email}")


if __name__ == "__main__":
    main()

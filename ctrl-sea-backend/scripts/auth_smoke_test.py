import argparse
import time

import httpx


def main() -> None:
    parser = argparse.ArgumentParser(description="CTRL SEA authentication smoke test")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000/api")
    parser.add_argument("--email", default=f"smoke.{int(time.time())}@example.com")
    parser.add_argument("--password", default="Password123!")
    args = parser.parse_args()

    with httpx.Client(base_url=args.base_url, timeout=10) as client:
        admin_login = client.post("/auth/login", json={"email": "admin@ctrlsea.com", "password": "Admin12345!"})
        admin_login.raise_for_status()
        admin_token = admin_login.json()["access_token"]

        me = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        me.raise_for_status()

        register = client.post("/auth/register", json={"full_name": "Smoke Analyst", "email": args.email, "password": args.password})
        register.raise_for_status()
        token = register.json()["access_token"]

        login = client.post("/auth/login", json={"email": args.email, "password": args.password})
        login.raise_for_status()

        dashboard = client.get("/dashboard", headers={"Authorization": f"Bearer {token}"})
        dashboard.raise_for_status()

        duplicate = client.post("/auth/register", json={"full_name": "Smoke Analyst", "email": args.email, "password": args.password})
        assert duplicate.status_code == 409, duplicate.text

        invalid_password = client.post("/auth/login", json={"email": args.email, "password": "WrongPass123!"})
        assert invalid_password.status_code == 401, invalid_password.text

    print(f"Auth smoke test passed for {args.email}")


if __name__ == "__main__":
    main()


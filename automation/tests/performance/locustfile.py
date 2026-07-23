from typing import Any

from locust import HttpUser, between, task


class PublicBatikApiUser(HttpUser):
    """Read-only requests for independently comparing public API endpoints."""

    wait_time = between(1, 3)
    latest_slug: str | None = None

    @task
    def list_batiks(self) -> None:
        with self.client.get(
            "/api/v1/batiks",
            params={"page": 1, "per_page": 9},
            name="GET /api/v1/batiks",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"unexpected status {response.status_code}")
                return

            try:
                payload: dict[str, Any] = response.json()
                items = payload.get("data", {}).get("items", [])
            except ValueError:
                response.failure("response is not valid JSON")
                return

            if not isinstance(items, list):
                response.failure("response data.items is not a list")
                return

            for item in items:
                slug = item.get("slug") if isinstance(item, dict) else None
                if isinstance(slug, str) and slug:
                    self.latest_slug = slug
                    break

    @task
    def search_batiks(self) -> None:
        self.client.get(
            "/api/v1/batiks/search",
            params={"q": "batik", "page": 1, "per_page": 9},
            name="GET /api/v1/batiks/search",
        )

    @task
    def get_batik_detail(self) -> None:
        if self.latest_slug:
            self.client.get(
                f"/api/v1/batiks/{self.latest_slug}",
                name="GET /api/v1/batiks/[slug]",
            )

    @task
    def list_legacy_batiks(self) -> None:
        self.client.get(
            "/api/batik/getbatik",
            params={"page": 1, "per_page": 9},
            name="GET /api/batik/getbatik",
        )

    @task
    def search_legacy_batiks(self) -> None:
        self.client.get(
            "/api/batik/search",
            params={"q": "batik", "page": 1, "per_page": 9},
            name="GET /api/batik/search",
        )

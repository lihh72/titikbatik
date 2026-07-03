import asyncio
from pathlib import Path
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import ExternalServiceError, ServiceUnavailableError


class ComfyUIService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def _client(self, timeout: float | None = None) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=self.settings.comfyui_base_url, timeout=timeout or self.settings.comfyui_request_timeout_seconds)

    async def check_health(self) -> bool:
        try:
            async with self._client() as client:
                response = await client.get("/queue")
                response.raise_for_status()
            return True
        except httpx.HTTPError:
            return False

    async def upload_image(self, path: Path, *, image_type: str = "input", overwrite: bool = True) -> str:
        try:
            async with self._client() as client:
                with path.open("rb") as handle:
                    response = await client.post(
                        "/upload/image",
                        data={"type": image_type, "overwrite": str(overwrite).lower()},
                        files={"image": (path.name, handle, "application/octet-stream")},
                    )
                response.raise_for_status()
                data = response.json()
                return data.get("name") or data.get("filename") or path.name
        except httpx.ConnectError as exc:
            raise ServiceUnavailableError("ComfyUI is offline") from exc
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"ComfyUI upload failed: {exc}") from exc

    async def queue_prompt(self, prompt: dict[str, Any]) -> str:
        try:
            async with self._client() as client:
                response = await client.post(
                    "/prompt",
                    json={"prompt": prompt, "client_id": self.settings.comfyui_client_id},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as exc:
            raise ServiceUnavailableError("ComfyUI is offline") from exc
        except httpx.HTTPStatusError as exc:
            raise ExternalServiceError(f"ComfyUI rejected workflow: {exc.response.text[:500]}") from exc
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"ComfyUI queue request failed: {exc}") from exc
        prompt_id = data.get("prompt_id")
        if not prompt_id:
            raise ExternalServiceError("ComfyUI response did not include prompt_id")
        return str(prompt_id)

    async def get_history(self, prompt_id: str) -> dict[str, Any]:
        try:
            async with self._client() as client:
                response = await client.get(f"/history/{prompt_id}")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"ComfyUI history request failed: {exc}") from exc

    async def get_queue(self) -> dict[str, Any]:
        try:
            async with self._client() as client:
                response = await client.get("/queue")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"ComfyUI queue request failed: {exc}") from exc

    def history_item(self, history: dict[str, Any], prompt_id: str) -> dict[str, Any] | None:
        return history.get(prompt_id) or history.get(str(prompt_id))

    def prompt_in_queue(self, queue: dict[str, Any], prompt_id: str) -> bool:
        return self._contains_prompt_id(queue.get("queue_running", []), prompt_id) or self._contains_prompt_id(
            queue.get("queue_pending", []), prompt_id
        )

    async def wait_for_completion(self, prompt_id: str) -> dict[str, Any]:
        deadline = asyncio.get_running_loop().time() + self.settings.comfyui_generation_timeout_seconds
        while asyncio.get_running_loop().time() < deadline:
            history = await self.get_history(prompt_id)
            item = self.history_item(history, prompt_id)
            if item:
                status = item.get("status", {})
                if status.get("status_str") == "error" or status.get("completed") is False and status.get("messages"):
                    raise ExternalServiceError(f"ComfyUI execution failed for prompt {prompt_id}")
                if item.get("outputs"):
                    return item
            await asyncio.sleep(self.settings.worker_poll_interval_seconds)
        raise ExternalServiceError(f"ComfyUI generation timed out after {self.settings.comfyui_generation_timeout_seconds}s")

    def get_output_images(self, history_item: dict[str, Any], *, save_node_id: str | None = None) -> list[dict[str, Any]]:
        outputs = history_item.get("outputs", {})
        nodes = [save_node_id] if save_node_id else list(outputs.keys())
        images: list[dict[str, Any]] = []
        for node_id in nodes:
            output = outputs.get(str(node_id), {})
            images.extend(output.get("images", []))
        return images

    def get_output_videos(
        self,
        history_item: dict[str, Any],
        *,
        save_node_id: str | None = None,
    ) -> list[dict[str, Any]]:
        outputs = history_item.get("outputs", {})
        nodes = [save_node_id] if save_node_id else list(outputs.keys())
        videos: list[dict[str, Any]] = []
        for node_id in nodes:
            output = outputs.get(str(node_id), {})
            for key in ("videos", "video", "gifs"):
                value = output.get(key, [])
                if isinstance(value, dict):
                    value = [value]
                if isinstance(value, list):
                    videos.extend(
                        item for item in value if isinstance(item, dict) and item.get("filename")
                    )
            image_descriptors = output.get("images", [])
            if isinstance(image_descriptors, list):
                videos.extend(
                    item
                    for item in image_descriptors
                    if isinstance(item, dict)
                    and str(item.get("filename", "")).lower().endswith((".mp4", ".webm"))
                )
        return videos

    async def download_output_image(self, image_info: dict[str, Any]) -> bytes:
        return await self.download_output_file(image_info)

    async def download_output_file(self, file_info: dict[str, Any]) -> bytes:
        params = {
            "filename": file_info["filename"],
            "subfolder": file_info.get("subfolder", ""),
            "type": file_info.get("type", "output"),
        }
        try:
            async with self._client() as client:
                response = await client.get("/view", params=params)
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"ComfyUI output download failed: {exc}") from exc

    def _contains_prompt_id(self, value: Any, prompt_id: str) -> bool:
        if isinstance(value, str):
            return value == prompt_id
        if isinstance(value, dict):
            return any(self._contains_prompt_id(child, prompt_id) for child in value.values())
        if isinstance(value, (list, tuple)):
            return any(self._contains_prompt_id(child, prompt_id) for child in value)
        return False

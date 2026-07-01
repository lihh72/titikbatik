import json
from pathlib import Path
from typing import Any

from app.core.config import Settings, get_settings
from app.core.exceptions import WorkflowMappingError


GENERATE_NODE_MAPPING = {
    "positive_prompt": {"id": "6", "class_type": "CLIPTextEncode", "widget": 0},
    "negative_prompt": {"id": "7", "class_type": "CLIPTextEncode", "widget": 0},
    "sampler": {"id": "3", "class_type": "KSampler"},
    "latent_image": {"id": "5", "class_type": "EmptyLatentImage"},
    "save_image": {"id": "9", "class_type": "SaveImage"},
    "checkpoint": {"id": "4", "class_type": "CheckpointLoaderSimple"},
    "lora": {"id": "11", "class_type": "LoraLoader"},
}

COMBINE_NODE_MAPPING = {
    "sampler": {"id": "3", "class_type": "KSampler"},
    "positive_prompt": {"id": "111", "class_type": "TextEncodeQwenImageEditPlus", "widget": 0},
    "negative_prompt": {"id": "110", "class_type": "TextEncodeQwenImageEditPlus", "widget": 0},
    "base_costume_image": {"id": "78", "class_type": "LoadImage", "widget": 0},
    "batik_motif_image": {"id": "106", "class_type": "LoadImage", "widget": 0},
    "latent_image": {"id": "112", "class_type": "EmptySD3LatentImage"},
    "save_image": {"id": "60", "class_type": "SaveImage"},
}

VIDEO_NODE_MAPPING = {
    "input_image": {"id": "269", "class_type": "LoadImage"},
    "width": {"id": "320:312", "class_type": "PrimitiveInt"},
    "height": {"id": "320:299", "class_type": "PrimitiveInt"},
    "create_video": {"id": "320:310", "class_type": "CreateVideo"},
    "save_video": {"id": "75", "class_type": "SaveVideo"},
}


class WorkflowService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def build_generate_prompt(
        self,
        *,
        positive_prompt: str,
        negative_prompt: str,
        filename_prefix: str,
    ) -> dict[str, Any]:
        workflow = self._load_workflow(self.settings.path(self.settings.generate_workflow_path))
        self._validate_mapping(workflow, GENERATE_NODE_MAPPING)
        self._set_input(workflow, "6", "text", positive_prompt)
        self._set_input(workflow, "7", "text", negative_prompt)
        self._set_input(workflow, "9", "filename_prefix", filename_prefix)
        return workflow

    def build_combine_prompt(
        self,
        *,
        costume_image_name: str,
        batik_image_name: str,
        filename_prefix: str,
    ) -> dict[str, Any]:
        workflow = self._load_workflow(self.settings.path(self.settings.combine_workflow_path))
        self._validate_mapping(workflow, COMBINE_NODE_MAPPING)
        self._set_input(workflow, "78", "image", costume_image_name)
        self._set_input(workflow, "106", "image", batik_image_name)
        self._set_input(workflow, "60", "filename_prefix", filename_prefix)
        return workflow

    def build_video_prompt(
        self,
        *,
        costume_image_name: str,
        filename_prefix: str,
    ) -> dict[str, Any]:
        workflow = self._load_workflow(self.settings.path(self.settings.video_workflow_path))
        self._validate_mapping(workflow, VIDEO_NODE_MAPPING)
        self._set_input(workflow, "269", "image", costume_image_name)
        self._set_input(workflow, "320:312", "value", 512)
        self._set_input(workflow, "320:299", "value", 512)
        self._node(workflow, "320:310").setdefault("inputs", {}).pop("audio", None)
        self._set_input(workflow, "75", "filename_prefix", filename_prefix)
        return workflow

    def get_input(self, workflow: dict[str, Any], node_id: str, name: str, default: Any = None) -> Any:
        return workflow.get(node_id, {}).get("inputs", {}).get(name, default)

    def inspect_workflow(self, path: Path) -> list[dict[str, Any]]:
        workflow = self._load_workflow(path)
        rows: list[dict[str, Any]] = []
        for node_id, node in sorted(workflow.items(), key=lambda item: self._node_sort_key(str(item[0]))):
            node_inputs = node.get("inputs", {})
            connections = [
                f"{name} <- {value[0]}:{value[1]}"
                for name, value in node_inputs.items()
                if self._is_connection(value)
            ]
            parameters = [name for name, value in node_inputs.items() if not self._is_connection(value)]
            rows.append(
                {
                    "node_id": str(node_id),
                    "class_type": node.get("class_type"),
                    "title": node.get("_meta", {}).get("title", ""),
                    "inputs": ", ".join(node_inputs.keys()),
                    "connection": "; ".join(connections),
                    "candidate_parameter": ", ".join(parameters),
                }
            )
        return rows

    @staticmethod
    def _node_sort_key(node_id: str) -> tuple[int, ...]:
        try:
            return tuple(int(part) for part in node_id.split(":"))
        except ValueError:
            return (2**31 - 1, *node_id.encode("utf-8"))

    def ui_to_api_prompt(self, workflow: dict[str, Any]) -> dict[str, Any]:
        nodes = {str(node["id"]): node for node in workflow.get("nodes", [])}
        links = {link[0]: link for link in workflow.get("links", [])}
        api_prompt: dict[str, Any] = {}
        for node_id, node in nodes.items():
            inputs: dict[str, Any] = {}
            for node_input in node.get("inputs", []):
                link_id = node_input.get("link")
                if link_id is None:
                    continue
                link = links.get(link_id)
                if not link:
                    continue
                inputs[node_input["name"]] = [str(link[1]), int(link[2])]
            inputs.update(self._widget_inputs(node))
            api_prompt[node_id] = {"class_type": node["type"], "inputs": inputs}
        return api_prompt

    def _load_workflow(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            raise WorkflowMappingError(f"Workflow file not found: {path}")
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if "nodes" in data and "links" in data:
            return self.ui_to_api_prompt(data)
        if self._is_api_prompt(data):
            return json.loads(json.dumps(data))
        raise WorkflowMappingError(f"Workflow must be a ComfyUI UI export or API prompt: {path}")

    def _validate_mapping(self, workflow: dict[str, Any], mapping: dict[str, dict[str, Any]]) -> None:
        for key, expected in mapping.items():
            node = workflow.get(expected["id"])
            if not node:
                raise WorkflowMappingError(f"Workflow mapping '{key}' node {expected['id']} was not found")
            if node.get("class_type") != expected["class_type"]:
                raise WorkflowMappingError(
                    f"Workflow mapping '{key}' expected {expected['class_type']} at node {expected['id']}, "
                    f"found {node.get('class_type')}"
                )

    def _set_input(self, workflow: dict[str, Any], node_id: str, name: str, value: Any) -> None:
        node = self._node(workflow, node_id)
        inputs = node.setdefault("inputs", {})
        if name not in inputs:
            raise WorkflowMappingError(f"Node {node_id} has no input '{name}'")
        inputs[name] = value

    def _node(self, workflow: dict[str, Any], node_id: str) -> dict[str, Any]:
        node = workflow.get(node_id)
        if not node:
            raise WorkflowMappingError(f"Node {node_id} was not found")
        return node

    @staticmethod
    def _ensure_widget_count(node_id: str, widgets: list[Any], count: int) -> None:
        if len(widgets) < count:
            raise WorkflowMappingError(f"Node {node_id} expected at least {count} widgets")

    @staticmethod
    def _is_connection(value: Any) -> bool:
        return isinstance(value, list) and len(value) == 2 and isinstance(value[0], str) and isinstance(value[1], int)

    @staticmethod
    def _is_api_prompt(data: Any) -> bool:
        return isinstance(data, dict) and all(
            isinstance(node, dict) and "class_type" in node and "inputs" in node for node in data.values()
        )

    def _widget_inputs(self, node: dict[str, Any]) -> dict[str, Any]:
        widgets = node.get("widgets_values", [])
        class_type = node.get("type")
        if class_type == "KSampler":
            self._ensure_widget_count(str(node.get("id")), widgets, 7)
            return {
                "seed": widgets[0],
                "steps": widgets[2],
                "cfg": widgets[3],
                "sampler_name": widgets[4],
                "scheduler": widgets[5],
                "denoise": widgets[6],
            }
        mapping = {
            "EmptyLatentImage": ["width", "height", "batch_size"],
            "EmptySD3LatentImage": ["width", "height", "batch_size"],
            "CLIPTextEncode": ["text"],
            "SaveImage": ["filename_prefix"],
            "CheckpointLoaderSimple": ["ckpt_name"],
            "LoraLoader": ["lora_name", "strength_model", "strength_clip"],
            "CLIPLoader": ["clip_name", "type", "device"],
            "VAELoader": ["vae_name"],
            "ModelSamplingAuraFlow": ["shift"],
            "CFGNorm": ["strength"],
            "LoraLoaderModelOnly": ["lora_name", "strength_model"],
            "ImageScaleToTotalPixels": ["upscale_method", "megapixels"],
            "TextEncodeQwenImageEditPlus": ["prompt"],
            "LoadImage": ["image"],
            "UnetLoaderGGUF": ["unet_name"],
        }
        keys = mapping.get(class_type, [])
        return {key: widgets[index] for index, key in enumerate(keys) if index < len(widgets)}

from app.core.config import Settings
from app.services.comfyui_service import ComfyUIService


def test_get_output_videos_reads_save_video_list_metadata():
    service = ComfyUIService(Settings())
    history = {
        "outputs": {
            "75": {
                "videos": [
                    {"filename": "result.mp4", "subfolder": "video", "type": "output"}
                ]
            }
        }
    }

    videos = service.get_output_videos(history, save_node_id="75")

    assert videos == [{"filename": "result.mp4", "subfolder": "video", "type": "output"}]


def test_get_output_videos_accepts_singular_video_metadata():
    service = ComfyUIService(Settings())
    history = {
        "outputs": {
            "75": {
                "video": {"filename": "result.webm", "subfolder": "", "type": "output"}
            }
        }
    }

    videos = service.get_output_videos(history, save_node_id="75")

    assert videos[0]["filename"] == "result.webm"


def test_get_output_videos_accepts_video_descriptor_under_images_key():
    service = ComfyUIService(Settings())
    history = {
        "outputs": {
            "75": {
                "images": [
                    {"filename": "result.mp4", "subfolder": "video", "type": "output"},
                    {"filename": "preview.png", "subfolder": "video", "type": "output"},
                ]
            }
        }
    }

    videos = service.get_output_videos(history, save_node_id="75")

    assert [item["filename"] for item in videos] == ["result.mp4"]

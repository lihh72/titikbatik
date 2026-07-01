from pathlib import Path

from app.services.workflow_service import WorkflowService


def test_generate_workflow_only_patches_prompt_and_output_prefix():
    service = WorkflowService()
    prompt = service.build_generate_prompt(
        positive_prompt="batik test positive",
        negative_prompt="batik test negative",
        filename_prefix="preview_test",
    )

    assert prompt["6"]["class_type"] == "CLIPTextEncode"
    assert prompt["6"]["inputs"]["text"] == "batik test positive"
    assert prompt["7"]["inputs"]["text"] == "batik test negative"
    assert prompt["3"]["inputs"]["seed"] == 828584272167847
    assert prompt["3"]["inputs"]["steps"] == 20
    assert prompt["5"]["inputs"]["width"] == 512
    assert prompt["9"]["inputs"]["filename_prefix"] == "preview_test"


def test_combine_workflow_only_patches_images_and_output_prefix():
    service = WorkflowService()
    prompt = service.build_combine_prompt(
        costume_image_name="base.png",
        batik_image_name="motif.png",
        filename_prefix="costume_test",
    )

    assert prompt["78"]["inputs"]["image"] == "base.png"
    assert prompt["106"]["inputs"]["image"] == "motif.png"
    assert prompt["111"]["inputs"]["prompt"] == "Change the cloth fabric difference in image 1 to the fabric material in image 2."
    assert prompt["3"]["inputs"]["seed"] == 457020829044974
    assert prompt["3"]["inputs"]["steps"] == 1
    assert prompt["3"]["inputs"]["cfg"] == 1
    assert prompt["3"]["inputs"]["denoise"] == 1
    assert prompt["60"]["inputs"]["filename_prefix"] == "costume_test"


def test_video_workflow_uses_costume_at_512_square_without_audio():
    service = WorkflowService()
    prompt = service.build_video_prompt(
        costume_image_name="costume.webp",
        filename_prefix="video_test",
    )

    assert prompt["269"]["class_type"] == "LoadImage"
    assert prompt["269"]["inputs"]["image"] == "costume.webp"
    assert prompt["320:312"]["inputs"]["value"] == 512
    assert prompt["320:299"]["inputs"]["value"] == 512
    assert "audio" not in prompt["320:310"]["inputs"]
    assert prompt["75"]["inputs"]["filename_prefix"] == "video_test"
    assert prompt["320:300"]["inputs"]["value"] == 25
    assert prompt["320:301"]["inputs"]["value"] == 5


def test_inspect_workflows_reports_nodes():
    service = WorkflowService()
    rows = service.inspect_workflow(Path("workflows/generatebatik.json"))
    assert any(row["node_id"] == "6" and row["class_type"] == "CLIPTextEncode" for row in rows)
    assert any(row["node_id"] == "3" and row["class_type"] == "KSampler" for row in rows)


def test_inspect_video_workflow_reports_subgraph_nodes():
    service = WorkflowService()
    rows = service.inspect_workflow(Path("workflows/videobatik.json"))

    assert any(row["node_id"] == "320:310" and row["class_type"] == "CreateVideo" for row in rows)

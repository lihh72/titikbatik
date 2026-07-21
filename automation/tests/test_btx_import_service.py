import pytest


def test_normalize_btx_record_generates_a_safe_candidate_without_slug():
    from app.services.btx_import_service import normalize_btx_record

    candidate = normalize_btx_record({
        "id": 42,
        "name": "Mega Mendung Biru",
        "image_url": "https://cdn.example/preview.jpg",
        "costume_url": "https://cdn.example/costume.jpg",
    })

    assert candidate.source_id == "42"
    assert candidate.keyword == "Mega Mendung Biru"
    assert candidate.preview_url == "https://cdn.example/preview.jpg"
    assert candidate.costume_urls == ["https://cdn.example/costume.jpg"]


def test_unwrap_btx_records_accepts_nested_data_items():
    from app.services.btx_import_service import unwrap_btx_records

    assert unwrap_btx_records({"data": {"items": [{"id": 1}]}}) == [{"id": 1}]


def test_unwrap_btx_records_rejects_unknown_shape():
    from app.services.btx_import_service import unwrap_btx_records

    with pytest.raises(ValueError, match="unsupported JSON shape"):
        unwrap_btx_records({"unexpected": True})

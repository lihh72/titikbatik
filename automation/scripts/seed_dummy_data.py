import argparse
import hashlib
import math
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "storage" / "database" / "titikbatik.db"
PREVIEW_DIR = ROOT / "storage" / "output" / "preview"
COSTUME_DIR = ROOT / "storage" / "output" / "costume"
TEMPLATE_DIR = ROOT / "storage" / "templates"


DUMMY_BATIKS = [
    {
        "slug": "dummy-mega-mendung-indigo",
        "keyword": "batik pattern, cloud motif, flowing curved lines, seamless repeat pattern",
        "warna": "deep indigo and warm ivory",
        "style": "Cirebon mega mendung style",
        "seed": 101001,
        "palette": ("#173b73", "#f7ead2", "#4f86c6", "#d7aa48"),
    },
    {
        "slug": "dummy-kawung-peach",
        "keyword": "batik pattern, kawung circle, circular four-petal geometry, balanced all-over textile composition",
        "warna": "soft peach and dove grey",
        "style": "modern geometric batik",
        "seed": 101002,
        "palette": ("#f4a698", "#f7f1e8", "#697174", "#b56576"),
    },
    {
        "slug": "dummy-parang-gold",
        "keyword": "batik pattern, parang wave, diagonal lereng arrangement, dense ornamental repeat",
        "warna": "royal blue and old gold",
        "style": "traditional wax-resist Indonesian batik",
        "seed": 101003,
        "palette": ("#0d2d5f", "#f0c45c", "#fbf5df", "#8f5c24"),
    },
]


TEMPLATES = [
    {"name": "Dummy Shirt Template", "filename": "dummy_template_shirt.webp", "kind": "shirt", "is_active": 0},
    {"name": "Dummy Tote Template", "filename": "dummy_template_tote.webp", "kind": "tote", "is_active": 0},
    {"name": "Dummy Person Model Template", "filename": "dummy_template_person_model.webp", "kind": "person_model", "is_active": 0},
]


def ensure_dirs() -> None:
    for directory in [PREVIEW_DIR, COSTUME_DIR, TEMPLATE_DIR]:
        directory.mkdir(parents=True, exist_ok=True)


def font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def save_webp(image: Image.Image, path: Path) -> None:
    image.convert("RGB").save(path, "WEBP", quality=92, method=6)


def draw_label(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], fill: str = "#1b1b1b") -> None:
    draw.text(xy, text, font=font(30), fill=fill)


def create_batik_preview(path: Path, item: dict) -> None:
    base, light, accent, gold = item["palette"]
    image = Image.new("RGB", (1024, 1024), light)
    draw = ImageDraw.Draw(image)

    for y in range(-120, 1100, 160):
        for x in range(-120, 1100, 160):
            if "kawung" in item["slug"]:
                draw.ellipse((x + 18, y + 18, x + 142, y + 142), outline=base, width=8)
                draw.ellipse((x + 48, y + 10, x + 112, y + 150), outline=accent, width=5)
                draw.ellipse((x + 10, y + 48, x + 150, y + 112), outline=gold, width=5)
                draw.ellipse((x + 68, y + 68, x + 92, y + 92), fill=base)
            elif "parang" in item["slug"]:
                offset = (y // 160) % 2 * 80
                draw.line((x + offset, y + 160, x + 160 + offset, y), fill=base, width=18)
                draw.arc((x + offset - 60, y + 20, x + offset + 120, y + 200), 300, 70, fill=gold, width=8)
                draw.arc((x + offset + 40, y - 50, x + offset + 220, y + 130), 120, 250, fill=accent, width=6)
            else:
                for radius, color, width in [(140, base, 12), (104, accent, 8), (68, gold, 5)]:
                    draw.arc((x, y, x + radius, y + radius), 200, 35, fill=color, width=width)
                    draw.arc((x + 58, y + 44, x + 58 + radius, y + 44 + radius), 200, 35, fill=color, width=width)

    for i in range(90):
        angle = i * 0.63
        x = int(512 + math.cos(angle) * (60 + i * 4.2))
        y = int(512 + math.sin(angle) * (60 + i * 4.2))
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=base if i % 2 else gold)

    draw.rectangle((0, 0, 1024, 1024), outline=base, width=20)
    save_webp(image, path)


def create_template(path: Path, kind: str) -> None:
    image = Image.new("RGB", (1024, 1024), "#f6f3ee")
    draw = ImageDraw.Draw(image)
    draw.rectangle((70, 70, 954, 954), outline="#d8d2c8", width=6)
    if kind == "shirt":
        draw.polygon([(360, 240), (260, 340), (180, 330), (135, 470), (260, 515), (295, 430), (295, 790), (729, 790), (729, 430), (764, 515), (889, 470), (844, 330), (764, 340), (664, 240)], fill="#dcdfe4", outline="#59606b")
        draw.arc((418, 215, 606, 360), 0, 180, fill="#59606b", width=7)
        draw_label(draw, "DUMMY SHIRT TEMPLATE", (310, 850), "#59606b")
    else:
        if kind == "person_model":
            draw.rectangle((120, 120, 904, 904), fill="#ebe6df")
            draw.ellipse((405, 130, 619, 344), fill="#c9906c", outline="#6f4d3d", width=5)
            draw.pieslice((382, 105, 642, 365), 180, 360, fill="#2c2624")
            draw.rectangle((465, 325, 559, 405), fill="#c9906c")
            draw.polygon(
                [(360, 405), (430, 365), (594, 365), (664, 405), (626, 710), (398, 710)],
                fill="#f9f7f0",
                outline="#55504a",
            )
            draw.line((430, 365, 512, 470, 594, 365), fill="#55504a", width=5)
            draw.line((365, 430, 275, 628), fill="#c9906c", width=38)
            draw.line((659, 430, 749, 628), fill="#c9906c", width=38)
            draw.ellipse((248, 607, 302, 661), fill="#c9906c")
            draw.ellipse((722, 607, 776, 661), fill="#c9906c")
            draw.rectangle((420, 710, 492, 880), fill="#5b6570")
            draw.rectangle((532, 710, 604, 880), fill="#5b6570")
            draw.rounded_rectangle((385, 870, 500, 910), radius=18, fill="#242424")
            draw.rounded_rectangle((524, 870, 639, 910), radius=18, fill="#242424")
            draw_label(draw, "DUMMY PERSON MODEL", (335, 940), "#55504a")
            save_webp(image, path)
            return
        draw.rounded_rectangle((300, 330, 724, 820), radius=34, fill="#e4ded4", outline="#6e6256", width=8)
        draw.arc((388, 170, 636, 480), 180, 360, fill="#6e6256", width=18)
        draw_label(draw, "DUMMY TOTE TEMPLATE", (330, 850), "#6e6256")
    save_webp(image, path)


def create_costume(path: Path, preview_path: Path, template_kind: str, label: str) -> None:
    template_path_by_kind = {
        "shirt": "dummy_template_shirt.webp",
        "tote": "dummy_template_tote.webp",
        "person_model": "dummy_template_person_model.webp",
    }
    template_path = TEMPLATE_DIR / template_path_by_kind[template_kind]
    image = Image.open(template_path).convert("RGB")
    motif = Image.open(preview_path).convert("RGB").resize((320, 320))
    if template_kind == "shirt":
        image.paste(motif, (352, 430))
        mask = Image.new("L", image.size, 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((352, 430, 672, 750), radius=28, fill=170)
        overlay = Image.new("RGB", image.size, "#ffffff")
        image = Image.composite(overlay, image, mask.point(lambda px: 45 if px else 0))
        image.paste(motif, (352, 430))
    elif template_kind == "person_model":
        motif = Image.open(preview_path).convert("RGB").resize((330, 360))
        garment_mask = Image.new("L", image.size, 0)
        mask_draw = ImageDraw.Draw(garment_mask)
        mask_draw.polygon([(360, 405), (430, 365), (594, 365), (664, 405), (626, 710), (398, 710)], fill=255)
        motif_layer = Image.new("RGB", image.size, "#ffffff")
        motif_layer.paste(motif, (347, 365))
        image = Image.composite(motif_layer, image, garment_mask)
        draw = ImageDraw.Draw(image)
        draw.polygon([(360, 405), (430, 365), (594, 365), (664, 405), (626, 710), (398, 710)], outline="#403b37", width=5)
        draw.line((430, 365, 512, 470, 594, 365), fill="#403b37", width=4)
    else:
        image.paste(motif, (352, 410))
    draw = ImageDraw.Draw(image)
    draw_label(draw, label.upper(), (96, 92), "#2a2a2a")
    save_webp(image, path)


def require_tables(conn: sqlite3.Connection) -> None:
    required = {"batiks", "batik_costume_files", "costume_templates"}
    existing = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    missing = required - existing
    if missing:
        missing_text = ", ".join(sorted(missing))
        raise RuntimeError(f"Missing table(s): {missing_text}. Run `alembic upgrade head` first.")


def upsert_database() -> None:
    if not DB_PATH.exists():
        raise RuntimeError(f"Database not found: {DB_PATH}. Run `alembic upgrade head` first.")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=ON")
    require_tables(conn)
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")

    template_ids: dict[str, int] = {}
    for index, template in enumerate(TEMPLATES, start=1):
        conn.execute(
            """
            INSERT INTO costume_templates (name, filename, description, is_active, sort_order, deleted_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
            ON CONFLICT(filename) DO UPDATE SET
                name=excluded.name,
                description=excluded.description,
                is_active=excluded.is_active,
                sort_order=excluded.sort_order,
                deleted_at=NULL,
                updated_at=excluded.updated_at
            """,
            (
                template["name"],
                template["filename"],
                "Inactive dummy template for local testing",
                template["is_active"],
                index,
                now,
                now,
            ),
        )
        template_ids[template["filename"]] = conn.execute(
            "SELECT id FROM costume_templates WHERE filename=?",
            (template["filename"],),
        ).fetchone()[0]

    for item in DUMMY_BATIKS:
        preview_filename = f"{item['slug']}_preview.webp"
        positive_prompt = f"Dummy preview for {item['keyword']}"
        negative_prompt = "dummy only, not generated by ComfyUI"
        prompt_hash = hashlib.sha256(f"dummy:{item['slug']}".encode("utf-8")).hexdigest()
        conn.execute(
            """
            INSERT INTO batiks (
                keyword, warna, style, seed, positive_prompt, negative_prompt,
                file_preview, file_video, prompt_hash, generation_job_id,
                is_published, deleted_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, 1, NULL, ?, ?)
            ON CONFLICT(file_preview) DO UPDATE SET
                keyword=excluded.keyword,
                warna=excluded.warna,
                style=excluded.style,
                seed=excluded.seed,
                positive_prompt=excluded.positive_prompt,
                negative_prompt=excluded.negative_prompt,
                prompt_hash=excluded.prompt_hash,
                is_published=1,
                deleted_at=NULL,
                updated_at=excluded.updated_at
            """,
            (
                item["keyword"],
                item["warna"],
                item["style"],
                item["seed"],
                positive_prompt,
                negative_prompt,
                preview_filename,
                prompt_hash,
                now,
                now,
            ),
        )
        batik_id = conn.execute("SELECT id FROM batiks WHERE file_preview=?", (preview_filename,)).fetchone()[0]
        for order, template in enumerate(TEMPLATES, start=1):
            costume_filename = f"{item['slug']}_costume_{template['kind']}.webp"
            conn.execute(
                """
                INSERT INTO batik_costume_files (batik_id, filename, template_id, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(filename) DO UPDATE SET
                    batik_id=excluded.batik_id,
                    template_id=excluded.template_id,
                    sort_order=excluded.sort_order
                """,
                (batik_id, costume_filename, template_ids[template["filename"]], order, now),
            )
    conn.commit()
    conn.close()


def create_images() -> None:
    ensure_dirs()
    for template in TEMPLATES:
        create_template(TEMPLATE_DIR / template["filename"], template["kind"])
    for item in DUMMY_BATIKS:
        preview_path = PREVIEW_DIR / f"{item['slug']}_preview.webp"
        create_batik_preview(preview_path, item)
        for template in TEMPLATES:
            create_costume(
                COSTUME_DIR / f"{item['slug']}_costume_{template['kind']}.webp",
                preview_path,
                template["kind"],
                item["slug"].replace("dummy-", "").replace("-", " "),
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create dummy Titik Batik images and optional database rows.")
    parser.add_argument("--images-only", action="store_true", help="Only create WebP files, do not insert database rows.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    create_images()
    if not args.images_only:
        upsert_database()
    print(
        {
            "preview_images": len(DUMMY_BATIKS),
            "costume_images": len(DUMMY_BATIKS) * len(TEMPLATES),
            "template_images": len(TEMPLATES),
            "database_seeded": not args.images_only,
        }
    )


if __name__ == "__main__":
    main()

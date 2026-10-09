#!/usr/bin/env python3
"""Transcribe the content note into src/content/content.json, word for word.

The note is "Info event template and resources for {create volunteer portal prototype prototype for
Matilda funding pitch}.md" in the PauseAI Global vault. Its structure is fixed:

  # Info event            card line, then a guidance block (**Goal**, **How**, **Take care of**, **Resources**)
  ## <sub-project>        guidance block, then ### Tasks: "1. Title — hint"
  # Coming soon           ## Protest / ## Coalition building: one paragraph each
  # Resources             ## <group>: "1. Title — URL — description — members"

Usage: python3 scripts/import_content.py <note.md> [out.json]
"""
import json
import re
import sys
from pathlib import Path

LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)( \(members\))?")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_resources_field(text: str) -> list[dict]:
    return [{"title": m[1], "url": m[2], "members": bool(m[3])} for m in LINK.finditer(text)]


def parse(note: str) -> dict:
    lines = note.split("\n")
    if lines and lines[0].strip() == "---":  # front matter
        end = lines.index("---", 1)
        lines = lines[end + 1 :]

    template: dict | None = None
    node: dict | None = None  # the node whose guidance is being read
    field: str | None = None  # "how" | "takeCareOf" | "tasks"
    section: str | None = None  # "template" | "soon" | "resources"
    coming_soon: list[dict] = []
    groups: list[dict] = []

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            continue
        if line.startswith("# "):
            title = line[2:].strip()
            if title == "Coming soon":
                section = "soon"
            elif title == "Resources":
                section = "resources"
            else:
                section = "template"
                template = node = {"id": slug(title), "title": title, "card": None, "guidance": new_guidance(), "children": []}
            field = None
            continue
        if section == "template":
            assert template is not None and node is not None
            if line.startswith("## "):
                title = line[3:].strip()
                node = {"id": slug(title), "title": title, "guidance": new_guidance(), "children": []}
                template["children"].append(node)
                field = None
            elif line.startswith("### Tasks"):
                field = "tasks"
            elif line.startswith("**Goal**"):
                node["guidance"]["goal"] = line[len("**Goal**") :].strip()
                field = None
            elif line.startswith("**How**"):
                field = "how"
            elif line.startswith("**Take care of**"):
                field = "takeCareOf"
            elif line.startswith("**Resources**"):
                node["guidance"]["resources"] = parse_resources_field(line)
                field = None
            elif field == "how" and re.match(r"\d+\. ", line):
                node["guidance"]["how"].append(re.sub(r"^\d+\. ", "", line))
            elif field == "takeCareOf" and line.startswith("- "):
                node["guidance"]["takeCareOf"].append(line[2:])
            elif field == "tasks" and re.match(r"\d+\. ", line):
                title, hint = re.sub(r"^\d+\. ", "", line).split(" — ", 1)  # hints may contain " — " themselves
                node["children"].append({"id": f"{node['id']}--{slug(title)}", "title": title, "hint": hint, "children": []})
            elif node is template and template["card"] is None:
                template["card"] = line
            else:
                raise ValueError(f"unexpected line in template: {line!r}")
        elif section == "soon":
            if line.startswith("## "):
                title = line[3:].strip()
                coming_soon.append({"id": slug(title), "title": title, "description": ""})
            else:
                entry = coming_soon[-1]
                entry["description"] = (entry["description"] + " " + line.strip()).strip()
        elif section == "resources":
            if line.startswith("## "):
                groups.append({"title": line[3:].strip(), "entries": []})
            elif re.match(r"\d+\. ", line):
                parts = re.sub(r"^\d+\. ", "", line).split(" — ")
                entry = {"title": parts.pop(0), "url": None, "status": None, "description": "", "members": False}
                if parts and parts[-1] == "members":
                    entry["members"] = True
                    parts.pop()
                for i, part in enumerate(parts):
                    if part.startswith("http"):
                        entry["url"] = parts.pop(i)
                        break
                if len(parts) == 2:
                    entry["status"], entry["description"] = parts
                elif len(parts) == 1:
                    entry["description"] = parts[0]
                else:
                    raise ValueError(f"unexpected resource line: {line!r}")
                entry["id"] = slug(entry["title"])
                groups[-1]["entries"].append(entry)
            else:
                raise ValueError(f"unexpected line in resources: {line!r}")

    assert template is not None
    return {"template": template, "comingSoon": coming_soon, "resourceGroups": groups}


def new_guidance() -> dict:
    return {"goal": "", "how": [], "takeCareOf": [], "resources": []}


def main() -> None:
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "src/content/content.json"
    data = parse(src.read_text(encoding="utf-8"))
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    t = data["template"]
    tasks = sum(len(c["children"]) for c in t["children"])
    print(f"{out}: {len(t['children'])} sub-projects, {tasks} tasks, {len(data['comingSoon'])} coming soon, "
          f"{sum(len(g['entries']) for g in data['resourceGroups'])} resources in {len(data['resourceGroups'])} groups")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Validate *.agent.md files against scripts/schema.yaml."""

from __future__ import annotations

import argparse
import glob
import re
import sys
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict, ValidationError, create_model
from pydantic import Field as PydanticField

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "scripts" / "schema.yaml"


class DynamicModelFactory:
    """Creates nested Pydantic models from a simplified YAML schema."""

    @staticmethod
    def _string_field(spec: dict[str, Any]) -> tuple[type[str], Any]:
        kwargs: dict[str, Any] = {}
        if "minLength" in spec:
            kwargs["min_length"] = spec["minLength"]
        if "maxLength" in spec:
            kwargs["max_length"] = spec["maxLength"]
        if "pattern" in spec:
            kwargs["pattern"] = spec["pattern"]
        if "enum" in spec:
            kwargs["pattern"] = f"^({'|'.join(re.escape(i) for i in spec['enum'])})$"
        return str, PydanticField(..., **kwargs)

    @classmethod
    def _from_spec(cls, name: str, spec: dict[str, Any]) -> tuple[Any, Any]:
        spec_type = spec.get("type", "string")

        if spec_type == "string":
            return cls._string_field(spec)

        if spec_type == "array":
            item_spec = spec.get("items", {"type": "string"})
            item_type, _ = cls._from_spec(f"{name}Item", item_spec)
            return list[item_type], PydanticField(default_factory=list)

        if spec_type == "object":
            fields: dict[str, tuple[Any, Any]] = {}
            required = set(spec.get("required", []))
            for prop_name, prop_spec in spec.get("properties", {}).items():
                field_type, field_def = cls._from_spec(f"{name}_{prop_name}", prop_spec)
                if prop_name not in required:
                    field_def = None
                fields[prop_name] = (field_type, field_def)
            model = create_model(name, __config__=ConfigDict(extra="ignore"), **fields)
            return model, PydanticField(default_factory=dict)

        return Any, PydanticField(default=None)

    @classmethod
    def build_root_model(cls, schema: dict[str, Any]) -> type[BaseModel]:
        fields: dict[str, tuple[Any, Any]] = {}
        for key, spec in schema.items():
            field_type, field_def = cls._from_spec(f"Root_{key}", spec)
            fields[key] = (field_type, None)
        return create_model("AgentSchema", __config__=ConfigDict(extra="ignore"), **fields)


def load_schema() -> dict[str, Any]:
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema not found: {SCHEMA_PATH}")
    with SCHEMA_PATH.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def extract_front_matter(path: Path) -> dict[str, Any]:
    content = path.read_text(encoding="utf-8")
    if content.startswith("---\n"):
        chunks = content.split("---\n", 2)
        if len(chunks) >= 3:
            parsed = yaml.safe_load(chunks[1])
            if isinstance(parsed, dict):
                return parsed
    parsed = yaml.safe_load(content)
    if isinstance(parsed, dict):
        return parsed
    raise ValueError("File does not contain a YAML object or YAML front matter")


def resolve_targets(globs: list[str]) -> list[Path]:
    matched: list[Path] = []
    for pattern in globs:
        matched.extend(Path(p).resolve() for p in glob.glob(pattern))
    unique_sorted = sorted(set(matched))
    return [p for p in unique_sorted if p.is_file()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--glob", action="append", default=[], help="Glob for .agent.md files")
    parser.add_argument("--file", action="append", default=[], help="Explicit file(s) to validate")
    args = parser.parse_args()

    targets = [Path(f).resolve() for f in args.file]
    targets.extend(resolve_targets(args.glob or ["agents/*.agent.md", ".github/agents/*.agent.md"]))
    targets = sorted(set(targets))

    if not targets:
        print("No agent files found; skipping validation.")
        return 0

    schema = load_schema()
    model = DynamicModelFactory.build_root_model(schema)

    failures = 0
    for target in targets:
        try:
            payload = extract_front_matter(target)
            model.model_validate(payload)
            print(f"✅ {target.relative_to(ROOT)}")
        except (ValidationError, ValueError, yaml.YAMLError) as exc:
            failures += 1
            print(f"❌ {target.relative_to(ROOT)}")
            print(exc)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

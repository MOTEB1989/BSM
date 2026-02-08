#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bsm_config.src.api.client_factory import APIClientFactory


def main():
    client = APIClientFactory.fromProviders(["openai"]).getPrimaryClient()
    report = client.generateReport({"title": "CI Test", "data": "health-check"})
    assert "content" in report
    print("AI agent test passed")


if __name__ == "__main__":
    main()

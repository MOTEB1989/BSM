#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bsm_config.src.api.client_factory import APIClientFactory


def main():
    if len(sys.argv) < 5:
        print("Usage: python generate_report_with_ai.py --provider <provider> --model <model_name>")
        sys.exit(1)

    provider = sys.argv[2]
    model = sys.argv[4]

    data_path = Path("./data/latest.csv")
    if not data_path.exists():
        print("❌ No data file found at ./data/latest.csv")
        sys.exit(1)

    raw_data = data_path.read_text(encoding="utf-8")

    factory = APIClientFactory.fromProviders([provider])
    client = factory.getPrimaryClient()

    report = client.generateReport(
        {
            "title": "BSM Weekly Insights Report",
            "data": raw_data,
            "format": "markdown",
            "model": model,
        }
    )

    output_path = Path("./reports/weekly-insights.md")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report["content"], encoding="utf-8")

    print(f"✅ Report generated successfully at {output_path}")


if __name__ == "__main__":
    main()

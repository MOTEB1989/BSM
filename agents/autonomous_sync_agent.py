import json
import os
from datetime import datetime

import requests


class BSMNexusAgent:
    def __init__(self):
        with open("docs/nexus.config.json", "r", encoding="utf-8") as config_file:
            self.config = json.load(config_file)

        self.cf_token = os.getenv("CLOUDFLARE_TOKEN")
        # Allow override from env while preserving config fallback.
        self.cf_zone = os.getenv("CLOUDFLARE_ZONE_ID") or self.config["infrastructure"]["zone_id"]

    def log(self, action, status="INFO"):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [BSM-NEXUS] {action} | {status}")

    def verify_dns(self):
        self.log("Verifying DNS...", "CHECK")

        if not self.cf_token:
            self.log("Missing Cloudflare token", "ERROR")
            return False

        if not self.cf_zone:
            self.log("Missing Cloudflare zone id", "ERROR")
            return False

        headers = {
            "Authorization": f"Bearer {self.cf_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(
                f"https://api.cloudflare.com/client/v4/zones/{self.cf_zone}/dns_records",
                headers=headers,
                timeout=15,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            self.log(f"Cloudflare API error: {exc}", "ERROR")
            return False

        self.log(f"DNS OK: {self.config['domain']}", "SUCCESS")
        return True

    def run(self):
        self.log("Starting BSM Nexus Cycle", "START")
        self.verify_dns()
        self.log("Cycle Complete", "DONE")


if __name__ == "__main__":
    BSMNexusAgent().run()

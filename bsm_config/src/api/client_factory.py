from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class MockProviderClient:
    name: str

    def generateReport(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "content": f"# {params.get('title', 'Report')}\n\nProvider: {self.name}\n",
            "provider": self.name,
            "model": params.get("model"),
        }

    async def analyzeData(self, data: Any) -> Dict[str, Any]:
        return {
            "provider": self.name,
            "recommendations": [
                "Use richer prompts for structured recommendations.",
                "Add provider fallback policies for resilience.",
            ],
            "raw": data,
        }


class APIClientFactory:
    @staticmethod
    def fromProviders(enabledProviders: List[str]) -> "APIClientFactory":
        providers = [p.strip() for p in enabledProviders if p and p.strip()]
        if not providers:
            providers = ["openai"]
        return APIClientFactory(providers)

    def __init__(self, providers: List[str]) -> None:
        self.providers = providers

    def getPrimaryClient(self) -> MockProviderClient:
        return MockProviderClient(self.providers[0])

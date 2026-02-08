import os
from typing import Dict, Any

from .engine import BSM_AgentEngine
from bsm_config.src.api.client_factory import APIClientFactory


class BSM_AI_Engine(BSM_AgentEngine):
    def __init__(self, config_path: str = "bsm-config/.env"):
        super().__init__(config_path)
        self.ai_client = self._init_ai_client()

    def _init_ai_client(self):
        enabled_providers = [p.strip() for p in os.environ.get("ENABLED_PROVIDERS", "").split(",") if p.strip()]
        factory = APIClientFactory.fromProviders(enabled_providers)
        return factory.getPrimaryClient()

    async def execute_agent_with_ai_insight(self, name: str, context: Dict[str, Any]):
        result = await self.execute_agent(name, context)
        ai_analysis = await self.ai_client.analyzeData(result)

        return {
            "agent_result": result,
            "ai_insights": ai_analysis,
            "recommendations": ai_analysis.get("recommendations", []),
        }

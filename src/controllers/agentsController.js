import { loadAgents } from "../services/agentsService.js";
import { runAgent } from "../runners/agentRunner.js";
import { env } from "../config/env.js";
import { loadRegistry } from "../utils/registryCache.js";
import logger from "../utils/logger.js";
import { badRequest, success } from "../utils/httpResponses.js";

export const listAgents = async (req, res, next) => {
  try {
    const agents = await loadAgents();
    const mode = req.query.mode; // e.g., ?mode=mobile or ?mode=api
    
    // Validate mode parameter if provided
    const validModes = ["chat", "api", "ci", "mobile", "github", "system", "security"];
    if (mode && !validModes.includes(mode)) {
      return badRequest(
        res,
        `Invalid mode parameter. Must be one of: ${validModes.join(", ")}`,
        req.correlationId
      );
    }
    
    // If mode filtering requested, load registry and filter
    if (mode) {
      const registry = loadRegistry();
      
      if (!registry || !registry.agents) {
        logger.warn({ mode }, "Registry not available for mode filtering");
        // Fallback to unfiltered list
        return success(res, { 
          agents, 
          mode,
          filtered: false
        }, req.correlationId);
      }

      // Filter agents by mode and enrich with context/safety info
      const filteredAgents = agents
        .map(agent => {
          // Find corresponding registry entry
          const registryAgent = registry.agents.find(ra => ra.id === agent.id);
          
          if (!registryAgent) {
            return null; // Skip agents not in registry
          }

          const contexts = registryAgent.contexts?.allowed || [];
          const hasMode = contexts.includes(mode);
          
          if (!hasMode) {
            return null; // Skip agents not allowed in this mode
          }

          // Enrich with governance info
          return {
            ...agent,
            contexts: registryAgent.contexts,
            safety: registryAgent.safety,
            risk: registryAgent.risk,
            approval: registryAgent.approval,
            expose: registryAgent.expose
          };
        })
        .filter(Boolean); // Remove nulls

      return success(res, {
        count: filteredAgents.length,
        agents: filteredAgents,
        mode,
        filtered: true
      }, req.correlationId);
    }

    // No mode filtering - enrich all agents with registry info if available
    const registry = loadRegistry();
    if (registry && registry.agents) {
      const enrichedAgents = agents.map(agent => {
        const registryAgent = registry.agents.find(ra => ra.id === agent.id);
        if (registryAgent) {
          return {
            ...agent,
            contexts: registryAgent.contexts,
            safety: registryAgent.safety,
            risk: registryAgent.risk,
            approval: registryAgent.approval,
            expose: registryAgent.expose
          };
        }
        return agent;
      });
      
      return success(res, { agents: enrichedAgents }, req.correlationId);
    }

    // Fallback to basic agent list
    success(res, { agents }, req.correlationId);
  } catch (err) {
    next(err);
  }
};

export const executeAgent = async (req, res, next) => {
  try {
    const { agentId, input, payload } = req.body;
    
    if (!agentId || typeof agentId !== "string") {
      return badRequest(res, "Invalid or missing agentId", req.correlationId);
    }
    
    if (!input || typeof input !== "string") {
      return badRequest(res, "Invalid or missing input", req.correlationId);
    }

    if (input.length > env.maxAgentInputLength) {
      return badRequest(
        res,
        `Input exceeds maximum length of ${env.maxAgentInputLength} characters`,
        req.correlationId
      );
    }
    
    const result = await runAgent({ agentId, input, payload });
    success(res, { result }, req.correlationId);
  } catch (err) {
    next(err);
  }
};

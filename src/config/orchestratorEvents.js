/**
 * Orchestrator Event Configuration
 * Maps events to agent execution strategies
 * 
 * This replaces hard-coded event handling with configuration-based routing
 */

export const eventStrategies = {
  "pull_request.opened": {
    agents: ["governance-review-agent", "code-review-agent", "security-agent", "integrity-agent"],
    execution: "parallel",
    description: "Full review for new PRs"
  },
  
  "pull_request.synchronize": {
    agents: ["governance-review-agent", "code-review-agent", "security-agent", "integrity-agent"],
    execution: "parallel",
    description: "Re-review on PR updates"
  },
  
  "pull_request.ready_for_review": {
    agents: ["governance-review-agent", "code-review-agent", "security-agent"],
    execution: "parallel",
    description: "Review when PR marked ready"
  },
  
  "check_suite.completed": {
    agents: ["pr-merge-agent"],
    execution: "sequential",
    description: "Post-CI merge check"
  },
  
  "repository.health_check": {
    agents: ["integrity-agent"],
    execution: "sequential",
    description: "Repository health validation"
  },
  
  "scheduled.weekly_agents": {
    agents: ["bsu-autonomous-architect", "runner", "security"],
    execution: "sequential",
    description: "Weekly comprehensive analysis"
  },
  
  "manual.orchestrator_run": {
    agents: ["bsu-autonomous-architect", "runner", "security"],
    execution: "sequential",
    description: "Manual orchestration trigger"
  },
  
  // Default fallback
  "default": {
    agents: ["governance-agent"],
    execution: "sequential",
    description: "Default governance check"
  }
};

/**
 * Get agents for a specific event
 * @param {string} event - Event identifier
 * @returns {Array<string>} Array of agent IDs
 */
export function getAgentsForEvent(event) {
  const strategy = eventStrategies[event] || eventStrategies.default;
  return strategy.agents;
}

/**
 * Get execution strategy for event
 * @param {string} event - Event identifier
 * @returns {string} "parallel" or "sequential"
 */
export function getExecutionStrategy(event) {
  const strategy = eventStrategies[event] || eventStrategies.default;
  return strategy.execution;
}

/**
 * Get all configured events
 * @returns {Array<object>} Array of event configurations
 */
export function getAllEventStrategies() {
  return Object.entries(eventStrategies).map(([event, config]) => ({
    event,
    ...config
  }));
}

/**
 * Add or update event strategy (for dynamic configuration)
 * @param {string} event - Event identifier
 * @param {object} strategy - Strategy configuration
 */
export function setEventStrategy(event, strategy) {
  eventStrategies[event] = strategy;
}

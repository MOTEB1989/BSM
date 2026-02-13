import { runOrchestration, generateReport, saveReport } from "../services/orchestratorService.js";
import path from "path";
import logger from "../utils/logger.js";

/**
 * Orchestrator Controller
 * Handles HTTP requests for orchestration
 * Coordinates the execution of custom agents via the task tool
 */

export const triggerOrchestration = async (req, res, next) => {
  try {
    // Initialize orchestration structure
    const init = await runOrchestration();
    const results = init.results;

    logger.info("Starting agent orchestration sequence");

    // Note: In a real implementation, this would use the task tool to invoke custom agents
    // Since we cannot directly call the task tool from within code, 
    // the orchestration should be triggered by the user or a workflow
    // This endpoint prepares the structure and returns information for manual orchestration
    
    // For now, create a basic report structure
    results.architect = "Orchestrator is ready. Use custom agents (bsm-autonomous-architect, runner, security) to execute the full orchestration.";
    results.runner = "Awaiting runner agent execution.";
    results.security = "Awaiting security agent execution.";

    // Generate and save report
    const report = generateReport(results);
    await saveReport(init.reportFile, report);

    res.json({ 
      success: true,
      message: "Orchestration structure created. Use custom agents to complete orchestration.",
      reportFile: init.reportFile,
      timestamp: init.timestamp,
      instructions: {
        step1: "Call custom agent 'bsm-autonomous-architect' to analyze repository",
        step2: "Call custom agent 'runner' to run tests and build",
        step3: "Call custom agent 'security' to check configurations",
        step4: "Results will be consolidated in the report file"
      },
      correlationId: req.correlationId 
    });
  } catch (err) {
    next(err);
  }
};

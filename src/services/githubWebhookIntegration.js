import logger from "../utils/logger.js";
import { notificationService } from "../services/notificationService.js";
import { agentCoordinationService } from "../services/agentCoordinationService.js";
import { securityShieldService } from "../services/securityShieldService.js";
import { auditLogger } from "../utils/auditLogger.js";

/**
 * GitHub Webhook Integration for Team Notifications
 * Automatically broadcasts notifications on GitHub events
 */
const safeRepoName = (repository) => repository?.full_name || "unknown-repository";
const safeSenderLogin = (sender) => sender?.login || "unknown-user";
const safePusherName = (pusher) => pusher?.name || "unknown-pusher";
const asArray = (value) => (Array.isArray(value) ? value : []);

/**
 * Handle push events
 */
export async function handlePushEvent(payload) {
  const { repository, pusher, commits, ref } = payload;
  const repositoryName = safeRepoName(repository);
  const pusherName = safePusherName(pusher);
  const commitList = asArray(commits);

  logger.info({
    repository: repositoryName,
    pusher: pusherName,
    commitCount: commitList.length,
    ref
  }, "GitHub push event received");

  // Broadcast repository change notification
  await notificationService.repositoryChange("push", {
    description: `${pusherName} pushed ${commitList.length} commit(s) to ${ref || "unknown-ref"}`,
    repository: repositoryName,
    pusher: pusherName,
    commitCount: commitList.length,
    commits: commitList.slice(0, 5).map(c => ({
      sha: String(c?.id || "").substring(0, 7),
      message: c?.message || "",
      author: c?.author?.name || "unknown-author"
    }))
  });

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: "push",
    repository: repositoryName,
    pusher: pusherName,
    commitCount: commitList.length
  });
}

/**
 * Handle pull request events
 */
export async function handlePullRequestEvent(payload) {
  const { action, pull_request, repository, sender } = payload;
  if (!pull_request) {
    logger.warn({ action }, "Skipping pull_request webhook without pull_request payload");
    return;
  }
  const repositoryName = safeRepoName(repository);
  const senderLogin = safeSenderLogin(sender);

  logger.info({
    action,
    repository: repositoryName,
    prNumber: pull_request.number || payload?.number,
    sender: senderLogin
  }, "GitHub pull request event received");

  // Broadcast for important PR events
  if (["opened", "closed", "merged", "reopened"].includes(action)) {
    await notificationService.repositoryChange("pull_request", {
      description: `PR #${pull_request.number || payload?.number || "unknown"} ${action} by ${senderLogin}: ${pull_request.title || "Untitled PR"}`,
      repository: repositoryName,
      prNumber: pull_request.number,
      action,
      sender: senderLogin,
      title: pull_request.title,
      url: pull_request.html_url
    });

    // If PR is opened, consider starting coordination for review
    if (action === "opened" && pull_request.draft === false) {
      await agentCoordinationService.startCollaboration({
        initiator: "github-webhook",
        task: `Review PR #${pull_request.number}: ${pull_request.title}`,
        requiredAgents: ["code-review-agent", "security-agent"],
        priority: "normal",
        approvalRequired: false,
        userContext: {
          repository: repositoryName,
          prNumber: pull_request.number,
          prUrl: pull_request.html_url
        }
      });
    }
  }

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: `pr_${action}`,
    repository: repositoryName,
    prNumber: pull_request.number
  });
}

/**
 * Handle security advisory events
 */
export async function handleSecurityAdvisoryEvent(payload) {
  const { action, security_advisory, repository } = payload;
  if (!security_advisory) {
    logger.warn({ action }, "Skipping security_advisory webhook without advisory payload");
    return;
  }
  const repositoryName = safeRepoName(repository);

  logger.warn({
    action,
    repository: repositoryName,
    severity: security_advisory.severity
  }, "GitHub security advisory received");

  // Report vulnerability
  await securityShieldService.reportVulnerability({
    description: security_advisory.summary,
    severity: security_advisory.severity,
    source: "github_advisory",
    details: {
      ghsaId: security_advisory.ghsa_id,
      cveId: security_advisory.cve_id,
      summary: security_advisory.summary,
      description: security_advisory.description,
      publishedAt: security_advisory.published_at
    }
  });

  // Audit
  auditLogger.logSecurityEvent({
    severity: security_advisory.severity,
    action: "github_security_advisory",
    details: {
      ghsaId: security_advisory.ghsa_id,
      summary: security_advisory.summary
    },
    user: "github"
  });
}

/**
 * Handle issue events
 */
export async function handleIssueEvent(payload) {
  const { action, issue, repository, sender } = payload;
  if (!issue) {
    logger.warn({ action }, "Skipping issues webhook without issue payload");
    return;
  }
  const repositoryName = safeRepoName(repository);
  const senderLogin = safeSenderLogin(sender);
  const labels = asArray(issue.labels);

  logger.info({
    action,
    repository: repositoryName,
    issueNumber: issue.number,
    sender: senderLogin
  }, "GitHub issue event received");

  // Broadcast for important issue events
  if (["opened", "closed", "reopened"].includes(action)) {
    // Check if issue is labeled as security or bug
    const isSecurityIssue = labels.some(l =>
      ["security", "vulnerability", "bug"].includes(String(l?.name || "").toLowerCase())
    );

    if (isSecurityIssue && action === "opened") {
      // Report as security concern
      await securityShieldService.reportVulnerability({
        description: issue.title,
        severity: "medium",
        source: "github_issue",
        details: {
          issueNumber: issue.number,
          title: issue.title,
          url: issue.html_url,
          labels: labels.map(l => l?.name).filter(Boolean)
        }
      });
    }

    await notificationService.repositoryChange("issue", {
      description: `Issue #${issue.number} ${action} by ${senderLogin}: ${issue.title}`,
      repository: repositoryName,
      issueNumber: issue.number,
      action,
      sender: senderLogin,
      title: issue.title,
      url: issue.html_url,
      isSecurityIssue
    });
  }

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: `issue_${action}`,
    repository: repositoryName,
    issueNumber: issue.number
  });
}

/**
 * Handle workflow run events (CI/CD)
 */
export async function handleWorkflowRunEvent(payload) {
  const { action, workflow_run, repository } = payload;
  if (!workflow_run) {
    logger.warn({ action }, "Skipping workflow_run webhook without workflow_run payload");
    return;
  }
  const repositoryName = safeRepoName(repository);

  logger.info({
    action,
    repository: repositoryName,
    workflow: workflow_run.name,
    status: workflow_run.status,
    conclusion: workflow_run.conclusion
  }, "GitHub workflow run event received");

  // Notify on workflow failures
  if (action === "completed" && workflow_run.conclusion === "failure") {
    await notificationService.integrationIssue(
      `CI/CD Workflow: ${workflow_run.name}`,
      {
        message: `Workflow failed in ${repositoryName}`,
        workflowName: workflow_run.name,
        runNumber: workflow_run.run_number,
        url: workflow_run.html_url,
        triggeredBy: workflow_run.triggering_actor?.login
      }
    );

    // Start coordination for fixing CI
    await agentCoordinationService.coordinateIntegrationFix(
      `CI: ${workflow_run.name}`,
      {
        message: "Workflow failed",
        url: workflow_run.html_url
      },
      "github-webhook"
    );
  }

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: `workflow_${action}`,
    repository: repositoryName,
    workflow: workflow_run.name,
    conclusion: workflow_run.conclusion
  });
}

/**
 * Handle deployment events
 */
export async function handleDeploymentEvent(payload) {
  const { deployment, repository } = payload;
  if (!deployment) {
    logger.warn("Skipping deployment webhook without deployment payload");
    return;
  }
  const repositoryName = safeRepoName(repository);

  logger.info({
    repository: repositoryName,
    environment: deployment.environment,
    ref: deployment.ref
  }, "GitHub deployment event received");

  await notificationService.repositoryChange("deployment", {
    description: `Deployment to ${deployment.environment} initiated`,
    repository: repositoryName,
    environment: deployment.environment,
    ref: deployment.ref,
    url: deployment.url
  });

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: "deployment",
    repository: repositoryName,
    environment: deployment.environment
  });
}

/**
 * Handle deployment status events
 */
export async function handleDeploymentStatusEvent(payload) {
  const { deployment_status, deployment, repository } = payload;
  if (!deployment_status || !deployment) {
    logger.warn("Skipping deployment_status webhook with incomplete payload");
    return;
  }
  const repositoryName = safeRepoName(repository);

  logger.info({
    repository: repositoryName,
    environment: deployment.environment,
    state: deployment_status.state
  }, "GitHub deployment status event received");

  // Notify on deployment failures
  if (deployment_status.state === "failure" || deployment_status.state === "error") {
    await notificationService.integrationIssue(
      `Deployment to ${deployment.environment}`,
      {
        message: `Deployment failed in ${repositoryName}`,
        environment: deployment.environment,
        state: deployment_status.state,
        url: deployment_status.target_url
      }
    );
  }

  // Audit
  auditLogger.writeDeferred({
    event: "github_webhook",
    action: "deployment_status",
    repository: repositoryName,
    environment: deployment.environment,
    state: deployment_status.state
  });
}

/**
 * Main webhook router
 */
export async function processGitHubWebhook(event, payload) {
  try {
    switch (event) {
      case "push":
        await handlePushEvent(payload);
        break;
      case "pull_request":
        await handlePullRequestEvent(payload);
        break;
      case "security_advisory":
        await handleSecurityAdvisoryEvent(payload);
        break;
      case "issues":
        await handleIssueEvent(payload);
        break;
      case "workflow_run":
        await handleWorkflowRunEvent(payload);
        break;
      case "deployment":
        await handleDeploymentEvent(payload);
        break;
      case "deployment_status":
        await handleDeploymentStatusEvent(payload);
        break;
      default:
        logger.debug({ event }, "Unhandled GitHub webhook event");
    }
  } catch (error) {
    logger.error({
      event,
      error: error.message
    }, "Failed to process GitHub webhook");
    throw error;
  }
}

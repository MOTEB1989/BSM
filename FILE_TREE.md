## 📂 هيكل المشروع المحدث تلقائياً
```bash
.
├── ANALYSIS-COMPLETE.md
├── BOOTSTRAP.md
├── CHAT-ACTIVATION-COMPLETE.md
├── CHAT-UI-FIXES-SUMMARY.md
├── CLAUDE.md
├── CLOSURE-README.md
├── Dockerfile.example
├── EXECUTION-COMPLETE.md
├── FILE_TREE.md
├── FINAL-DELIVERY-SUMMARY.md
├── GOVERNANCE.md
├── IMPLEMENTATION-SUMMARY.md
├── Index.html
├── LICENSE
├── MOBILE_MODE.md
├── NOTIFICATION-CHANGES.md
├── ORBIT-BOOTSTRAP-IMPLEMENTATION.md
├── ORBIT-QUICK-REFERENCE.md
├── ORCHESTRATOR-SUMMARY.md
├── PERFORMANCE-ANALYSIS-SESSION.md
├── PERFORMANCE-OPTIMIZATION-COMPLETE.md
├── QUICK-START-CLOSURE.md
├── README.md
├── SECURITY.md
├── agents
│   ├── agent.manifest.yaml
│   ├── autonomous_sync_agent.py
│   ├── bsm-ai-analyst.agent.md
│   ├── registry.schema.json
│   └── registry.yaml
├── api
│   └── agents.chat.json
├── bsm-config
│   ├── README.md
│   ├── config
│   │   └── ai-providers.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── validate-config.mjs
├── bsm_config
│   ├── __init__.py
│   └── src
│       ├── __init__.py
│       └── api
│           ├── __init__.py
│           └── client_factory.py
├── cleanup-branches.sh
├── config
│   ├── orbit.secrets.json
│   └── secrets.map.json
├── core
│   └── engine-with-ai.py
├── dashboard
│   └── ai_dashboard.py
├── data
│   ├── agents
│   │   ├── bsu-audit-agent.yaml
│   │   ├── code-review-agent.yaml
│   │   ├── governance-agent.yaml
│   │   ├── governance-review-agent.yaml
│   │   ├── index.json
│   │   ├── integrity-agent.yaml
│   │   ├── legal-agent.yaml
│   │   ├── my-agent.yaml
│   │   ├── pr-merge-agent.yaml
│   │   └── security-agent.yaml
│   └── knowledge
│       ├── example.md
│       └── index.json
├── disable_all_github_repo_alerts.sh
├── dns
│   ├── DNS-RECORD-TYPES.md
│   ├── GITHUB-PAGES-VERIFICATION.md
│   └── lexdo-uk-zone.txt
├── docker-compose.hybrid.yml
├── docker-compose.yml.example
├── docs
│   ├── AGENT-ORCHESTRATION.md
│   ├── ANALYSIS-SUMMARY.md
│   ├── ARCHITECTURE.md
│   ├── ARCHITECTURE.old.md
│   ├── AUTOMATION-AGENTS.md
│   ├── BSM-ORCHESTRATOR.md
│   ├── BSM-SUPREME-ORCHESTRATOR.md
│   ├── BSU-SUPREME-ORCHESTRATOR-QUICK-REF.md
│   ├── BSU-SUPREME-ORCHESTRATOR.md
│   ├── CICD-RECOMMENDATIONS.md
│   ├── COMMUNITY.md
│   ├── GO-IMPLEMENTATION-GUIDE.md
│   ├── GO-INTEGRATION-ARCHITECTURE.md
│   ├── GO-INTEGRATION-SUMMARY.md
│   ├── GO-QUICK-REFERENCE.md
│   ├── GOVERNANCE-CHECKLIST-GUIDE.md
│   ├── MOBILE_MODE.md
│   ├── ORBIT-BOOTSTRAP-GUIDE.md
│   ├── ORBIT-QUICK-SETUP.md
│   ├── ORBIT-SECRETS-MANAGEMENT.md
│   ├── ORBIT-TELEGRAM-TEMPLATES.md
│   ├── PERFORMANCE-AUDIT.md
│   ├── PERFORMANCE-IMPLEMENTATION.md
│   ├── PERFORMANCE-SUMMARY.md
│   ├── README.md
│   ├── SECRETS-MANAGEMENT.md
│   ├── SECURITY-DEPLOYMENT.md
│   ├── SECURITY-INDEX.md
│   ├── SECURITY-QUICKSTART.md
│   ├── SECURITY.md
│   ├── TELEGRAM_LINKS.md
│   ├── TELEGRAM_WEBHOOK.md
│   ├── app.js
│   ├── index.html
│   ├── index.md
│   ├── issues
│   │   └── meta-data-foundation-governance-master-tracking.md
│   ├── nexus.config.json
│   ├── reports
│   │   ├── CLOUD-CODE-REVIEW.md
│   │   ├── SECURITY-AUDIT.md
│   │   ├── SECURITY-SUMMARY.md
│   │   ├── report_20260206T060349.md
│   │   ├── report_20260206T061619.md
│   │   └── report_20260208T065934.md
│   └── styles.css
├── monitoring
│   └── prometheus.yml
├── package-lock.json
├── package.json
├── render.yaml
├── reports
│   ├── AGENTS-STATUS-REPORT.md
│   ├── INTEGRITY-AGENT-SUMMARY.md
│   ├── PERFORMANCE-ANALYSIS.md
│   ├── PERFORMANCE-EXECUTIVE-SUMMARY.md
│   ├── PERFORMANCE-QUICK-WINS.md
│   ├── PR-CLOSURE-PLAN.md
│   ├── README.md
│   ├── SECURITY-AUDIT.md
│   ├── SECURITY-SUMMARY.md
│   ├── TASK-COMPLETION-SUMMARY.md
│   ├── agents-inventory.json
│   ├── all-prs-analysis.csv
│   ├── runner-results-2026-02-08_18-05-55.json
│   └── runner-summary-2026-02-08_18-05-55.md
├── scripts
│   ├── README-CLOSURE.md
│   ├── audit-runner.js
│   ├── bootstrap-orbit.sh
│   ├── bootstrap.ps1
│   ├── bootstrap.sh
│   ├── bootstrap_bsu_agents.sh
│   ├── bootstrap_windows.ps1
│   ├── build_reports_index.js
│   ├── check_domain_health.sh
│   ├── close-all.sh
│   ├── close-draft-prs.sh
│   ├── close-issues.sh
│   ├── dedupe-code.sh
│   ├── dedupe-files.sh
│   ├── generate_report_with_ai.py
│   ├── get-telegram-chat-id.sh
│   ├── json_to_md.js
│   ├── optimize_agent.py
│   ├── pr-review-checklist.js
│   ├── query-agents.js
│   ├── run_agents.sh
│   ├── schema.yaml
│   ├── security-check.sh
│   ├── setup_github_pages_verification.sh
│   ├── test_ai_agent.py
│   ├── validate-registry.js
│   ├── validate.js
│   ├── validate_agent.py
│   └── verify-repo-integrity.sh
├── services
│   └── document-processor
│       ├── Dockerfile
│       ├── README.md
│       ├── cmd
│       │   └── server
│       │       └── main.go
│       ├── go.mod
│       └── internal
│           ├── api
│           │   ├── handlers.go
│           │   ├── metrics.go
│           │   ├── middleware.go
│           │   └── router.go
│           └── config
│               └── config.go
├── src
│   ├── actions
│   │   └── githubActions.js
│   ├── admin
│   │   ├── app.js
│   │   ├── index.html
│   │   └── styles.css
│   ├── agents
│   │   ├── CodeReviewAgent.js
│   │   ├── GovernanceAgent.js
│   │   ├── IntegrityAgent.js
│   │   ├── PRMergeAgent.js
│   │   ├── governanceResearch.js
│   │   ├── legalResearch.js
│   │   ├── orbit
│   │   │   ├── orbit.worker.ts
│   │   │   └── telegram.gateway.worker.ts
│   │   └── securityScanner.js
│   ├── api
│   │   ├── anthropic-client.ts
│   │   ├── azure-openai-client.ts
│   │   ├── base-client.ts
│   │   ├── client-factory.ts
│   │   ├── cohere-client.ts
│   │   ├── control.ts
│   │   ├── gemini-client.ts
│   │   ├── groq-client.ts
│   │   ├── index.ts
│   │   ├── mistral-client.ts
│   │   ├── openai-client.ts
│   │   ├── perplexity-client.ts
│   │   └── types.ts
│   ├── app.js
│   ├── audit
│   │   └── logger.ts
│   ├── chat
│   │   ├── README.md
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── key-status-display.js
│   │   ├── styles.css
│   │   └── tailwind.config.js
│   ├── config
│   │   ├── env.js
│   │   ├── modelRouter.js
│   │   ├── models.js
│   │   └── smartKeyManager.js
│   ├── controllers
│   │   ├── agentControl.js
│   │   ├── agentsController.js
│   │   ├── healthController.js
│   │   ├── knowledgeController.js
│   │   ├── orchestratorController.js
│   │   └── webhookController.js
│   ├── guards
│   │   ├── approvals.ts
│   │   ├── modes.ts
│   │   └── permissions.ts
│   ├── middleware
│   │   ├── auth.js
│   │   ├── correlation.js
│   │   ├── errorHandler.js
│   │   ├── lanOnly.js
│   │   ├── mobileMode.js
│   │   ├── notFound.js
│   │   └── requestLogger.js
│   ├── orbit
│   │   ├── agents
│   │   │   └── TelegramAgent.js
│   │   ├── router.js
│   │   └── webhooks
│   │       └── telegram.js
│   ├── orchestrator
│   │   └── index.ts
│   ├── routes
│   │   ├── admin.js
│   │   ├── agents.js
│   │   ├── chat.js
│   │   ├── control.js
│   │   ├── emergency.js
│   │   ├── health.js
│   │   ├── index.js
│   │   ├── knowledge.js
│   │   ├── orchestrator.js
│   │   ├── status.js
│   │   └── webhooks.js
│   ├── runners
│   │   ├── agentRunner.js
│   │   └── orchestrator.js
│   ├── server.js
│   ├── services
│   │   ├── agentStateService.js
│   │   ├── agentsService.js
│   │   ├── audit.js
│   │   ├── goServiceClient.js
│   │   ├── gptService.js
│   │   ├── knowledgeService.js
│   │   ├── orchestratorService.js
│   │   ├── telegramStatusService.js
│   │   └── vectorService.js
│   ├── utils
│   │   ├── agentCache.js
│   │   ├── auditLogger.js
│   │   ├── errors.js
│   │   ├── fsSafe.js
│   │   ├── intent.js
│   │   ├── logger.js
│   │   └── registryValidator.js
│   ├── views
│   │   └── LandingPage.vue
│   └── webhooks
│       └── telegram.js
├── test-telegram-webhook.sh
├── wrangler.jsonc
└── wrangler.toml

50 directories, 255 files
```

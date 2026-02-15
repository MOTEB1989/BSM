# KIMI Agent Verification Checklist

Use this checklist to verify the KIMI agent integration is working correctly.

## ✅ File Structure Verification

### Created Files
- [ ] `src/api/kimi-client.ts` exists and exports KimiClient
- [ ] `data/agents/kimi-agent.yaml` exists with complete agent definition
- [ ] `docs/KIMI-AGENT.md` exists with comprehensive documentation
- [ ] `KIMI-INTEGRATION-SUMMARY.md` exists with technical summary

### Modified Files
- [ ] `src/api/client-factory.ts` includes kimi in PROVIDER_MAP
- [ ] `src/api/index.ts` exports KimiClient
- [ ] `src/config/models.js` includes kimi configuration
- [ ] `data/agents/index.json` includes "kimi-agent.yaml"
- [ ] `agents/registry.yaml` includes kimi-agent entry
- [ ] `.env.example` includes KIMI_API_KEY
- [ ] `docs/README.md` references KIMI-AGENT.md

## ✅ Code Quality Verification

### TypeScript Structure
```bash
# Verify KimiClient extends BaseMockAIClient
grep "extends BaseMockAIClient" src/api/kimi-client.ts

# Verify export
grep "export class KimiClient" src/api/kimi-client.ts
```

### YAML Structure
```bash
# Verify agent ID
grep "^id: kimi-agent" data/agents/kimi-agent.yaml

# Verify required fields
grep -E "(name|role|version|modelProvider|actions|contexts|safety|risk|approval|expose)" data/agents/kimi-agent.yaml
```

### Registry Entry
```bash
# Verify registry includes kimi-agent
grep "id: kimi-agent" agents/registry.yaml

# Verify required governance fields
grep -A 30 "id: kimi-agent" agents/registry.yaml | grep -E "(category|role|safety|risk|approval|startup|healthcheck)"
```

## ✅ Integration Verification

### Client Factory
```bash
# Verify kimi in PROVIDER_MAP
grep "kimi: () => new KimiClient()" src/api/client-factory.ts
```

### Models Configuration
```bash
# Verify kimi model config
grep -A 2 "kimi:" src/config/models.js
```

### Agent Index
```bash
# Verify kimi-agent.yaml in index
grep "kimi-agent.yaml" data/agents/index.json
```

## ✅ Environment Configuration

### .env.example
```bash
# Verify KIMI_API_KEY is documented
grep "KIMI_API_KEY" .env.example
```

## ✅ Runtime Verification

### Start the Server
```bash
cd /home/runner/work/BSM/BSM
npm start
```

### List All Agents
```bash
curl http://localhost:3000/api/agents
```

Expected output should include:
```json
{
  "id": "kimi-agent",
  "name": "KIMI AI Agent",
  "role": "Moonshot AI conversational assistant with Chinese language expertise",
  ...
}
```

### Execute KIMI Agent
```bash
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "kimi-agent",
    "input": "Hello KIMI!"
  }'
```

### Check Agent Status
```bash
curl http://localhost:3000/api/agents/kimi-agent/status
```

### Health Check
```bash
curl http://localhost:3000/api/agents/kimi-agent/health
```

## ✅ Documentation Verification

### KIMI-AGENT.md
- [ ] Contains overview section
- [ ] Contains configuration instructions
- [ ] Contains usage examples
- [ ] Contains security and governance details
- [ ] Contains getting started guide
- [ ] Contains API key instructions

### KIMI-INTEGRATION-SUMMARY.md
- [ ] Lists all changed files
- [ ] Explains integration architecture
- [ ] Documents validation status
- [ ] Provides testing instructions

### docs/README.md
- [ ] Includes KIMI Agent entry in Architecture section
- [ ] Has correct link to KIMI-AGENT.md

## ✅ Validation Tests

### Agent YAML Validation
```bash
cd /home/runner/work/BSM/BSM
node -e "
const fs = require('fs');
const YAML = require('yaml');
const content = fs.readFileSync('data/agents/kimi-agent.yaml', 'utf8');
const agent = YAML.parse(content);
console.log('ID:', agent.id);
console.log('Name:', agent.name);
console.log('Model Provider:', agent.modelProvider);
console.log('Contexts:', agent.contexts.allowed);
console.log('Risk Level:', agent.risk.level);
"
```

Expected output:
```
ID: kimi-agent
Name: KIMI AI Agent
Model Provider: kimi
Contexts: [ 'chat', 'api', 'mobile' ]
Risk Level: low
```

### Registry Validation
```bash
cd /home/runner/work/BSM/BSM
node -e "
const fs = require('fs');
const YAML = require('yaml');
const content = fs.readFileSync('agents/registry.yaml', 'utf8');
const registry = YAML.parse(content);
const kimiAgent = registry.agents.find(a => a.id === 'kimi-agent');
console.log('Found KIMI in registry:', !!kimiAgent);
console.log('Category:', kimiAgent?.category);
console.log('Role:', kimiAgent?.role);
console.log('Auto-start:', kimiAgent?.startup?.auto_start);
"
```

Expected output:
```
Found KIMI in registry: true
Category: conversational
Role: advisor
Auto-start: false
```

## ✅ Git Verification

### Commits
```bash
git log --oneline --grep="KIMI" | head -5
```

Expected output should show KIMI-related commits.

### Changed Files
```bash
git diff origin/main --name-only | grep -E "(kimi|KIMI)"
```

Expected files:
- src/api/kimi-client.ts
- data/agents/kimi-agent.yaml
- docs/KIMI-AGENT.md
- KIMI-INTEGRATION-SUMMARY.md

## ✅ Pattern Consistency

### Compare with Existing Agents
```bash
# Compare KIMI structure with legal-agent
diff -u <(grep -E "^(id|name|role|version|modelProvider)" data/agents/legal-agent.yaml) \
        <(grep -E "^(id|name|role|version|modelProvider)" data/agents/kimi-agent.yaml)
```

### Compare API Clients
```bash
# Compare KIMI client with Groq client
diff -u src/api/groq-client.ts src/api/kimi-client.ts
```

Should show minimal differences (only the provider name).

## ✅ Security Verification

### No Secrets in Code
```bash
grep -r "sk-\|api_key.*=" src/api/kimi-client.ts data/agents/kimi-agent.yaml
```

Expected: No matches (should return empty)

### Safe Mode Configuration
```bash
grep -A 2 "safety:" data/agents/kimi-agent.yaml
```

Expected output:
```yaml
safety:
  mode: safe
  requires_approval: false
```

## ✅ Final Checklist

- [ ] All files created and modified correctly
- [ ] TypeScript client follows standard pattern
- [ ] YAML structure matches existing agents
- [ ] Registry includes all required governance fields
- [ ] Environment variables documented
- [ ] Documentation is comprehensive
- [ ] No secrets committed to repository
- [ ] Agent operates in safe mode
- [ ] Auto-start is disabled
- [ ] All verification tests pass
- [ ] Git commits are clean and descriptive

## 🚀 Ready to Use

Once all items are checked, the KIMI agent is ready for production use!

## Support

For issues or questions:
1. Check docs/KIMI-AGENT.md
2. Check KIMI-INTEGRATION-SUMMARY.md
3. Review agent YAML definition
4. Check server logs for errors
5. Verify KIMI_API_KEY is set correctly

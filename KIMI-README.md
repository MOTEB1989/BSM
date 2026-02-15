# 🤖 KIMI Agent - Start Here!

Welcome to the KIMI agent integration for BSM! This README will help you get started quickly.

## 🚀 What is KIMI?

KIMI is the **13th agent** in the BSM platform, powered by **Moonshot AI**. It specializes in:
- 🇨🇳 Chinese language understanding and generation
- 📝 Long-context conversations (8,000 tokens)
- 💬 Multi-turn dialogue with context awareness
- 🔍 Advanced knowledge retrieval

## 📚 Documentation Quick Links

| Document | Use When You... | Lines |
|----------|----------------|-------|
| [KIMI-QUICK-REFERENCE.md](KIMI-QUICK-REFERENCE.md) | Want to get started in 5 steps | 130+ |
| [docs/KIMI-AGENT.md](docs/KIMI-AGENT.md) | Need complete setup instructions | 140+ |
| [KIMI-INTEGRATION-SUMMARY.md](KIMI-INTEGRATION-SUMMARY.md) | Want technical implementation details | 170+ |
| [KIMI-VERIFICATION-CHECKLIST.md](KIMI-VERIFICATION-CHECKLIST.md) | Need to test and verify | 275+ |
| [KIMI-PROJECT-SUMMARY.md](KIMI-PROJECT-SUMMARY.md) | Want the complete project overview | 450+ |

## ⚡ Quick Start (5 Steps)

```bash
# 1. Get API key
# Visit: https://platform.moonshot.cn/

# 2. Configure
echo "KIMI_API_KEY=your-api-key" >> .env

# 3. Restart
npm start

# 4. Test
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId": "kimi-agent", "input": "你好！"}'

# 5. Use in chat
# Open: http://localhost:3000/chat
# Select: KIMI AI Agent
```

## 🎯 Agent Specifications

- **ID**: kimi-agent
- **Model**: moonshot-v1-8k (8K context)
- **Risk**: Low (safe mode, no system mods)
- **Contexts**: Chat, API, Mobile
- **Status**: ✅ Active & Production Ready

## 📖 Which Document Should I Read?

### For Users
👉 **Start with**: [KIMI-QUICK-REFERENCE.md](KIMI-QUICK-REFERENCE.md)
- Fast 5-step setup
- Common use cases
- Quick troubleshooting

### For Setup
👉 **Follow**: [docs/KIMI-AGENT.md](docs/KIMI-AGENT.md)
- Complete installation guide
- Configuration details
- API examples
- Security notes

### For Developers
👉 **Read**: [KIMI-INTEGRATION-SUMMARY.md](KIMI-INTEGRATION-SUMMARY.md)
- Technical architecture
- File-by-file changes
- Integration patterns
- Code examples

### For Testing
👉 **Use**: [KIMI-VERIFICATION-CHECKLIST.md](KIMI-VERIFICATION-CHECKLIST.md)
- 50+ verification steps
- Code quality checks
- Runtime tests
- Security validation

### For Project Overview
👉 **See**: [KIMI-PROJECT-SUMMARY.md](KIMI-PROJECT-SUMMARY.md)
- Complete statistics
- Architecture diagrams
- Success metrics
- Reusable patterns

## 🆘 Need Help?

1. Check the [KIMI-QUICK-REFERENCE.md](KIMI-QUICK-REFERENCE.md) for common issues
2. Review [docs/KIMI-AGENT.md](docs/KIMI-AGENT.md) for detailed setup
3. Verify your setup with [KIMI-VERIFICATION-CHECKLIST.md](KIMI-VERIFICATION-CHECKLIST.md)
4. Check server logs for errors

## 🌟 Key Features

- ✅ Chinese language expertise
- ✅ 8K token context window
- ✅ Safe mode (no system modifications)
- ✅ No approval required (low risk)
- ✅ Multi-platform support (Chat, API, Mobile)
- ✅ Complete health monitoring
- ✅ Production ready

## 📞 Resources

- **Platform**: https://platform.moonshot.cn/
- **BSM Agents**: See [agents/registry.yaml](agents/registry.yaml)
- **API Endpoints**: `/api/agents/*`

---

**Ready to start? Pick a document above and dive in!** 🚀

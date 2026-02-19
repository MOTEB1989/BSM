import { getAgentConfig } from '../guards/permissions';
import { enforceMode } from '../guards/modes';
import { requireApproval } from '../guards/approvals';
import { audit } from '../audit/logger';

export type ExecutionContext = {
  mode: 'local' | 'mobile' | 'lan' | 'ci';
  actor: string;
  ip?: string;
};

export async function runPipeline(
  agents: string[],
  context: ExecutionContext
) {
  audit('PIPELINE_START', context.actor, { agents, mode: context.mode, ip: context.ip });

  for (const agentId of agents) {
    const agent = await getAgentConfig(agentId);

    enforceMode(agent, context);
    requireApproval(agent, context);

    audit('AGENT_RUN', context.actor, { agentId });

    if (typeof agent.execute !== 'function') {
      throw new Error(`Agent ${agent.id} is missing execute() binding`);
    }

    // 🔹 التنفيذ الفعلي (موجود عندك مسبقًا)
    await agent.execute();
  }

  audit('PIPELINE_END', context.actor, { agents, mode: context.mode });
}

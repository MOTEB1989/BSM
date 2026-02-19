import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

export type AgentConfig = {
  id: string;
  safety?: {
    mode?: string;
    requires_approval?: boolean;
  };
  approval?: {
    required?: boolean;
  };
  risk?: {
    level?: string;
  };
  network?: {
    outbound?: string[];
  };
  execute?: () => Promise<void>;
};

type RegistryShape = {
  agents?: AgentConfig[];
};

let cachedRegistry: RegistryShape | null = null;
let loadingPromise: Promise<RegistryShape> | null = null;

async function loadRegistry(): Promise<RegistryShape> {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  // Prevent cache stampede
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const registryPath = path.join(process.cwd(), 'agents', 'registry.yaml');
      const source = await fs.readFile(registryPath, 'utf8');
      cachedRegistry = YAML.parse(source) as RegistryShape;
      return cachedRegistry;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export async function getAgentConfig(agentId: string): Promise<AgentConfig> {
  const registry = await loadRegistry();
  const agent = registry.agents?.find((a) => a.id === agentId);

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  return agent;
}

import { OrbitEngine } from './orbit.engine'
import { dispatchToGitHub } from '../../utils/githubDispatch'

export default {
  async scheduled() {
    const telemetry = await collectTelemetry()
    const engine = new OrbitEngine(telemetry)
    const actions = engine.evaluate()

    if (actions.length > 0) {
      await dispatchToGitHub(actions)
    }

    return new Response('OK', { status: 200 })
  }
}

async function collectTelemetry() {
  // TODO: connect Cloudflare Analytics + GitHub API
  return {
    errors: Math.floor(Math.random() * 5),
    cacheHitRate: 0.75,
    branches: 12,
    duplicateFiles: 0,
    duplicateCodeBlocks: 0
  }
}

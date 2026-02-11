import { dispatchToGitHub } from '../../utils/githubDispatch'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ALLOWED_CHAT_IDS = (process.env.ORBIT_ADMIN_CHAT_IDS || '').split(',')

export default {
  async fetch(request: Request) {
    const update = await request.json().catch(() => null)
    if (!update || !update.message) return new Response('ignored', { status: 200 })

    const chatId = String(update.message.chat.id)
    const text = (update.message.text || '').trim()

    if (!ALLOWED_CHAT_IDS.includes(chatId)) {
      await sendTelegram(chatId, 'عذراً. ليس لديك صلاحية تنفيذ الأوامر.')
      return new Response('forbidden', { status: 200 })
    }

    if (text === '/status') {
      const status = await getOrbitStatus()
      await sendTelegram(chatId, formatStatus(status))
      return new Response('ok', { status: 200 })
    }

    if (text === '/deploy') {
      await dispatchToGitHub(['trigger:deploy'])
      await sendTelegram(chatId, 'تم استلام طلب النشر. سيتم إعلامكم عند الانتهاء.')
      return new Response('ok', { status: 200 })
    }

    if (text === '/purge') {
      await dispatchToGitHub(['trigger:purge-cache'])
      await sendTelegram(chatId, 'تم استلام طلب تفريغ الكاش. الإجراء جارٍ.')
      return new Response('ok', { status: 200 })
    }

    if (text === '/cleanup') {
      await dispatchToGitHub(['trigger:cleanup-branches'])
      await sendTelegram(chatId, 'تم استلام طلب تنظيف الفروع. الإجراء جارٍ.')
      return new Response('ok', { status: 200 })
    }

    if (text === '/dedupe') {
      await dispatchToGitHub(['trigger:dedupe-files', 'trigger:dedupe-code'])
      await sendTelegram(chatId, 'تم استلام طلب فحص وإزالة التكرار. الإجراء جارٍ.')
      return new Response('ok', { status: 200 })
    }

    await sendTelegram(chatId, 'الأمر غير معروف. أرسل /status أو /deploy أو /purge أو /cleanup أو /dedupe.')
    return new Response('ok', { status: 200 })
  }
}

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}

async function getOrbitStatus() {
  // TODO: replace with ORBIT API / telemetry storage
  return {
    system: { pages: 'OK', workers: 'OK', errors: 0, cacheHitRate: 0.82, lastDeploy: '2 hours ago' },
    repo: { branches: 12, duplicateFiles: 0, duplicateCodeBlocks: 0, openPRs: 4, openIssues: 18 },
    orbit: { lastActions: ['purge-cache', 'dedupe-code'] }
  }
}

function formatStatus(s: any) {
  return `تقرير حالة LEX/BSM

System: ${s.system.pages}
Workers: ${s.system.workers}
Errors (24h): ${s.system.errors}
Cache Hit Rate: ${Math.round(s.system.cacheHitRate * 100)}%
Last Deploy: ${s.system.lastDeploy}

Repository
Branches: ${s.repo.branches}
Duplicate Files: ${s.repo.duplicateFiles}
Duplicate Code Blocks: ${s.repo.duplicateCodeBlocks}
Open PRs: ${s.repo.openPRs}
Open Issues: ${s.repo.openIssues}

Recent ORBIT Actions: ${s.orbit.lastActions.join(', ')}`
}

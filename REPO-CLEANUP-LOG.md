# REPO Cleanup Log

سجل تدقيقي مختصر لعمليات التنظيف (حذف/نقل) مع أدلة قابلة للتحقق من تاريخ Git.

## Cleanup entries

| Date | Type | Before path | After path | Reason | Evidence |
|---|---|---|---|---|---|
| 2026-02-09 | Delete | `.github/workflows/pages.yml` | — | إزالة workflow قديم بعد اعتماد تدفق GitHub Pages محدث. | Commit `f5de2f6` (`git show --name-status --oneline f5de2f6`) |
| 2026-02-09 | Delete | `.github/workflows/docker-publish.yml` | — | لا يوجد `Dockerfile` في المستودع، والنشر الفعلي يتم عبر Render.com. | Commit `2dea954` (`git show --name-status --oneline 2dea954`) |
| 2026-02-09 | Delete | `.github/workflows/docker-image.yml` و`.github/workflows/python-package-conda.yml` | — | تبسيط CI بإزالة workflows غير المستخدمة (Docker/Python) واعتماد مسار Node.js. | Commit `3d00d83` (`git show --name-status --oneline 3d00d83`) |
| 2026-02-08 | Rename | `.github/agents/bsm-autonomous-architect.agent.md` | `.github/agents/bsu-autonomous-architect.agent.md` | توحيد التسمية من BSM إلى BSU على مستوى المستودع. | Commit `514f90c` (`git show --name-status --oneline 514f90c`) |
| 2026-02-08 | Rename | `.github/workflows/run-bsm-agents.yml` | `.github/workflows/run-bsu-agents.yml` | توحيد التسمية التشغيلية للـ agents بعد إعادة التسمية العامة. | Commit `514f90c` (`git show --name-status --oneline 514f90c`) |
| 2026-02-08 | Rename | `scripts/bootstrap_bsm_agents.sh` | `scripts/bootstrap_bsu_agents.sh` | مواءمة اسم سكربت الإقلاع مع الاسم الجديد للمشروع/الـ agents. | Commit `514f90c` (`git show --name-status --oneline 514f90c`) |
| 2026-02-09 | Delete | `logs/audit.log` | — | منع تتبع ملفات logs المتولدة محليًا داخل Git. | Commit `f6dc8ed` (`git show --name-status --oneline f6dc8ed`) |

> ملاحظة: عمود الدليل يعتمد على **commit hash** (مقبول حسب الطلب: "commit أو PR"). عند توفر رقم PR مستقبلاً يمكن إضافته بجانب hash.

## Verification commands

استخدم الأوامر التالية للتحقق من هيكل المستودع بعد التنظيف:

```bash
# 1) عرض كل عمليات الحذف/النقل تاريخيًا
 git log --oneline --name-status --diff-filter=DR

# 2) التأكد من عدم وجود workflows المحذوفة
 test ! -f .github/workflows/docker-publish.yml && echo "OK: docker-publish removed"
 test ! -f .github/workflows/docker-image.yml && echo "OK: docker-image removed"
 test ! -f .github/workflows/python-package-conda.yml && echo "OK: python-package-conda removed"

# 3) التأكد من وجود المسارات بعد إعادة التسمية
 test -f .github/agents/bsu-autonomous-architect.agent.md && echo "OK: renamed agent exists"
 test -f .github/workflows/run-bsu-agents.yml && echo "OK: renamed workflow exists"
 test -f scripts/bootstrap_bsu_agents.sh && echo "OK: renamed bootstrap script exists"

# 4) التأكد من عدم تتبع ملف log القديم
 git ls-files logs/audit.log
```

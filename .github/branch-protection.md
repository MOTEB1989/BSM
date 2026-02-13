# Branch Protection Required Status Checks

To enforce blocking merge when the PR checklist is incomplete, configure branch protection (or rulesets) for `main` and any protected release branches with these required status checks:

- `PR Checklist Gate / Enforce PR Checklist Completeness`
- `PR Governance Check / Validate PR Governance` (recommended)

## GitHub UI steps

1. Go to **Settings → Branches** (or **Settings → Rules → Rulesets**).
2. Create/edit a rule for `main`.
3. Enable **Require status checks to pass before merging**.
4. Mark the checks above as **required**.
5. Enable **Require branches to be up to date before merging**.

This makes unchecked mandatory items in the PR template a hard merge blocker through CI status checks.

# Branch Protection Required Status Checks

To enforce safe merges on `main`, branch protection **must** include all of the following:

- Disable force pushes (`allow_force_pushes=false`).
- Require pull requests before merging.
- Require CI checks to pass before merge.

Required checks currently enforced:

- `Validate / validate`
- `PR Checklist Gate / Enforce PR Checklist Completeness`
- `PR Governance Check / Validate PR Governance` (recommended)

> Automation: `.github/workflows/enforce-main-branch-protection.yml` applies these settings to `main` using `BRANCH_PROTECTION_TOKEN`.

## GitHub UI steps

1. Go to **Settings → Branches** (or **Settings → Rules → Rulesets**).
2. Create/edit a rule for `main`.
3. Enable **Require a pull request before merging**.
4. Enable **Require status checks to pass before merging**.
5. Mark the checks above as **required**.
6. Enable **Require branches to be up to date before merging**.
7. Disable **Allow force pushes**.

This makes unchecked mandatory items in the PR template a hard merge blocker through CI status checks and prevents history rewrites on `main`.

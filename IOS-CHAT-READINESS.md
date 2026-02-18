# iPhone Web Chat Readiness Checklist

This checklist is used to validate LexBANK chat readiness on iPhone browsers (Safari/Chrome).

## UX & Layout
- [ ] Header and chat content respect `safe-area` top inset.
- [ ] Input area respects `safe-area` bottom inset (home indicator).
- [ ] No overlap when software keyboard opens/closes.
- [ ] Message list remains scrollable and stable on long chats.
- [ ] RTL and LTR layouts are both readable and aligned.

## API Integration
- [ ] Agent list loads with `GET /api/agents?mode=mobile`.
- [ ] Fallback to `/api/agents` works if filtered endpoint fails.
- [ ] Direct chat requests reach `/api/chat/direct`.
- [ ] Agent execution requests reach `/api/control/run` with `context.mobile=true`.

## Reliability
- [ ] Clear user-facing error on DNS/network failures.
- [ ] Clear user-facing error on server 5xx errors.
- [ ] No duplicate submissions while request is loading.

## Security & Governance
- [ ] Only mobile-safe/selectable agents are shown.
- [ ] Destructive operations remain blocked in mobile mode.
- [ ] No secret keys are exposed client-side.

## Suggested Observability Metrics
- Mobile request error rate (`4xx/5xx`) by endpoint.
- Median response latency on iPhone networks.
- Chat success rate by agent id.
- Top failure reasons (`network`, `timeout`, `unauthorized`, `server_error`).

# Deploy and Host Paperclip on Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/paperclip-production?referralCode=sLjDXb&utm_medium=integration&utm_source=button&utm_campaign=paperclip-production)

[Paperclip](https://paperclip.ing) is an open-source control plane for teams of AI agents. You set up a company with a goal, hire agents into an org chart (a CEO, engineers, a marketer), give them budgets and approval rules, and they work through issues on a schedule. Claude Code, Codex, OpenCode and Gemini CLI run inside the container as agents, and you watch and steer it all from a web dashboard. It is MIT licensed.

## About Hosting Paperclip

This template runs the official Paperclip image against Railway Postgres:

| Service | What it does |
|---|---|
| **Paperclip** | The Paperclip server and web UI, plus the agent CLIs (Claude Code, Codex, OpenCode, Gemini CLI). Its volume holds agent workspaces, CLI logins, uploaded files and hourly database backups. |
| **Postgres** | PostgreSQL 17 on a volume. |

Paperclip's Docker setup is built for a private network: the first visitor claims the instance from the browser. On a public Railway URL that would be a race, so this template sets it up for public use:

- **Admin account from variables.** On first boot a small step creates your admin account from `ADMIN_EMAIL` and the generated `ADMIN_PASSWORD`, through Paperclip's own sign-up, and makes it the instance admin. Nothing is claimable from the browser.
- **Public mode.** Paperclip runs in `authenticated` mode with public exposure: every page needs a login, and the public URL is set to your Railway domain so sign-in, invite links and agent callbacks work over HTTPS.
- **Strangers can't do anything.** Anyone can create an account on the sign-in page (Paperclip needs that for invites), but without an invite to a company they see an empty instance and can't create one. Only the instance admin can.
- **Real client IPs.** Paperclip trusts one proxy hop, so its per-IP rate limits see each visitor instead of Railway's edge.
- **Migrations on boot.** Database migrations apply automatically on start, so upgrades are just a redeploy.

## Common Use Cases

- Running a small "AI company": a CEO agent that plans work and engineer agents that ship code to your repos
- Orchestrating many Claude Code or Codex agents with budgets, approvals and an audit trail instead of separate terminals
- A shared dashboard where a team assigns issues to agents and reviews their output

## Dependencies for Paperclip Hosting

- PostgreSQL 17 (included)
- An API key or subscription for at least one agent: Anthropic (Claude Code), OpenAI (Codex and OpenCode) or Google (Gemini)

### Deployment Dependencies

- [Paperclip documentation](https://docs.paperclip.ing)
- [Paperclip on GitHub](https://github.com/paperclipai/paperclip)
- [Template source on GitHub](https://github.com/nomideusz/paperclip-railway)

### Implementation Details

**Sign in.** Open the Paperclip service's Railway domain and sign in with `ADMIN_EMAIL` and the `ADMIN_PASSWORD` value from the service's Variables tab. The password is only used to create the account on first boot, so change it afterwards in your profile.

**Give agents a model.** Set one or more of these on the Paperclip service and redeploy:

- `ANTHROPIC_API_KEY` for Claude Code agents, or `CLAUDE_CODE_OAUTH_TOKEN` to use a Claude Pro/Max subscription (run `claude setup-token` on your own machine to get one)
- `OPENAI_API_KEY` for Codex agents (OpenCode uses it too)
- `GEMINI_API_KEY` for Gemini CLI agents (the key must be restricted to the Gemini API)

You can also store keys per company in Paperclip's secrets and attach them to individual agents.

**Create your company.** After signing in, create a company, describe its goal and hire a CEO agent. The CEO proposes the rest of the team, and new hires wait for your approval if you turn that on.

**Add people.** Invite teammates from the company settings. They open the invite link and create their account on the spot.

**Custom domain.** Add it to the Paperclip service, then set `PAPERCLIP_PUBLIC_URL` to `https://your.domain` and redeploy. Sign-in only works from the URL in that variable.

**Upgrade.** Set `PAPERCLIP_VERSION` on the Paperclip service to a newer release (for example `2026.1020.0`, see [releases](https://github.com/paperclipai/paperclip/releases), without the leading `v`) and deploy. Migrations run on start. Paperclip's hourly backups on the volume give you a way back.

**Things to know.**

- Agents run as processes inside the Paperclip container, so memory grows with how many run at once. Give the service more memory if you run many agents in parallel.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` only apply on first boot. Changing them later does nothing.
- Database backups are written every hour to the Paperclip volume and kept for 7 days. Change that under Instance settings. Railway's volume backups are another option.
- `BETTER_AUTH_SECRET` signs sessions and agent tokens. Changing it signs everyone out and invalidates agent keys.

**Memory.** Measured on Railway with no agents running: Paperclip idles at about 1 GB and Postgres at about 340 MB, so plan for about 1.4 GB in total (Hobby plan or above).

## Why Deploy Paperclip on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Paperclip on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.

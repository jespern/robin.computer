# robin.computer

The public introduction to Robin, a personal attention router. This is a static
site, independent of the private chat app and its credentials. HTML, CSS and a
small browser-only policy illustration; no dependencies, analytics, external
fonts, backend or account connection.

The green wordmark dot matches the chat app's `#70977c` brand dot. The first
design uses warm paper, forest green, large type and an original SVG routing
illustration. Product examples are synthetic and labelled as illustrative.
The progress section distinguishes today's shadow/read-only implementation
from notifications, orders and approval-gated writes still to come.

The second design pass brings proactive assistance and coordination across
providers forward. Three synthetic scenarios show an overdue parcel linked
across Gmail and Fastmail, a Google Calendar meeting brief drawing on Fastmail,
and a changed trip plan conflicting with a booking confirmation. These are
explicitly labelled as the direction being built toward, not live capabilities.
The qmail and OTP/Suture influences are each a short paragraph about their
benefit; the process diagrams and detailed lifecycle explanation were removed.

The third pass adds phone calls in both directions: call Robin with questions
or instructions, or approve a brief for Robin to call someone on your behalf.
This is a prospective feature presentation, marked “On the roadmap”, based on
`robin-stage2/deploy/voice-design-note.md`. No phone implementation or real
phone number is offered. Calls stay within the approved purpose and limits.
The providers section names Gmail, Google Workspace and Fastmail as current;
Google Routes, Google Weather, weather alerts, Slack, Telegram and WhatsApp
are planned information sources. The owner explicitly requested these future
providers on the site; this copy does not change Robin's technical decisions,
stages, permissions or current connector availability.

The fourth pass leads with coordination and productivity: “Connect the dots.
Move life forward.” The hero combines a calendar event, a changed location in
Slack, traffic and weather into one suggested departure plan. Its caption
identifies the illustration and planned capabilities. Coordination scenarios
now precede the mail-routing demo; the demo remains further down the page.
Provider marks are hosted locally with provenance in `assets/providers/`.

Architecture copy follows Robin's `SPEC.md` and `deploy/suture-evaluation.md`:
qmail-inspired process/privilege separation, and Erlang/OTP-inspired supervision
through Suture, pinned and vendored in Go. Upstream references are linked on
the page. Suture is not presented as an OS sandbox or the Erlang runtime.

Serve the repository root with any static server. For example:

```
python3 -m http.server 8787 --bind 0.0.0.0
```

On the owner's network, open `http://victory.local:8787`. Over SSH, forward
that port to your machine. Stop the preview server when finished.

GitHub Pages serves the root with the custom domain in `CNAME`. Preserve
`oauth/fastmail.json` and `link/fastmail/index.html`: they are public sign-in
infrastructure, separate from the landing page. Do not place private app URLs,
account details or credentials here.

This first pass is committed on `landing-page` in the isolated worktree
`/Users/jespern/Work/robin.computer-landing`; the main domain is unchanged until
that branch is integrated and pushed. The owner selected “Build and publish a
preview”. A separate owner-private Sites preview was successfully published on
2026-11-18, without changing DNS or the GitHub Pages deployment:

https://robin-attention-router-preview.mirador-5864.chatgpt.site

Its checkout is `/Users/jespern/Work/robin-landing-preview`; the persisted Site
identity is in that checkout's `.openai/hosting.json`. Reuse it for revisions.
The deployed static directory contains an exact copy of this branch's
`index.html` and `assets/`. Keep the website repository as the source of truth,
copy changed public assets to the preview, and save/deploy a new Site version.
Do not copy `CNAME` or the Fastmail sign-in infrastructure to the preview.

Check with Node 22.22.2 and an installed Chrome (override `ROBIN_CHROME` if needed):

```
node --check assets/site.js
node scripts/browser-check.mjs
git diff --check
```

The browser check owns and stops its static server and isolated Chrome profile.
It checks six widths from 320 to 1920px, the routing examples, native keyboard
activation, text contrast, reduced motion, section links, readable HTML without
JavaScript, browser errors and external resource loads. Screenshots go to the OS temporary
directory (or `ROBIN_SCREENSHOTS`), never into the repository.

Validation passed with Chrome on 2026-11-18. Desktop and phone screenshots were
visually reviewed. The original `oauth/fastmail.json`, `link/fastmail/index.html`,
`CNAME` and `.nojekyll` are byte-for-byte unchanged. No private Robin service was
started or restarted, and no account/model calls were made.

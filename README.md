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

This first pass is prepared on `landing-page`; the main domain is unchanged
until that branch is integrated and pushed. A separate Sites preview is used
for visual review, without changing DNS or the GitHub Pages deployment.

Check with Node 22.22.2 and an installed Chrome (override `ROBIN_CHROME` if needed):

```
node --check assets/site.js
node scripts/browser-check.mjs
git diff --check
```

The browser check owns and stops its static server and isolated Chrome profile.
It checks six widths from 320 to 1920px, the routing examples, native keyboard
activation, reduced motion, section links, readable HTML without JavaScript,
browser errors and external resource loads. Screenshots go to the OS temporary
directory (or `ROBIN_SCREENSHOTS`), never into the repository.

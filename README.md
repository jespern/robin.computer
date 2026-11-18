# robin.computer

The public website for **Robin, a personal attention router**:
https://robin.computer/

A static site, separate from the private Robin app. HTML, CSS, local provider
marks and a small browser-only routing illustration. No dependencies,
analytics, external fonts, backend or account connection.

## Content and assets

The opening brings email attention and proactive coordination into one view.
The examples cover an email needing a reply, a passport renewal connected to a
flight booking, conflicting plans and an overdue parcel. They are synthetic and
labelled as illustrative. Current integrations and planned capabilities are
identified separately, including phone calls and future information sources.

The green wordmark dot matches Robin's chat interface. Provider asset sources
and integrity digests are recorded in [assets/providers](assets/providers/).
All page resources are hosted locally. Preserve the provider credits.

The architecture section explains the qmail influence on process separation
and the Erlang/OTP influence through Suture in Go. Upstream references are
linked on the page.

## Local preview and checks

Serve this repository with a static server:

```
python3 -m http.server 8787 --bind 0.0.0.0
```

Open port 8787 on the serving host. If working over SSH, forward that port to
your machine. Stop the server when finished.

Use Node 22.22.2 and an installed Chrome; override `ROBIN_CHROME` if necessary:

```
node --check assets/site.js
node scripts/browser-check.mjs
git diff --check
```

The browser check owns and stops its static server and isolated Chrome profile.
It checks widths from 320 to 1920px, source-card overlap, local logo loading,
routing interactions, keyboard activation, text contrast, reduced motion,
section links, readable HTML without JavaScript and external resource loads.
Screenshots go to the OS temporary directory or `ROBIN_SCREENSHOTS`.

## Publishing

GitHub Pages serves the root of `main`, with HTTPS and the custom domain in
`CNAME`. To publish, validate the change, integrate it into `main`, then push to
`origin`. Wait for the Pages deployment and verify the live HTML and assets.

Preserve `oauth/fastmail.json`, `link/fastmail/index.html`, `CNAME` and
`.nojekyll`. The Fastmail files are public sign-in infrastructure, independent
of the landing page. Never put private app URLs, account data or credentials
in this repository.

A separate owner-private Sites preview is maintained for design review. Its
source checkout is the sibling `robin-landing-preview` directory; reuse the
identity in its `.openai/hosting.json`. Copy `index.html` and `assets/` to its
static directory and publish a new version. Keep this repository as the source
of truth. Do not copy `CNAME` or sign-in infrastructure to that preview.

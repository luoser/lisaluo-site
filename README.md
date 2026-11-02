# lisaluo.com

A dependency-free static site designed for GitHub Pages.

## Editing the writing

Edit `content.js`. `window.LISALUO_HOME_PAGES` holds the home intro cards; `window.LISALUO_POEMS` preserves the full poem library. The words tab is temporarily removed, so only home is visible and old `#poetry` links return to `#home`. The three-short-poem selection remains in `window.LISALUO_PAGES`; restoring a bottom navigation link with `href="#poetry"` and `data-feed-tab="poetry"` makes it available again. The scroll tutorial appears on the first visit to the feed.

Each writing array entry is one line, and an empty entry creates a stanza break. Each card fills one screen. The feed snaps one page at a time; `vv`, keyboard arrows, and Page Up/Down move between pages. The feed automatically loops forever. All poems remain saved in the source but are excluded from the visible feed.

The final home card is a 2×2 sobriety counter. Edit its `counters` entries in `content.js` to change labels or reset timestamps. Each reset is midnight in New York on the specified date, with an explicit UTC offset. The display counts complete elapsed 24-hour days, automatically updates when another day elapses, and catches up when the tab becomes visible again. The counters need no server or saved browser state.

## Sharing

The heart toggles a personal like for the current card: `<3` becomes `[<3]` with a small pop animation. Likes are saved only in that visitor's browser, keyed by feed and card ID, so looping copies share the same state. There are no public counts or server requests. If storage is unavailable, likes last for the current visit. Reduced-motion preferences disable the animation.

The right-hand `->` button opens an image preview and a link to that exact card, such as `#home/joy`. Visitors can copy the link or save the PNG. Browsers with native sharing also show a share-image button, or a share-link button if file sharing is unsupported. Cancelling a native share has no other effect. The image preserves line breaks and includes the page URL; the sobriety image uses the current day counts and reset dates. Links use the current site origin and path, so local previews produce localhost links and the deployed website produces public links. No content is uploaded to an image service.

## Email signup

`[+]` opens the lowercase, monospace “seek entropy” modal. It subscribes to Seek Entropy using the public native HTML form action in [Substack's own signup embed](https://seekentropy.substack.com/embed), `https://seekentropy.substack.com/api/v1/free?nojs=true`, with `email` and `source=embed`. The browser validates the email and posts it directly to Substack in a new tab; Substack handles saving, any further signup steps, and confirmation. No emails are saved in browser storage, no private API key is needed, and the site never simulates a successful subscription. The modal links to the same terms, privacy policy, and information collection notice as Substack's embed. `window.LISALUO_SUBSCRIPTION` in `content.js` holds the public form configuration.

## Previewing locally

From this directory, run:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Publishing with GitHub Pages

Repository: https://github.com/luoser/lisaluo-site.

In Settings → Pages, select **Deploy from a branch**, branch `main`, folder `/(root)`. `.nojekyll` serves the static files directly; no build step is required. Future pushes to `main` publish updates.

The initial Pages address is https://luoser.github.io/lisaluo-site/. To use lisaluo.com, set the custom domain in Pages settings, configure DNS at the domain provider, and enable HTTPS after the certificate is available. Private-repository Pages hosting requires a qualifying GitHub plan.

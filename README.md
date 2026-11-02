# lisaluo.com

A dependency-free static site designed for GitHub Pages.

## Editing the writing

Edit `content.js`, then run `node scripts/prerender.mjs` and commit the source, updated `index.html`, and generated `share/` files. This updates the real HTML feed and page-specific link previews. The authoring command requires Python 3 with Pillow and Courier New (override the font path with `LISALUO_CARD_FONT`); the deployed site still has no dependencies. Run it after editing the shared HTML template, too, so share pages receive modal, metadata, and asset-version changes. `node scripts/prerender.mjs --check` verifies the feed and share outputs match the source. `window.LISALUO_HOME_PAGES` holds the home intro cards; `window.LISALUO_POEMS` preserves the full poem library. The words tab is temporarily removed, so only home is visible and old `#poetry` links return to `#home`. The three-short-poem selection remains in `window.LISALUO_PAGES`; restoring a bottom navigation link with `href="#poetry"` and `data-feed-tab="poetry"` makes it available again. The scroll tutorial appears on the first visit to the feed.

Each writing array entry is one line, and an empty entry creates a stanza break. Each card fills one screen. The feed snaps one page at a time; `vv`, keyboard arrows, and Page Up/Down move between pages. The feed automatically loops forever. All poems remain saved in the source but are excluded from the visible feed.

The greeting contains only writing, and the toolbar keeps the lowercase name and centered feed label. The browser and social-preview title is `lisa luo`. Chrome imagery is used for the Open Graph preview; the standalone transparent turtle and its generation prompt remain in `assets/` for future use.

The 2×2 sobriety card is followed by a single screen-centered “no ice cream” counter, starting 10/24/26. Edit their `counters` entries in `content.js` to change labels or reset timestamps. A card with one counter uses the centered single layout, including its exported share image. Each reset is midnight in New York on the specified date, with an explicit UTC offset. The display counts complete elapsed 24-hour days, automatically updates when another day elapses, and catches up when the tab becomes visible again. The counters need no server or saved browser state.

## Sharing

The heart toggles a personal like for the current card: `<3` becomes `[<3]` with a small pop animation. Likes are saved only in that visitor's browser, keyed by feed and card ID, so looping copies share the same state. There are no public counts or server requests. If storage is unavailable, likes last for the current visit. Reduced-motion preferences disable the animation.

The right-hand `->` button opens an image preview and a link to that exact card, such as `/share/home/joy/`. Each current home card has a real HTML URL containing its own Open Graph/Twitter metadata and a 1200×630 black-on-white Courier image. Opening the URL loads the same looping feed at the selected card; old `#home/joy` links still work. Without JavaScript, the selected card comes first in the finite feed. Share pages have matching canonical and Open Graph URLs so preview crawlers identify each one separately. They use `noindex, follow` and stay out of the sitemap to avoid indexing duplicate copies of the feed. The homepage retains its chrome flower-and-turtle preview.

Visitors can copy the link or save the portrait PNG. Browsers with native sharing also show a share-image button, or a share-link button if file sharing is unsupported. Cancelling a native share has no other effect. Both image formats use `lisaluo.com` in the top-left. The downloaded image preserves line breaks and has no URL footer; the page URL stays in the share dialog and native-share payload. Downloaded counter images use current day counts and reset dates; static OG images show reset dates only, so cached previews never show stale day totals. OG image filenames include a content hash to refresh image caches after edits. Links use the current site origin and base path, so local previews produce localhost links and the deployed website produces public links. No content is uploaded to an image service.

The `[..]` action opens X's composer in a new tab with `@luoser hiii <3` prefilled. The visitor can edit and post their message on X.

## Email signup

`[+]` opens the lowercase, monospace “seek entropy” modal. It subscribes to Seek Entropy using the public native HTML form action in [Substack's own signup embed](https://seekentropy.substack.com/embed), `https://seekentropy.substack.com/api/v1/free?nojs=true`, with `email` and `source=embed`. The browser validates the email and posts it directly to Substack in a new tab; Substack handles saving, any further signup steps, and confirmation. No emails are saved in browser storage, no private API key is needed, and the site never simulates a successful subscription. The modal links to the same terms, privacy policy, and information collection notice as Substack's embed. `window.LISALUO_SUBSCRIPTION` in `content.js` holds the public form configuration.

## Search and link previews

The favicon is a transparent chrome orbit-heart charm, exported as 32px/48px PNGs and a multi-size ICO. `assets/favicon-orbit-heart-master.png` and its prompt preserve the built-in imagegen output. To regenerate the small icon files, run `python3 scripts/render-favicon.py` with Pillow installed. The original `favicon.svg` remains available as an alternative.

The homepage is the canonical indexable URL: `https://lisaluo.com/`. Feed fragments are reading positions, and generated share pages are alternate views of the same feed. The sitemap and profile structured data use the homepage URL; each share page has its own canonical URL, `og:url`, and image, with `noindex, follow` to keep it out of search results. `robots.txt` allows crawling and points to the sitemap. No analytics or additional tracking is installed.

The initial HTML contains all home cards, including the moodsearch link. JavaScript enhances those cards into the looping feed; without JavaScript the same writing remains readable in a finite scroll. Counter fallbacks show reset dates, with current day totals added by JavaScript. Excluded poems are not added to the static feed or sitemap.

The JSON-LD in `index.html` identifies Lisa Luo, her role at moodsearch, and her authorship of Seek Entropy. Update it and the search description if those facts change. This supports standard search and machine understanding; it does not guarantee rankings, indexing, or AI citations. There is no special AI-only copy or schema.

Open Graph and Twitter card tags on the homepage share `social-card-chrome-v1.png`, a 1732×908 image of a chrome wilted flower and turtle surrounded by white space, without text. The built-in image generator created the composition; `assets/social-card-chrome-v1.prompt.txt` preserves the final prompt. Both metadata sets use the same absolute URL and descriptive alt text; the Open Graph dimensions match the actual file. Use a new versioned filename when replacing it to distinguish the asset from previously cached social previews. The original text-based `social-card.png` and its optional Pillow generator in `scripts/render-social-card.py` remain available as an alternative, but are not referenced by the current preview metadata.

After launch, verify the domain in Google Search Console and Bing Webmaster Tools and submit `https://lisaluo.com/sitemap.xml`. Account verification must be completed in those services; the repository does not contain verification tokens.

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

## Security policy

The homepage and generated share pages carry an early HTML Content Security Policy. Scripts and styles must come from this site; images can also use data URLs for local share previews. The policy blocks embedded objects, background network connections, and unapproved form destinations. The subscription form can post only to Seek Entropy/Substack, including redirects on the publication and Substack domains. Same-origin base URLs support the generated share pages. There are no inline executable scripts or `unsafe-inline`/`unsafe-eval` exceptions. Keep the policy before scripts and the generated base element, and run the prerender command after changing it.

GitHub Pages serves the policy through HTML rather than a custom response header. Header-only controls such as `frame-ancestors` are not supplied by this meta policy. Secret scanning and secret-scanning push protection are enabled in repository settings; those settings are managed on GitHub, outside these files.

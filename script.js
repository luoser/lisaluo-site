(() => {
  const poems = Array.isArray(window.LISALUO_PAGES) ? window.LISALUO_PAGES : [];
  const homePages = Array.isArray(window.LISALUO_HOME_PAGES) ? window.LISALUO_HOME_PAGES : [];
  const feeds = { home: homePages, poetry: poems };
  const tabLabels = { home: "home", poetry: "words" };
  const feed = document.getElementById("feed");
  const nextButton = document.getElementById("next-page");
  const shareButton = document.getElementById("share-page");
  const likeButton = document.getElementById("like-page");
  const tutorial = document.getElementById("tutorial");
  const dismissTutorialButton = document.getElementById("dismiss-tutorial");
  const frame = document.querySelector(".feed-frame");
  const tabs = document.querySelectorAll("[data-feed-tab]");
  const tutorialKey = "lisaluo-feed-tutorial-v1";
  const likesKey = "lisaluo-liked-pages-v1";
  let likedPages = new Set();
  let likeAnimation;
  let displayedLikeKey;
  let likePhysicalIndex = 0;
  let lastLikeScrollTop = 0;

  try {
    const saved = JSON.parse(window.localStorage.getItem(likesKey));
    if (Array.isArray(saved)) {
      likedPages = new Set(saved.filter((key) => typeof key === "string"));
    }
  } catch {
    // Likes still work for this visit if storage is blocked or invalid.
  }

  if (!feed || !nextButton || homePages.length === 0) {
    return;
  }

  let activeTab = "home";
  let pages = homePages;
  const positions = {
    home: { index: 0, offset: 0 },
    poetry: { index: 0, offset: 0 },
  };
  let renderedPages = [];
  let pageStarts = [];
  let currentPhysicalIndex = 0;
  let renderVersion = 0;
  let resizeTimer;
  let settleTimer;
  let tutorialVisible = false;
  let tutorialStart = 0;
  let suppressSettle = false;
  let counterNodes = [];
  let counterTimer;
  const resetDateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });

  function updateSobrietyCounters() {
    const now = Date.now();
    counterNodes.forEach(({ resetAt, days }) => {
      const dayCount = String(Math.max(0, Math.floor((now - resetAt) / 86400000)));

      if (days.textContent !== dayCount) {
        days.textContent = dayCount;
      }
    });
  }

  function syncSobrietyCounters() {
    window.clearTimeout(counterTimer);
    updateSobrietyCounters();
    if (!document.hidden && counterNodes.length > 0) {
      const now = Date.now();
      const untilNextDay = Math.min(...counterNodes.map(({ resetAt }) => {
        return now < resetAt ? resetAt - now : 86400000 - ((now - resetAt) % 86400000);
      }));
      counterTimer = window.setTimeout(syncSobrietyCounters, Math.max(1000, Math.min(86400000, untilNextDay)));
    }
  }

  function makeSobrietyGrid(counters) {
    const grid = document.createElement("div");
    grid.className = "sobriety-grid";
    grid.dataset.layout = counters.length === 1 ? "single" : "quadrants";
    // Keep automatic day changes from interrupting screen readers.
    grid.setAttribute("aria-live", "off");

    counters.forEach((counter) => {
      const cell = document.createElement("section");
      const label = document.createElement("h2");
      const total = document.createElement("p");
      const days = document.createElement("span");
      const unit = document.createElement("span");
      const since = document.createElement("p");
      const date = document.createElement("time");
      const resetAt = Date.parse(counter.resetAt);

      cell.className = "sobriety-cell";
      cell.setAttribute("aria-label", counter.label);
      label.className = "sobriety-label";
      label.textContent = counter.label;
      total.className = "sobriety-total";
      days.className = "sobriety-days";
      unit.className = "sobriety-unit";
      unit.textContent = "days";
      since.className = "sobriety-since";
      date.dateTime = counter.resetAt;
      date.textContent = resetDateFormat.format(resetAt);

      total.append(days, " ", unit);
      since.append("since ", date);
      cell.append(label, total, since);
      grid.append(cell);
      counterNodes.push({ resetAt, days });
    });
    return grid;
  }

  function makePage(page, physicalIndex) {
    const article = document.createElement("article");
    const ascii = document.createElement("pre");
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    const writing = document.createElement("pre");
    const logicalIndex = physicalIndex % pages.length;
    const writingText = Array.isArray(page.writing) ? page.writing.join("\n") : String(page.writing || "");

    article.className = "feed-page";
    article.dataset.logicalIndex = String(logicalIndex);
    article.dataset.intro = String(activeTab === "home");
    article.dataset.kind = page.type || "writing";
    article.setAttribute("aria-label", page.title || page.label || "Introduction");

    if (page.type === "sobriety") {
      article.append(makeSobrietyGrid(page.counters));
      return article;
    }

    ascii.className = "page-ascii";
    ascii.setAttribute("aria-hidden", "true");
    ascii.textContent = page.ascii || "";

    copy.className = "page-copy";
    title.className = "page-title";
    title.textContent = page.title || "";

    writing.className = "page-writing";
    writing.textContent = writingText;
    if (page.link && writingText.includes(page.link.text)) {
      const link = document.createElement("a");
      const start = writingText.indexOf(page.link.text);
      link.href = page.link.href;
      link.textContent = page.link.text;
      writing.replaceChildren(
        writingText.slice(0, start),
        link,
        writingText.slice(start + page.link.text.length),
      );
    }

    copy.append(title, writing);
    if (page.image) {
      const image = document.createElement("img");
      image.className = "page-charm";
      image.src = page.image.src;
      image.alt = page.image.alt;
      image.width = page.image.width;
      image.height = page.image.height;
      image.decoding = "async";
      copy.prepend(image);
    }
    article.append(ascii, copy);
    return article;
  }

  function renderFeed() {
    if (renderedPages.length > 0) {
      positions[activeTab] = readingPosition();
    }
    const [requestedTab, encodedPageId] = window.location.hash.slice(1).split("/");
    activeTab = Array.from(tabs).some((tab) => tab.dataset.feedTab === requestedTab) ? requestedTab : "home";
    if (requestedTab === "poetry" && activeTab === "home") {
      window.history.replaceState(window.history.state, "", "#home");
    }
    pages = feeds[activeTab];
    if (encodedPageId && requestedTab === activeTab) {
      let pageId;
      try {
        pageId = decodeURIComponent(encodedPageId);
      } catch {
        pageId = "";
      }
      const index = pages.findIndex((page) => page.id === pageId);
      positions[activeTab] = { index: index >= 0 ? index : 0, offset: 0 };
    }
    const version = ++renderVersion;
    window.clearTimeout(settleTimer);
    window.clearTimeout(resizeTimer);
    window.clearTimeout(counterTimer);
    counterNodes = [];
    tutorial.hidden = true;
    tutorialVisible = false;
    frame.setAttribute("aria-label", `Lisa Luo ${tabLabels[activeTab]} feed`);
    feed.dataset.feed = activeTab;

    tabs.forEach((tab) => {
      const name = tab.dataset.feedTab;
      const selected = name === activeTab;
      tab.textContent = selected ? `[${tabLabels[name]}]` : tabLabels[name];
      if (selected) {
        tab.setAttribute("aria-current", "page");
      } else {
        tab.removeAttribute("aria-current");
      }
    });

    const fragment = document.createDocumentFragment();
    [...pages, ...pages, ...pages].forEach((page, index) => {
      fragment.append(makePage(page, index));
    });
    renderedPages = Array.from(fragment.children);
    feed.replaceChildren(fragment);
    measurePages();
    syncSobrietyCounters();
    const position = positions[activeTab];
    jumpToPhysicalIndex(pages.length + position.index, position.offset);
    requestAnimationFrame(() => {
      if (version === renderVersion && pages.length > 1) {
        showTutorialIfNeeded();
      }
    });
  }

  function pageHeight() {
    return feed.clientHeight;
  }

  function measurePages() {
    pageStarts = renderedPages.map((page) => page.offsetTop);
  }

  function physicalIndexAt(scrollTop = feed.scrollTop) {
    for (let index = pageStarts.length - 1; index > 0; index -= 1) {
      if (scrollTop >= pageStarts[index] - 1) {
        return index;
      }
    }
    return 0;
  }

  function readingPosition() {
    const physicalIndex = physicalIndexAt();
    return {
      index: logicalIndex(physicalIndex),
      offset: Math.max(0, feed.scrollTop - pageStarts[physicalIndex]),
    };
  }

  function logicalIndex(physicalIndex) {
    return ((physicalIndex % pages.length) + pages.length) % pages.length;
  }

  function currentLikeKey() {
    return `${activeTab}/${pages[logicalIndex(likePhysicalIndex)].id}`;
  }

  function syncLikeButton() {
    const key = currentLikeKey();
    if (key !== displayedLikeKey) {
      likeAnimation?.cancel();
      displayedLikeKey = key;
    }
    const liked = likedPages.has(key);
    likeButton.dataset.page = key;
    likeButton.textContent = liked ? "[<3]" : "<3";
    likeButton.setAttribute("aria-pressed", String(liked));
  }

  function jumpToPhysicalIndex(physicalIndex, offset = 0) {
    const version = renderVersion;
    suppressSettle = true;
    feed.style.scrollSnapType = "none";
    const withinPage = Math.min(offset, Math.max(0, renderedPages[physicalIndex].offsetHeight - 1));
    feed.scrollTo({ top: pageStarts[physicalIndex] + withinPage, behavior: "instant" });
    currentPhysicalIndex = physicalIndex;
    positions[activeTab] = { index: logicalIndex(physicalIndex), offset: withinPage };
    likePhysicalIndex = physicalIndex;
    lastLikeScrollTop = feed.scrollTop;
    syncLikeButton();

    requestAnimationFrame(() => {
      if (version !== renderVersion) {
        return;
      }
      feed.style.scrollSnapType = "y mandatory";
      suppressSettle = false;
    });
  }

  function settleLoop() {
    if (suppressSettle) {
      return;
    }

    if (!pageStarts.length) {
      return;
    }

    currentPhysicalIndex = physicalIndexAt();
    const index = logicalIndex(currentPhysicalIndex);

    if (currentPhysicalIndex < pages.length || currentPhysicalIndex >= pages.length * 2) {
      const offset = Math.max(0, feed.scrollTop - pageStarts[currentPhysicalIndex]);
      jumpToPhysicalIndex(pages.length + index, offset);
    }
  }

  function dismissTutorial() {
    if (!tutorialVisible) {
      return;
    }

    tutorial.hidden = true;
    tutorialVisible = false;

    try {
      window.localStorage.setItem(tutorialKey, "seen");
    } catch {
      // The tutorial still works when storage is unavailable.
    }
  }

  function showTutorialIfNeeded() {
    let hasSeenTutorial = false;

    try {
      hasSeenTutorial = window.localStorage.getItem(tutorialKey) === "seen";
    } catch {
      hasSeenTutorial = false;
    }

    if (!hasSeenTutorial) {
      tutorialStart = feed.scrollTop;
      tutorial.hidden = false;
      tutorialVisible = true;
    }
  }

  function scrollByPage(direction) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    let target = physicalIndexAt() + direction;
    if (target < 0 || target >= renderedPages.length) {
      target = pages.length + logicalIndex(target);
    }
    feed.scrollTo({ top: pageStarts[target], behavior });
  }

  feed.addEventListener("scroll", () => {
    if (suppressSettle || !pageStarts.length) {
      return;
    }
    currentPhysicalIndex = physicalIndexAt();
    positions[activeTab] = readingPosition();
    // Follow the incoming page from the first movement, rather than waiting
    // for its top edge to reach the top of the feed.
    likePhysicalIndex = currentPhysicalIndex;
    if (feed.scrollTop > lastLikeScrollTop && feed.scrollTop > pageStarts[currentPhysicalIndex] + 1) {
      likePhysicalIndex = Math.min(currentPhysicalIndex + 1, renderedPages.length - 1);
    }
    lastLikeScrollTop = feed.scrollTop;
    syncLikeButton();

    if (tutorialVisible && Math.abs(feed.scrollTop - tutorialStart) > 12) {
      dismissTutorial();
    }

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleLoop, 120);
  }, { passive: true });

  feed.addEventListener("scrollend", settleLoop);
  nextButton.addEventListener("click", () => scrollByPage(1));
  likeButton.addEventListener("click", () => {
    const key = currentLikeKey();
    const liked = !likedPages.has(key);
    if (liked) {
      likedPages.add(key);
    } else {
      likedPages.delete(key);
    }
    try {
      window.localStorage.setItem(likesKey, JSON.stringify([...likedPages]));
    } catch {
      // Keep the in-memory state when browser storage is unavailable.
    }
    syncLikeButton();
    likeAnimation?.cancel();
    if (liked && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      likeAnimation = likeButton.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.35)", offset: 0.4 },
        { transform: "scale(0.95)", offset: 0.75 },
        { transform: "scale(1)" },
      ], { duration: 320, easing: "ease-out" });
    }
  });
  shareButton.addEventListener("click", () => {
    const page = pages[logicalIndex(physicalIndexAt())];
    window.LISALUO_SHARE.sharePage(page, activeTab);
  });
  dismissTutorialButton.addEventListener("click", dismissTutorial);

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest("a, button, input, textarea, select, [contenteditable]")) {
      return;
    }
    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      dismissTutorial();
      scrollByPage(event.shiftKey && event.key === " " ? -1 : 1);
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      dismissTutorial();
      scrollByPage(-1);
    }
  });

  window.addEventListener("resize", () => {
    const position = { ...positions[activeTab] };
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      measurePages();
      jumpToPhysicalIndex(pages.length + position.index, position.offset);
    }, 100);
  });

  window.addEventListener("hashchange", renderFeed);
  document.addEventListener("visibilitychange", syncSobrietyCounters);
  renderFeed();
})();

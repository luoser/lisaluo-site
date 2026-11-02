(() => {
  const dialog = document.getElementById("share-dialog");
  const nativeButton = document.getElementById("native-share-page");
  const preview = document.getElementById("share-preview");
  const linkField = document.getElementById("share-link");
  const saveLink = document.getElementById("save-share-image");
  const status = document.getElementById("share-status");
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "2-digit",
  });
  let sharing = false;
  let currentShare;

  function pageUrl(page, tab) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = `${tab}/${encodeURIComponent(page.id)}`;
    return url.href;
  }

  function wrapLines(context, text, width) {
    return text.split("\n").flatMap((paragraph) => {
      if (!paragraph) return [""];
      const lines = [];
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > width) {
          lines.push(line);
          line = "";
        }
        // Also handle long URLs or slash-prefixed poem titles without clipping.
        for (const character of Array.from((line ? " " : "") + word)) {
          if (context.measureText(line + character).width > width && line) {
            lines.push(line);
            line = "";
          }
          line += character;
        }
      }
      lines.push(line);
      return lines;
    });
  }

  function drawLines(context, lines, x, y, lineHeight) {
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  }

  function counterSnapshot(page) {
    const now = Date.now();
    return page.counters.map((counter) => ({
      label: counter.label,
      days: Math.max(0, Math.floor((now - Date.parse(counter.resetAt)) / 86400000)),
      since: dateFormat.format(Date.parse(counter.resetAt)),
    }));
  }

  function createImage(page, url, counters) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const margin = 96;
    const width = canvas.width - margin * 2;
    const text = Array.isArray(page.writing) ? page.writing.join("\n") : String(page.writing || "");
    context.font = '48px "Courier New", Courier, monospace';
    const lines = wrapLines(context, text, width);
    context.font = '40px "Courier New", Courier, monospace';
    const titleLines = page.title ? wrapLines(context, page.title, width) : [];
    const textHeight = lines.length * 70;
    const titleHeight = titleLines.length ? titleLines.length * 58 + 40 : 0;
    canvas.height = Math.max(1920, textHeight + titleHeight + 560);

    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000";
    context.textBaseline = "top";
    context.font = '30px "Courier New", Courier, monospace';
    context.fillText("lisa luo", margin, 90);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(margin, 158);
    context.lineTo(canvas.width - margin, 158);
    context.stroke();

    if (counters) {
      const top = 420;
      const cellWidth = width / 2;
      const cellHeight = 460;
      context.beginPath();
      context.moveTo(canvas.width / 2, top);
      context.lineTo(canvas.width / 2, top + cellHeight * 2);
      context.moveTo(margin, top + cellHeight);
      context.lineTo(canvas.width - margin, top + cellHeight);
      context.stroke();
      context.textAlign = "center";
      counters.forEach((counter, index) => {
        const x = margin + cellWidth * ((index % 2) + 0.5);
        const y = top + Math.floor(index / 2) * cellHeight;
        context.font = '32px "Courier New", Courier, monospace';
        context.fillText(counter.label, x, y + 80);
        context.font = '100px "Courier New", Courier, monospace';
        context.fillText(String(counter.days), x, y + 155);
        context.font = '30px "Courier New", Courier, monospace';
        context.fillText("days", x, y + 275);
        context.font = '25px "Courier New", Courier, monospace';
        context.fillText(`since ${counter.since}`, x, y + 350);
      });
      context.textAlign = "left";
    } else {
      const top = titleLines.length ? 270 : Math.max(270, (canvas.height - textHeight) / 2);
      context.font = '40px "Courier New", Courier, monospace';
      drawLines(context, titleLines, margin, top, 58);
      context.font = '48px "Courier New", Courier, monospace';
      drawLines(context, lines, margin, top + titleHeight, 70);
    }

    const footerY = canvas.height - 200;
    context.beginPath();
    context.moveTo(margin, footerY);
    context.lineTo(canvas.width - margin, footerY);
    context.stroke();
    context.font = '25px "Courier New", Courier, monospace';
    const displayUrl = url.replace(/^https?:\/\//, "");
    drawLines(context, wrapLines(context, displayUrl, width), margin, footerY + 42, 35);

    // Encode locally for both the save link and the device's native share sheet.
    const dataUrl = canvas.toDataURL("image/png");
    const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (character) => character.charCodeAt(0));
    const filename = `lisaluo-${page.id}.png`;
    const file = typeof File === "function" ? new File([bytes], filename, { type: "image/png" }) : null;
    return { dataUrl, filename, file };
  }

  function openShareDialog(share) {
    currentShare = share;
    linkField.value = share.url;
    status.textContent = "";
    nativeButton.hidden = typeof navigator.share !== "function";
    nativeButton.textContent = share.payload.files ? "[ share image ]" : "[ share link ]";
    preview.hidden = !share.image;
    saveLink.hidden = !share.image;
    if (share.image) {
      preview.src = share.image.dataUrl;
      saveLink.href = share.image.dataUrl;
      saveLink.download = share.image.filename;
    } else {
      preview.removeAttribute("src");
      saveLink.removeAttribute("href");
    }
    if (!dialog.open) dialog.showModal();
  }

  function sharePage(page, tab) {
    const url = pageUrl(page, tab);
    const counters = page.type === "sobriety" ? counterSnapshot(page) : null;
    const text = counters
      ? counters.map((counter) => `${counter.label}: ${counter.days} days (since ${counter.since})`).join("\n")
      : (Array.isArray(page.writing) ? page.writing.join("\n") : String(page.writing || ""));
    const payload = { title: page.title || "lisa luo", text, url };
    let image = null;
    try {
      image = createImage(page, url, counters);
    } catch {
      // Link sharing still works if this browser cannot create a PNG.
    }
    try {
      if (image?.file && typeof navigator.canShare === "function" && navigator.canShare({ files: [image.file] })) {
        payload.files = [image.file];
      }
    } catch {
      // Some browsers restrict file-sharing capability checks.
    }
    openShareDialog({ url, image, payload });
  }

  nativeButton.addEventListener("click", async () => {
    if (!currentShare || sharing) return;
    sharing = true;
    nativeButton.disabled = true;
    try {
      await navigator.share(currentShare.payload);
    } catch (error) {
      if (error.name !== "AbortError") {
        status.textContent = "choose copy link or save image below";
      }
    } finally {
      sharing = false;
      nativeButton.disabled = false;
    }
  });

  document.getElementById("copy-share-link").addEventListener("click", async () => {
    if (!currentShare) return;
    try {
      await navigator.clipboard.writeText(currentShare.url);
      status.textContent = "link copied";
    } catch {
      linkField.focus();
      linkField.select();
      status.textContent = "select and copy the link above";
    }
  });

  window.LISALUO_SHARE = { sharePage };
})();

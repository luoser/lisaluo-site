(() => {
  const trigger = document.getElementById("subscribe-updates");
  const dialog = document.getElementById("subscribe-dialog");
  const form = document.getElementById("subscribe-form");
  const email = document.getElementById("subscribe-email");
  const submit = document.getElementById("subscribe-submit");
  const status = document.getElementById("subscribe-status");
  const settings = window.LISALUO_SUBSCRIPTION;
  let signupEnabled = false;

  if (settings?.action) {
    try {
      const action = new URL(settings.action);
      if (action.protocol === "https:") {
        form.action = action.href;
        form.method = "post";
        email.name = settings.emailField || "email";
        submit.disabled = false;
        signupEnabled = true;
        status.textContent = "opens substack to finish subscribing.";
      }
    } catch {
      // Leave signup unavailable until a real public mailing-list form is configured.
    }
  }

  trigger.addEventListener("click", () => {
    if (!dialog.open) dialog.showModal();
  });

  form.addEventListener("submit", (event) => {
    if (!signupEnabled) {
      event.preventDefault();
      status.textContent = "signups are coming soon.";
    }
    // The configured mailing service handles saving and confirming subscriptions.
    // Never store emails in the browser or claim a subscription succeeded here.
  });
})();

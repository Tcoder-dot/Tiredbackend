export const adminAdsDashboardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="referrer" content="same-origin">
  <title>FLOATE Ads Admin</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #17211b; background: #f5f7f4; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { background: #123f16; color: white; padding: 20px max(20px, calc((100% - 1120px) / 2)); display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    header h1 { font-size: 19px; margin: 0; }
    header p { margin: 4px 0 0; color: #d7e8d8; font-size: 13px; }
    main { max-width: 1120px; margin: 28px auto; padding: 0 20px; }
    .panel { background: white; border: 1px solid #dfe7df; border-radius: 14px; padding: 20px; box-shadow: 0 3px 12px #16371b0a; }
    .auth { max-width: 420px; margin: 9vh auto; }
    h2 { font-size: 18px; margin: 0 0 8px; }
    .muted { color: #607066; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    label { display: block; color: #46564a; font-size: 12px; font-weight: 700; }
    input, textarea, select { width: 100%; margin-top: 6px; border: 1px solid #cbd6cc; border-radius: 8px; padding: 10px; font: inherit; font-size: 14px; background: white; }
    textarea { min-height: 78px; resize: vertical; }
    .wide { grid-column: 1 / -1; }
    button { border: 0; border-radius: 8px; background: #14531b; color: white; padding: 10px 14px; font: inherit; font-weight: 700; cursor: pointer; }
    button.secondary { background: #e9f0e9; color: #234629; }
    button.danger { background: #b42318; }
    button:disabled { opacity: .6; cursor: wait; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 16px; }
    .status { min-height: 20px; margin: 12px 0 0; font-size: 13px; }
    .status.error { color: #b42318; }
    .status.success { color: #16703b; }
    .campaigns { margin-top: 22px; }
    .campaigns-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .campaign { display: grid; grid-template-columns: 130px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid #e6ece6; }
    .campaign img { width: 130px; aspect-ratio: 4 / 3; object-fit: cover; background: #edf2ed; border-radius: 8px; }
    .image-preview { width: 240px; aspect-ratio: 4 / 3; object-fit: cover; border: 1px solid #dfe7df; border-radius: 8px; background: #edf2ed; }
    .campaign h3 { margin: 0; font-size: 15px; }
    .campaign p { margin: 6px 0; color: #607066; font-size: 13px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 800; border-radius: 99px; padding: 3px 8px; background: #e7f5e9; color: #17662a; }
    .badge.PAUSED, .badge.DRAFT, .badge.PENDING_DESIGN { background: #fff3d6; color: #855b00; }
    .badge.EXPIRED { background: #f0f0f0; color: #555; }
    [hidden] { display: none !important; }
    @media (max-width: 620px) { .grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } .campaign { grid-template-columns: 88px 1fr; gap: 10px; } .campaign img { width: 88px; } }
  </style>
</head>
<body>
  <header>
    <div><h1>FLOATE · Ads Admin</h1><p>Manage sponsored banner campaigns</p></div>
    <button id="logout" class="secondary" hidden>Lock dashboard</button>
  </header>
  <main>
    <section id="login" class="panel auth">
      <h2>Admin access</h2>
      <p class="muted">Enter the backend admin API key to manage ads.</p>
      <form id="login-form">
        <label>Admin API key<input id="admin-key" type="password" autocomplete="current-password" required></label>
        <div class="actions"><button type="submit">Unlock ads dashboard</button></div>
      </form>
      <p id="login-status" class="status" role="status"></p>
    </section>

    <section id="dashboard" hidden>
      <section class="panel">
        <h2 id="form-title">Create campaign</h2>
        <form id="campaign-form">
          <div class="grid">
            <label>Merchant / brand<input name="merchantName" maxlength="120" required></label>
            <label>Headline<input name="headline" maxlength="180" required></label>
            <label class="wide">Description<textarea name="description" maxlength="600"></textarea></label>
            <label>CTA text<input name="ctaText" maxlength="60" value="View offer"></label>
            <label>Category / ad type<input name="adType" maxlength="80" value="HERO_BANNER"></label>
            <label class="wide">Banner image file<input id="banner-image" name="bannerImage" type="file" accept="image/jpeg,image/png,image/webp" required><span id="image-help" class="muted">JPG, PNG, or WebP · maximum 8 MB. Cropped to 1200 x 900 (4:3) to match the storefront image frame.</span></label>
            <div class="wide"><img id="image-preview" class="image-preview" alt="Selected banner preview" hidden></div>
            <label class="wide">Target URL<input name="targetUrl" maxlength="2048" placeholder="/search or https://..." required></label>
            <label>Target cities<input name="targetCities" placeholder="Lagos, Onitsha, Aba"></label>
            <label>Target categories<input name="targetCategories" placeholder="Phones, Fashion"></label>
            <label class="wide">Keywords<input name="keywords" placeholder="phones, gadgets, offers"></label>
            <label>Status<select name="status"><option value="ACTIVE">ACTIVE — live</option><option value="PAUSED">PAUSED</option><option value="DRAFT">DRAFT</option><option value="EXPIRED">EXPIRED</option></select></label>
          </div>
          <p id="form-status" class="status" role="status"></p>
          <div class="actions">
            <button id="save-button" type="submit">Create campaign</button>
            <button id="cancel-edit" class="secondary" type="button" hidden>Cancel edit</button>
          </div>
        </form>
      </section>
      <section class="panel campaigns">
        <div class="campaigns-head"><div><h2>Campaigns</h2><p id="campaign-count" class="muted"></p></div><button id="refresh" class="secondary" type="button">Refresh</button></div>
        <div id="campaign-list" class="muted">Loading campaigns…</div>
      </section>
    </section>
  </main>
  <script>
    (() => {
      const api = "/api/admin/ads";
      const keySlot = "floate_ads_admin_key";
      const login = document.getElementById("login");
      const dashboard = document.getElementById("dashboard");
      const loginStatus = document.getElementById("login-status");
      const formStatus = document.getElementById("form-status");
      const form = document.getElementById("campaign-form");
      const list = document.getElementById("campaign-list");
      const fields = ["merchantName", "headline", "description", "ctaText", "adType", "targetUrl", "targetCities", "targetCategories", "keywords", "status"];
      let adminKey = sessionStorage.getItem(keySlot) || "";
      let editingId = "";
      let currentImageUrl = "";
      let campaigns = [];
      const imageInput = document.getElementById("banner-image");
      const imagePreview = document.getElementById("image-preview");
      const imageHelp = document.getElementById("image-help");

      const setStatus = (node, text, isError = false) => {
        node.textContent = text;
        node.className = "status" + (text ? (isError ? " error" : " success") : "");
      };
      const setAuthed = (value) => {
        login.hidden = value;
        dashboard.hidden = !value;
        document.getElementById("logout").hidden = !value;
      };
      const splitList = (value) => Array.isArray(value) ? value.join(", ") : (value || "");
      const request = async (path = api, options = {}) => {
        const response = await fetch(path, {
          ...options,
          headers: { Accept: "application/json", "Content-Type": "application/json", "x-admin-api-key": adminKey, ...(options.headers || {}) }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          if (response.status === 401) lock();
          throw new Error(result.error || "Request failed (" + response.status + ").");
        }
        return result;
      };
      const uploadBannerImage = async (file) => {
        const response = await fetch(api + "/image", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": file.type, "x-admin-api-key": adminKey },
          body: file
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          if (response.status === 401) lock();
          throw new Error(result.error || "Banner image upload failed (" + response.status + ").");
        }
        return result.imageUrl;
      };
      const lock = () => {
        adminKey = "";
        sessionStorage.removeItem(keySlot);
        setAuthed(false);
      };
      const renderCampaigns = () => {
        list.replaceChildren();
        document.getElementById("campaign-count").textContent =
          campaigns.length + " total · " + campaigns.filter((campaign) => campaign.status === "ACTIVE").length + " live";
        if (!campaigns.length) {
          list.textContent = "No campaigns yet. Create one above.";
          return;
        }
        for (const campaign of campaigns) {
          const row = document.createElement("article");
          row.className = "campaign";
          const image = document.createElement("img");
          image.src = campaign.designedBannerUrl || "";
          image.alt = "";
          image.referrerPolicy = "no-referrer";
          image.onerror = () => { image.hidden = true; };
          row.append(image);
          const content = document.createElement("div");
          const heading = document.createElement("h3");
          heading.textContent = campaign.headline || "Sponsored placement";
          const badge = document.createElement("span");
          badge.className = "badge " + campaign.status;
          badge.textContent = campaign.status;
          const merchant = document.createElement("p");
          merchant.textContent = (campaign.merchantName || "Floate Partner") + " · " + (campaign.adType || "Sponsored");
          const description = document.createElement("p");
          description.textContent = campaign.description || "";
          const stats = document.createElement("p");
          stats.textContent = "Views: " + Number(campaign.impressions || 0) + " · Clicks: " + Number(campaign.clicks || 0);
          const actions = document.createElement("div");
          actions.className = "actions";
          const edit = document.createElement("button");
          edit.type = "button";
          edit.className = "secondary";
          edit.textContent = "Edit";
          edit.addEventListener("click", () => beginEdit(campaign));
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "danger";
          remove.textContent = "Delete";
          remove.addEventListener("click", () => deleteCampaign(campaign));
          actions.append(edit, remove);
          content.append(heading, badge, merchant, description, stats, actions);
          row.append(content);
          list.append(row);
        }
      };
      const loadCampaigns = async () => {
        list.textContent = "Loading campaigns…";
        try {
          const result = await request();
          campaigns = result.ads;
          renderCampaigns();
        } catch (error) {
          if (dashboard.hidden) setStatus(loginStatus, error.message || "Admin access is no longer valid.", true);
          list.textContent = error.message || "Unable to load campaigns.";
        }
      };
      const verifyKey = async (key) => {
        adminKey = key;
        await request();
        sessionStorage.setItem(keySlot, key);
        setAuthed(true);
        setStatus(loginStatus, "");
        await loadCampaigns();
      };
      const resetForm = () => {
        editingId = "";
        currentImageUrl = "";
        form.reset();
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
        imageInput.required = true;
        imageHelp.textContent = "JPG, PNG, or WebP · maximum 8 MB. Cropped to 1200 x 900 (4:3) to match the storefront image frame.";
        form.elements.namedItem("ctaText").value = "View offer";
        form.elements.namedItem("adType").value = "HERO_BANNER";
        form.elements.namedItem("status").value = "ACTIVE";
        document.getElementById("form-title").textContent = "Create campaign";
        document.getElementById("save-button").textContent = "Create campaign";
        document.getElementById("cancel-edit").hidden = true;
        setStatus(formStatus, "");
      };
      const beginEdit = (campaign) => {
        editingId = campaign.id;
        currentImageUrl = campaign.designedBannerUrl || campaign.rawImageUrl || "";
        imageInput.value = "";
        imageInput.required = false;
        imagePreview.src = currentImageUrl;
        imagePreview.hidden = !currentImageUrl;
        imageHelp.textContent = currentImageUrl ? "Choose a new image to replace the current banner. It will be cropped to 1200 x 900 (4:3)." : "JPG, PNG, or WebP · maximum 8 MB. Cropped to 1200 x 900 (4:3) to match the storefront image frame.";
        for (const field of fields) {
          const value = campaign[field] ?? (field === "targetCities" ? campaign.targetLocation : field === "targetCategories" ? campaign.targetCategory : "");
          form.elements.namedItem(field).value = ["targetCities", "targetCategories", "keywords"].includes(field) ? splitList(value) : value;
        }
        document.getElementById("form-title").textContent = "Edit campaign";
        document.getElementById("save-button").textContent = "Save changes";
        document.getElementById("cancel-edit").hidden = false;
        setStatus(formStatus, "");
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      const deleteCampaign = async (campaign) => {
        if (!window.confirm("Delete the campaign “" + campaign.headline + "”?")) return;
        try {
          await request(api + "/" + encodeURIComponent(campaign.id), { method: "DELETE" });
          campaigns = campaigns.filter((item) => item.id !== campaign.id);
          renderCampaigns();
          setStatus(formStatus, "Campaign deleted.");
        } catch (error) {
          setStatus(formStatus, error.message || "Unable to delete campaign.", true);
        }
      };

      document.getElementById("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus(loginStatus, "Checking access…");
        try {
          await verifyKey(document.getElementById("admin-key").value.trim());
        } catch (error) {
          lock();
          setStatus(loginStatus, error.message || "Admin access could not be verified.", true);
        }
      });
      document.getElementById("logout").addEventListener("click", lock);
      document.getElementById("refresh").addEventListener("click", loadCampaigns);
      document.getElementById("cancel-edit").addEventListener("click", resetForm);
      imageInput.addEventListener("change", () => {
        const file = imageInput.files && imageInput.files[0];
        if (file) {
          imagePreview.src = URL.createObjectURL(file);
          imagePreview.hidden = false;
        } else {
          imagePreview.src = currentImageUrl;
          imagePreview.hidden = !currentImageUrl;
        }
      });
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());
        const imageFile = imageInput.files && imageInput.files[0];
        delete payload.bannerImage;
        if (imageFile) {
          if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
            setStatus(formStatus, "Choose a JPG, PNG, or WebP image.", true);
            return;
          }
          if (imageFile.size > 8 * 1024 * 1024) {
            setStatus(formStatus, "Image must be 8 MB or smaller.", true);
            return;
          }
        } else if (!currentImageUrl) {
          setStatus(formStatus, "Choose a banner image file.", true);
          return;
        }
        for (const field of ["targetCities", "targetCategories", "keywords"]) {
          payload[field] = String(payload[field] || "").split(/[,;|\\n]/).map((part) => part.trim()).filter(Boolean);
        }
        const path = editingId ? api + "/" + encodeURIComponent(editingId) : api;
        const method = editingId ? "PUT" : "POST";
        const wasEditing = Boolean(editingId);
        const button = document.getElementById("save-button");
        button.disabled = true;
        setStatus(formStatus, "Saving campaign…");
        try {
          payload.designedBannerUrl = imageFile ? await uploadBannerImage(imageFile) : currentImageUrl;
          payload.rawImageUrl = payload.designedBannerUrl;
          await request(path, { method, body: JSON.stringify(payload) });
          resetForm();
          setStatus(formStatus, wasEditing ? "Campaign updated." : "Campaign created.");
          await loadCampaigns();
        } catch (error) {
          setStatus(formStatus, error.message || "Unable to save campaign.", true);
        } finally {
          button.disabled = false;
        }
      });
      if (adminKey) {
        verifyKey(adminKey).catch((error) => {
          lock();
          setStatus(loginStatus, error.message || "Admin access could not be verified.", true);
        });
      }
    })();
  </script>
</body>
</html>`;

/* FELab — phòng lab Git/GitHub cho nhóm làm web HTML, CSS, JavaScript */
(function () {
  "use strict";

  const global = window;
  const { GitSim, TEAM, TEAM_IDS, short } = global.RepoEngine;
  const DATA = global.RepoData;
  const SCENARIOS = global.RepoScenarios;
  const app = document.getElementById("app");
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const STORE_KEY = "felab.progress.v1";
  const state = {
    view: "home",
    scenarioId: null,
    tab: "terminal",
    ghTab: "issues",
    role: "minh",
    hints: 0,
    drawer: false,
    editor: { path: null, dirty: false },
    selectedCommit: null,
    solutionOpen: false,
    solutionBusy: false,
    solutionToken: 0,
    results: [],
    completed: {},
    lastId: null
  };
  let sim = new GitSim();
  let current = null;
  let terminal = { entries: [], history: [], cursor: 0 };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function multi(text) {
    return esc(text).replace(/\n/g, "<br>");
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.completed && typeof parsed.completed === "object") state.completed = parsed.completed;
      if (parsed.lastId) state.lastId = parsed.lastId;
    } catch (error) { /* bộ nhớ trình duyệt có thể bị chặn */ }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ completed: state.completed, lastId: state.lastId }));
    } catch (error) { /* bỏ qua khi chế độ riêng tư */ }
  }

  function completedCount() {
    return SCENARIOS.filter((scenario) => state.completed[scenario.id]).length;
  }

  function scenarioById(id) {
    return SCENARIOS.find((scenario) => scenario.id === id) || null;
  }

  function moduleById(id) {
    return DATA.MODULES.find((module) => module.id === id) || null;
  }

  function roleName(id) {
    return TEAM[id] ? TEAM[id].short : id;
  }

  function toast(message, tone) {
    const root = document.getElementById("toastRoot");
    const node = document.createElement("div");
    node.className = "toast toast-" + (tone || "info");
    node.setAttribute("role", "status");
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => { node.classList.add("leaving"); }, 3200);
    setTimeout(() => { node.remove(); }, 3700);
  }

  function closeModal() {
    const root = document.getElementById("modalRoot");
    if (root) root.textContent = "";
  }

  function showModal(opts) {
    const root = document.getElementById("modalRoot");
    root.innerHTML = "";
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<h2 id="modalTitle">' + esc(opts.title) + "</h2>" +
      '<div class="modal-body">' + (opts.body || "") + "</div>" +
      '<div class="modal-actions">' +
      '<button type="button" class="btn ghost" data-modal-cancel>Huỷ</button>' +
      '<button type="button" class="btn ' + (opts.danger ? "danger" : "primary") + '" data-modal-ok>' + esc(opts.confirmLabel || "Đồng ý") + "</button>" +
      "</div></div>";
    root.appendChild(overlay);
    const ok = $("[data-modal-ok]", overlay);
    const cancel = $("[data-modal-cancel]", overlay);
    const finish = () => closeModal();
    cancel.addEventListener("click", finish);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) finish(); });
    document.addEventListener("keydown", function onKey(event) {
      if (event.key === "Escape") { finish(); document.removeEventListener("keydown", onKey); }
    });
    ok.addEventListener("click", () => {
      const input = $("[data-modal-input]", overlay);
      const value = input ? input.value : null;
      closeModal();
      if (opts.onConfirm) opts.onConfirm(value);
    });
    if (opts.input) {
      const field = $("[data-modal-input]", overlay);
      if (field) { field.focus(); field.select(); }
    } else {
      ok.focus();
    }
  }

  function confirmDialog(title, body, onConfirm, label) {
    showModal({ title, body: "<p>" + esc(body) + "</p>", onConfirm, confirmLabel: label || "Tiếp tục" });
  }

  function promptDialog(title, label, placeholder, onConfirm) {
    showModal({
      title,
      body: '<label class="field"><span>' + esc(label) + '</span><input data-modal-input type="text" placeholder="' + esc(placeholder) + '"></label>',
      input: true,
      confirmLabel: "Tạo",
      onConfirm
    });
  }

  /* ---------------- Khung chung ---------------- */

  function renderTopbar() {
    const select = $("#roleSelect");
    if (select) select.value = state.role;
    const progress = $("#globalProgress");
    if (progress) {
      progress.textContent = "Tiến độ " + completedCount() + "/" + SCENARIOS.length;
      progress.setAttribute("aria-label", "Đã hoàn thành " + completedCount() + " trên " + SCENARIOS.length + " kịch bản");
    }
    $$(".topnav a").forEach((link) => {
      const target = link.getAttribute("href");
      const active = (state.view === "home" && target === "#/") ||
        (state.view === "conventions" && target === "#/conventions") ||
        (state.view === "cheats" && target === "#/cheats") ||
        (state.view === "lab" && target === "#/");
      link.classList.toggle("active", active);
      if (state.view === "lab") link.classList.remove("active");
    });
    document.body.dataset.view = state.view;
  }

  function navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function cancelSolution() {
    state.solutionToken += 1;
    state.solutionBusy = false;
  }

  function route() {
    const hash = location.hash || "#/";
    const lab = hash.match(/^#\/lab\/(s\d{2})/);
    if (lab && scenarioById(lab[1])) {
      openLab(lab[1]);
      return;
    }
    cancelSolution();
    if (hash.indexOf("#/conventions") === 0) {
      state.view = "conventions";
      closeDrawer();
      renderApp();
      return;
    }
    if (hash.indexOf("#/cheats") === 0) {
      state.view = "cheats";
      closeDrawer();
      renderApp();
      return;
    }
    state.view = "home";
    closeDrawer();
    renderApp();
  }

  /* ---------------- Trang chủ ---------------- */

  function moduleScenarios(moduleId) {
    return SCENARIOS.filter((scenario) => scenario.module === moduleId);
  }

  function homeHTML() {
    const done = completedCount();
    const totalSteps = SCENARIOS.reduce((sum, scenario) => sum + scenario.tasks.length, 0);
    const totalChecks = SCENARIOS.reduce((sum, scenario) => sum + scenario.checks.length, 0);
    const teamCards = TEAM_IDS.map((id) => {
      const person = DATA.TEAM_DETAILS[id];
      return (
        '<article class="team-card" style="--team:' + person.color + '">' +
        '<div class="team-head"><span class="avatar">' + esc(person.avatar) + "</span>" +
        "<div><h3>" + esc(person.name) + "</h3><p>" + esc(person.role) + " · " + esc(person.email) + "</p></div></div>" +
        '<p class="team-focus">' + esc(person.focus) + "</p>" +
        '<ul class="pill-list">' + person.permissions.map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul>" +
        '<div class="team-owns"><span>Phụ trách</span> ' + person.owns.map((item) => "<code>" + esc(item) + "</code>").join(" ") + "</div>" +
        '<button class="btn small ghost" data-role-switch="' + id + '">' + (state.role === id ? "Đang thao tác vai này" : "Nhận vai " + esc(person.short)) + "</button>" +
        "</article>"
      );
    }).join("");

    const raciRows = DATA.RACI.map((row) =>
      "<tr><td>" + esc(row.work) + "</td><td>" + esc(row.minh) + "</td><td>" + esc(row.lan) + "</td><td>" + esc(row.huy) + "</td><td>" + esc(row.note) + "</td></tr>"
    ).join("");

    const modulesHTML = DATA.MODULES.map((module) => {
      const cards = moduleScenarios(module.id).map((scenario) => {
        const isDone = !!state.completed[scenario.id];
        return (
          '<article class="scenario-card' + (isDone ? " done" : "") + '" style="--module:' + module.color + '">' +
          '<div class="card-top"><span class="scenario-number">' + String(scenario.order).padStart(2, "0") + "</span>" +
          '<span class="pill ' + (isDone ? "pill-done" : "pill-role") + '">' + (isDone ? "Đã hoàn thành" : esc(TEAM[scenario.role].short)) + "</span></div>" +
          "<h4>" + esc(scenario.title) + "</h4>" +
          '<p class="scenario-brief">' + esc(scenario.brief.split(". ")[0]) + ".</p>" +
          '<div class="card-meta"><span>' + scenario.tasks.length + " bước</span><span>" + scenario.minutes + " phút</span><span>" + esc(scenario.level) + "</span></div>" +
          '<button class="btn small primary" data-open-scenario="' + scenario.id + '">Mở kịch bản</button>' +
          "</article>"
        );
      }).join("");
      return (
        '<section class="module-block" id="module-' + module.id + '">' +
        '<div class="module-head"><span class="module-index">0' + module.order + "</span>" +
        "<div><h3>" + esc(module.title) + "</h3><p>" + esc(module.summary) + "</p></div>" +
        '<span class="pill" style="--module:' + module.color + '">' + moduleScenarios(module.id).length + " kịch bản</span></div>" +
        '<div class="scenario-grid">' + cards + "</div></section>"
      );
    }).join("");

    const dod = DATA.SPRINT.definitionOfDone.map((item, index) => "<li><span>" + (index + 1) + "</span>" + esc(item) + "</li>").join("");
    const branches = ["main", "feature/menu-grid", "feature/contact-form", "fix/navbar-toggle", "release/v1.0"];
    const conventions = DATA.CONVENTIONS.slice(0, 3).map((item) =>
      '<article class="mini-card"><h4>' + esc(item.title) + "</h4><code>" + esc(item.example.split("\n")[0]) + "</code><p>" + esc(item.why) + "</p></article>"
    ).join("");

    return (
      '<div class="home">' +
      '<section class="hero">' +
      '<div class="hero-copy"><p class="eyebrow">CSE122 · Thực hành cộng tác</p>' +
      '<h1>Mộc Coffee: làm web nhóm<br><span>bằng Git và GitHub</span></h1>' +
      '<p class="hero-lede">Một website sáu trang, ba người thật, mười lăm tình huống thật. Bạn nhận vai, gõ lệnh trong kho mô phỏng, dựng HTML/CSS/JS, mở pull request, review chéo và phát hành — tất cả ngay trên trình duyệt.</p>' +
      '<div class="hero-actions"><a class="btn primary big" href="#/lab/' + (state.lastId || "s01") + '">' + (state.lastId ? "Học tiếp " + esc(state.lastId.toUpperCase()) : "Bắt đầu kịch bản 01") + "</a>" +
      '<a class="btn ghost big" href="#/conventions">Xem phân công</a></div>' +
      '<div class="progress-line"><div class="progress-track"><span style="width:' + Math.round((done / SCENARIOS.length) * 100) + '%"></span></div>' +
      "<p><strong>" + done + "/" + SCENARIOS.length + "</strong> kịch bản đã hoàn thành · lưu trên máy bạn</p></div></div>" +
      '<div class="hero-stage" aria-hidden="true"><div class="stage-window"><div class="stage-bar"><i></i><i></i><i></i><span>moc-coffee · main</span></div>' +
      '<div class="stage-body"><div class="stage-side">' + branches.map((name) => '<span class="stage-branch' + (name === "main" ? " current" : "") + '">' + esc(name) + "</span>").join("") + "</div>" +
      '<div class="stage-main"><div class="stage-commit"><span class="dot"></span><div><strong>feat(menu): lưới thẻ Bootstrap (#4)</strong><small>Lan · ci/pages xanh · đã merge</small></div><em>main</em></div>' +
      '<div class="stage-commit muted"><span class="dot"></span><div><strong>fix(nav): nút menu trên điện thoại (#7)</strong><small>Huy · 1 approval</small></div></div>' +
      '<div class="stage-commit muted"><span class="dot"></span><div><strong>feat(contact): form có label (#5)</strong><small>Lan review chéo · ci/pages</small></div></div>' +
      '<div class="stage-pr"><span>PR #5</span><b>Đủ điều kiện merge</b></div></div></div></div></div>' +
      "</section>" +
      '<section class="stats">' +
      "<div><strong>" + SCENARIOS.length + "</strong><span>kịch bản thực tế</span></div>" +
      "<div><strong>3</strong><span>vai trong nhóm</span></div>" +
      "<div><strong>" + DATA.MODULES.length + "</strong><span>module</span></div>" +
      "<div><strong>" + totalSteps + "</strong><span>bước thực hành</span></div>" +
      "<div><strong>" + totalChecks + "</strong><span>điểm kiểm tra</span></div></section>" +
      '<section class="section"><div class="section-head"><div><p class="eyebrow">Đội ngũ</p><h2>Ba người, ba trách nhiệm rõ ràng</h2></div><a class="text-link" href="#/conventions">Bảng RACI đầy đủ</a></div>' +
      '<div class="team-grid">' + teamCards + "</div></section>" +
      '<section class="section"><div class="section-head"><div><p class="eyebrow">Sprint 01</p><h2>' + esc(DATA.SPRINT.goal) + "</h2></div>" +
      '<span class="pill">' + esc(DATA.SPRINT.dates) + "</span></div>" +
      '<div class="sprint-grid"><article class="panel"><h3>Definition of Done</h3><ol class="dod">' + dod + "</ol></article>" +
      '<article class="panel"><h3>Nhịp làm việc</h3><div class="flow">' +
      '<span>Issue</span><i></i><span>Nhánh</span><i></i><span>Commit</span><i></i><span>PR</span><i></i><span>Review</span><i></i><span>CI</span><i></i><span>Squash merge</span></div>' +
      "<p class=\"muted-text\">Mỗi thay đổi đi trọn một vòng. Không có đường tắt vào main.</p>" +
      '<div class="branch-policy"><span>main được bảo vệ</span><ul><li>Bắt buộc pull request</li><li>1 approval từ người khác</li><li>Check ci/pages phải xanh</li><li>Không push trực tiếp</li></ul></div></article></div></section>' +
      '<section class="section"><div class="section-head"><div><p class="eyebrow">Lộ trình</p><h2>' + SCENARIOS.length + " kịch bản, " + DATA.MODULES.length + " module</h2></div><span class=\"pill\">" + done + "/" + SCENARIOS.length + " đã xong</span></div>" + modulesHTML + "</section>" +
      '<section class="section"><div class="section-head"><div><p class="eyebrow">Quy ước</p><h2>Luật chơi viết một lần, dùng cả sprint</h2></div><a class="text-link" href="#/conventions">Xem tất cả</a></div>' +
      '<div class="mini-grid">' + conventions + "</div></section>" +
      '<section class="section cta-panel"><div><h2>Không cần cài Git để bắt đầu</h2><p>Toàn bộ lệnh chạy trong kho mô phỏng. Khi quen tay, mở terminal thật và làm lại đúng chuỗi lệnh.</p></div><div class="cta-actions"><a class="btn primary big" href="#/lab/' + (state.lastId || "s01") + '">Vào phòng lab</a><a class="btn ghost big" href="#/cheats">Mở cheatsheet</a></div></section>' +
      "</div>"
    );
  }

  function conventionsHTML() {
    const cards = DATA.CONVENTIONS.map((item, index) =>
      '<article class="panel convention-card"><span class="scenario-number">' + String(index + 1).padStart(2, "0") + "</span>" +
      "<h3>" + esc(item.title) + "</h3><code class=\"rule\">" + esc(item.rule) + "</code>" +
      '<pre class="example">' + esc(item.example) + "</pre><p>" + esc(item.why) + "</p></article>"
    ).join("");
    const raci = DATA.RACI.map((row) =>
      "<tr><td>" + esc(row.work) + "</td><td>" + esc(row.minh) + "</td><td>" + esc(row.lan) + "</td><td>" + esc(row.huy) + "</td><td>" + esc(row.note) + "</td></tr>"
    ).join("");
    const members = TEAM_IDS.map((id) => {
      const person = DATA.TEAM_DETAILS[id];
      return '<article class="team-card compact" style="--team:' + person.color + '"><div class="team-head"><span class="avatar">' + esc(person.avatar) + "</span><div><h3>" + esc(person.name) + "</h3><p>" + esc(person.role) + "</p></div></div>" +
        "<p>" + esc(person.quote) + "</p><ul class=\"plain-list\">" + person.owns.map((item) => "<li><code>" + esc(item) + "</code></li>").join("") + "</ul></article>";
    }).join("");
    return (
      '<div class="page">' +
      '<header class="page-head"><p class="eyebrow">Cách nhóm làm việc</p><h1>Phân công, quy ước và quyền hạn</h1>' +
      "<p>Mộc Coffee chia quyền theo vai trò thật: người dựng trang không tự duyệt PR của mình, chỉ Tech Lead merge và quản lý bảo vệ nhánh. Mọi quy ước dưới đây đều được kiểm tra trong phòng lab.</p></header>" +
      '<section class="section"><h2>Ba vai</h2><div class="team-grid three">' + members + "</div></section>" +
      '<section class="section"><h2>Bảng RACI</h2><p class="muted-text">A: chịu trách nhiệm cuối · R: trực tiếp làm · C: được hỏi ý · I: được thông báo.</p>' +
      '<div class="table-wrap"><table class="raci"><thead><tr><th>Công việc</th><th>Minh</th><th>Lan</th><th>Huy</th><th>Ghi chú</th></tr></thead><tbody>' + raci + "</tbody></table></div></section>" +
      '<section class="section"><h2>Quy ước</h2><div class="convention-grid">' + cards + "</div></section>" +
      '<section class="section"><h2>Vòng đời một thay đổi</h2><div class="lifecycle">' +
      '<div><span>1</span><h4>Issue</h4><p>Mô tả việc, gắn nhãn, giao người.</p></div>' +
      '<div><span>2</span><h4>Nhánh</h4><p>Tách từ main, đặt tên theo scope.</p></div>' +
      '<div><span>3</span><h4>Commit nhỏ</h4><p>Conventional Commits, một mục tiêu.</p></div>' +
      '<div><span>4</span><h4>Push và PR</h4><p>Mô tả bối cảnh, Closes #N.</p></div>' +
      '<div><span>5</span><h4>Review và CI</h4><p>Người khác duyệt, check xanh.</p></div>' +
      '<div><span>6</span><h4>Squash merge</h4><p>Một commit trên main, xoá nhánh.</p></div>' +
      "</div></section>" +
      '<section class="section cta-panel"><div><h2>Áp dụng ngay trong phòng lab</h2><p>Mỗi kịch bản kiểm tra đúng các quy ước này, không chỉ kiểm tra bạn gõ đúng lệnh.</p></div><a class="btn primary big" href="#/lab/s01">Bắt đầu</a></section>' +
      "</div>"
    );
  }

  function cheatsHTML() {
    return (
      '<div class="page">' +
      '<header class="page-head"><p class="eyebrow">Tra cứu nhanh</p><h1>Cheatsheet Git và GitHub</h1>' +
      "<p>Tất cả lệnh dưới đây chạy được trong phòng lab. Nhóm theo tình huống thay vì theo thứ tự bảng chữ cái.</p></header>" +
      '<div class="cheat-tools"><label class="search-field"><span>Tìm lệnh</span><input id="cheatSearch" type="search" placeholder="ví dụ: rebase, stash, merge…"></label>' +
      '<div class="chip-row" id="cheatFilters"></div></div>' +
      '<div class="cheat-list" id="cheatList"></div>' +
      "</div>"
    );
  }

  function bindCheats() {
    const groups = ["Tất cả"].concat(Array.from(new Set(DATA.CHEATS.map((item) => item.group))));
    let activeGroup = "Tất cả";
    let query = "";
    const filterRoot = $("#cheatFilters");
    const listRoot = $("#cheatList");
    function apply() {
      const rows = DATA.CHEATS.filter((item) => {
        const okGroup = activeGroup === "Tất cả" || item.group === activeGroup;
        const text = (item.cmd + " " + item.note).toLowerCase();
        return okGroup && (!query || text.indexOf(query) > -1);
      });
      listRoot.innerHTML = rows.length ? rows.map((item) =>
        '<article class="cheat-row"><div class="cheat-cmd"><code>' + esc(item.cmd) + '</code><button class="icon-btn" data-copy="' + esc(item.cmd) + '" title="Chép lệnh">Chép</button></div>' +
        '<p>' + esc(item.note) + '</p><span class="cheat-group">' + esc(item.group) + "</span></article>"
      ).join("") : '<p class="empty-state">Không tìm thấy lệnh phù hợp.</p>';
      $$("[data-copy]", listRoot).forEach((button) => {
        button.addEventListener("click", () => copyText(button.getAttribute("data-copy")));
      });
    }
    filterRoot.innerHTML = groups.map((group) =>
      '<button class="chip' + (group === activeGroup ? " active" : "") + '" data-group="' + esc(group) + '">' + esc(group) + "</button>"
    ).join("");
    $$("[data-group]", filterRoot).forEach((button) => {
      button.addEventListener("click", () => {
        activeGroup = button.getAttribute("data-group");
        $$("[data-group]", filterRoot).forEach((item) => item.classList.toggle("active", item === button));
        apply();
      });
    });
    const input = $("#cheatSearch");
    input.addEventListener("input", () => { query = input.value.trim().toLowerCase(); apply(); });
    apply();
  }

  function copyText(text) {
    const done = () => toast("Đã chép lệnh vào clipboard.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();
    function fallback() {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); done(); } catch (error) { toast("Không chép được, hãy chọn lệnh thủ công.", "warn"); }
      area.remove();
    }
  }

  /* ---------------- Modal chạy lời giải, v.v. ---------------- */

  function showSolutionPrompt() {
    if (!current) return;
    if (state.solutionBusy) return;
    confirmDialog(
      "Chạy lời giải mẫu?",
      "FELab sẽ đặt lại kịch bản " + current.id.toUpperCase() + " và thực hiện từng bước mẫu. Lời giải không tính vào tiến độ; các kịch bản bạn đã tự hoàn thành vẫn được giữ.",
      () => runSolution(),
      "Chạy lời giải"
    );
  }

  async function runSolution() {
    if (!current) return;
    resetScenario(false);
    const token = ++state.solutionToken;
    state.solutionBusy = true;
    state.tab = "terminal";
    renderApp();
    toast("Đang chạy lời giải mẫu cho " + current.id.toUpperCase() + ".", "info");
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (const step of current.solution) {
      if (state.solutionToken !== token) return;
      if (step.role) {
        state.role = step.role;
        sim.role = step.role;
        appendSystem("Chuyển vai: " + TEAM[step.role].name);
        updateRoleUI();
      }
      if (step.protect) {
        sim.updateProtection("main", step.protect);
        appendSystem("Đã cập nhật bảo vệ nhánh main trong Settings.");
      }
      if (step.write) {
        sim.writeFile(step.write.path, step.write.content);
        appendSystem("Ghi tệp " + step.write.path);
      }
      if (step.run) {
        const command = typeof step.run === "function" ? step.run(sim) : step.run;
        runCommand(command, { noMark: true });
      }
      refreshPanes();
      await delay(520);
    }
    state.solutionBusy = false;
    refreshLab({ fromCommand: false });
    toast("Đã chạy xong lời giải mẫu. Hãy đọc lại từng bước trong terminal.", "success");
  }

  /* ---------------- Render chung ---------------- */

  function renderApp() {
    renderTopbar();
    if (state.view === "home") {
      app.innerHTML = homeHTML();
      document.title = "FELab · Git và GitHub cho nhóm làm web";
      bindHome();
    } else if (state.view === "conventions") {
      app.innerHTML = conventionsHTML();
      document.title = "FELab · Phân công và quy ước";
    } else if (state.view === "cheats") {
      app.innerHTML = cheatsHTML();
      document.title = "FELab · Cheatsheet Git, GitHub và frontend";
      bindCheats();
    } else if (state.view === "lab") {
      renderLabShell();
      document.title = current ? "FELab · " + current.id.toUpperCase() + " " + current.title : "FELab";
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function bindHome() {
    $$("[data-open-scenario]").forEach((button) => {
      button.addEventListener("click", () => navigate("#/lab/" + button.getAttribute("data-open-scenario")));
    });
    $$("[data-role-switch]").forEach((button) => {
      button.addEventListener("click", () => setRole(button.getAttribute("data-role-switch")));
    });
  }

  function setRole(id) {
    if (!TEAM[id]) return;
    state.role = id;
    if (sim) sim.role = id;
    renderTopbar();
    if (state.view === "home") {
      renderApp();
    } else if (state.view === "lab") {
      updateRoleUI();
      appendSystem("Chuyển vai thao tác: " + TEAM[id].name + " (" + TEAM[id].role + ").");
      refreshPanes();
    }
    toast("Đang thao tác với vai " + TEAM[id].name + ".");
  }

  function closeDrawer() {
    state.drawer = false;
    document.body.classList.remove("drawer-open");
    const side = document.getElementById("labSidebar");
    if (side) side.classList.remove("open");
  }

  /* ---------------- Phòng lab: nạp kịch bản ---------------- */

  function openLab(id) {
    const scenario = scenarioById(id);
    if (!scenario) { navigate("#/"); return; }
    const changed = !current || current.id !== id;
    state.view = "lab";
    state.scenarioId = id;
    if (changed) loadScenario(id);
    closeDrawer();
    if (changed || !document.getElementById("labSidebar")) renderApp();
    else refreshLab({ fromCommand: false });
  }

  function loadScenario(id) {
    const toastRoot = document.getElementById("toastRoot");
    if (toastRoot) toastRoot.textContent = "";
    current = scenarioById(id);
    if (!current) return;
    state.scenarioId = id;
    state.lastId = id;
    saveStore();
    resetScenario(false);
  }

  function welcomeEntries() {
    const module = moduleById(current.module);
    return [
      { kind: "system", text: "FELab · " + current.id.toUpperCase() + " — " + current.title },
      { kind: "system", text: "Module " + module.order + ": " + module.title + " · vai mặc định " + TEAM[current.role].name + " (" + TEAM[current.role].role + ")" },
      { kind: "info", text: "Gõ help để xem phạm vi lệnh. Tab Files có trình sửa tệp; tab GitHub xem issue, PR, CI." },
      { kind: "muted", text: "Mục tiêu: " + current.brief }
    ];
  }

  function resetScenario(render) {
    if (!current) return;
    cancelSolution();
    state.tab = "terminal";
    state.ghTab = "issues";
    state.hints = 0;
    state.editor = { path: null, dirty: false };
    state.selectedCommit = null;
    state.solutionBusy = false;
    state.solutionOpen = false;
    sim = new GitSim();
    sim.seed(current.seed);
    sim.role = current.role;
    state.role = current.role;
    terminal = { entries: welcomeEntries(), history: [], cursor: 0 };
    state.results = evaluateChecks();
    if (render) {
      renderApp();
      toast("Đã đặt lại kịch bản " + current.id.toUpperCase() + ".", "info");
    }
  }

  function evaluateChecks() {
    if (!current) return [];
    return current.checks.map((check) => {
      let ok = false;
      try { ok = !!check.test(sim); } catch (error) { ok = false; }
      return { id: check.id, label: check.label, hint: check.hint, ok };
    });
  }

  function nextScenario() {
    const index = SCENARIOS.findIndex((scenario) => scenario.id === (current && current.id));
    return index > -1 ? SCENARIOS[index + 1] || null : null;
  }

  /* ---------------- Terminal ---------------- */

  function promptLabel() {
    const branch = sim.detachedSha ? "detached" : sim.branch;
    return TEAM[state.role].short.toLowerCase() + "@moc-coffee:~/moc-coffee (" + branch + ")";
  }

  function terminalPromptText() {
    return promptLabel() + " $";
  }

  function appendSystem(text) {
    terminal.entries.push({ kind: "system", text });
    renderTerminal();
  }

  function appendPrompt(command) {
    terminal.entries.push({ kind: "prompt", text: command, meta: promptLabel() });
  }

  function pushOutput(text, cls) {
    terminal.entries.push({ kind: "out", text: text == null ? "" : String(text), cls: cls || "" });
  }

  function renderTerminal() {
    const out = document.getElementById("terminalOut");
    if (!out) return;
    const rows = terminal.entries.map((entry) => {
      if (entry.kind === "prompt") {
        return '<div class="term-line term-prompt-line"><span class="term-path">' + esc(entry.meta) + " $</span> " + esc(entry.text) + "</div>";
      }
      if (entry.kind === "system") return '<div class="term-line term-system">' + esc(entry.text) + "</div>";
      if (entry.kind === "info") return '<div class="term-line term-info">' + esc(entry.text) + "</div>";
      if (entry.kind === "muted") return '<div class="term-line term-muted">' + esc(entry.text) + "</div>";
      if (entry.kind === "error") return '<div class="term-line term-error">' + esc(entry.text) + "</div>";
      return '<div class="term-line ' + esc(entry.cls) + '">' + (entry.text === "" ? "&nbsp;" : esc(entry.text)) + "</div>";
    });
    out.innerHTML = rows.join("");
    out.scrollTop = out.scrollHeight;
    updateTerminalPrompt();
  }

  function updateTerminalPrompt() {
    const prompt = document.getElementById("termPrompt");
    if (prompt) prompt.textContent = terminalPromptText();
  }

  function runCommand(raw, opts) {
    const options = opts || {};
    const command = String(raw || "").trim();
    if (!command || !current) return;
    appendPrompt(command);
    if (terminal.history[terminal.history.length - 1] !== command) terminal.history.push(command);
    terminal.cursor = terminal.history.length;
    let result;
    try {
      result = sim.exec(command);
    } catch (error) {
      result = { ok: false, error: "Lỗi mô phỏng: " + error.message, lines: [] };
    }
    if (result.action && result.action.type === "clear") {
      terminal.entries = [];
      renderTerminal();
      return;
    }
    (result.lines || []).forEach((item) => pushOutput(item.text, item.cls));
    if (result.error) {
      result.error.split("\n").forEach((row) => terminal.entries.push({ kind: "error", text: row }));
    }
    if (result.action && result.action.type === "edit") {
      state.tab = "files";
      state.editor = { path: result.action.path, dirty: false };
    }
    renderTerminal();
    refreshLab({ fromCommand: !options.noMark });
    if (state.tab === "terminal") {
      const input = document.getElementById("terminalInput");
      if (input) input.focus();
    }
  }

  function runFromPanel(command) {
    state.tab = "terminal";
    refreshPanes();
    runCommand(command);
  }

  /* ---------------- Khung phòng lab ---------------- */

  function labSidebarHTML() {
    const modules = DATA.MODULES.map((module) => {
      const rows = moduleScenarios(module.id).map((scenario) => {
        const active = current && current.id === scenario.id;
        const done = !!state.completed[scenario.id];
        return '<a class="lab-link' + (active ? " current" : "") + (done ? " done" : "") + '" href="#/lab/' + scenario.id + '">' +
          '<span class="lab-num">' + String(scenario.order).padStart(2, "0") + "</span>" +
          "<span class=\"lab-link-body\"><strong>" + esc(scenario.title) + "</strong><small>" + esc(TEAM[scenario.role].short) + " · " + scenario.minutes + " phút" + (done ? " · đã xong" : "") + "</small></span>" +
          "</a>";
      }).join("");
      return '<div class="lab-module"><p>0' + module.order + " · " + esc(module.title) + "</p>" + rows + "</div>";
    }).join("");
    return (
      '<aside class="lab-sidebar" id="labSidebar" aria-label="Danh sách kịch bản">' +
      '<div class="sidebar-top"><span>' + SCENARIOS.length + ' kịch bản</span><button type="button" class="icon-btn" id="closeSidebar">Đóng</button></div>' +
      '<div class="lab-links">' + modules + "</div>" +
      '<div class="sidebar-foot"><div class="progress-track slim"><span style="width:' + Math.round((completedCount() / SCENARIOS.length) * 100) + '%"></span></div>' +
      "<p>" + completedCount() + "/" + SCENARIOS.length + " kịch bản hoàn thành</p></div></aside>" +
      '<div class="lab-scrim" id="labScrim"></div>'
    );
  }

  function scoreHTML() {
    const module = moduleById(current.module);
    return (
      '<aside class="score-panel" id="scorePanel">' +
      '<div class="score-head"><div><p class="eyebrow">Nhiệm vụ</p><h2>' + esc(current.title) + "</h2></div>" +
      '<span class="score-count" id="scoreBadge">0/' + current.checks.length + "</span></div>" +
      '<p class="score-brief">' + esc(current.brief) + "</p>" +
      '<div class="meta-row"><span class="pill">' + esc(module.title) + "</span><span class=\"pill\">" + esc(current.level) + "</span><span class=\"pill\">~" + current.minutes + " phút</span></div>" +
      '<h3>Việc cần làm</h3><ol class="task-list">' + current.tasks.map((task) => "<li>" + esc(task) + "</li>").join("") + "</ol>" +
      '<h3>Kiểm tra tự động</h3><ul class="check-list" id="checkList"></ul>' +
      '<div class="hint-box" id="hintBox"></div>' +
      '<details class="solution-box"><summary>Xem lời giải mẫu</summary>' +
      '<p class="muted-text">Chạy lời giải sẽ đặt lại kịch bản và thực hiện từng bước. Lời giải mẫu không tính vào tiến độ; chỉ nên xem sau khi đã thử ít nhất ba gợi ý.</p>' +
      '<ol class="solution-steps">' + current.solution.map((step) =>
        "<li><strong>" + esc(step.label) + "</strong>" + (step.run ? "<code>" + esc(typeof step.run === "function" ? "lệnh theo trạng thái hiện tại" : step.run) + "</code>" : "<span class=\"muted-text\">thao tác giao diện</span>") + "</li>"
      ).join("") + "</ol>" +
      '<button type="button" class="btn small primary" id="runSolutionInline">' + (state.solutionBusy ? "Đang chạy..." : "Chạy lời giải mẫu") + "</button></details>" +
      '<div class="next-box" id="nextBox"></div>' +
      "</aside>"
    );
  }

  function renderLabShell() {
    if (!current) {
      app.innerHTML = '<div class="empty-lab"><h1>Chưa chọn kịch bản</h1><a class="btn primary" href="#/">Về trang chủ</a></div>';
      return;
    }
    const module = moduleById(current.module);
    app.innerHTML =
      '<div class="lab">' +
      labSidebarHTML() +
      '<section class="lab-main">' +
      '<header class="lab-head">' +
      '<button type="button" class="btn small ghost lab-menu" id="labMenuBtn">Danh sách</button>' +
      "<div class=\"lab-title\"><p class=\"eyebrow\">Module 0" + module.order + " · Kịch bản " + String(current.order).padStart(2, "0") + "/" + SCENARIOS.length + "</p>" +
      "<h1>" + esc(current.title) + "</h1>" +
      '<p class="lab-sub">Vai <strong id="headerRole">' + esc(TEAM[state.role].name) + "</strong> · nhánh <code id=\"headerBranch\">" + esc(sim.detachedSha ? "detached" : sim.branch) + "</code> · " + esc(module.title) + "</p></div>" +
      '<div class="lab-actions"><span class="score-pill" id="labScorePill">0/' + current.checks.length + " đạt</span>" +
      '<button type="button" class="btn small ghost" id="resetBtn">Đặt lại</button>' +
      '<button type="button" class="btn small primary" id="solutionBtn">' + (state.solutionBusy ? "Đang chạy..." : "Chạy lời giải") + "</button></div></header>" +
      '<div class="lab-progress"><span id="labProgressBar"></span></div>' +
      '<div class="lab-body"><div class="lab-work"><nav class="work-tabs" role="tablist">' +
      '<button type="button" role="tab" id="tab-terminal" aria-controls="pane-terminal" data-tab="terminal">Terminal</button>' +
      '<button type="button" role="tab" id="tab-files" aria-controls="pane-files" data-tab="files">Files <span class="tab-count" id="fileCount">0</span></button>' +
      '<button type="button" role="tab" id="tab-graph" aria-controls="pane-graph" data-tab="graph">Sơ đồ</button>' +
      '<button type="button" role="tab" id="tab-github" aria-controls="pane-github" data-tab="github">GitHub <span class="tab-count" id="ghCount">0</span></button>' +
      '<button type="button" role="tab" id="tab-settings" aria-controls="pane-settings" data-tab="settings">Settings</button>' +
      '</nav><div class="panes">' +
      '<section class="pane pane-terminal" id="pane-terminal" role="tabpanel" aria-labelledby="tab-terminal" data-pane="terminal"><div class="terminal">' +
      '<div class="terminal-bar"><span class="term-dots"><i></i><i></i><i></i></span><span class="term-title">moc-coffee — zsh</span><span class="term-branch" id="termBranch"></span></div>' +
      '<div class="terminal-out" id="terminalOut" role="log" aria-live="polite"></div>' +
      '<form class="terminal-form" id="terminalForm" autocomplete="off">' +
      '<span class="term-prompt" id="termPrompt"></span>' +
      '<input id="terminalInput" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Nhập lệnh Git hoặc GitHub" placeholder="git status">' +
      '<button type="submit" class="term-run">Chạy</button></form>' +
      '<div class="quick-row">' + ["git status", "git log --oneline -n 6", "gh pr list", "gh issue list", "help"].map((cmd) =>
        '<button type="button" class="chip small" data-quick="' + esc(cmd) + '">' + esc(cmd) + "</button>"
      ).join("") + "</div></div></section>" +
      '<section class="pane pane-files" id="pane-files" role="tabpanel" aria-labelledby="tab-files" data-pane="files" hidden><div class="files-layout">' +
      '<div class="file-rail"><div class="file-tools"><strong>Thư mục làm việc</strong><button type="button" class="icon-btn" id="newFileBtn">Tệp mới</button></div><ul class="file-tree" id="fileTree"></ul></div>' +
      '<div class="editor" id="editor"></div></div></section>' +
      '<section class="pane pane-graph" id="pane-graph" role="tabpanel" aria-labelledby="tab-graph" data-pane="graph" hidden><div class="graph-pane" id="graphPane"></div></section>' +
      '<section class="pane pane-github" id="pane-github" role="tabpanel" aria-labelledby="tab-github" data-pane="github" hidden><div class="github-pane"><nav class="gh-tabs" id="ghTabs"></nav><div class="gh-body" id="ghBody"></div></div></section>' +
      '<section class="pane pane-settings" id="pane-settings" role="tabpanel" aria-labelledby="tab-settings" data-pane="settings" hidden><div class="settings-pane" id="settingsPane"></div></section>' +
      "</div></div>" +
      scoreHTML() +
      "</div></section></div>";
    bindLab();
    renderTerminal();
    refreshPanes();
    refreshLab({ fromCommand: false });
  }

  function bindLab() {
    const menu = document.getElementById("labMenuBtn");
    if (menu) menu.addEventListener("click", () => {
      state.drawer = true;
      document.body.classList.add("drawer-open");
      const side = document.getElementById("labSidebar");
      if (side) side.classList.add("open");
    });
    const closeSide = document.getElementById("closeSidebar");
    if (closeSide) closeSide.addEventListener("click", closeDrawer);
    $$(".lab-link").forEach((link) => link.addEventListener("click", closeDrawer));
    const scrim = document.getElementById("labScrim");
    if (scrim) scrim.addEventListener("click", closeDrawer);

    $$(".work-tabs [data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.tab = button.getAttribute("data-tab");
        refreshPanes();
      });
    });

    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");
    if (form && input) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = input.value;
        input.value = "";
        runCommand(value);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          terminal.cursor = Math.max(0, terminal.cursor - 1);
          input.value = terminal.history[terminal.cursor] || "";
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          terminal.cursor = Math.min(terminal.history.length, terminal.cursor + 1);
          input.value = terminal.history[terminal.cursor] || "";
        }
      });
      input.focus();
    }
    $$("[data-quick]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!input) return;
        input.value = button.getAttribute("data-quick");
        input.focus();
      });
    });

    const reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", () => {
      confirmDialog("Đặt lại kịch bản?", "Mọi thay đổi trong kho mô phỏng sẽ trở về trạng thái đầu. Tiến độ hoàn thành vẫn được giữ.", () => resetScenario(true), "Đặt lại");
    });
    const solution = document.getElementById("solutionBtn");
    if (solution) solution.addEventListener("click", showSolutionPrompt);

    const filesPane = $('.pane-files');
    if (filesPane) {
      filesPane.addEventListener("click", (event) => {
        const fileButton = event.target.closest("[data-file-path]");
        if (fileButton) { selectFile(fileButton.getAttribute("data-file-path")); return; }
        if (event.target.closest("#saveFile")) { saveEditor(); return; }
        if (event.target.closest("#deleteFile")) { deleteEditor(); return; }
        if (event.target.closest("#newFileBtn")) { createFilePrompt(); return; }
        if (event.target.closest("#closeEditor")) { state.editor = { path: null, dirty: false }; renderFilesPane(); return; }
      });
      filesPane.addEventListener("input", (event) => {
        if (event.target && event.target.id === "fileEditor") {
          state.editor.dirty = true;
          const dot = document.getElementById("editorDirty");
          if (dot) dot.hidden = false;
        }
      });
    }

    const graphPane = document.getElementById("graphPane");
    if (graphPane) {
      graphPane.addEventListener("click", (event) => {
        const copy = event.target.closest("[data-copy-sha]");
        if (copy) { copyText(copy.getAttribute("data-copy-sha")); return; }
        const show = event.target.closest("[data-show-commit]");
        if (show) runFromPanel("git show " + show.getAttribute("data-show-commit"));
      });
    }

    const ghTabs = document.getElementById("ghTabs");
    if (ghTabs) {
      ghTabs.addEventListener("click", (event) => {
        const tab = event.target.closest("[data-gh-tab]");
        if (!tab) return;
        state.ghTab = tab.getAttribute("data-gh-tab");
        renderGhPane();
      });
    }
    const ghBody = document.getElementById("ghBody");
    if (ghBody) {
      ghBody.addEventListener("click", (event) => {
        const action = event.target.closest("[data-gh-cmd]");
        if (!action) return;
        const command = action.getAttribute("data-gh-cmd");
        if (action.getAttribute("data-confirm")) {
          confirmDialog(action.getAttribute("data-confirm"), command, () => runFromPanel(command), "Xác nhận");
        } else {
          runFromPanel(command);
        }
      });
    }

    const settings = document.getElementById("settingsPane");
    if (settings) {
      settings.addEventListener("click", (event) => {
        if (event.target.closest("#saveProtection")) { saveProtection(); return; }
        if (event.target.closest("#addLabelBtn")) { addLabel(); return; }
      });
      settings.addEventListener("change", (event) => {
        if (event.target && event.target.id === "protectPrRequired") {
          const direct = document.getElementById("protectDirectPush");
          if (direct) direct.disabled = event.target.checked;
        }
      });
    }

    const runInline = document.getElementById("runSolutionInline");
    if (runInline) runInline.addEventListener("click", showSolutionPrompt);

    const score = document.getElementById("scorePanel");
    if (score) {
      score.addEventListener("click", (event) => {
        if (event.target.closest("#nextHint")) {
          state.hints = Math.min(current.hints.length, state.hints + 1);
          renderHints();
        }
        if (event.target.closest("#runSolutionInline")) showSolutionPrompt();
        const next = event.target.closest("[data-next-scenario]");
        if (next) navigate("#/lab/" + next.getAttribute("data-next-scenario"));
      });
    }
  }

  /* ---------------- Cập nhật phòng lab ---------------- */

  function refreshLab(opts) {
    if (!current) return;
    state.results = evaluateChecks();
    const done = state.results.filter((item) => item.ok).length;
    const total = state.results.length;
    const allOk = done === total;
    const scorePill = document.getElementById("labScorePill");
    if (scorePill) scorePill.textContent = done + "/" + total + " đạt" + (allOk ? " · đủ kiểm tra" : "");
    const badge = document.getElementById("scoreBadge");
    if (badge) badge.textContent = done + "/" + total;
    const bar = document.getElementById("labProgressBar");
    if (bar) bar.style.width = Math.round((done / total) * 100) + "%";
    const role = document.getElementById("headerRole");
    if (role) role.textContent = TEAM[state.role].name;
    const branch = document.getElementById("headerBranch");
    if (branch) branch.textContent = sim.detachedSha ? "detached" : sim.branch;
    const fileCount = document.getElementById("fileCount");
    if (fileCount) fileCount.textContent = Object.keys(sim.worktree).length;
    const ghCount = document.getElementById("ghCount");
    if (ghCount) ghCount.textContent = sim.prs.filter((pr) => pr.state === "open").length;
    const termBranch = document.getElementById("termBranch");
    if (termBranch) termBranch.textContent = sim.branch;
    renderChecklist();
    renderHints();
    renderNextBox();
    updateTerminalPrompt();
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) resetBtn.disabled = state.solutionBusy;
    const solutionBtn = document.getElementById("solutionBtn");
    if (solutionBtn) { solutionBtn.disabled = state.solutionBusy; solutionBtn.textContent = state.solutionBusy ? "Đang chạy..." : "Chạy lời giải"; }
    if (state.tab !== "terminal") renderActivePane();
    if (opts && opts.fromCommand && allOk && !state.completed[current.id]) {
      state.completed[current.id] = true;
      saveStore();
      renderTopbar();
      toast("Hoàn thành " + current.id.toUpperCase() + ": " + current.title + ".", "success");
      renderNextBox();
      refreshSidebarStatus();
    }
  }

  function refreshSidebarStatus() {
    const links = $$(".lab-link");
    links.forEach((link) => {
      const id = (link.getAttribute("href") || "").replace("#/lab/", "");
      link.classList.toggle("done", !!state.completed[id]);
      const small = $("small", link);
      if (small && !link.classList.contains("current")) { /* giữ nhãn hiện tại */ }
    });
    const sidebarFoot = $(".sidebar-foot p");
    if (sidebarFoot) sidebarFoot.textContent = completedCount() + "/" + SCENARIOS.length + " kịch bản hoàn thành";
  }

  function renderChecklist() {
    const root = document.getElementById("checkList");
    if (!root) return;
    root.innerHTML = state.results.map((item) =>
      '<li class="check-item ' + (item.ok ? "ok" : "pending") + '"><span class="check-mark" aria-hidden="true">' + (item.ok ? "OK" : "·") + "</span>" +
      '<div><strong>' + esc(item.label) + "</strong>" + (item.ok ? "" : '<p class="check-hint">' + esc(item.hint) + "</p>") + "</div></li>"
    ).join("");
  }

  function renderHints() {
    const root = document.getElementById("hintBox");
    if (!root || !current) return;
    const shown = current.hints.slice(0, state.hints);
    const list = shown.length ? '<ol class="hint-list">' + shown.map((hint) => "<li>" + esc(hint) + "</li>").join("") + "</ol>" : '<p class="muted-text">Chưa mở gợi ý nào. Thử làm trước, rồi mở từng gợi ý khi cần.</p>';
    const button = state.hints < current.hints.length
      ? '<button type="button" class="btn small ghost" id="nextHint">Mở gợi ý ' + (state.hints + 1) + "/" + current.hints.length + "</button>"
      : '<span class="muted-text">Đã mở hết gợi ý.</span>';
    root.innerHTML = '<h3>Gợi ý theo bậc</h3>' + list + '<div class="hint-actions">' + button + "</div>";
  }

  function renderNextBox() {
    const root = document.getElementById("nextBox");
    if (!root || !current) return;
    const next = nextScenario();
    const allOk = state.results.length && state.results.every((item) => item.ok);
    if (!allOk) {
      root.innerHTML = '<p class="muted-text">Hoàn thành đủ ' + current.checks.length + " kiểm tra để đánh dấu kịch bản.</p>";
      return;
    }
    if (!next) {
      root.innerHTML = '<div class="next-done"><strong>Đã xong ' + SCENARIOS.length + ' kịch bản.</strong><p>Quay lại trang chủ để xem tiến độ và bảng phân công.</p><a class="btn small primary" href="#/">Về trang chủ</a></div>';
      return;
    }
    root.innerHTML = '<div class="next-done"><strong>Kịch bản tiếp theo</strong><p>' + esc(next.title) + "</p>" +
      '<button type="button" class="btn small primary" data-next-scenario="' + next.id + '">Mở ' + next.id.toUpperCase() + "</button></div>";
  }

  function refreshPanes() {
    $$(".work-tabs [data-tab]").forEach((button) => {
      const active = button.getAttribute("data-tab") === state.tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$(".pane").forEach((pane) => { pane.hidden = pane.getAttribute("data-pane") !== state.tab; });
    renderActivePane();
    updateTerminalPrompt();
  }

  function renderActivePane() {
    if (state.tab === "terminal") { renderTerminal(); return; }
    if (state.tab === "files") { renderFilesPane(); return; }
    if (state.tab === "graph") { renderGraphPane(); return; }
    if (state.tab === "github") { renderGhPane(); return; }
    if (state.tab === "settings") { renderSettingsPane(); }
  }

  function updateRoleUI() {
    if (state.view !== "lab") { renderTopbar(); return; }
    renderTopbar();
    const role = document.getElementById("headerRole");
    if (role) role.textContent = TEAM[state.role].name;
    updateTerminalPrompt();
    if (state.tab === "settings") renderSettingsPane();
    if (state.tab === "github") renderGhPane();
  }

  /* ---------------- Files ---------------- */

  function fileStatus(path) {
    if (sim.conflicts[path]) return { code: "UU", label: "xung đột" };
    const head = sim.commits[sim.headSha()] ? sim.commits[sim.headSha()].files : {};
    const index = sim.index[path];
    const work = sim.worktree[path];
    if (head[path] === undefined && work !== undefined) return { code: "A", label: "tệp mới" };
    if (work === undefined) return { code: "D", label: "đã xoá" };
    if (work !== index) return { code: "M", label: "chưa stage" };
    if (index !== head[path]) return { code: "M", label: "đã stage" };
    return { code: "", label: "không đổi" };
  }

  function collectPaths() {
    const set = new Set([
      ...Object.keys(sim.worktree),
      ...Object.keys(sim.index),
      ...Object.keys(sim.commits[sim.headSha()] ? sim.commits[sim.headSha()].files : {}),
      ...Object.keys(sim.conflicts)
    ]);
    return Array.from(set).sort();
  }

  function renderFilesPane() {
    const tree = document.getElementById("fileTree");
    const editor = document.getElementById("editor");
    if (!tree || !editor) return;
    const paths = collectPaths();
    if (!state.editor.path && paths.length) {
      state.editor.path = paths.includes("README.md") ? "README.md" : paths[0];
    }
    tree.innerHTML = paths.map((path) => {
      const status = fileStatus(path);
      const active = state.editor.path === path;
      return '<li><button type="button" class="file-row' + (active ? " active" : "") + '" data-file-path="' + esc(path) + '">' +
        '<span class="file-status status-' + esc(status.code || "none") + '" title="' + esc(status.label) + '">' + esc(status.code || " ") + "</span>" +
        '<span class="file-name">' + esc(path) + "</span></button></li>";
    }).join("");
    const path = state.editor.path;
    if (!path) {
      editor.innerHTML = '<div class="editor-empty"><p>Chọn một tệp bên trái hoặc tạo tệp mới.</p></div>';
      return;
    }
    const content = sim.worktree[path] === undefined ? "" : sim.worktree[path];
    const status = fileStatus(path);
    const headHas = sim.commits[sim.headSha()] && sim.commits[sim.headSha()].files[path] !== undefined;
    editor.innerHTML =
      '<div class="editor-head"><div><p class="eyebrow">Trình sửa tệp</p><h3>' + esc(path) + '</h3>' +
      '<p class="editor-meta">HEAD: ' + (headHas ? "có" : "không") + " · index: " + (sim.index[path] !== undefined ? "có" : "không") + " · trạng thái: " + esc(status.label) + "</p></div>" +
      '<div class="editor-actions"><span class="dirty-dot" id="editorDirty" ' + (state.editor.dirty ? "" : "hidden") + ">chưa lưu</span>" +
      '<button type="button" class="btn small primary" id="saveFile">Lưu tệp</button>' +
      '<button type="button" class="btn small ghost" id="deleteFile">Xoá</button>' +
      '<button type="button" class="icon-btn" id="closeEditor">Đóng</button></div></div>' +
      '<textarea id="fileEditor" spellcheck="false" aria-label="Nội dung ' + esc(path) + '">' + esc(content) + "</textarea>" +
      '<p class="editor-note">Lưu tệp chỉ sửa thư mục làm việc. Muốn đưa vào commit, quay lại Terminal và chạy git add, git commit.</p>';
  }

  function selectFile(path) {
    if (state.editor.dirty && state.editor.path && state.editor.path !== path) {
      confirmDialog("Bỏ thay đổi chưa lưu?", "Tệp " + state.editor.path + " có thay đổi chưa lưu. Mở tệp khác sẽ bỏ các thay đổi đó.", () => {
        state.editor = { path, dirty: false };
        renderFilesPane();
      }, "Bỏ và mở");
      return;
    }
    state.editor = { path, dirty: false };
    renderFilesPane();
  }

  function saveEditor() {
    if (!state.editor.path) return;
    const area = document.getElementById("fileEditor");
    if (!area) return;
    sim.writeFile(state.editor.path, area.value);
    state.editor.dirty = false;
    appendSystem("Đã lưu tệp " + state.editor.path + " vào thư mục làm việc.");
    refreshLab({ fromCommand: false });
    renderFilesPane();
    toast("Đã lưu " + state.editor.path + ".");
  }

  function deleteEditor() {
    if (!state.editor.path) return;
    const path = state.editor.path;
    confirmDialog("Xoá tệp?", "Xoá " + path + " khỏi thư mục làm việc (chưa commit).", () => {
      sim.deleteWorkFile(path);
      appendSystem("Đã xoá tệp " + path + " khỏi thư mục làm việc.");
      state.editor = { path: null, dirty: false };
      refreshLab({ fromCommand: false });
      renderFilesPane();
    }, "Xoá");
  }

  function createFilePrompt() {
    promptDialog("Tạo tệp mới", "Đường dẫn tệp", "src/ui/filter.js", (value) => {
      const path = String(value || "").trim();
      if (!path || /[<>\\]/.test(path) || path.indexOf("..") > -1) { toast("Đường dẫn không hợp lệ.", "warn"); return; }
      if (sim.worktree[path] !== undefined) { toast("Tệp đã tồn tại.", "warn"); state.editor = { path, dirty: false }; renderFilesPane(); return; }
      sim.writeFile(path, "");
      state.editor = { path, dirty: false };
      appendSystem("Đã tạo tệp " + path + ".");
      refreshLab({ fromCommand: false });
      renderFilesPane();
    });
  }

  /* ---------------- Sơ đồ và reflog ---------------- */

  function renderGraphPane() {
    const root = document.getElementById("graphPane");
    if (!root) return;
    const model = sim.graphModel(80);
    const selected = state.selectedCommit && sim.commits[state.selectedCommit] ? sim.commits[state.selectedCommit] : sim.commits[sim.headSha()];
    const selectedNode = model.nodes.find((node) => selected && node.sha === selected.sha);
    const detail = selected ? (
      '<div class="commit-detail"><div class="commit-detail-head"><div><p class="eyebrow">Commit đang chọn</p><h3>' + esc(selected.message.split("\n")[0]) + "</h3>" +
      '<p class="muted-text">' + esc(selected.name) + " · commit · " + short(selected.sha) + "</p></div>" +
      '<div class="detail-actions"><button type="button" class="btn small ghost" data-copy-sha="' + esc(selected.sha) + '">Chép mã</button>' +
      '<button type="button" class="btn small ghost" data-show-commit="' + esc(selected.sha) + '">git show</button></div></div>' +
      '<div class="detail-grid"><div><span>Mã đầy đủ</span><code>' + esc(selected.sha) + "</code></div>" +
      "<div><span>Cha</span><code>" + (selected.parents.length ? selected.parents.map(short).join(", ") : "không có") + "</code></div>" +
      "<div><span>Tệp thay đổi</span><code>" + (sim.commitPaths(selected.sha).join(", ") || "không") + "</code></div>" +
      "<div><span>Nhãn</span><code>" + (selectedNode && selectedNode.refs.length ? selectedNode.refs.map((ref) => ref.name).join(", ") : "không") + "</code></div></div></div>"
    ) : '<p class="empty-state">Chưa có commit.</p>';
    const reflog = sim.reflog.slice().reverse().slice(0, 16).map((entry) =>
      '<li><span>' + esc(entry.message) + "</span><code>" + short(entry.new || entry.old) + "</code></li>"
    ).join("");
    root.innerHTML =
      '<div class="graph-toolbar"><div><h3>Sơ đồ commit</h3><p class="muted-text">Mỗi làn là một nhánh. Chấm rỗng là commit merge. Bấm vào commit để xem chi tiết.</p></div>' +
      '<div class="legend"><span><i style="background:var(--brand)"></i>nhánh</span><span><i style="background:var(--line-strong)"></i>quan hệ cha</span></div></div>' +
      '<div class="graph-scroll" id="graphSvg"></div>' + detail +
      '<div class="reflog"><div class="reflog-head"><h3>Reflog</h3><span class="pill">' + sim.reflog.length + " mục</span></div>" +
      (reflog ? '<ol class="reflog-list">' + reflog + "</ol>" : '<p class="muted-text">Reflog trống.</p>') + "</div>";
    const host = document.getElementById("graphSvg");
    if (host) global.RepoGraph.render(host, model, (node) => { state.selectedCommit = node.sha; renderGraphPane(); });
  }

  /* ---------------- GitHub ---------------- */

  function renderGhPane() {
    const tabs = document.getElementById("ghTabs");
    const body = document.getElementById("ghBody");
    if (!tabs || !body) return;
    const counts = {
      issues: sim.issues.filter((issue) => issue.state === "open").length,
      prs: sim.prs.filter((pr) => pr.state === "open").length,
      actions: sim.runs.length,
      releases: sim.releases.length
    };
    const tabDefs = [["issues", "Issues"], ["prs", "Pull requests"], ["actions", "Actions"], ["releases", "Releases"]];
    tabs.innerHTML = tabDefs.map(([id, label]) =>
      '<button type="button" data-gh-tab="' + id + '" class="gh-tab' + (state.ghTab === id ? " active" : "") + '">' + label + ' <span class="tab-count">' + counts[id] + "</span></button>"
    ).join("");
    if (state.ghTab === "issues") body.innerHTML = issuesHTML();
    else if (state.ghTab === "prs") body.innerHTML = prsHTML();
    else if (state.ghTab === "actions") body.innerHTML = actionsHTML();
    else body.innerHTML = releasesHTML();
  }

  function issuesHTML() {
    if (!sim.issues.length) return '<p class="empty-state">Chưa có issue. Tạo bằng <code>gh issue create</code>.</p>';
    return '<div class="card-stack">' + sim.issues.slice().reverse().map((issue) =>
      '<article class="gh-card"><div class="gh-card-head"><div><span class="gh-number">#' + issue.number + "</span><h3>" + esc(issue.title) + '</h3></div><span class="state-chip state-' + issue.state + '">' + (issue.state === "open" ? "đang mở" : "đã đóng") + "</span></div>" +
      '<p class="gh-body-text">' + multi(issue.body || "(không có mô tả)") + "</p>" +
      '<div class="gh-meta">' + issue.labels.map((label) => '<span class="label-chip">' + esc(label) + "</span>").join("") +
      (issue.assignee ? '<span class="pill">giao ' + esc(roleName(issue.assignee)) + "</span>" : "") +
      '<span class="muted-text">' + esc(TEAM[issue.author] ? TEAM[issue.author].short : issue.author) + " · " + issue.comments.length + " bình luận</span></div>" +
      '<div class="gh-actions"><button type="button" class="btn small ghost" data-gh-cmd="gh issue view ' + issue.number + '">Xem</button>' +
      (issue.state === "open" ? '<button type="button" class="btn small ghost" data-gh-cmd="gh issue close ' + issue.number + ' --comment &quot;Đã xử lý trong sprint 01.&quot;">Đóng</button>' : "") +
      "</div></article>"
    ).join("") + "</div>";
  }

  function prsHTML() {
    if (!sim.prs.length) return '<p class="empty-state">Chưa có pull request. Tạo bằng <code>gh pr create</code>.</p>';
    return '<div class="card-stack">' + sim.prs.slice().reverse().map((pr) => {
      const status = pr.state === "open" ? sim.prState(pr) : null;
      const checks = pr.state === "open" ? sim.prChecks(pr) : [];
      return '<article class="gh-card"><div class="gh-card-head"><div><span class="gh-number">#' + pr.number + "</span><h3>" + esc(pr.title) + "</h3></div>" +
        '<span class="state-chip state-' + pr.state + '">' + (pr.state === "open" ? "đang mở" : pr.state === "merged" ? "đã merge" : "đã đóng") + "</span></div>" +
        '<div class="gh-branches"><code>' + esc(pr.head) + "</code> → <code>" + esc(pr.base) + "</code></div>" +
        '<p class="gh-body-text">' + multi(pr.body || "(không có mô tả)") + "</p>" +
        '<div class="gh-meta"><span class="pill">tác giả ' + esc(roleName(pr.author)) + '</span><span class="pill">' + (status ? status.approvals + "/" + status.requiredReviews + " approval" : "—") + "</span>" +
        (checks.length ? checks.map((check) => '<span class="check-chip ' + esc(check.conclusion) + '">' + esc(check.name) + ": " + esc(check.conclusion) + "</span>").join("") : '<span class="muted-text">chưa có check</span>') + "</div>" +
        (status && status.blocked.length ? '<ul class="blocked-list">' + status.blocked.map((reason) => "<li>" + esc(reason) + "</li>").join("") + "</ul>" : "") +
        (pr.reviews.length ? '<div class="review-list">' + pr.reviews.map((review) => '<span class="review-chip ' + esc(review.state) + '">' + esc(roleName(review.author)) + ": " + esc(review.state) + "</span>").join("") + "</div>" : "") +
        '<div class="gh-actions"><button type="button" class="btn small ghost" data-gh-cmd="gh pr view ' + pr.number + '">Xem</button>' +
        '<button type="button" class="btn small ghost" data-gh-cmd="gh pr checks ' + pr.number + '">CI</button>' +
        (pr.state === "open" && pr.author !== state.role ? '<button type="button" class="btn small ghost" data-gh-cmd="gh pr review ' + pr.number + ' --approve --body &quot;Đã kiểm tra trên FELab.&quot;">Approve</button>' : "") +
        (pr.state === "open" ? '<button type="button" class="btn small primary" data-confirm="Merge PR #' + pr.number + ' vào ' + esc(pr.base) + ' bằng squash?" data-gh-cmd="gh pr merge ' + pr.number + ' --squash --delete-branch">Merge squash</button>' : "") +
        "</div></article>";
    }).join("") + "</div>";
  }

  function actionsHTML() {
    if (!sim.runs.length) return '<p class="empty-state">Chưa có workflow run. Push một nhánh để kích hoạt CI.</p>';
    return '<div class="card-stack">' + sim.runs.slice().reverse().map((run) =>
      '<article class="gh-card run-card"><div class="gh-card-head"><div><span class="gh-number">#' + run.id + "</span><h3>" + esc(run.workflow) + " · " + esc(run.branch) + '</h3></div><span class="state-chip state-' + esc(run.conclusion) + '">' + esc(run.conclusion) + "</span></div>" +
      '<div class="gh-meta"><span class="pill">' + esc(short(run.sha)) + "</span><span class=\"muted-text\">" + esc(TEAM[run.actor] ? TEAM[run.actor].short : "") + " · " + sim.reflog.length + " sự kiện</span></div>" +
      '<div class="gh-actions"><button type="button" class="btn small ghost" data-gh-cmd="gh run view ' + run.id + ' --log">Xem log</button></div></article>'
    ).join("") + "</div>";
  }

  function releasesHTML() {
    if (!sim.releases.length) return '<p class="empty-state">Chưa có release. Tạo tag annotated, push tag rồi <code>gh release create</code>.</p>';
    return '<div class="card-stack">' + sim.releases.slice().reverse().map((release) =>
      '<article class="gh-card"><div class="gh-card-head"><div><span class="gh-number">' + esc(release.tag) + "</span><h3>" + esc(release.title) + '</h3></div><span class="state-chip state-tag">release</span></div>' +
      '<p class="gh-body-text">' + multi(release.notes || "(không có ghi chú)") + "</p>" +
      '<div class="gh-meta"><span class="pill">bởi ' + esc(roleName(release.author)) + "</span><span class=\"muted-text\">tag " + esc(release.tag) + "</span></div></article>"
    ).join("") + "</div>";
  }

  /* ---------------- Settings ---------------- */

  function renderSettingsPane() {
    const root = document.getElementById("settingsPane");
    if (!root) return;
    const rule = Object.assign({ prRequired: false, reviews: 0, checks: [], directPush: true }, sim.protection.main || {});
    const canAdmin = state.role === "minh";
    const ci = !!sim.workflows.ci;
    const deploy = !!sim.workflows.deploy;
    const labels = sim.labels.map((label) => '<span class="label-chip">' + esc(label.name) + "</span>").join("") || '<span class="muted-text">Chưa có nhãn</span>';
    root.innerHTML =
      '<div class="settings-grid"><section class="settings-card"><div class="settings-head"><div><p class="eyebrow">Branches</p><h3>Bảo vệ nhánh main</h3></div><span class="state-chip ' + (rule.prRequired ? "state-open" : "state-closed") + '">' + (rule.prRequired ? "đang bật" : "chưa bật") + "</span></div>" +
      '<p class="muted-text">Thay đổi có hiệu lực ngay trong mô phỏng. Chỉ Tech Lead có quyền admin.</p>' +
      '<label class="toggle-row"><input type="checkbox" id="protectPrRequired" ' + (rule.prRequired ? "checked" : "") + " " + (canAdmin ? "" : "disabled") + "><span>Bắt buộc pull request trước khi vào main</span></label>" +
      '<label class="field inline"><span>Số approval tối thiểu</span><select id="protectReviews" ' + (canAdmin ? "" : "disabled") + ">" +
      [0, 1, 2].map((num) => '<option value="' + num + '"' + (Number(rule.reviews) === num ? " selected" : "") + ">" + num + "</option>").join("") + "</select></label>" +
      '<label class="toggle-row"><input type="checkbox" id="protectCheck" ' + (rule.checks.indexOf("ci/pages") > -1 ? "checked" : "") + " " + (canAdmin ? "" : "disabled") + "><span>Bắt buộc check ci/pages xanh</span></label>" +
      '<label class="toggle-row"><input type="checkbox" id="protectDirectPush" ' + (rule.directPush ? "checked" : "") + " " + (canAdmin || rule.prRequired ? "disabled" : "") + "><span>Cho phép push trực tiếp</span></label>" +
      '<div class="settings-actions"><button type="button" class="btn small primary" id="saveProtection" ' + (canAdmin ? "" : "disabled") + ">Lưu bảo vệ</button>" +
      (canAdmin ? "" : '<span class="muted-text">Đang là ' + esc(TEAM[state.role].short) + "; chỉ Minh sửa được mục này.</span>") + "</div></section>" +
      '<section class="settings-card"><div class="settings-head"><div><p class="eyebrow">Workflows</p><h3>CI và deploy</h3></div></div>' +
      '<div class="workflow-row"><div><strong>CI · ci/pages</strong><p>Kiểm tra doctype, lang, viewport và CSS khi push nhánh.</p></div><span class="state-chip ' + (ci ? "state-open" : "state-closed") + '">' + (ci ? "bật" : "tắt") + "</span></div>" +
      '<div class="workflow-row"><div><strong>Deploy Pages</strong><p>Chạy khi push tag phát hành.</p></div><span class="state-chip ' + (deploy ? "state-open" : "state-closed") + '">' + (deploy ? "bật" : "tắt") + "</span></div>" +
      '<div class="repo-card"><span>Repository</span><code>' + esc(sim.github.owner + "/" + sim.github.repo) + "</code>" +
      '<span>Nhánh mặc định</span><code>main</code><span>Quyền của ' + esc(TEAM[state.role].short) + "</span><code>" + (state.role === "minh" ? "Admin" : "Write") + "</code></div></section>" +
      '<section class="settings-card"><div class="settings-head"><div><p class="eyebrow">Labels</p><h3>Nhãn issue</h3></div></div><div class="label-cloud" id="labelCloud">' + labels + "</div>" +
      '<form class="label-form" id="labelForm"><input type="text" id="newLabelName" maxlength="24" placeholder="tên-nhãn"><button type="button" class="btn small ghost" id="addLabelBtn">Thêm nhãn</button></form>' +
      '<p class="muted-text">Tên chỉ gồm chữ thường, số và dấu gạch ngang.</p></section>' +
      '<section class="settings-card"><div class="settings-head"><div><p class="eyebrow">Members</p><h3>Quyền thành viên</h3></div></div>' +
      '<ul class="member-list">' + TEAM_IDS.map((id) => '<li><span class="avatar tiny" style="--team:' + DATA.TEAM_DETAILS[id].color + '">' + esc(DATA.TEAM_DETAILS[id].avatar) + "</span><div><strong>" + esc(TEAM[id].name) + "</strong><small>" + esc(DATA.TEAM_DETAILS[id].role) + "</small></div><span class=\"pill\">" + (id === "minh" ? "Admin" : "Write") + "</span></li>").join("") + "</ul></section></div>";
  }

  function saveProtection() {
    if (state.role !== "minh") { toast("Chỉ Minh (Tech Lead) có quyền đổi bảo vệ nhánh.", "warn"); return; }
    const required = document.getElementById("protectPrRequired").checked;
    const reviews = Number(document.getElementById("protectReviews").value);
    const check = document.getElementById("protectCheck").checked;
    const direct = document.getElementById("protectDirectPush").checked;
    sim.updateProtection("main", {
      prRequired: required,
      reviews,
      checks: check ? ["ci/pages"] : [],
      directPush: required ? false : direct
    });
    appendSystem("Đã cập nhật bảo vệ main: " + (required ? "bắt buộc PR, " + reviews + " approval" : "cho phép push trực tiếp") + (check ? ", check ci/pages" : "") + ".");
    toast("Đã lưu cấu hình bảo vệ nhánh main.");
    refreshLab({ fromCommand: true });
    renderSettingsPane();
  }

  function addLabel() {
    const input = document.getElementById("newLabelName");
    if (!input) return;
    const name = input.value.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,23}$/.test(name)) { toast("Tên nhãn chỉ gồm chữ thường, số, gạch ngang (2-24 ký tự).", "warn"); return; }
    if (sim.labels.some((label) => label.name === name)) { toast("Nhãn này đã tồn tại.", "warn"); return; }
    sim.labels.push({ name, color: "ededed", description: "" });
    appendSystem("Đã tạo nhãn " + name + ".");
    renderSettingsPane();
    toast("Đã thêm nhãn " + name + ".");
  }

  /* ---------------- Khởi động ---------------- */

  document.addEventListener("DOMContentLoaded", function boot() {
    loadStore();
    const select = $("#roleSelect");
    if (select) {
      select.innerHTML = TEAM_IDS.map((id) => '<option value="' + id + '">' + esc(TEAM[id].short + " · " + TEAM[id].role) + "</option>").join("");
      select.addEventListener("change", () => setRole(select.value));
    }
    const progress = $("#globalProgress");
    if (progress) progress.addEventListener("click", () => navigate("#/"));
    window.addEventListener("hashchange", route);
    route();
  });
})();

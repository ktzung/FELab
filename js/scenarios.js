/* 15 kịch bản frontend của nhóm Mộc Coffee: HTML, CSS, JavaScript và Bootstrap */
(function (global) {
  "use strict";

  const BOOT_CSS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
  const BOOT_JS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";

  function nav(active) {
    const items = [
      ["index.html", "Trang chủ"],
      ["menu.html", "Thực đơn"],
      ["about.html", "Câu chuyện"],
      ["gallery.html", "Thư viện"],
      ["contact.html", "Liên hệ"],
      ["faq.html", "Hỏi đáp"]
    ];
    return '<nav class="navbar navbar-expand-lg site-header sticky-top">' +
      '<div class="container"><a class="navbar-brand" href="index.html">Mộc Coffee</a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Mở menu"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto">' +
      items.map(([href, label]) => '<li class="nav-item"><a class="nav-link' + (href === active ? " active" : "") + '" href="' + href + '">' + label + "</a></li>").join("") +
      '</ul></div></div></nav>';
  }

  function navBroken() {
    return '<nav class="navbar navbar-expand-lg site-header sticky-top">' +
      '<div class="container"><a class="navbar-brand" href="index.html">Mộc Coffee</a>' +
      '<button class="navbar-toggler" type="button" aria-label="Mở menu"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto">' +
      '<li class="nav-item"><a class="nav-link" href="index.html">Trang chủ</a></li>' +
      '<li class="nav-item"><a class="nav-link" href="menu.html">Thực đơn</a></li>' +
      '<li class="nav-item"><a class="nav-link" href="contact.html">Liên hệ</a></li>' +
      '</ul></div></div></nav>';
  }

  function footer() {
    return '<footer class="site-footer mt-auto"><div class="container"><div class="row g-3">' +
      '<div class="col-md-6"><strong>Mộc Coffee</strong><p class="mb-0">Cà phê rang mộc, không gian nhỏ và câu chuyện của người làm vườn.</p></div>' +
      '<div class="col-md-3"><strong>Trang</strong><ul class="list-unstyled mb-0"><li><a href="menu.html">Thực đơn</a></li><li><a href="gallery.html">Thư viện</a></li><li><a href="faq.html">Hỏi đáp</a></li></ul></div>' +
      '<div class="col-md-3"><strong>Ghé thăm</strong><p class="mb-0">18 Hàng Mộc, Hà Nội<br>08:00 - 21:00</p></div>' +
      '</div><hr><p class="mb-0 small">© <span id="year">2026</span> Mộc Coffee. Dự án học tập CSE122.</p></div></footer>';
  }

  function page(title, active, main, scripts) {
    return '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + title + ' | Mộc Coffee</title>\n' +
      '<link href="' + BOOT_CSS + '" rel="stylesheet">\n<link href="css/style.css" rel="stylesheet">\n</head>\n<body class="d-flex flex-column min-vh-100">\n' +
      nav(active) + '\n<main class="flex-grow-1">\n' + main + '\n</main>\n' + footer() + '\n' +
      '<script src="' + BOOT_JS + '"></script>\n<script src="js/main.js"></script>\n' + (scripts || "") + "</body>\n</html>\n";
  }

  function barePage(title, main) {
    return '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + title + ' | Mộc Coffee</title>\n' +
      '<link href="' + BOOT_CSS + '" rel="stylesheet">\n<link href="css/style.css" rel="stylesheet">\n</head>\n<body>\n<main>\n' + main + '\n</main>\n' +
      '<script src="' + BOOT_JS + '"></script>\n<script src="js/main.js"></script>\n</body>\n</html>\n';
  }

  const MAIN_JS = "document.addEventListener('DOMContentLoaded', function () {\n" +
    "  var path = location.pathname.split('/').pop() || 'index.html';\n" +
    "  document.querySelectorAll('.nav-link').forEach(function (link) {\n" +
    "    if (link.getAttribute('href') === path) link.classList.add('active');\n" +
    "  });\n" +
    "  var year = document.getElementById('year');\n" +
    "  if (year) year.textContent = new Date().getFullYear();\n" +
    "});\n";

  const CSS_BASE = ":root {\n  --moc: #6f4e37;\n  --cream: #fff8ef;\n  --leaf: #0f766e;\n  --ink: #2f241d;\n}\n\n" +
    "body {\n  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;\n  color: var(--ink);\n  background: #fffdf9;\n}\n\n" +
    ".site-header {\n  background: var(--cream);\n  border-bottom: 1px solid #eadfce;\n}\n\n" +
    ".navbar-brand {\n  color: var(--moc) !important;\n  font-weight: 700;\n  letter-spacing: 0.02em;\n}\n\n" +
    ".nav-link.active {\n  color: var(--leaf) !important;\n  font-weight: 600;\n}\n\n" +
    ".hero {\n  padding: clamp(3rem, 8vw, 6rem) 0;\n  background: linear-gradient(135deg, #fff8ef 0%, #f3e5d3 100%);\n}\n\n" +
    ".hero h1 {\n  font-size: clamp(2rem, 5vw, 3.6rem);\n  line-height: 1.1;\n  color: var(--moc);\n}\n\n" +
    ".hero .lead {\n  max-width: 34rem;\n}\n\n" +
    ".menu-card {\n  border: 0;\n  border-radius: 1rem;\n  overflow: hidden;\n  box-shadow: 0 10px 24px rgba(111, 78, 55, 0.12);\n  height: 100%;\n}\n\n" +
    ".menu-card img {\n  height: 180px;\n  object-fit: cover;\n}\n\n" +
    "figure.gallery-item {\n  margin: 0;\n}\n\n" +
    "figure.gallery-item img {\n  width: 100%;\n  height: 220px;\n  object-fit: cover;\n  border-radius: 1rem;\n}\n\n" +
    ".site-footer {\n  background: #2f241d;\n  color: #f5ede3;\n  padding-top: 2.5rem;\n}\n\n" +
    ".site-footer a {\n  color: #f5ede3;\n}\n\n" +
    "form .form-control:focus {\n  border-color: var(--leaf);\n  box-shadow: 0 0 0 0.2rem rgba(15, 118, 110, 0.15);\n}\n\n" +
    "@media (max-width: 767.98px) {\n  .hero { padding: 3rem 0; }\n  .menu-card img { height: 150px; }\n}\n";

  const CSS_FIXED = CSS_BASE.replace(".hero {\n  padding: clamp(3rem, 8vw, 6rem) 0;", ".hero {\n  width: 1100px;\n  padding: 4rem 0;")
    .replace("figure.gallery-item img {\n  width: 100%;", "figure.gallery-item img {\n  width: 900px;")
    .replace("@media (max-width: 767.98px) {\n  .hero { padding: 3rem 0; }\n  .menu-card img { height: 150px; }\n}", "");

  const CSS_RESPONSIVE = CSS_BASE +
    "\n@media (max-width: 991.98px) {\n  .hero h1 { font-size: clamp(2rem, 6vw, 3rem); }\n  .menu-card { border-radius: 0.75rem; }\n}\n" +
    "\n@media (max-width: 575.98px) {\n  .hero { padding: 2.5rem 0; }\n  .gallery-grid { --bs-gutter-x: 0.75rem; }\n  .site-footer { text-align: center; }\n}\n";

  const FORM_JS = "document.addEventListener('DOMContentLoaded', function () {\n" +
    "  var form = document.getElementById('contactForm');\n" +
    "  if (!form) return;\n" +
    "  form.addEventListener('submit', function (event) {\n" +
    "    event.preventDefault();\n" +
    "    if (!form.checkValidity()) {\n" +
    "      form.classList.add('was-validated');\n" +
    "      return;\n" +
    "    }\n" +
    "    var note = document.getElementById('formNote');\n" +
    "    if (note) { note.textContent = 'Cảm ơn bạn, Mộc Coffee sẽ phản hồi trong 24 giờ.'; note.hidden = false; }\n" +
    "    form.reset();\n" +
    "    form.classList.remove('was-validated');\n" +
    "  });\n" +
    "});\n";

  const MENU_JS = "document.addEventListener('DOMContentLoaded', function () {\n" +
    "  var buttons = document.querySelectorAll('[data-filter]');\n" +
    "  var cards = document.querySelectorAll('[data-category]');\n" +
    "  buttons.forEach(function (button) {\n" +
    "    button.addEventListener('click', function () {\n" +
    "      var value = button.getAttribute('data-filter');\n" +
    "      buttons.forEach(function (item) { item.classList.toggle('active', item === button); });\n" +
    "      cards.forEach(function (card) {\n" +
    "        var show = value === 'all' || card.getAttribute('data-category') === value;\n" +
    "        card.classList.toggle('d-none', !show);\n" +
    "      });\n" +
    "    });\n" +
    "  });\n" +
    "});\n";

  const HOME_HERO = '<section class="hero"><div class="container"><div class="row align-items-center g-5">' +
    '<div class="col-lg-6"><p class="text-uppercase small fw-semibold text-success">Cà phê rang mộc</p>' +
    '<h1>Một chỗ ngồi nhỏ,<br>một tách cà phê thật.</h1>' +
    '<p class="lead mt-3">Mộc Coffee chọn hạt Việt Nam, rang vừa và pha theo cách đơn giản nhất. Ghé 18 Hàng Mộc, ngồi cạnh cửa sổ và để buổi sáng chậm lại.</p>' +
    '<a class="btn btn-dark btn-lg mt-3" href="menu.html">Xem thực đơn</a></div>' +
    '<div class="col-lg-6"><img class="img-fluid rounded-4 shadow" src="https://picsum.photos/seed/moc-hero/900/700" alt="Quầy pha chế nhỏ với cà phê và cây xanh"></div>' +
    '</div></div></section>' +
    '<section class="py-5"><div class="container"><div class="row g-4">' +
    '<div class="col-md-4"><div class="p-4 bg-white rounded-4 shadow-sm h-100"><h2 class="h5">Hạt từ Đà Lạt</h2><p class="mb-0">Robusta và Arabica từ nông trại nhỏ, rang mỗi tuần.</p></div></div>' +
    '<div class="col-md-4"><div class="p-4 bg-white rounded-4 shadow-sm h-100"><h2 class="h5">Menu ngắn</h2><p class="mb-0">Chỉ những món chúng tôi làm tốt nhất, không dàn trải.</p></div></div>' +
    '<div class="col-md-4"><div class="p-4 bg-white rounded-4 shadow-sm h-100"><h2 class="h5">Không gian nhỏ</h2><p class="mb-0">Mười hai chỗ ngồi, phù hợp đọc sách và làm việc buổi sáng.</p></div></div>' +
    '</div></div></section>';

  const MENU_CARDS = [
    ["Cà phê đen", "ca-phe", "Đậm, hậu ngọt", "https://picsum.photos/seed/moc-den/640/480"],
    ["Cà phê sữa", "ca-phe", "Sữa đặc, đá nhiều", "https://picsum.photos/seed/moc-sua/640/480"],
    ["Bạc xỉu", "ca-phe", "Nhiều sữa, nhẹ", "https://picsum.photos/seed/moc-bac/640/480"],
    ["Trà sen", "tra", "Thơm, thanh", "https://picsum.photos/seed/moc-sen/640/480"],
    ["Trà đào", "tra", "Đào ngâm, đá", "https://picsum.photos/seed/moc-dao/640/480"],
    ["Bánh mì bơ", "banh", "Giòn, bơ mặn", "https://picsum.photos/seed/moc-banh/640/480"]
  ];

  function menuCards() {
    return MENU_CARDS.map(([name, category, note, img]) =>
      '<div class="col-12 col-md-6 col-lg-4" data-category="' + category + '"><article class="card menu-card">' +
      '<img src="' + img + '" class="card-img-top" alt="' + name + ' tại Mộc Coffee" loading="lazy">' +
      '<div class="card-body"><h2 class="h5 card-title">' + name + '</h2><p class="card-text text-secondary">' + note + '</p><span class="badge text-bg-light">' + category + '</span></div>' +
      '</article></div>'
    ).join("");
  }

  const MENU_MAIN = '<section class="py-5"><div class="container"><div class="row align-items-end g-3 mb-4">' +
    '<div class="col-md-8"><p class="text-uppercase small fw-semibold text-success">Thực đơn</p><h1 class="display-6">Đồ uống và món nhẹ</h1></div>' +
    '<div class="col-md-4 text-md-end"><p class="text-secondary mb-0">Phục vụ 08:00 - 21:00</p></div></div>' +
    '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">' + menuCards() + "</div></div></section>";

  const CONTACT_MAIN = '<section class="py-5"><div class="container"><div class="row g-5">' +
    '<div class="col-lg-5"><p class="text-uppercase small fw-semibold text-success">Liên hệ</p><h1 class="display-6">Đặt bàn hoặc góp ý</h1>' +
    '<p class="text-secondary">Điền form, chúng tôi trả lời trong 24 giờ. Nếu cần gấp, gọi số 024 1234 5678.</p>' +
    '<p class="mb-0">18 Hàng Mộc, Hà Nội</p><p>08:00 - 21:00 hằng ngày</p></div>' +
    '<div class="col-lg-7"><form id="contactForm" class="needs-validation" novalidate>' +
    '<div class="row g-3"><div class="col-md-6"><label class="form-label" for="name">Họ tên</label><input class="form-control" id="name" name="name" type="text" required></div>' +
    '<div class="col-md-6"><label class="form-label" for="email">Email</label><input class="form-control" id="email" name="email" type="email" required></div>' +
    '<div class="col-12"><label class="form-label" for="message">Nội dung</label><textarea class="form-control" id="message" name="message" rows="5" required></textarea></div></div>' +
    '<button class="btn btn-dark mt-3" type="submit">Gửi liên hệ</button><p class="text-success mt-3" id="formNote" hidden></p>' +
    '</form></div></div></div></section>';

  const CONTACT_NO_LABEL = '<section class="py-5"><div class="container"><div class="row g-5">' +
    '<div class="col-lg-5"><p class="text-uppercase small fw-semibold text-success">Liên hệ</p><h1 class="display-6">Đặt bàn hoặc góp ý</h1>' +
    '<p class="text-secondary">Điền form, chúng tôi trả lời trong 24 giờ.</p></div>' +
    '<div class="col-lg-7"><form id="contactForm" class="needs-validation" novalidate>' +
    '<div class="row g-3"><div class="col-md-6"><input class="form-control" name="name" type="text" placeholder="Họ tên" required></div>' +
    '<div class="col-md-6"><input class="form-control" name="email" type="email" placeholder="Email" required></div>' +
    '<div class="col-12"><textarea class="form-control" name="message" rows="5" placeholder="Nội dung" required></textarea></div></div>' +
    '<button class="btn btn-dark mt-3" type="submit">Gửi liên hệ</button></form></div></div></div></section>';

  const ABOUT_MAIN = '<section class="py-5"><div class="container"><div class="row g-5 align-items-center">' +
    '<div class="col-lg-6"><img class="img-fluid rounded-4" src="https://picsum.photos/seed/moc-about/900/700" alt="Người pha chế rót cà phê tại quầy gỗ"></div>' +
    '<div class="col-lg-6"><p class="text-uppercase small fw-semibold text-success">Câu chuyện</p><h1 class="display-6">Bắt đầu từ một chiếc bàn gỗ</h1>' +
    '<p>Mộc Coffee mở cửa năm 2024 từ một chiếc bàn gỗ nhỏ và hai người bạn thích cà phê rang mộc. Chúng tôi học cách rang từng mẻ, ghi lại nhiệt độ và giữ menu thật ngắn.</p>' +
    '<p>Mỗi tuần, hạt được rang hai lần. Bạn có thể hỏi barista về nguồn gốc, cách pha và cả lý do chúng tôi chọn ly sứ thay vì ly nhựa.</p></div>' +
    '</div></div></section>';

  const GALLERY_MAIN = '<section class="py-5"><div class="container"><p class="text-uppercase small fw-semibold text-success">Thư viện</p>' +
    '<h1 class="display-6 mb-4">Một buổi sáng ở Mộc</h1><div class="row gallery-grid g-4">' +
    [1, 2, 3, 4, 5, 6].map((n) => '<div class="col-12 col-md-4"><figure class="gallery-item"><img src="https://picsum.photos/seed/moc-gallery-' + n + '/700/520" alt="Khoảnh khắc ' + n + ' tại quán Mộc Coffee" loading="lazy"></figure></div>').join("") +
    "</div></div></section>";

  const FAQ_MAIN = '<section class="py-5"><div class="container"><p class="text-uppercase small fw-semibold text-success">Hỏi đáp</p>' +
    '<h1 class="display-6 mb-4">Những câu hỏi thường gặp</h1><div class="accordion" id="faqList">' +
    '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">Quán có chỗ làm việc không?</button></h2><div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqList"><div class="accordion-body">Có ổ điện tại bốn bàn cạnh cửa sổ. Buổi sáng thường yên tĩnh hơn.</div></div></div>' +
    '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">Có sữa hạt không?</button></h2><div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqList"><div class="accordion-body">Có sữa yến mạch và sữa hạt điều, phụ thu 10.000 đồng.</div></div></div>' +
    '<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">Nhóm 6 người cần đặt bàn không?</button></h2><div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqList"><div class="accordion-body">Nên gọi trước 30 phút để quán xếp bàn dài.</div></div></div>' +
    '</div></div></section>';

  const FILES = {
    "README.md": "# Mộc Coffee\n\nWebsite tĩnh 6 trang cho quán cà phê nhỏ, dựng bằng HTML5, CSS, JavaScript và Bootstrap 5.\n\n## Cấu trúc\n\n- index.html, gallery.html: Minh\n- menu.html, about.html, css/style.css: Lan\n- contact.html, faq.html, js/main.js: Huy\n\n## Kiểm tra\n\n- npm run check\n- Mở index.html bằng trình duyệt hoặc GitHub Pages.\n",
    "package.json": "{\n  \"name\": \"moc-coffee\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"check\": \"node scripts/check-pages.js\",\n    \"check:html\": \"node scripts/check-pages.js\",\n    \"check:css\": \"node scripts/check-pages.js\"\n  }\n}\n",
    "index.html": page("Trang chủ", "index.html", HOME_HERO),
    "menu.html": page("Thực đơn", "menu.html", MENU_MAIN),
    "about.html": page("Câu chuyện", "about.html", ABOUT_MAIN),
    "gallery.html": page("Thư viện", "gallery.html", GALLERY_MAIN),
    "contact.html": page("Liên hệ", "contact.html", CONTACT_MAIN),
    "faq.html": page("Hỏi đáp", "faq.html", FAQ_MAIN),
    "css/style.css": CSS_BASE,
    "js/main.js": MAIN_JS,
    ".gitignore": ".DS_Store\nnode_modules/\n"
  };

  const copy = (value) => JSON.parse(JSON.stringify(value));
  const files = (extra) => Object.assign(copy(FILES), extra || {});
  const baseSeed = (extra) => Object.assign({
    files: files(),
    message: "chore: khởi tạo website Mộc Coffee",
    branch: "main"
  }, extra || {});
  const PROTECTED = { main: { prRequired: true, reviews: 1, checks: ["ci/pages"], directPush: false } };

  function tip(sim) {
    const sha = sim.headSha();
    return sha ? sim.commits[sha] : null;
  }

  function headFiles(sim, ref) {
    return sim.snapshotOf(ref || "HEAD");
  }

  function mainFiles(sim) {
    return sim.branches.main ? sim.commits[sim.branches.main].files : {};
  }

  function clean(sim) {
    const info = sim.statusInfo();
    return info.dirty === false && info.conflicts.length === 0;
  }

  function contains(text, needle) {
    return String(text || "").indexOf(needle) > -1;
  }

  function branchHas(sim, name, path, needle) {
    const snap = headFiles(sim, name);
    return contains(snap[path], needle);
  }

  const SCENARIOS = [
    {
      id: "s01",
      module: "m1",
      order: 1,
      title: "Khởi tạo kho Mộc Coffee",
      role: "minh",
      level: "Nhập môn",
      minutes: 10,
      skills: ["git init", "git config", "git remote", "push -u"],
      brief: "Minh nhận thư mục website 6 trang của Mộc Coffee. Mã đã có nhưng chưa phải kho Git. Hãy khởi tạo kho, đặt danh tính, nối GitHub và đưa commit đầu tiên lên main.",
      tasks: [
        "Khởi tạo kho Git trong thư mục hiện tại.",
        "Đặt user.name là Nguyễn Minh và user.email là minh@moccoffee.dev.",
        "Stage toàn bộ tệp và commit với thông điệp bắt đầu bằng chore:.",
        "Thêm remote origin trỏ tới git@github.com:ktzung/moc-coffee.git.",
        "Push main lần đầu và gắn upstream."
      ],
      hints: [
        "Ba lệnh đầu: git init, git config user.name, git config user.email.",
        "Dùng git add . rồi git commit -m \"chore: khởi tạo website Mộc Coffee\".",
        "Lần push đầu cần -u: git push -u origin main."
      ],
      seed: { role: "minh", uninitialized: true, empty: true, files: files(), branch: "main" },
      checks: [
        { id: "init", label: "Kho Git đã được khởi tạo", hint: "Chạy git init.", test: (sim) => sim.initialized === true },
        { id: "name", label: "Đã đặt tên và email của Minh", hint: "git config user.name và user.email.", test: (sim) => sim.user().name === "Nguyễn Minh" && sim.user().email === "minh@moccoffee.dev" },
        { id: "commit", label: "Có commit đầu tiên trên main", hint: "Stage rồi commit với chore:.", test: (sim) => !!sim.branches.main && /^chore:\s/.test(sim.commits[sim.branches.main].message) },
        { id: "pages", label: "Cả index.html và menu.html nằm trong commit", hint: "git add . để stage toàn bộ 6 trang.", test: (sim) => { const snap = mainFiles(sim); return !!snap["index.html"] && !!snap["menu.html"] && !!snap["contact.html"]; } },
        { id: "remote", label: "Remote origin đúng địa chỉ", hint: "git remote add origin git@github.com:ktzung/moc-coffee.git.", test: (sim) => contains(sim.remote.url, "ktzung/moc-coffee") },
        { id: "push", label: "main trên GitHub trùng với local", hint: "git push -u origin main.", test: (sim) => !!sim.branches.main && sim.remote.branches.main === sim.branches.main }
      ],
      solution: [
        { label: "Khởi tạo kho", run: "git init" },
        { label: "Đặt tên", run: "git config user.name \"Nguyễn Minh\"" },
        { label: "Đặt email", run: "git config user.email minh@moccoffee.dev" },
        { label: "Stage toàn bộ", run: "git add ." },
        { label: "Commit đầu tiên", run: "git commit -m \"chore: khởi tạo website Mộc Coffee\"" },
        { label: "Nối GitHub", run: "git remote add origin git@github.com:ktzung/moc-coffee.git" },
        { label: "Push main", run: "git push -u origin main" }
      ]
    },
    {
      id: "s02",
      module: "m1",
      order: 2,
      title: "Chia 6 trang bằng issue",
      role: "lan",
      level: "Nhập môn",
      minutes: 10,
      skills: ["gh label", "gh issue create", "assignee"],
      brief: "Lan lập kế hoạch sprint: mỗi trang là một issue, có nhãn theo công nghệ và người phụ trách. Cả ba đều nhận trang, kể cả Tech Lead.",
      tasks: [
        "Tạo nhãn frontend, html-css, javascript và bootstrap.",
        "Tạo 6 issue, mỗi issue là một trang: chủ, thực đơn, câu chuyện, thư viện, liên hệ, hỏi đáp.",
        "Giao trang chủ và thư viện cho minh; thực đơn và câu chuyện cho lan; liên hệ và hỏi đáp cho huy.",
        "Mỗi issue có nhãn, người nhận và mô tả ít nhất một câu."
      ],
      hints: [
        "Tạo nhãn: gh label create frontend --color b45309 --description \"Giao diện chung\".",
        "Tạo issue: gh issue create --title \"...\" --label html-css --assignee lan --body \"...\".",
        "Dùng gh issue list để kiểm tra đủ 6 issue."
      ],
      seed: baseSeed({ role: "lan", labels: [], issues: [] }),
      checks: [
        { id: "labels", label: "Đủ 4 nhãn công nghệ", hint: "frontend, html-css, javascript, bootstrap.", test: (sim) => ["frontend", "html-css", "javascript", "bootstrap"].every((name) => sim.labels.some((label) => label.name === name)) },
        { id: "count", label: "Có đủ 6 issue cho 6 trang", hint: "Mỗi trang một issue.", test: (sim) => sim.issues.length >= 6 },
        { id: "assign", label: "Cả ba người đều có trang", hint: "Dùng --assignee minh, lan hoặc huy.", test: (sim) => ["minh", "lan", "huy"].every((id) => sim.issues.some((issue) => issue.assignee === id)) },
        { id: "labels-used", label: "Mỗi issue có ít nhất một nhãn", hint: "Thêm --label khi tạo issue.", test: (sim) => sim.issues.length >= 6 && sim.issues.every((issue) => issue.labels.length > 0) },
        { id: "body", label: "Mỗi issue có mô tả", hint: "Thêm --body \"...\".", test: (sim) => sim.issues.length >= 6 && sim.issues.every((issue) => issue.body.trim().length > 10) }
      ],
      solution: [
        { label: "Nhãn frontend", run: "gh label create frontend --color b45309 --description \"Giao diện chung\"" },
        { label: "Nhãn HTML/CSS", run: "gh label create html-css --color 0f766e --description \"Bố cục và giao diện\"" },
        { label: "Nhãn JavaScript", run: "gh label create javascript --color 7c3aed --description \"Tương tác trình duyệt\"" },
        { label: "Nhãn Bootstrap", run: "gh label create bootstrap --color 2563eb --description \"Thành phần Bootstrap 5\"" },
        { label: "Issue trang chủ", run: "gh issue create --title \"Trang chủ: giới thiệu quán và món nổi bật\" --label frontend,bootstrap --assignee minh --body \"Dựng hero, ba thẻ giới thiệu và liên kết tới thực đơn.\"" },
        { label: "Issue thực đơn", run: "gh issue create --title \"Thực đơn: lưới thẻ Bootstrap\" --label html-css,bootstrap --assignee lan --body \"Sáu món, lưới responsive, ảnh có alt và nhãn danh mục.\"" },
        { label: "Issue câu chuyện", run: "gh issue create --title \"Câu chuyện: nội dung và bố cục hai cột\" --label html-css --assignee lan --body \"Kể câu chuyện quán, ảnh lớn bên trái, chữ bên phải.\"" },
        { label: "Issue thư viện", run: "gh issue create --title \"Thư viện: sáu ảnh có alt\" --label frontend --assignee minh --body \"Lưới ảnh ba cột trên desktop, một cột trên điện thoại.\"" },
        { label: "Issue liên hệ", run: "gh issue create --title \"Liên hệ: form đặt bàn có kiểm tra dữ liệu\" --label javascript,bootstrap --assignee huy --body \"Form có label, trường bắt buộc và thông báo sau khi gửi.\"" },
        { label: "Issue hỏi đáp", run: "gh issue create --title \"Hỏi đáp: accordion Bootstrap\" --label javascript,bootstrap --assignee huy --body \"Ba câu hỏi, mở đóng bằng accordion và kiểm tra bàn phím.\"" }
      ]
    },
    {
      id: "s03",
      module: "m1",
      order: 3,
      title: "Navbar và footer dùng chung",
      role: "huy",
      level: "Cơ bản",
      minutes: 12,
      skills: ["git switch -c", "Bootstrap navbar", "footer", "push -u"],
      brief: "Ba trang cuối chưa có navbar và footer. Huy dựng khung dùng chung từ index.html, chép đúng markup sang các trang còn lại, rồi đưa lên nhánh riêng để cả nhóm review.",
      tasks: [
        "Tạo nhánh feature/shared-layout từ main.",
        "Bổ sung navbar và footer giống index.html cho about.html, gallery.html và faq.html.",
        "Giữ đúng 6 liên kết trong navbar và đủ mục trong footer.",
        "Commit với thông điệp bắt đầu bằng feat: rồi push nhánh lên origin.",
        "Không sửa trực tiếp main."
      ],
      hints: [
        "Tạo nhánh: git switch -c feature/shared-layout.",
        "Mở tab Files, chọn about.html và dán navbar/footer từ index.html.",
        "Commit: git commit -m \"feat(layout): dùng chung navbar và footer\".",
        "Push: git push -u origin feature/shared-layout."
      ],
      seed: baseSeed({
        role: "huy",
        files: files({
          "about.html": barePage("Câu chuyện", ABOUT_MAIN),
          "gallery.html": barePage("Thư viện", GALLERY_MAIN),
          "faq.html": barePage("Hỏi đáp", FAQ_MAIN)
        })
      }),
      checks: [
        { id: "branch", label: "Nhánh feature/shared-layout tồn tại", hint: "git switch -c feature/shared-layout.", test: (sim) => !!sim.branches["feature/shared-layout"] },
        { id: "main", label: "main vẫn giữ nguyên", hint: "Làm việc trên nhánh riêng.", test: (sim) => sim.branches.main !== sim.branches["feature/shared-layout"] },
        { id: "nav", label: "Cả 6 trang đều có navbar", hint: "Chép nguyên khối nav từ index.html.", test: (sim) => ["index.html", "menu.html", "about.html", "gallery.html", "contact.html", "faq.html"].every((path) => branchHas(sim, "feature/shared-layout", path, '<nav class="navbar')) },
        { id: "footer", label: "Cả 6 trang đều có footer", hint: "Footer có địa chỉ, giờ mở cửa và năm.", test: (sim) => ["index.html", "menu.html", "about.html", "gallery.html", "contact.html", "faq.html"].every((path) => branchHas(sim, "feature/shared-layout", path, '<footer class="site-footer')) },
        { id: "message", label: "Commit mô tả đúng việc", hint: "Dùng feat(layout): ...", test: (sim) => { const sha = sim.branches["feature/shared-layout"]; return !!sha && /^feat(\(layout\))?:\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin feature/shared-layout.", test: (sim) => sim.remote.branches["feature/shared-layout"] === sim.branches["feature/shared-layout"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c feature/shared-layout" },
        { label: "Trang câu chuyện có khung", write: { path: "about.html", content: FILES["about.html"] } },
        { label: "Trang thư viện có khung", write: { path: "gallery.html", content: FILES["gallery.html"] } },
        { label: "Trang hỏi đáp có khung", write: { path: "faq.html", content: FILES["faq.html"] } },
        { label: "Stage ba trang", run: "git add about.html gallery.html faq.html" },
        { label: "Commit", run: "git commit -m \"feat(layout): dùng chung navbar và footer\"" },
        { label: "Push nhánh", run: "git push -u origin feature/shared-layout" }
      ]
    },
    {
      id: "s04",
      module: "m2",
      order: 4,
      title: "Trang thực đơn với lưới Bootstrap",
      role: "lan",
      level: "Cơ bản",
      minutes: 12,
      skills: ["Bootstrap grid", "card", "HTML5", "git add"],
      brief: "Lan dựng trang thực đơn: sáu món, lưới ba cột trên desktop, hai cột trên tablet và một cột trên điện thoại. Mỗi thẻ có ảnh alt, tên món và nhãn danh mục.",
      tasks: [
        "Tạo nhánh feature/menu-grid từ main.",
        "Dựng menu.html với row row-cols-1 row-cols-md-2 row-cols-lg-3 và sáu card.",
        "Mỗi card có ảnh với alt, tên món, mô tả ngắn và data-category.",
        "Commit bắt đầu bằng feat(menu): rồi push nhánh lên origin."
      ],
      hints: [
        "Dùng <div class=\"row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4\">.",
        "Mỗi món là một <article class=\"card menu-card\"> nằm trong cột.",
        "Ảnh phải có alt mô tả món, không để alt rỗng.",
        "Commit mẫu: feat(menu): dựng lưới thẻ Bootstrap."
      ],
      seed: baseSeed({
        role: "lan",
        files: files({
          "menu.html": page("Thực đơn", "menu.html", '<section class="py-5"><div class="container"><h1 class="display-6">Thực đơn</h1><p>Cà phê, trà và bánh.</p></div></section>')
        })
      }),
      checks: [
        { id: "branch", label: "Nhánh feature/menu-grid tồn tại", hint: "git switch -c feature/menu-grid.", test: (sim) => !!sim.branches["feature/menu-grid"] },
        { id: "grid", label: "Dùng lưới responsive của Bootstrap", hint: "row-cols-1, row-cols-md-2, row-cols-lg-3.", test: (sim) => branchHas(sim, "feature/menu-grid", "menu.html", "row-cols-lg-3") && branchHas(sim, "feature/menu-grid", "menu.html", "row-cols-md-2") },
        { id: "cards", label: "Có đủ 6 card món", hint: "Mỗi món một thẻ card.", test: (sim) => { const html = headFiles(sim, "feature/menu-grid")["menu.html"] || ""; return (html.match(/class="card menu-card"/g) || []).length >= 6; } },
        { id: "category", label: "Mỗi món có data-category", hint: "Dùng ca-phe, tra hoặc banh.", test: (sim) => { const html = headFiles(sim, "feature/menu-grid")["menu.html"] || ""; return (html.match(/data-category=/g) || []).length >= 6; } },
        { id: "alt", label: "Ảnh có alt mô tả", hint: "Không dùng alt rỗng cho ảnh món.", test: (sim) => { const html = headFiles(sim, "feature/menu-grid")["menu.html"] || ""; return (html.match(/alt="[^"]+"/g) || []).length >= 6; } },
        { id: "message", label: "Commit theo mẫu feat(menu):", hint: "feat(menu): dựng lưới thẻ Bootstrap.", test: (sim) => { const sha = sim.branches["feature/menu-grid"]; return !!sha && /^feat\(menu\):\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin feature/menu-grid.", test: (sim) => sim.remote.branches["feature/menu-grid"] === sim.branches["feature/menu-grid"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c feature/menu-grid" },
        { label: "Dựng menu", write: { path: "menu.html", content: FILES["menu.html"] } },
        { label: "Stage", run: "git add menu.html" },
        { label: "Commit", run: "git commit -m \"feat(menu): dựng lưới thẻ Bootstrap\"" },
        { label: "Push", run: "git push -u origin feature/menu-grid" }
      ]
    },
    {
      id: "s05",
      module: "m2",
      order: 5,
      title: "Form liên hệ và kiểm tra dữ liệu",
      role: "huy",
      level: "Cơ bản",
      minutes: 15,
      skills: ["form Bootstrap", "label", "checkValidity", "JavaScript"],
      brief: "Huy dựng form đặt bàn có nhãn rõ ràng, trường bắt buộc và phản hồi sau khi gửi. Đây là chỗ dễ mất điểm accessibility nhất, nên label phải gắn đúng với input.",
      tasks: [
        "Tạo nhánh feature/contact-form từ main.",
        "Dựng contact.html với form id=contactForm, đủ label cho họ tên, email và nội dung.",
        "Viết js/form.js dùng checkValidity và hiển thị thông báo cảm ơn.",
        "Commit bắt đầu bằng feat(contact): rồi push nhánh lên origin."
      ],
      hints: [
        "Mỗi input cần label for trùng với id.",
        "Thêm required và type=email cho đúng trường.",
        "Trong JS: form.addEventListener('submit', ...); if (!form.checkValidity()) { ... }.",
        "Commit: feat(contact): thêm form đặt bàn có kiểm tra."
      ],
      seed: baseSeed({
        role: "huy",
        files: files({
          "contact.html": page("Liên hệ", "contact.html", '<section class="py-5"><div class="container"><h1 class="display-6">Liên hệ</h1><p>Form đang được dựng.</p></div></section>')
        })
      }),
      checks: [
        { id: "branch", label: "Nhánh feature/contact-form tồn tại", hint: "git switch -c feature/contact-form.", test: (sim) => !!sim.branches["feature/contact-form"] },
        { id: "form", label: "Trang liên hệ có form đúng id", hint: "Dùng form id=\"contactForm\".", test: (sim) => branchHas(sim, "feature/contact-form", "contact.html", 'id="contactForm"') },
        { id: "labels", label: "Đủ label cho ba trường", hint: "label for phải khớp id của input.", test: (sim) => { const html = headFiles(sim, "feature/contact-form")["contact.html"] || ""; return ["name", "email", "message"].every((id) => html.indexOf('for="' + id + '"') > -1 && html.indexOf('id="' + id + '"') > -1); } },
        { id: "required", label: "Có trường bắt buộc và email đúng kiểu", hint: "Thêm required; email dùng type=\"email\".", test: (sim) => branchHas(sim, "feature/contact-form", "contact.html", 'type="email"') && branchHas(sim, "feature/contact-form", "contact.html", "required") },
        { id: "js", label: "JavaScript kiểm tra và phản hồi", hint: "js/form.js dùng checkValidity và bắt sự kiện submit.", test: (sim) => { const js = headFiles(sim, "feature/contact-form")["js/form.js"] || ""; return contains(js, "checkValidity") && contains(js, "addEventListener('submit'"); } },
        { id: "message", label: "Commit theo mẫu feat(contact):", hint: "feat(contact): thêm form đặt bàn có kiểm tra.", test: (sim) => { const sha = sim.branches["feature/contact-form"]; return !!sha && /^feat\(contact\):\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin feature/contact-form.", test: (sim) => sim.remote.branches["feature/contact-form"] === sim.branches["feature/contact-form"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c feature/contact-form" },
        { label: "Dựng form", write: { path: "contact.html", content: page("Liên hệ", "contact.html", CONTACT_MAIN, '<script src="js/form.js"></script>\n') } },
        { label: "Viết kiểm tra form", write: { path: "js/form.js", content: FORM_JS } },
        { label: "Stage", run: "git add contact.html js/form.js" },
        { label: "Commit", run: "git commit -m \"feat(contact): thêm form đặt bàn có kiểm tra\"" },
        { label: "Push", run: "git push -u origin feature/contact-form" }
      ]
    },
    {
      id: "s06",
      module: "m2",
      order: 6,
      title: "Trang chủ và thư viện ảnh",
      role: "minh",
      level: "Cơ bản",
      minutes: 12,
      skills: ["hero", "grid ảnh", "alt", "commit"],
      brief: "Minh hoàn thiện hai trang của mình: trang chủ có hero và ba điểm giới thiệu, thư viện có sáu ảnh alt rõ ràng. Đây là bộ mặt của quán khi khách mở link.",
      tasks: [
        "Tạo nhánh feature/home-gallery từ main.",
        "Dựng index.html với hero, nút Xem thực đơn và ba thẻ giới thiệu.",
        "Dựng gallery.html với sáu ảnh, mỗi ảnh có alt mô tả.",
        "Commit bắt đầu bằng feat(home): rồi push nhánh lên origin."
      ],
      hints: [
        "Hero dùng section class=\"hero\" và một ảnh lớn.",
        "Gallery dùng lưới col-12 col-md-4.",
        "Mỗi figure có img với alt cụ thể, không viết alt chung chung.",
        "Commit: feat(home): hoàn thiện trang chủ và thư viện."
      ],
      seed: baseSeed({
        role: "minh",
        files: files({
          "index.html": page("Trang chủ", "index.html", '<section class="py-5"><div class="container"><h1>Mộc Coffee</h1></div></section>'),
          "gallery.html": page("Thư viện", "gallery.html", '<section class="py-5"><div class="container"><h1>Thư viện</h1></div></section>')
        })
      }),
      checks: [
        { id: "branch", label: "Nhánh feature/home-gallery tồn tại", hint: "git switch -c feature/home-gallery.", test: (sim) => !!sim.branches["feature/home-gallery"] },
        { id: "hero", label: "Trang chủ có hero và nút thực đơn", hint: "Thêm section.hero và liên kết menu.html.", test: (sim) => { const html = headFiles(sim, "feature/home-gallery")["index.html"] || ""; return contains(html, 'class="hero"') && contains(html, 'href="menu.html"'); } },
        { id: "cards", label: "Trang chủ có ba thẻ giới thiệu", hint: "Dùng ba cột col-md-4.", test: (sim) => { const html = headFiles(sim, "feature/home-gallery")["index.html"] || ""; return (html.match(/col-md-4/g) || []).length >= 3; } },
        { id: "gallery", label: "Thư viện có sáu ảnh", hint: "Sáu figure hoặc sáu img.", test: (sim) => { const html = headFiles(sim, "feature/home-gallery")["gallery.html"] || ""; return (html.match(/<img/g) || []).length >= 6; } },
        { id: "alt", label: "Ảnh thư viện có alt mô tả", hint: "Mỗi img cần alt cụ thể.", test: (sim) => { const html = headFiles(sim, "feature/home-gallery")["gallery.html"] || ""; return (html.match(/alt="[^"]+"/g) || []).length >= 6; } },
        { id: "message", label: "Commit theo mẫu feat(home):", hint: "feat(home): hoàn thiện trang chủ và thư viện.", test: (sim) => { const sha = sim.branches["feature/home-gallery"]; return !!sha && /^feat\(home\):\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin feature/home-gallery.", test: (sim) => sim.remote.branches["feature/home-gallery"] === sim.branches["feature/home-gallery"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c feature/home-gallery" },
        { label: "Dựng trang chủ", write: { path: "index.html", content: FILES["index.html"] } },
        { label: "Dựng thư viện", write: { path: "gallery.html", content: FILES["gallery.html"] } },
        { label: "Stage", run: "git add index.html gallery.html" },
        { label: "Commit", run: "git commit -m \"feat(home): hoàn thiện trang chủ và thư viện\"" },
        { label: "Push", run: "git push -u origin feature/home-gallery" }
      ]
    },
    {
      id: "s07",
      module: "m2",
      order: 7,
      title: "Responsive ba mốc màn hình",
      role: "lan",
      level: "Cơ bản",
      minutes: 12,
      skills: ["media query", "clamp", "max-width", "mobile first"],
      brief: "Trang đang bị tràn ngang vì hero và ảnh đặt chiều rộng cố định. Lan sửa CSS theo hướng co giãn, thêm media query cho tablet và điện thoại, rồi kiểm tra lại ở 390, 768 và 1440 px.",
      tasks: [
        "Tạo nhánh style/responsive từ main.",
        "Bỏ chiều rộng cố định 1100px và 900px trong css/style.css.",
        "Thêm media query cho 991.98px và 575.98px; dùng max-width cho ảnh.",
        "Commit bắt đầu bằng feat(style): rồi push nhánh lên origin."
      ],
      hints: [
        "Đổi width cố định thành max-width: 100% hoặc bỏ hẳn.",
        "Dùng @media (max-width: 767.98px) cho điện thoại.",
        "Ảnh trong figure cần width: 100%; height tự động hoặc object-fit.",
        "Commit: feat(style): làm trang co giãn trên ba mốc màn hình."
      ],
      seed: baseSeed({ role: "lan", files: files({ "css/style.css": CSS_FIXED }) }),
      checks: [
        { id: "branch", label: "Nhánh style/responsive tồn tại", hint: "git switch -c style/responsive.", test: (sim) => !!sim.branches["style/responsive"] },
        { id: "fixed", label: "Không còn chiều rộng cố định 1100px", hint: "Bỏ width: 1100px khỏi .hero.", test: (sim) => !branchHas(sim, "style/responsive", "css/style.css", "width: 1100px") },
        { id: "media", label: "Có ít nhất hai media query", hint: "Thêm mốc 991.98px và 575.98px.", test: (sim) => { const css = headFiles(sim, "style/responsive")["css/style.css"] || ""; return (css.match(/@media/g) || []).length >= 2; } },
        { id: "mobile", label: "Có mốc điện thoại 575.98px", hint: "Thêm @media (max-width: 575.98px).", test: (sim) => branchHas(sim, "style/responsive", "css/style.css", "575.98px") },
        { id: "clamp", label: "Tiêu đề dùng kích thước co giãn", hint: "Giữ clamp cho .hero h1.", test: (sim) => branchHas(sim, "style/responsive", "css/style.css", "clamp(") },
        { id: "message", label: "Commit theo mẫu feat(style):", hint: "feat(style): làm trang co giãn trên ba mốc màn hình.", test: (sim) => { const sha = sim.branches["style/responsive"]; return !!sha && /^feat\(style\):\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin style/responsive.", test: (sim) => sim.remote.branches["style/responsive"] === sim.branches["style/responsive"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c style/responsive" },
        { label: "Sửa CSS co giãn", write: { path: "css/style.css", content: CSS_RESPONSIVE } },
        { label: "Stage", run: "git add css/style.css" },
        { label: "Commit", run: "git commit -m \"feat(style): làm trang co giãn trên ba mốc màn hình\"" },
        { label: "Push", run: "git push -u origin style/responsive" }
      ]
    },
    {
      id: "s08",
      module: "m2",
      order: 8,
      title: "Lọc thực đơn bằng JavaScript",
      role: "huy",
      level: "Trung cấp",
      minutes: 15,
      skills: ["DOM", "querySelectorAll", "classList", "data attribute"],
      brief: "Huy thêm bộ lọc Cà phê, Trà, Bánh cho thực đơn. Nút lọc đọc data-filter, thẻ món đọc data-category và ẩn/hiện bằng lớp d-none của Bootstrap. Không cần tải lại trang.",
      tasks: [
        "Tạo nhánh feature/menu-filter từ main.",
        "Thêm bốn nút lọc với data-filter all, ca-phe, tra, banh và trạng thái active.",
        "Viết js/menu-filter.js dùng querySelectorAll, addEventListener và classList.toggle('d-none').",
        "Nhúng file JS vào menu.html, commit feat(menu): rồi push nhánh."
      ],
      hints: [
        "Nút: button data-filter=\"ca-phe\".",
        "Thẻ món đã có data-category; giữ nguyên để JS lọc.",
        "Dùng event listener trên từng nút, không dùng onclick trong HTML.",
        "Commit: feat(menu): thêm bộ lọc món bằng JavaScript."
      ],
      seed: baseSeed({ role: "huy" }),
      checks: [
        { id: "branch", label: "Nhánh feature/menu-filter tồn tại", hint: "git switch -c feature/menu-filter.", test: (sim) => !!sim.branches["feature/menu-filter"] },
        { id: "buttons", label: "Có đủ bốn nút lọc", hint: "all, ca-phe, tra, banh.", test: (sim) => { const html = headFiles(sim, "feature/menu-filter")["menu.html"] || ""; return ["all", "ca-phe", "tra", "banh"].every((value) => html.indexOf('data-filter="' + value + '"') > -1); } },
        { id: "script", label: "Trang thực đơn nhúng js/menu-filter.js", hint: "Thêm script src ngay trước body kết thúc.", test: (sim) => branchHas(sim, "feature/menu-filter", "menu.html", 'src="js/menu-filter.js"') },
        { id: "query", label: "JS chọn đúng nút và thẻ", hint: "querySelectorAll('[data-filter]') và '[data-category]'.", test: (sim) => { const js = headFiles(sim, "feature/menu-filter")["js/menu-filter.js"] || ""; return contains(js, "querySelectorAll") && contains(js, "data-filter") && contains(js, "data-category"); } },
        { id: "toggle", label: "JS ẩn hiện bằng class d-none", hint: "card.classList.toggle('d-none', !show).", test: (sim) => { const js = headFiles(sim, "feature/menu-filter")["js/menu-filter.js"] || ""; return contains(js, "classList.toggle") && contains(js, "d-none") && contains(js, "addEventListener"); } },
        { id: "message", label: "Commit theo mẫu feat(menu):", hint: "feat(menu): thêm bộ lọc món bằng JavaScript.", test: (sim) => { const sha = sim.branches["feature/menu-filter"]; return !!sha && /^feat\(menu\):\s/.test(sim.commits[sha].message); } },
        { id: "push", label: "Nhánh đã lên GitHub", hint: "git push -u origin feature/menu-filter.", test: (sim) => sim.remote.branches["feature/menu-filter"] === sim.branches["feature/menu-filter"] }
      ],
      solution: [
        { label: "Tách nhánh", run: "git switch -c feature/menu-filter" },
        { label: "Thêm nút lọc và nhúng JS", write: { path: "menu.html", content: page("Thực đơn", "menu.html", '<section class="py-5"><div class="container"><div class="d-flex flex-wrap gap-2 mb-4"><button type="button" class="btn btn-dark active" data-filter="all">Tất cả</button><button type="button" class="btn btn-outline-dark" data-filter="ca-phe">Cà phê</button><button type="button" class="btn btn-outline-dark" data-filter="tra">Trà</button><button type="button" class="btn btn-outline-dark" data-filter="banh">Bánh</button></div><div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">' + menuCards() + "</div></div></section>", '<script src="js/menu-filter.js"></script>\n') } },
        { label: "Viết bộ lọc", write: { path: "js/menu-filter.js", content: MENU_JS } },
        { label: "Stage", run: "git add menu.html js/menu-filter.js" },
        { label: "Commit", run: "git commit -m \"feat(menu): thêm bộ lọc món bằng JavaScript\"" },
        { label: "Push", run: "git push -u origin feature/menu-filter" }
      ]
    },
    {
      id: "s09",
      module: "m3",
      order: 9,
      title: "Pull request cho trang thực đơn",
      role: "minh",
      level: "Cơ bản",
      minutes: 12,
      skills: ["gh pr create", "Closes #", "review", "squash merge"],
      brief: "Nhánh feature/menu-grid đã sẵn sàng. Minh mở PR, liên kết issue #4, nhờ Lan review chéo rồi merge squash và xoá nhánh. Đây là vòng cộng tác chuẩn của cả nhóm.",
      tasks: [
        "Mở PR từ feature/menu-grid vào main, tiêu đề feat(menu): ..., mô tả có Closes #4.",
        "Kiểm tra ci/pages và nhờ Lan approve bằng gh pr review.",
        "Merge squash và xoá nhánh sau merge.",
        "Xác nhận issue #4 tự đóng và main trên GitHub có lưới thẻ."
      ],
      hints: [
        "Tạo PR: gh pr create --base main --head feature/menu-grid --title \"...\" --body \"... Closes #4\".",
        "Chuyển vai Lan bằng ô chọn vai, rồi gh pr review 5 --approve.",
        "Sau đó quay lại Minh và chạy gh pr merge 5 --squash --delete-branch.",
        "Kiểm tra bằng gh pr list và gh issue list."
      ],
      seed: baseSeed({
        role: "minh",
        issues: [{ number: 4, title: "Thực đơn: lưới thẻ Bootstrap", body: "Dựng sáu món thành lưới responsive, ảnh có alt.", labels: ["html-css", "bootstrap"], assignee: "lan", author: "lan" }],
        branches: {
          "feature/menu-grid": { from: "main", commits: [{ message: "feat(menu): dựng lưới thẻ Bootstrap", author: "lan", changes: { "menu.html": FILES["menu.html"] } }] }
        },
        remoteBranches: { "feature/menu-grid": "feature/menu-grid" },
        runs: [{ workflow: "CI", branch: "feature/menu-grid", conclusion: "success", log: ["npm run check:html", "PASS  6 trang HTML đã kiểm tra", "Kết luận: success"] }]
      }),
      checks: [
        { id: "pr", label: "Có PR từ feature/menu-grid và đã merge", hint: "Mở PR rồi merge squash.", test: (sim) => sim.prs.some((pr) => pr.head === "feature/menu-grid" && pr.base === "main" && pr.state === "merged") },
        { id: "closes", label: "PR liên kết Closes #4", hint: "Ghi Closes #4 trong mô tả PR.", test: (sim) => { const pr = sim.prs.find((item) => item.head === "feature/menu-grid"); return !!pr && pr.closes.indexOf(4) > -1; } },
        { id: "approval", label: "Lan đã approve PR", hint: "Chuyển vai Lan rồi gh pr review 1 --approve.", test: (sim) => { const pr = sim.prs.find((item) => item.head === "feature/menu-grid"); return !!pr && pr.reviews.some((review) => review.author === "lan" && review.state === "approved"); } },
        { id: "checks", label: "ci/pages đã xanh", hint: "Chạy gh pr checks 1 để xem.", test: (sim) => { const pr = sim.prs.find((item) => item.head === "feature/menu-grid"); if (!pr) return false; const run = sim.latestRun(pr.headSha); return !!run && run.conclusion === "success"; } },
        { id: "squash", label: "Merge bằng squash", hint: "gh pr merge 1 --squash --delete-branch.", test: (sim) => { const pr = sim.prs.find((item) => item.head === "feature/menu-grid"); return !!pr && pr.mergeMethod === "squash"; } },
        { id: "issue", label: "Issue #4 đã đóng", hint: "PR có Closes #4 và đã merge.", test: (sim) => { const issue = sim.issueByNumber(4); return !!issue && issue.state === "closed"; } },
        { id: "clean", label: "Nhánh trên GitHub đã được xoá", hint: "Thêm --delete-branch khi merge.", test: (sim) => !sim.remote.branches["feature/menu-grid"] },
        { id: "main", label: "main trên GitHub có lưới thẻ Bootstrap", hint: "Sau merge, nhánh main remote phải chứa menu.html mới.", test: (sim) => { const sha = sim.remote.branches.main; return !!sha && contains((sim.commits[sha].files["menu.html"] || ""), "row-cols-lg-3"); } }
      ],
      solution: [
        { label: "Mở pull request", run: "gh pr create --base main --head feature/menu-grid --title \"feat(menu): dựng lưới thẻ Bootstrap\" --body \"Trang thực đơn dùng lưới 1/2/3 cột, ảnh có alt và nhãn danh mục. Đã kiểm tra ở 390, 768 và 1440 px. Closes #4\"" },
        { label: "Xem check", run: "gh pr checks 5" },
        { label: "Chuyển vai Lan để review", role: "lan" },
        { label: "Lan approve", run: "gh pr review 5 --approve --body \"Lưới đúng, ảnh có alt, mình đã thử mốc 390 px. Duyệt.\"" },
        { label: "Quay lại Minh", role: "minh" },
        { label: "Merge squash và xoá nhánh", run: "gh pr merge 5 --squash --delete-branch" }
      ]
    },
    {
      id: "s10",
      module: "m3",
      order: 10,
      title: "Review chéo form liên hệ",
      role: "lan",
      level: "Cơ bản",
      minutes: 12,
      skills: ["gh pr review", "request changes", "push bổ sung"],
      brief: "Huy mở PR form liên hệ nhưng quên label và ci/pages đang đỏ. Lan review, yêu cầu sửa; Huy bổ sung label, push lại; Lan kiểm tra và approve. Không ai tự duyệt PR của mình.",
      tasks: [
        "Xem PR #1 và ci/pages; dùng gh pr review 1 --request-changes với lý do thiếu label.",
        "Chuyển vai Huy, bổ sung label cho ba trường, commit và push lại.",
        "Chờ ci/pages xanh, quay lại Lan và approve.",
        "Không merge PR này; việc merge do Minh làm ở bước sau."
      ],
      hints: [
        "Lan: gh pr review 1 --request-changes --body \"Thiếu label...\".",
        "Huy: thêm label for khớp id, git add, git commit -m \"fix(contact): thêm label\".",
        "Sau push, kiểm tra gh pr checks 1.",
        "Lan: gh pr review 1 --approve --body \"Đã kiểm tra lại.\"."
      ],
      seed: baseSeed({
        role: "lan",
        protection: PROTECTED,
        workflows: { ci: true, deploy: false },
        ciRule: { require: [{ path: "contact.html", includes: "<label", message: "contact.html thiếu label cho trường nhập" }] },
        branches: {
          "feature/contact-form": {
            from: "main",
            commits: [{ message: "feat(contact): thêm form đặt bàn", author: "huy", changes: { "contact.html": page("Liên hệ", "contact.html", CONTACT_NO_LABEL) } }]
          }
        },
        remoteBranches: { "feature/contact-form": "feature/contact-form" },
        issues: [{ number: 5, title: "Liên hệ: form đặt bàn có kiểm tra dữ liệu", body: "Form có label, trường bắt buộc và thông báo sau khi gửi.", labels: ["javascript", "bootstrap"], assignee: "huy", author: "huy" }],
        prs: [{ number: 1, title: "feat(contact): thêm form đặt bàn", head: "feature/contact-form", base: "main", author: "huy", body: "Form đặt bàn cơ bản. Closes #5", state: "open", reviews: [], mergeable: true }],
        runs: [{ workflow: "CI", branch: "feature/contact-form", conclusion: "failure", log: ["npm run check:html", "FAIL  contact.html thiếu label cho trường nhập", "Kết luận: failure"] }]
      }),
      checks: [
        { id: "requested", label: "Lan đã yêu cầu sửa", hint: "gh pr review 1 --request-changes.", test: (sim) => { const pr = sim.prByNumber(1); return !!pr && pr.reviews.some((review) => review.author === "lan" && review.state === "changes_requested"); } },
        { id: "labels", label: "Form đã có đủ label", hint: "Thêm label for khớp id name, email, message.", test: (sim) => { const pr = sim.prByNumber(1); const html = pr && sim.resolve(pr.head) ? sim.commits[sim.resolve(pr.head)].files["contact.html"] : ""; return ["name", "email", "message"].every((id) => contains(html, 'for="' + id + '"') && contains(html, 'id="' + id + '"')); } },
        { id: "push", label: "Huy đã push bản sửa", hint: "Commit rồi git push trên nhánh feature/contact-form.", test: (sim) => { const pr = sim.prByNumber(1); const remoteSha = sim.remote.branches["feature/contact-form"]; return !!pr && remoteSha === sim.resolve(pr.head) && pr.headSha === remoteSha; } },
        { id: "ci", label: "ci/pages đã xanh sau khi sửa", hint: "Push lại để workflow chạy.", test: (sim) => { const pr = sim.prByNumber(1); if (!pr) return false; const run = sim.latestRun(pr.headSha); return !!run && run.conclusion === "success"; } },
        { id: "approval", label: "Lan đã approve sau khi sửa", hint: "gh pr review 1 --approve.", test: (sim) => { const pr = sim.prByNumber(1); return !!pr && pr.reviews.some((review) => review.author === "lan" && review.state === "approved"); } },
        { id: "open", label: "PR vẫn mở để Minh merge", hint: "Không tự merge ở bước review.", test: (sim) => { const pr = sim.prByNumber(1); return !!pr && pr.state === "open"; } }
      ],
      solution: [
        { label: "Lan xem PR", run: "gh pr view 1" },
        { label: "Yêu cầu sửa", run: "gh pr review 1 --request-changes --body \"Form thiếu label nên screen reader không đọc được trường nhập. Thêm label for khớp id rồi push lại nhé.\"" },
        { label: "Chuyển vai Huy", role: "huy" },
        { label: "Sang nhánh PR", run: "git switch feature/contact-form" },
        { label: "Bổ sung label", write: { path: "contact.html", content: page("Liên hệ", "contact.html", CONTACT_MAIN, '<script src="js/form.js"></script>\n') } },
        { label: "Stage", run: "git add contact.html" },
        { label: "Commit", run: "git commit -m \"fix(contact): thêm label cho các trường nhập\"" },
        { label: "Push bản sửa", run: "git push" },
        { label: "Quay lại Lan", role: "lan" },
        { label: "Xem check", run: "gh pr checks 1" },
        { label: "Approve", run: "gh pr review 1 --approve --body \"Đã có đủ label, ci/pages xanh. Mình duyệt để Minh merge.\"" }
      ]
    },
    {
      id: "s11",
      module: "m4",
      order: 11,
      title: "Sửa navbar không bấm được",
      role: "huy",
      level: "Cơ bản",
      minutes: 8,
      skills: ["fix", "Bootstrap data attributes", "push"],
      brief: "Trên điện thoại, nút menu không mở vì thiếu data-bs-toggle và data-bs-target. Huy tìm đúng hai thuộc tính Bootstrap, sửa index.html trên nhánh lỗi, push để ci/pages chạy lại.",
      tasks: [
        "Chuyển sang nhánh feature/navbar-fix đã có sẵn.",
        "Thêm data-bs-toggle=\"collapse\" và data-bs-target=\"#mainNav\" cho nút navbar-toggler.",
        "Giữ aria-controls=\"mainNav\" và aria-label cho nút.",
        "Commit bắt đầu bằng fix(nav): rồi push để CI xanh."
      ],
      hints: [
        "Nút cần class navbar-toggler và hai data-bs-* giống index.html gốc.",
        "data-bs-target phải trỏ đúng id của khối collapse.",
        "Commit: fix(nav): khôi phục nút menu trên điện thoại.",
        "Push: git push."
      ],
      seed: baseSeed({
        role: "huy",
        branch: "feature/navbar-fix",
        workflows: { ci: true, deploy: false },
        files: files({
          "index.html": page("Trang chủ", "index.html", HOME_HERO).replace(nav("index.html"), navBroken())
        }),
        branches: { "feature/navbar-fix": { from: "main", commits: [{ message: "feat(nav): thêm navbar mobile", author: "huy", changes: { "index.html": page("Trang chủ", "index.html", HOME_HERO).replace(nav("index.html"), navBroken()) } }] } },
        remoteBranches: { "feature/navbar-fix": "feature/navbar-fix" },
        issues: [{ number: 7, title: "Navbar mobile không mở", body: "Trên điện thoại, nút menu không phản hồi.", labels: ["frontend", "bootstrap"], assignee: "huy", author: "lan" }]
      }),
      checks: [
        { id: "branch", label: "Đang ở nhánh feature/navbar-fix", hint: "git switch feature/navbar-fix.", test: (sim) => sim.branch === "feature/navbar-fix" },
        { id: "toggle", label: "Nút có data-bs-toggle=collapse", hint: "Thêm thuộc tính vào navbar-toggler.", test: (sim) => contains((headFiles(sim)["index.html"] || ""), 'data-bs-toggle="collapse"') },
        { id: "target", label: "Nút trỏ đúng #mainNav", hint: "data-bs-target=\"#mainNav\".", test: (sim) => contains((headFiles(sim)["index.html"] || ""), 'data-bs-target="#mainNav"') },
        { id: "aria", label: "Giữ aria-controls và aria-label", hint: "Không xoá thuộc tính trợ năng.", test: (sim) => contains((headFiles(sim)["index.html"] || ""), 'aria-controls="mainNav"') && contains((headFiles(sim)["index.html"] || ""), "aria-label") },
        { id: "message", label: "Commit theo mẫu fix(nav):", hint: "fix(nav): khôi phục nút menu trên điện thoại.", test: (sim) => { const sha = sim.branches["feature/navbar-fix"]; return !!sha && /^fix\(nav\):\s/.test(sim.commits[sha].message); } },
        { id: "ci", label: "ci/pages xanh sau khi push", hint: "git push để workflow chạy.", test: (sim) => { const run = sim.latestRun(sim.branches["feature/navbar-fix"]); return !!run && run.conclusion === "success"; } },
        { id: "push", label: "Nhánh trên GitHub đã cập nhật", hint: "git push.", test: (sim) => sim.remote.branches["feature/navbar-fix"] === sim.branches["feature/navbar-fix"] }
      ],
      solution: [
        { label: "Sửa nút navbar", write: { path: "index.html", content: FILES["index.html"] } },
        { label: "Stage", run: "git add index.html" },
        { label: "Commit", run: "git commit -m \"fix(nav): khôi phục nút menu trên điện thoại\"" },
        { label: "Push", run: "git push" }
      ]
    },
    {
      id: "s12",
      module: "m4",
      order: 12,
      title: "Xung đột CSS khi rebase",
      role: "lan",
      level: "Trung cấp",
      minutes: 15,
      skills: ["rebase", "conflict", "add", "force-with-lease"],
      brief: "Lan đang thêm khoảng đệm cho header thì Minh đổi màu header trên main. Cùng một dòng CSS, rebase dừng lại. Lan giữ cả hai thay đổi, chạy tiếp và push an toàn bằng force-with-lease.",
      tasks: [
        "Chạy git rebase main và đọc tệp xung đột css/style.css.",
        "Giữ màu header mới của main và khoảng đệm của nhánh.",
        "git add css/style.css, git rebase --continue.",
        "Push nhánh bằng --force-with-lease."
      ],
      hints: [
        "Dấu <<<<<<<, =======, >>>>>>> phải được xoá hoàn toàn.",
        "Giữ background mới và padding-top của nhánh.",
        "Sau rebase, lịch sử nhánh đổi nên cần force-with-lease, không dùng --force.",
        "Kiểm tra bằng git status và git log --oneline."
      ],
      seed: baseSeed({
        role: "lan",
        branch: "style/menu-spacing",
        branches: {
          "style/menu-spacing": {
            from: "main",
            commits: [{ message: "style(header): thêm khoảng đệm trên", author: "lan", changes: { "css/style.css": CSS_BASE.replace(".site-header {\n  background: var(--cream);\n  border-bottom: 1px solid #eadfce;\n}", ".site-header {\n  background: var(--cream);\n  border-bottom: 1px solid #eadfce;\n  padding-top: 1.5rem;\n}") } }]
          }
        },
        remoteBranches: { "style/menu-spacing": "style/menu-spacing" },
        localAhead: [{ message: "style(header): đổi màu thương hiệu", author: "minh", changes: { "css/style.css": CSS_BASE.replace(".site-header {\n  background: var(--cream);\n  border-bottom: 1px solid #eadfce;\n}", ".site-header {\n  background: #f3e5d3;\n  border-bottom: 1px solid #d9c3a7;\n}") } }]
      }),
      checks: [
        { id: "clean", label: "Không còn xung đột", hint: "Sửa dấu xung đột, add rồi rebase --continue.", test: (sim) => Object.keys(sim.conflicts).length === 0 && clean(sim) },
        { id: "markers", label: "CSS không còn dấu xung đột", hint: "Xoá <<<<<<<, =======, >>>>>>>.", test: (sim) => !contains(sim.worktree["css/style.css"], "<<<<<<<") && !contains(sim.worktree["css/style.css"], "=======") && !contains(sim.worktree["css/style.css"], ">>>>>>>") },
        { id: "both", label: "Giữ cả màu mới và khoảng đệm", hint: "Có background #f3e5d3 và padding-top: 1.5rem.", test: (sim) => { const css = sim.worktree["css/style.css"] || ""; return contains(css, "#f3e5d3") && contains(css, "padding-top: 1.5rem"); } },
        { id: "rebase", label: "Commit nhánh nằm trên main mới", hint: "Sau rebase, parent của nhánh phải là main.", test: (sim) => { const sha = sim.branches["style/menu-spacing"]; return !!sha && sim.commits[sha].parents[0] === sim.branches.main; } },
        { id: "push", label: "Nhánh remote đã cập nhật an toàn", hint: "git push --force-with-lease.", test: (sim) => sim.remote.branches["style/menu-spacing"] === sim.branches["style/menu-spacing"] }
      ],
      solution: [
        { label: "Rebase lên main", run: "git rebase main" },
        { label: "Giữ cả hai thay đổi", write: { path: "css/style.css", content: CSS_RESPONSIVE.replace(".site-header {\n  background: var(--cream);\n  border-bottom: 1px solid #eadfce;\n}", ".site-header {\n  background: #f3e5d3;\n  border-bottom: 1px solid #d9c3a7;\n  padding-top: 1.5rem;\n}") } },
        { label: "Đánh dấu đã sửa", run: "git add css/style.css" },
        { label: "Chạy tiếp rebase", run: "git rebase --continue" },
        { label: "Push an toàn", run: "git push --force-with-lease origin style/menu-spacing" }
      ]
    },
    {
      id: "s13",
      module: "m4",
      order: 13,
      title: "Revert màu nền sai",
      role: "minh",
      level: "Cơ bản",
      minutes: 8,
      skills: ["git revert", "push", "issue close"],
      brief: "Một commit thử nghiệm đổi nền trang chủ sang đỏ đã lỡ vào main. Minh revert đúng commit đó, push bản sửa và đóng issue báo lỗi. Revert an toàn vì không viết lại lịch sử đã chia sẻ.",
      tasks: [
        "Xem git log để xác định commit làm nền đỏ.",
        "Revert commit đó bằng git revert.",
        "Push main và đóng issue #7 với ghi chú đã sửa.",
        "Kiểm tra CSS không còn mã màu đỏ."
      ],
      hints: [
        "Commit xấu là commit đầu trên main, có thể revert HEAD.",
        "git revert HEAD tạo commit đảo ngược, không xoá lịch sử.",
        "Sau đó git push và gh issue close 7 --comment \"...\".",
        "Kiểm tra bằng git log --oneline và cat css/style.css."
      ],
      seed: baseSeed({
        role: "minh",
        history: [{ message: "style(home): thử nền đỏ", author: "minh", changes: { "css/style.css": CSS_BASE.replace("background: #fffdf9;", "background: #b91c1c;") } }],
        issues: [{ number: 7, title: "Nền trang chủ bị đỏ", body: "Màu nền sai sau commit thử nghiệm, cần đưa về màu kem.", labels: ["frontend"], assignee: "minh", author: "lan" }]
      }),
      checks: [
        { id: "revert", label: "Có commit revert trên main", hint: "git revert HEAD.", test: (sim) => { const sha = sim.branches.main; return !!sha && /^Revert\s+"/.test(sim.commits[sha].message); } },
        { id: "css", label: "CSS không còn nền đỏ", hint: "Revert commit style(home): thử nền đỏ.", test: (sim) => !contains(mainFiles(sim)["css/style.css"], "#b91c1c") },
        { id: "push", label: "main trên GitHub đã nhận bản revert", hint: "git push.", test: (sim) => sim.remote.branches.main === sim.branches.main },
        { id: "issue", label: "Issue #7 đã đóng", hint: "gh issue close 7 --comment \"...\".", test: (sim) => { const issue = sim.issueByNumber(7); return !!issue && issue.state === "closed"; } },
        { id: "clean", label: "Thư mục làm việc sạch", hint: "Commit hoặc revert xong thì không còn thay đổi.", test: (sim) => clean(sim) }
      ],
      solution: [
        { label: "Xem lịch sử", run: "git log --oneline -n 4" },
        { label: "Revert commit xấu", run: "git revert HEAD" },
        { label: "Push bản sửa", run: "git push" },
        { label: "Đóng issue", run: "gh issue close 7 --comment \"Đã revert commit đổi nền đỏ, trang chủ trở lại màu kem.\"" }
      ]
    },
    {
      id: "s14",
      module: "m5",
      order: 14,
      title: "Bảo vệ main và push bị chặn",
      role: "minh",
      level: "Trung cấp",
      minutes: 12,
      skills: ["protected branch", "push rejected", "feature branch", "PR"],
      brief: "Minh bật bảo vệ main: bắt buộc PR, một approval và ci/pages xanh. Huy thử push trực tiếp để thấy bị chặn, rồi đi đúng đường bằng nhánh riêng và pull request.",
      tasks: [
        "Bật bảo vệ main: bắt buộc PR, 1 approval, check ci/pages, tắt push trực tiếp.",
        "Chuyển vai Huy, tạo nhánh feature/faq-polish và thêm câu hỏi mới vào faq.html.",
        "Commit, push nhánh, rồi thử git push origin main để thấy bị từ chối.",
        "Mở PR liên kết Closes #6; để Minh review ở bước sau."
      ],
      hints: [
        "Bật bảo vệ trong tab Settings khi đang vai Minh.",
        "Huy: git switch -c feature/faq-polish, sửa faq.html, git add, git commit, git push -u.",
        "Thử git push origin main sẽ bị remote rejected.",
        "Mở PR: gh pr create --base main --head feature/faq-polish --body \"Closes #6\"."
      ],
      seed: baseSeed({
        role: "minh",
        workflows: { ci: true, deploy: false },
        issues: [{ number: 6, title: "Hỏi đáp: thêm câu hỏi về chỗ đỗ xe", body: "Khách hỏi đỗ xe máy ở đâu, cần bổ sung vào FAQ.", labels: ["frontend"], assignee: "huy", author: "lan" }]
      }),
      checks: [
        { id: "protection", label: "main bắt buộc PR, 1 approval và ci/pages", hint: "Bật trong Settings khi vai Minh.", test: (sim) => { const rule = sim.protection.main; return !!rule && rule.prRequired === true && rule.reviews === 1 && rule.checks.indexOf("ci/pages") > -1 && rule.directPush === false; } },
        { id: "rejected", label: "Đã thấy push trực tiếp bị chặn", hint: "Huy chạy git push origin main.", test: (sim) => sim.events.some((event) => event.type === "push-rejected") },
        { id: "branch", label: "Nhánh feature/faq-polish đã lên GitHub", hint: "git push -u origin feature/faq-polish.", test: (sim) => !!sim.remote.branches["feature/faq-polish"] },
        { id: "faq", label: "FAQ có nội dung mới", hint: "Thêm câu hỏi và câu trả lời về chỗ đỗ xe.", test: (sim) => contains((headFiles(sim, "feature/faq-polish")["faq.html"] || ""), "đỗ xe") },
        { id: "pr", label: "Có PR mở cho nhánh mới", hint: "gh pr create --base main --head feature/faq-polish.", test: (sim) => sim.prs.some((pr) => pr.state === "open" && pr.head === "feature/faq-polish" && pr.closes.indexOf(6) > -1) },
        { id: "main-safe", label: "main trên GitHub không bị push trực tiếp", hint: "Push main phải bị từ chối.", test: (sim) => sim.remote.branches.main === sim.branches.main }
      ],
      solution: [
        { label: "Bật bảo vệ main", protect: { prRequired: true, reviews: 1, checks: ["ci/pages"], directPush: false } },
        { label: "Chuyển vai Huy", role: "huy" },
        { label: "Tách nhánh", run: "git switch -c feature/faq-polish" },
        { label: "Thêm câu hỏi đỗ xe", write: { path: "faq.html", content: page("Hỏi đáp", "faq.html", FAQ_MAIN.replace("Nên gọi trước 30 phút để quán xếp bàn dài.</div></div></div>", "Nên gọi trước 30 phút để quán xếp bàn dài.</div></div></div><div class=\"accordion-item\"><h2 class=\"accordion-header\"><button class=\"accordion-button collapsed\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#faq4\">Xe máy đỗ ở đâu?</button></h2><div id=\"faq4\" class=\"accordion-collapse collapse\" data-bs-parent=\"#faqList\"><div class=\"accordion-body\">Có chỗ đỗ xe máy miễn phí trước cửa, vui lòng không chắn lối đi bộ.</div></div></div>")) } },
        { label: "Stage", run: "git add faq.html" },
        { label: "Commit", run: "git commit -m \"feat(faq): thêm câu hỏi chỗ đỗ xe\"" },
        { label: "Push nhánh", run: "git push -u origin feature/faq-polish" },
        { label: "Thử push main", run: "git push origin main" },
        { label: "Mở pull request", run: "gh pr create --base main --head feature/faq-polish --title \"feat(faq): thêm câu hỏi chỗ đỗ xe\" --body \"Bổ sung câu hỏi khách hay gặp và giữ accordion hoạt động. Closes #6\"" }
      ]
    },
    {
      id: "s15",
      module: "m5",
      order: 15,
      title: "Phát hành v1.0.0 và bàn giao",
      role: "lan",
      level: "Trung cấp",
      minutes: 12,
      skills: ["annotated tag", "push tag", "release", "cleanup"],
      brief: "Sprint khép lại. Lan chủ trì bàn giao: cả ba đóng issue của mình, xoá nhánh đã merge, Minh ký tag annotated v1.0.0 và tạo release. Push tag cũng kích hoạt deploy GitHub Pages.",
      tasks: [
        "Đóng issue #7 (Lan) và #8 (Huy) với ghi chú hoàn thành.",
        "Xoá ba nhánh feature đã merge, cả local và remote.",
        "Chuyển vai Minh, tạo tag annotated v1.0.0 và push tag.",
        "Tạo release v1.0.0 với ghi chú 6 trang và cả ba người."
      ],
      hints: [
        "gh issue close 7 --comment \"...\"; chuyển vai Huy cho issue #8.",
        "Xoá từng nhánh: git branch -d feature/menu-grid; git push origin --delete feature/menu-grid.",
        "Minh: git tag -a v1.0.0 -m \"Mộc Coffee 1.0\" rồi git push origin v1.0.0.",
        "Tạo release: gh release create v1.0.0 --title \"Mộc Coffee 1.0\" --notes \"...\"."
      ],
      seed: baseSeed({
        role: "lan",
        protection: PROTECTED,
        workflows: { ci: false, deploy: true },
        branches: {
          "feature/menu-grid": "main",
          "feature/contact-form": "main",
          "feature/shared-layout": "main"
        },
        remoteBranches: {
          "feature/menu-grid": "feature/menu-grid",
          "feature/contact-form": "feature/contact-form",
          "feature/shared-layout": "feature/shared-layout"
        },
        issues: [
          { number: 7, title: "Navbar mobile không mở", body: "Đã sửa nút menu trên điện thoại.", labels: ["frontend"], assignee: "lan", author: "lan" },
          { number: 8, title: "Kiểm tra responsive 390 px", body: "Rà lại toàn bộ 6 trang trên điện thoại nhỏ.", labels: ["frontend"], assignee: "huy", author: "huy" }
        ]
      }),
      checks: [
        { id: "issues", label: "Issue #7 và #8 đã đóng", hint: "Mỗi người đóng issue của mình.", test: (sim) => { const a = sim.issueByNumber(7); const b = sim.issueByNumber(8); return !!a && !!b && a.state === "closed" && b.state === "closed"; } },
        { id: "branches", label: "Ba nhánh feature đã được xoá", hint: "Xoá cả local và remote.", test: (sim) => ["feature/menu-grid", "feature/contact-form", "feature/shared-layout"].every((name) => !sim.branches[name] && !sim.remote.branches[name]) },
        { id: "tag", label: "Có tag annotated v1.0.0", hint: "git tag -a v1.0.0 -m \"Mộc Coffee 1.0\".", test: (sim) => { const tag = sim.tags["v1.0.0"]; return !!tag && tag.annotated === true; } },
        { id: "tag-push", label: "Tag đã được push lên GitHub", hint: "git push origin v1.0.0.", test: (sim) => !!sim.remote.tags["v1.0.0"] },
        { id: "deploy", label: "Deploy GitHub Pages đã chạy", hint: "Push tag khi workflow deploy bật.", test: (sim) => sim.runs.some((run) => run.workflow === "Deploy Pages" && run.conclusion === "success") },
        { id: "release", label: "Có release v1.0.0", hint: "gh release create v1.0.0 --title ... --notes ...", test: (sim) => sim.releases.some((release) => release.tag === "v1.0.0") },
        { id: "main", label: "main vẫn đủ 6 trang", hint: "Không làm mất trang khi dọn nhánh.", test: (sim) => ["index.html", "menu.html", "about.html", "gallery.html", "contact.html", "faq.html"].every((path) => !!mainFiles(sim)[path]) }
      ],
      solution: [
        { label: "Lan đóng issue", run: "gh issue close 7 --comment \"Đã kiểm tra lại navbar trên iPhone và Android, nút mở đúng.\"" },
        { label: "Chuyển vai Huy", role: "huy" },
        { label: "Huy đóng issue", run: "gh issue close 8 --comment \"Đã rà 6 trang ở 390 px, không còn tràn ngang.\"" },
        { label: "Xoá nhánh local 1", run: "git branch -d feature/menu-grid" },
        { label: "Xoá nhánh local 2", run: "git branch -d feature/contact-form" },
        { label: "Xoá nhánh local 3", run: "git branch -d feature/shared-layout" },
        { label: "Chuyển vai Lan", role: "lan" },
        { label: "Xoá nhánh remote 1", run: "git push origin --delete feature/menu-grid" },
        { label: "Xoá nhánh remote 2", run: "git push origin --delete feature/contact-form" },
        { label: "Xoá nhánh remote 3", run: "git push origin --delete feature/shared-layout" },
        { label: "Chuyển vai Minh", role: "minh" },
        { label: "Tạo tag annotated", run: "git tag -a v1.0.0 -m \"Mộc Coffee 1.0\"" },
        { label: "Push tag để deploy", run: "git push origin v1.0.0" },
        { label: "Tạo release", run: "gh release create v1.0.0 --title \"Mộc Coffee 1.0\" --notes \"Website 6 trang: trang chủ, thực đơn, câu chuyện, thư viện, liên hệ và hỏi đáp. Cả ba cùng làm, review chéo và phát hành. Chạy tốt ở 390, 768 và 1440 px.\"" }
      ]
    }
  ];

  global.RepoScenarios = SCENARIOS;
})(typeof window !== "undefined" ? window : globalThis);

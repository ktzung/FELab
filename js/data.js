/* Dữ liệu nhóm, sprint và quy ước của dự án Mộc Coffee */
(function (global) {
  "use strict";

  const TEAM_DETAILS = {
    minh: {
      id: "minh",
      name: "Nguyễn Minh",
      short: "Minh",
      email: "minh@moccoffee.dev",
      role: "Tech Lead · Trang chủ",
      focus: "Khung trang, navbar, footer, review và phát hành",
      permissions: ["Admin repository", "Merge pull request", "Cấu hình bảo vệ main", "Tạo tag và release"],
      owns: ["index.html", "gallery.html", "navbar và footer", "release/*"],
      avatar: "M",
      color: "#b45309",
      quote: "Cả ba cùng đi trọn vòng: lên issue, dựng trang, review chéo, merge và phát hành."
    },
    lan: {
      id: "lan",
      name: "Trần Lan",
      short: "Lan",
      email: "lan@moccoffee.dev",
      role: "HTML/CSS · Thực đơn",
      focus: "Bố cục HTML5, lưới Bootstrap, màu sắc và responsive",
      permissions: ["Write code", "Tạo nhánh feature", "Mở pull request", "Review PR của Huy và Minh"],
      owns: ["menu.html", "about.html", "css/style.css", "feature/menu-*"],
      avatar: "L",
      color: "#0f766e",
      quote: "Trang đẹp phải đọc được trên điện thoại, có nhãn form và ảnh alt rõ ràng."
    },
    huy: {
      id: "huy",
      name: "Lê Huy",
      short: "Huy",
      email: "huy@moccoffee.dev",
      role: "JS/Bootstrap · Liên hệ",
      focus: "Tương tác DOM, lọc thực đơn, kiểm tra form và thành phần Bootstrap",
      permissions: ["Write code", "Tạo nhánh feature/fix", "Chạy và đọc ci/pages", "Review PR của Lan và Minh"],
      owns: ["contact.html", "faq.html", "js/main.js", "js/menu-filter.js"],
      avatar: "H",
      color: "#7c3aed",
      quote: "Mọi nút bấm phải có phản hồi, form phải báo lỗi ngay cạnh ô nhập."
    }
  };

  const MODULES = [
    {
      id: "m1",
      order: 1,
      title: "Khởi động dự án",
      tag: "Nền tảng",
      summary: "Tạo kho, chia 6 trang bằng issue và dựng khung HTML dùng chung.",
      color: "#b45309"
    },
    {
      id: "m2",
      order: 2,
      title: "Dựng các trang giao diện",
      tag: "HTML/CSS/JS",
      summary: "Thực đơn, liên hệ, trang chủ, lọc JavaScript và responsive.",
      color: "#0f766e"
    },
    {
      id: "m3",
      order: 3,
      title: "Pull request và review",
      tag: "Cộng tác",
      summary: "Mở PR, review chéo theo checklist giao diện, merge squash và dọn nhánh.",
      color: "#7c3aed"
    },
    {
      id: "m4",
      order: 4,
      title: "Sửa lỗi và xung đột",
      tag: "Bình tĩnh",
      summary: "Sửa navbar hỏng, giải quyết xung đột CSS và revert commit sai màu.",
      color: "#dc2626"
    },
    {
      id: "m5",
      order: 5,
      title: "Bảo vệ và phát hành",
      tag: "Bàn giao",
      summary: "Chặn push trực tiếp, phát hành v1.0.0 và dọn sprint.",
      color: "#2563eb"
    }
  ];

  const RACI = [
    { work: "Chốt sitemap 6 trang", minh: "A/R", lan: "C", huy: "C", note: "Minh chốt phạm vi, cả nhóm chọn nội dung từng trang." },
    { work: "Trang chủ và thư viện ảnh", minh: "A/R", lan: "C", huy: "I", note: "Minh dựng index.html và gallery.html." },
    { work: "Thực đơn và câu chuyện", minh: "C", lan: "A/R", huy: "I", note: "Lan dựng menu.html, about.html và CSS dùng chung." },
    { work: "Liên hệ và hỏi đáp", minh: "C", lan: "C", huy: "A/R", note: "Huy dựng contact.html, faq.html và JavaScript." },
    { work: "Review pull request", minh: "A", lan: "R", huy: "R", note: "Không ai tự duyệt PR của mình; review chéo cả ba chiều." },
    { work: "Merge vào main", minh: "A/R", lan: "I", huy: "I", note: "Chỉ Minh merge khi đủ approval và ci/pages xanh." },
    { work: "Bảo vệ nhánh", minh: "A/R", lan: "I", huy: "I", note: "Bật required PR, 1 approval, check ci/pages." },
    { work: "Phát hành và bàn giao", minh: "A/R", lan: "R", huy: "R", note: "Cả ba đóng issue, kiểm tra responsive; Minh ký release." }
  ];

  const SPRINT = {
    name: "Sprint 01",
    product: "Mộc Coffee v1.0",
    dates: "24/11/2026 - 05/12/2026",
    goal: "Ra website 6 trang bằng HTML, CSS, JavaScript và Bootstrap 5; mỗi người làm chủ 2 trang, cả nhóm cùng review và phát hành.",
    milestone: "v1.0",
    definitionOfDone: [
      "Mỗi trang có issue, nhánh riêng và commit theo Conventional Commits",
      "HTML5 semantic, có lang, meta viewport và alt cho ảnh",
      "Bootstrap 5 cho lưới, navbar, card và form",
      "Responsive tốt ở 390, 768 và 1440 px, không tràn ngang",
      "PR có checklist, 1 approval, ci/pages xanh rồi mới merge squash"
    ]
  };

  const CONVENTIONS = [
    {
      title: "Tên nhánh",
      rule: "feature/<trang>-<việc>, fix/<lỗi>, style/<phần>, release/<phiên-bản>",
      example: "feature/menu-grid, fix/navbar-toggle",
      why: "Tên nhánh nói rõ đang dựng trang nào, tránh sửa nhầm phần của người khác."
    },
    {
      title: "Commit",
      rule: "feat, fix, style, docs, chore + phạm vi trong ngoặc + mô tả ngắn",
      example: "feat(menu): dựng lưới thẻ Bootstrap",
      why: "Lịch sử đọc được, biết ngay thay đổi thuộc trang hay thành phần nào."
    },
    {
      title: "Pull request",
      rule: "Tiêu đề theo commit chính; mô tả có ảnh chụp, checklist responsive và dòng Closes #N",
      example: "feat(contact): thêm form và kiểm tra dữ liệu\n\nCloses #5",
      why: "Reviewer thấy đúng trang, đúng issue, biết cách kiểm tra lại."
    },
    {
      title: "Review giao diện",
      rule: "Kiểm tra HTML semantic, alt ảnh, nhãn form, bàn phím, tương phản và 3 mốc màn hình",
      example: "Request changes khi thiếu label; approve sau khi thử 390 px.",
      why: "Lỗi giao diện nhìn thấy được, nên review phải chạm vào trang thật."
    },
    {
      title: "Merge",
      rule: "Squash merge, xoá nhánh, không push trực tiếp lên main",
      example: "gh pr merge 6 --squash --delete-branch",
      why: "Main tuyến tính, mỗi PR còn đúng một commit mang tên tính năng."
    },
    {
      title: "Phát hành",
      rule: "Tag annotated v1.0.0, release có ghi chú 6 trang, bật GitHub Pages",
      example: "git tag -a v1.0.0 -m \"Mộc Coffee 1.0\"",
      why: "Bản phát hành gắn đúng commit đã kiểm thử và có ghi chú cho người dùng."
    }
  ];

  const CHEATS = [
    { group: "Khởi tạo", cmd: "git init", note: "Tạo kho Git cho thư mục website." },
    { group: "Khởi tạo", cmd: "git config user.name \"Nguyễn Minh\"", note: "Đặt tên tác giả cho commit." },
    { group: "Khởi tạo", cmd: "git remote add origin git@github.com:ktzung/moc-coffee.git", note: "Nối thư mục local với GitHub." },
    { group: "Hằng ngày", cmd: "git status", note: "Xem nhánh, tệp đã stage và tệp chưa theo dõi." },
    { group: "Hằng ngày", cmd: "git add menu.html css/style.css", note: "Stage chọn lọc đúng tệp của trang đang làm." },
    { group: "Hằng ngày", cmd: "git diff --staged", note: "Đọc lại thay đổi trước khi commit." },
    { group: "Hằng ngày", cmd: "git commit -m \"feat(menu): dựng lưới thẻ\"", note: "Commit theo Conventional Commits." },
    { group: "Hằng ngày", cmd: "git commit --amend -m \"feat(menu): sửa lưới thẻ\"", note: "Sửa commit gần nhất khi chưa push." },
    { group: "Nhánh", cmd: "git switch -c feature/menu-grid", note: "Tách nhánh cho trang thực đơn." },
    { group: "Nhánh", cmd: "git switch main", note: "Quay về main; dừng nếu còn thay đổi chưa lưu." },
    { group: "Nhánh", cmd: "git branch -d feature/menu-grid", note: "Xoá nhánh đã merge." },
    { group: "Đồng bộ", cmd: "git fetch", note: "Cập nhật nhánh remote mà chưa đổi tệp local." },
    { group: "Đồng bộ", cmd: "git pull --rebase", note: "Đưa commit local lên trên main mới nhất." },
    { group: "Đồng bộ", cmd: "git push -u origin feature/menu-grid", note: "Push lần đầu và gắn upstream." },
    { group: "Đồng bộ", cmd: "git push --force-with-lease", note: "Sau rebase nhánh riêng, an toàn hơn --force." },
    { group: "Xung đột", cmd: "git merge feature/contact-form", note: "Gộp nhánh; dừng lại nếu hai người sửa cùng dòng CSS." },
    { group: "Xung đột", cmd: "git rebase main", note: "Đưa nhánh CSS lên trên main mới nhất." },
    { group: "Xung đột", cmd: "git add css/style.css", note: "Đánh dấu đã giải quyết xung đột." },
    { group: "Xung đột", cmd: "git rebase --continue", note: "Tiếp tục rebase sau khi sửa và add." },
    { group: "Sự cố", cmd: "git revert <sha>", note: "Tạo commit đảo ngược, an toàn trên main." },
    { group: "Sự cố", cmd: "git reset --soft HEAD~1", note: "Bỏ commit nhưng giữ thay đổi để sửa lại." },
    { group: "Sự cố", cmd: "git reflog", note: "Tìm lại commit vừa trôi khỏi nhánh." },
    { group: "Sự cố", cmd: "git stash push -m \"wip css\"", note: "Cất CSS đang viết dở để chuyển nhánh." },
    { group: "Sự cố", cmd: "git stash pop", note: "Lấy lại phần CSS đã cất." },
    { group: "Tệp", cmd: "ls", note: "Xem các thư mục và tệp ở thư mục hiện tại." },
    { group: "Tệp", cmd: "cat menu.html", note: "Đọc nhanh nội dung một tệp." },
    { group: "Tệp", cmd: "npm run check", note: "Chạy kiểm tra HTML/CSS mô phỏng trước khi mở PR." },
    { group: "GitHub", cmd: "gh issue create --title \"...\" --label frontend --assignee lan --body \"...\"", note: "Tạo issue cho một trang và giao người." },
    { group: "GitHub", cmd: "gh pr create --base main --head feature/menu-grid --title \"...\" --body \"Closes #4\"", note: "Mở pull request cho nhánh trang." },
    { group: "GitHub", cmd: "gh pr review 5 --request-changes --body \"Thiếu label ở ô email\"", note: "Yêu cầu sửa trước khi merge." },
    { group: "GitHub", cmd: "gh pr review 5 --approve", note: "Duyệt PR của người khác, không tự duyệt PR của mình." },
    { group: "GitHub", cmd: "gh pr checks 5", note: "Xem ci/pages xanh hay đỏ." },
    { group: "GitHub", cmd: "gh pr merge 5 --squash --delete-branch", note: "Merge squash và xoá nhánh." },
    { group: "GitHub", cmd: "gh release create v1.0.0 --title \"Mộc Coffee 1.0\" --notes \"...\"", note: "Tạo release từ tag đã push." }
  ];

  const COMMANDS = [
    { cmd: "help", note: "Xem phạm vi lệnh được mô phỏng." },
    { cmd: "git status", note: "Bắt đầu bằng trạng thái hiện tại." },
    { cmd: "git log --oneline -n 8", note: "Xem lịch sử commit gần đây." },
    { cmd: "git switch -c feature/ten-trang", note: "Tách nhánh trước khi sửa trang." },
    { cmd: "gh pr list", note: "Xem pull request đang mở." },
    { cmd: "gh issue list", note: "Xem các trang còn thiếu." }
  ];

  global.RepoData = {
    TEAM_DETAILS,
    MODULES,
    RACI,
    SPRINT,
    CONVENTIONS,
    CHEATS,
    COMMANDS
  };
})(typeof window !== "undefined" ? window : globalThis);

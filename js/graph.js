/* Vẽ sơ đồ commit dạng lane bằng SVG, không phụ thuộc thư viện */
(function (global) {
  "use strict";

  const COLORS = ["#2563eb", "#0d9488", "#db2777", "#d97706", "#7c3aed", "#0891b2"];
  const ROW = 34;
  const LANE = 50;
  const PAD_X = 34;
  const PAD_Y = 26;

  function el(name, attrs, text) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
    if (text != null) node.textContent = text;
    return node;
  }

  function shortMessage(text, max) {
    const value = String(text || "");
    return value.length > max ? value.slice(0, max - 1) + "…" : value;
  }

  function render(container, model, onSelect) {
    container.textContent = "";
    const nodes = model.nodes.slice(0, 46);
    const ids = new Set(nodes.map((node) => node.sha));
    const edges = model.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to));
    const rows = nodes.length;
    const lanes = Math.max(1, model.lanes);
    const width = Math.max(640, PAD_X * 2 + lanes * LANE + 430);
    const height = Math.max(120, PAD_Y * 2 + rows * ROW);
    const svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      width: width,
      height: height,
      role: "img",
      "aria-label": "Sơ đồ commit"
    });
    svg.classList.add("commit-graph");

    const defs = el("defs");
    const marker = el("marker", {
      id: "graph-arrow",
      viewBox: "0 0 10 10",
      refX: "8",
      refY: "5",
      markerWidth: "5",
      markerHeight: "5",
      orient: "auto-start-reverse"
    });
    marker.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#94a3b8" }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    const indexOf = new Map();
    nodes.forEach((node, index) => indexOf.set(node.sha, index));

    edges.forEach((edge) => {
      const child = nodes[indexOf.get(edge.from)];
      const parent = nodes[indexOf.get(edge.to)];
      if (!child || !parent) return;
      const x1 = PAD_X + child.lane * LANE;
      const y1 = PAD_Y + child.row * ROW;
      const x2 = PAD_X + parent.lane * LANE;
      const y2 = PAD_Y + parent.row * ROW;
      const midY = y1 + (y2 - y1) / 2;
      const d = x1 === x2
        ? "M " + x1 + " " + y1 + " L " + x2 + " " + y2
        : "M " + x1 + " " + y1 + " C " + x1 + " " + midY + ", " + x2 + " " + midY + ", " + x2 + " " + y2;
      svg.appendChild(el("path", {
        d,
        fill: "none",
        stroke: COLORS[edge.laneFrom % COLORS.length],
        "stroke-width": "2.2",
        "stroke-linecap": "round",
        opacity: "0.55"
      }));
    });

    nodes.forEach((node) => {
      const row = indexOf.get(node.sha);
      const cx = PAD_X + node.lane * LANE;
      const cy = PAD_Y + row * ROW;
      const color = COLORS[node.lane % COLORS.length];
      const group = el("g", { "data-sha": node.sha, tabindex: "0", role: "button", "aria-label": node.short + " " + node.message });
      group.classList.add("graph-node");
      if (node.merge) {
        group.appendChild(el("circle", { cx, cy, r: 8, fill: "#fff", stroke: color, "stroke-width": "2.4" }));
        group.appendChild(el("circle", { cx, cy, r: 3, fill: color }));
      } else {
        group.appendChild(el("circle", { cx, cy, r: 7, fill: color, stroke: "#fff", "stroke-width": "2" }));
      }
      const labelX = Math.max(PAD_X + lanes * LANE + 6, cx + 16);
      group.appendChild(el("text", { x: labelX, y: cy - 2, class: "graph-msg" }, shortMessage(node.message, 52)));
      const meta = node.short + " · " + node.name + " · " + node.time;
      group.appendChild(el("text", { x: labelX, y: cy + 12, class: "graph-meta" }, meta));
      let refX = labelX + 420;
      node.refs.slice(0, 3).forEach((ref) => {
        const text = el("text", { x: refX, y: cy + 3, class: "graph-ref graph-ref-" + ref.kind }, ref.kind === "tag" ? ref.name : ref.name);
        group.appendChild(text);
        refX += Math.max(54, ref.name.length * 6.4 + 18);
      });
      const title = el("title", {}, node.sha + " · " + node.message + " · " + node.name);
      group.appendChild(title);
      const activate = () => { if (onSelect) onSelect(node); };
      group.addEventListener("click", activate);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
      svg.appendChild(group);
    });

    if (!nodes.length) {
      svg.appendChild(el("text", { x: PAD_X, y: PAD_Y + 16, class: "graph-empty" }, "Chưa có commit nào. Hãy tạo commit đầu tiên."));
    }

    container.appendChild(svg);
    if (model.nodes.length > nodes.length) {
      const note = document.createElement("p");
      note.className = "graph-note";
      note.textContent = "Đang hiển thị 46 commit gần nhất trong tổng số " + model.nodes.length + ".";
      container.appendChild(note);
    }
  }

  global.RepoGraph = { render, COLORS };
})(typeof window !== "undefined" ? window : globalThis);

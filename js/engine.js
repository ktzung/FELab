/* FELab — giả lập Git/GitHub cho nhóm làm website tĩnh, chạy hoàn toàn trong trình duyệt */
(function (global) {
  "use strict";

  const TEAM = {
    minh: { name: "Nguyễn Minh", email: "minh@moccoffee.dev", short: "Minh", role: "Tech Lead" },
    lan: { name: "Trần Lan", email: "lan@moccoffee.dev", short: "Lan", role: "HTML/CSS" },
    huy: { name: "Lê Huy", email: "huy@moccoffee.dev", short: "Huy", role: "JS/Bootstrap" }
  };
  const TEAM_IDS = ["minh", "lan", "huy"];
  const BASE_TIME = Date.UTC(2026, 10, 20, 8, 0);
  const PROTECTED_DEFAULT = { prRequired: false, reviews: 0, checks: [], directPush: true };

  const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

  function short(sha) {
    return sha ? sha.slice(0, 7) : "";
  }

  function tokenize(line) {
    const out = [];
    let text = "";
    let quote = "";
    let has = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quote) {
        if (ch === quote) quote = "";
        else if (ch === "\\" && quote === '"' && i + 1 < line.length) { i += 1; text += line[i]; }
        else text += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch; has = true;
      } else if (/\s/.test(ch)) {
        if (has || text) { out.push(text); text = ""; has = false; }
      } else {
        text += ch;
      }
    }
    if (has || text) out.push(text);
    return out;
  }

  function parseFlags(tokens, start) {
    const flags = { _: [] };
    for (let i = start; i < tokens.length; i += 1) {
      const tok = tokens[i];
      if (tok === "--") { flags._.push(...tokens.slice(i + 1)); break; }
      if (tok.startsWith("--")) {
        const eq = tok.indexOf("=");
        if (eq > -1) { flags[tok.slice(2, eq)] = tok.slice(eq + 1); continue; }
        const key = tok.slice(2);
        const next = tokens[i + 1];
        if (next != null && !next.startsWith("-")) { flags[key] = next; i += 1; }
        else flags[key] = true;
      } else if (tok.startsWith("-") && tok.length > 1) {
        flags[tok.slice(1)] = true;
      } else {
        flags._.push(tok);
      }
    }
    return flags;
  }

  function subject(message) {
    return String(message || "").split("\n")[0];
  }

  function isIgnored(path) {
    return (
      path === ".DS_Store" ||
      path.endsWith("/.DS_Store") ||
      path === ".env" ||
      path.startsWith("node_modules/") ||
      path.startsWith("dist/")
    );
  }

  function applyChanges(snapshot, changes) {
    const next = clone(snapshot || {});
    Object.entries(changes || {}).forEach(([path, content]) => {
      if (content === null) delete next[path];
      else next[path] = content;
    });
    return next;
  }

  function conflictText(ours, theirs, label) {
    return (
      "<<<<<<< HEAD\n" +
      (ours || "") +
      (ours && !ours.endsWith("\n") ? "\n" : "") +
      "=======\n" +
      (theirs || "") +
      (theirs && !theirs.endsWith("\n") ? "\n" : "") +
      ">>>>>>> " + (label || "nhánh cần gộp") + "\n"
    );
  }

  function hasMarkers(text) {
    return /^<{7} /m.test(text || "") || /^={7}$/m.test(text || "") || /^>{7} /m.test(text || "");
  }

  function line(textValue, cls) {
    return { text: textValue == null ? "" : String(textValue), cls: cls || "" };
  }

  function diffLines(oldText, newText) {
    const a = String(oldText == null ? "" : oldText).split("\n");
    const b = String(newText == null ? "" : newText).split("\n");
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i -= 1) {
      for (let j = n - 1; j >= 0; j -= 1) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    let i = 0; let j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { out.push(line(" " + a[i], "diff-ctx")); i += 1; j += 1; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(line("-" + a[i], "diff-del")); i += 1; }
      else { out.push(line("+" + b[j], "diff-add")); j += 1; }
    }
    while (i < m) { out.push(line("-" + a[i], "diff-del")); i += 1; }
    while (j < n) { out.push(line("+" + b[j], "diff-add")); j += 1; }
    return out;
  }

  function GitSim() {
    this.reset();
  }

  GitSim.prototype.reset = function reset() {
    this.initialized = false;
    this.repo = "moc-coffee";
    this.github = { owner: "ktzung", repo: "moc-coffee" };
    this.role = "minh";
    this.identity = {};
    this.branch = "main";
    this.detachedSha = null;
    this.commits = {};
    this.branches = {};
    this.remote = {
      name: "origin",
      url: "git@github.com:ktzung/moc-coffee.git",
      branches: {},
      tags: {}
    };
    this.remoteRefs = {};
    this.index = {};
    this.worktree = {};
    this.tags = {};
    this.stash = [];
    this.reflog = [];
    this.conflicts = {};
    this.mergeState = null;
    this.upstream = {};
    this.issues = [];
    this.prs = [];
    this.runs = [];
    this.releases = [];
    this.labels = [];
    this.milestones = [];
    this.protection = { main: clone(PROTECTED_DEFAULT) };
    this.workflows = { ci: false, deploy: false };
    this.ciRule = null;
    this.events = [];
    this.seq = 1;
    this.runSeq = 0;
    this.clock = 0;
    this.lastError = "";
    this.lastLines = [];
  };

  GitSim.prototype.user = function user() {
    const person = TEAM[this.role] || TEAM.minh;
    return Object.assign({}, person, this.identity || {});
  };

  GitSim.prototype.emit = function emit(type, data) {
    this.events.push(Object.assign({ type, at: this.clock }, data || {}));
  };

  GitSim.prototype.nextSha = function nextSha() {
    const id = "c" + this.seq.toString(36).padStart(6, "0");
    this.seq += 1;
    return id;
  };

  GitSim.prototype.makeCommit = function makeCommit(opts) {
    const sha = this.nextSha();
    this.clock += 60;
    const author = opts.author || this.role;
    const person = TEAM[author] || TEAM.minh;
    this.commits[sha] = {
      sha,
      parents: (opts.parents || []).filter(Boolean),
      message: opts.message || "chore: cập nhật",
      author,
      name: person.name,
      email: person.email,
      time: this.clock,
      files: clone(opts.files || {})
    };
    return sha;
  };

  GitSim.prototype.logRef = function logRef(ref, oldSha, newSha, message) {
    this.reflog.push({
      ref,
      old: oldSha || null,
      new: newSha || null,
      message,
      time: this.clock
    });
  };

  GitSim.prototype.headSha = function headSha() {
    if (this.detachedSha) return this.detachedSha;
    return this.branches[this.branch] || null;
  };

  GitSim.prototype.headLabel = function headLabel() {
    if (this.detachedSha) return "HEAD detached at " + short(this.detachedSha);
    return "On branch " + this.branch;
  };

  GitSim.prototype.resolve = function resolve(ref) {
    if (!ref || ref === "HEAD" || ref === "@") return this.headSha();
    let name = String(ref).trim();
    const tilde = name.match(/^(.*)~(\d+)$/);
    if (tilde) {
      let sha = this.resolve(tilde[1]);
      const count = Number(tilde[2]);
      for (let i = 0; i < count && sha; i += 1) sha = this.commits[sha].parents[0] || null;
      return sha;
    }
    const caret = name.match(/^(.*)\^(\d*)$/);
    if (caret) {
      const sha = this.resolve(caret[1]);
      if (!sha) return null;
      const idx = caret[2] ? Number(caret[2]) : 1;
      return this.commits[sha].parents[idx - 1] || null;
    }
    if (name === "@{-1}") {
      const entry = this.reflog[this.reflog.length - 1];
      return entry ? entry.old : null;
    }
    if (this.branches[name] != null) return this.branches[name];
    if (this.detachedSha && name === "HEAD") return this.detachedSha;
    if (this.remoteRefs[name] != null) return this.remoteRefs[name];
    if (name.startsWith("origin/") && this.remote.branches[name.slice(7)] != null) return this.remote.branches[name.slice(7)];
    if (this.remote.branches[name] != null && !this.branches[name]) return this.remote.branches[name];
    if (this.tags[name] != null) return this.tags[name].sha;
    if (this.commits[name]) return name;
    const matches = Object.keys(this.commits).filter((sha) => sha.startsWith(name));
    if (matches.length === 1) return matches[0];
    return null;
  };

  GitSim.prototype.commitOf = function commitOf(ref) {
    const sha = this.resolve(ref);
    return sha ? this.commits[sha] : null;
  };

  GitSim.prototype.snapshotOf = function snapshotOf(ref) {
    const commit = this.commitOf(ref);
    return commit ? commit.files : {};
  };

  GitSim.prototype.ancestors = function ancestors(sha) {
    const seen = new Set();
    const stack = sha ? [sha] : [];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || seen.has(cur)) continue;
      seen.add(cur);
      const commit = this.commits[cur];
      if (commit) commit.parents.forEach((p) => stack.push(p));
    }
    return seen;
  };

  GitSim.prototype.isAncestor = function isAncestor(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    return this.ancestors(b).has(a);
  };

  GitSim.prototype.mergeBase = function mergeBase(a, b) {
    const setA = this.ancestors(a);
    const queue = [b];
    const seen = new Set();
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || seen.has(cur)) continue;
      seen.add(cur);
      if (setA.has(cur)) return cur;
      const commit = this.commits[cur];
      if (commit) commit.parents.forEach((p) => queue.push(p));
    }
    return null;
  };

  GitSim.prototype.listCommits = function listCommits(refs, limit) {
    const set = new Set();
    (refs || []).forEach((ref) => this.ancestors(this.resolve(ref)).forEach((sha) => set.add(sha)));
    const list = Array.from(set).map((sha) => this.commits[sha]).filter(Boolean);
    list.sort((a, b) => b.time - a.time);
    return limit ? list.slice(0, limit) : list;
  };

  GitSim.prototype.branchAheadBehind = function branchAheadBehind(branch, upstreamRef) {
    const local = this.resolve(branch);
    const remote = this.resolve(upstreamRef);
    if (!local || !remote) return { ahead: 0, behind: 0 };
    if (local === remote) return { ahead: 0, behind: 0 };
    if (this.isAncestor(remote, local)) {
      return { ahead: this.ancestors(local).size - this.ancestors(remote).size, behind: 0 };
    }
    if (this.isAncestor(local, remote)) {
      return { ahead: 0, behind: this.ancestors(remote).size - this.ancestors(local).size };
    }
    const base = this.mergeBase(local, remote);
    const baseCount = this.ancestors(base).size;
    return {
      ahead: this.ancestors(local).size - baseCount,
      behind: this.ancestors(remote).size - baseCount
    };
  };

  GitSim.prototype.mergeSnapshots = function mergeSnapshots(base, ours, theirs, label) {
    const files = {};
    const conflicts = {};
    const paths = new Set([...Object.keys(ours), ...Object.keys(theirs)]);
    paths.forEach((path) => {
      const b = base[path];
      const o = ours[path];
      const t = theirs[path];
      if (o === t) { if (o !== undefined) files[path] = o; return; }
      if (o === b) { if (t !== undefined) files[path] = t; return; }
      if (t === b) { if (o !== undefined) files[path] = o; return; }
      conflicts[path] = { base: b, ours: o, theirs: t };
      files[path] = conflictText(o, t, label);
    });
    return { files, conflicts };
  };

  GitSim.prototype.threeWayPreview = function threeWayPreview(headRef, baseRef) {
    const headSha = this.resolve(headRef);
    const baseSha = this.resolve(baseRef);
    if (!headSha || !baseSha) return { conflicts: [], files: {} };
    const base = this.mergeBase(headSha, baseSha);
    const result = this.mergeSnapshots(
      base ? this.commits[base].files : {},
      this.commits[headSha].files,
      this.commits[baseSha].files,
      baseRef
    );
    return { conflicts: Object.keys(result.conflicts), files: result.files };
  };

  GitSim.prototype.statusInfo = function statusInfo() {
    const headSha = this.headSha();
    const headSnap = headSha ? this.commits[headSha].files : {};
    const tracked = new Set([...Object.keys(headSnap), ...Object.keys(this.index)]);
    const staged = [];
    const unstaged = [];
    tracked.forEach((path) => {
      const h = headSnap[path];
      const idx = this.index[path];
      const wt = this.worktree[path];
      if (idx !== h) {
        if (idx === undefined) staged.push({ path, type: "deleted" });
        else if (h === undefined) staged.push({ path, type: "added" });
        else staged.push({ path, type: "modified" });
      }
      if (wt !== idx) {
        if (wt === undefined) unstaged.push({ path, type: "deleted" });
        else if (idx === undefined) unstaged.push({ path, type: "untracked" });
        else unstaged.push({ path, type: "modified" });
      }
    });
    const untracked = Object.keys(this.worktree).filter((path) => !tracked.has(path) && !isIgnored(path));
    const conflictPaths = Object.keys(this.conflicts);
    return { headSnap, staged, unstaged, untracked, conflicts: conflictPaths, dirty: staged.length + unstaged.length + untracked.length > 0 };
  };

  GitSim.prototype.file = function file(path) {
    return this.worktree[path];
  };

  GitSim.prototype.headFile = function headFile(path) {
    const commit = this.commitOf(this.headSha());
    return commit ? commit.files[path] : undefined;
  };

  GitSim.prototype.commitPaths = function commitPaths(sha) {
    const commit = this.commits[sha];
    if (!commit) return [];
    const parent = commit.parents[0] ? this.commits[commit.parents[0]] : { files: {} };
    const paths = new Set([...Object.keys(commit.files), ...Object.keys(parent.files)]);
    return Array.from(paths).filter((path) => commit.files[path] !== parent.files[path]);
  };

  GitSim.prototype.updateIndexAndWorktree = function updateIndexAndWorktree(snapshot, keepUntracked) {
    const kept = {};
    if (keepUntracked) {
      Object.keys(this.worktree).forEach((path) => {
        if (!(path in snapshot) && !(path in this.index)) kept[path] = this.worktree[path];
      });
    }
    this.worktree = Object.assign(clone(snapshot), kept);
    this.index = clone(snapshot);
    this.conflicts = {};
  };

  GitSim.prototype.changeBranch = function changeBranch(name, sha, opts) {
    const old = this.headSha();
    this.branch = name;
    this.detachedSha = opts && opts.detached ? sha : null;
    this.updateIndexAndWorktree(clone(this.commits[sha] ? this.commits[sha].files : {}), true);
    this.logRef("HEAD", old, sha, "checkout: moving to " + name);
    this.emit("checkout", { branch: name });
  };

  GitSim.prototype.createBranch = function createBranch(name, from) {
    const sha = this.resolve(from || this.branch);
    if (!sha) return false;
    this.branches[name] = sha;
    this.logRef("refs/heads/" + name, null, sha, "branch: created from " + (from || this.branch));
    return true;
  };

  GitSim.prototype.seed = function seed(opts) {
    const o = opts || {};
    this.reset();
    this.initialized = !o.uninitialized;
    if (o.role) this.role = o.role;
    if (o.repo) this.repo = o.repo;
    if (o.labels) this.labels = clone(o.labels);
    if (o.milestones) this.milestones = clone(o.milestones);
    if (o.protection) {
      Object.entries(o.protection).forEach(([branchName, value]) => {
        this.protection[branchName] = Object.assign(clone(PROTECTED_DEFAULT), clone(value));
      });
    }
    if (o.workflows) this.workflows = Object.assign({ ci: false, deploy: false }, o.workflows);
    if (o.ciRule) this.ciRule = o.ciRule;
    if (o.ignore) this.ignore = o.ignore.slice();

    let headSha = null;
    if (!o.empty) {
      let snapshot = clone(o.files || {});
      headSha = this.makeCommit({
        files: snapshot,
        message: o.message || "chore: khởi tạo website Mộc Coffee",
        author: o.author || "minh",
        parents: []
      });
      (o.history || []).forEach((entry) => {
        snapshot = entry.files ? clone(entry.files) : applyChanges(snapshot, entry.changes);
        headSha = this.makeCommit({
          files: snapshot,
          message: entry.message,
          author: entry.author || "minh",
          parents: [headSha]
        });
      });
      this.branches.main = headSha;
      this.remote.branches.main = headSha;
      this.remoteRefs["origin/main"] = headSha;
    }

    Object.entries(o.branches || {}).forEach(([name, def]) => {
      if (typeof def === "string") {
        this.branches[name] = this.resolve(def);
        return;
      }
      const start = this.resolve(def.from || "main") || headSha;
      let sha = start;
      let snapshot = clone(this.commits[start] ? this.commits[start].files : {});
      (def.commits || []).forEach((entry) => {
        snapshot = entry.files ? clone(entry.files) : applyChanges(snapshot, entry.changes);
        sha = this.makeCommit({
          files: snapshot,
          message: entry.message,
          author: entry.author || def.author || "lan",
          parents: [sha]
        });
      });
      this.branches[name] = sha;
    });

    Object.entries(o.remoteBranches || {}).forEach(([name, value]) => {
      const sha = typeof value === "string" ? this.resolve(this.branches[value] ? value : value) : null;
      if (sha) {
        this.remote.branches[name] = sha;
        this.remoteRefs["origin/" + name] = sha;
      }
    });

    if (o.remoteAhead) {
      let tip = this.remote.branches.main;
      let snap = tip ? clone(this.commits[tip].files) : {};
      o.remoteAhead.forEach((entry) => {
        snap = entry.files ? clone(entry.files) : applyChanges(snap, entry.changes);
        tip = this.makeCommit({
          files: snap,
          message: entry.message,
          author: entry.author || "huy",
          parents: tip ? [tip] : []
        });
        this.remote.branches.main = tip;
        this.remoteRefs["origin/main"] = tip;
      });
    }

    if (o.localAhead) {
      let tip = this.branches.main;
      let snap = tip ? clone(this.commits[tip].files) : {};
      o.localAhead.forEach((entry) => {
        snap = entry.files ? clone(entry.files) : applyChanges(snap, entry.changes);
        tip = this.makeCommit({
          files: snap,
          message: entry.message,
          author: entry.author || "lan",
          parents: tip ? [tip] : []
        });
        this.branches.main = tip;
      });
    }

    const current = o.branch || "main";
    this.branch = current;
    this.detachedSha = null;
    const currentSha = this.branches[current] || headSha;
    const baseSnap = currentSha ? clone(this.commits[currentSha].files) : clone(o.files || {});
    this.worktree = applyChanges(baseSnap, o.dirty || {});
    this.index = clone(baseSnap);
    Object.assign(this.worktree, clone(o.untracked || {}));
    Object.entries(o.trackedAdd || {}).forEach(([path, content]) => { this.worktree[path] = content; this.index[path] = content; });

    Object.entries(o.tags || {}).forEach(([name, def]) => {
      const value = typeof def === "string" ? def : def.sha || current;
      const sha = this.resolve(value) || currentSha;
      this.tags[name] = { sha, annotated: !!(def && def.message), message: def && def.message ? def.message : "" };
      if (def && def.push) this.remote.tags[name] = clone(this.tags[name]);
    });

    if (o.upstream) this.upstream = clone(o.upstream);
    else if (o.branch && this.remote.branches[o.branch]) this.upstream[o.branch] = "origin/" + o.branch;

    (o.reflog || []).forEach((entry) => {
      this.reflog.push({ ref: entry.ref || "HEAD", old: null, new: this.resolve(entry.sha || "HEAD"), message: entry.message, time: entry.time || this.clock });
    });

    (o.issues || []).forEach((issue) => {
      this.issues.push(Object.assign({ number: this.issues.length + 1, state: "open", labels: [], comments: [], author: "minh" }, clone(issue)));
    });
    (o.prs || []).forEach((pr) => {
      const number = pr.number || (this.prs.length + 1);
      const head = pr.head || (o.branch || "main");
      const base = pr.base || "main";
      const headSha = this.resolve(head);
      const closes = pr.closes || (() => {
        const found = [];
        const re = /(?:closes|fixes|resolves)\s+#(\d+)/gi;
        let hit = re.exec(pr.body || "");
        while (hit) { found.push(Number(hit[1])); hit = re.exec(pr.body || ""); }
        return found;
      })();
      this.prs.push(Object.assign({
        number, state: "open", draft: false, reviews: [], comments: [], author: "lan",
        headSha, createdAt: this.clock, mergeable: true, merged: false
      }, clone(pr), { number, head, base, headSha, closes }));
    });
    (o.runs || []).forEach((run) => {
      this.runSeq += 1;
      const sha = run.sha ? this.resolve(run.sha) : (run.branch ? this.resolve(run.branch) : null);
      this.runs.push(Object.assign({ id: this.runSeq, workflow: "CI", status: "completed", conclusion: "success", log: [] }, clone(run), { id: this.runSeq, sha: sha || run.sha }));
    });
    (o.releases || []).forEach((release) => this.releases.push(clone(release)));
    if (o.stash) this.stash = clone(o.stash);
  };

  GitSim.prototype.commitOn = function commitOn(refName, opts) {
    const tip = this.resolve(refName);
    const baseSnap = tip ? clone(this.commits[tip].files) : {};
    const snapshot = opts.files ? clone(opts.files) : applyChanges(baseSnap, opts.changes);
    const sha = this.makeCommit({
      files: snapshot,
      message: opts.message,
      author: opts.author || this.role,
      parents: tip ? [tip] : []
    });
    if (this.branches[refName] != null || refName === this.branch) {
      this.branches[refName] = sha;
      if (this.branch === refName && !this.detachedSha) {
        this.worktree = clone(snapshot);
        this.index = clone(snapshot);
      }
    }
    return sha;
  };

  GitSim.prototype.advanceRemote = function advanceRemote(name, opts) {
    const tip = this.remote.branches[name];
    const baseSnap = tip ? clone(this.commits[tip].files) : {};
    const snapshot = opts.files ? clone(opts.files) : applyChanges(baseSnap, opts.changes);
    const sha = this.makeCommit({
      files: snapshot,
      message: opts.message,
      author: opts.author || "huy",
      parents: tip ? [tip] : []
    });
    this.remote.branches[name] = sha;
    this.remoteRefs["origin/" + name] = sha;
    return sha;
  };

  /* ---------------- Git commands ---------------- */

  GitSim.prototype.stageAll = function stageAll() {
    const paths = new Set([...Object.keys(this.worktree), ...Object.keys(this.index)]);
    paths.forEach((path) => {
      const wt = this.worktree[path];
      if (wt === undefined) { delete this.index[path]; return; }
      if (!(path in this.index) && isIgnored(path)) return;
      this.index[path] = wt;
    });
    Object.keys(this.conflicts).forEach((path) => {
      if (!hasMarkers(this.worktree[path])) delete this.conflicts[path];
    });
  };

  GitSim.prototype.stagePaths = function stagePaths(paths) {
    const all = paths.includes(".") || paths.includes("-A") || paths.includes("*");
    if (all) { this.stageAll(); return { all: true, count: 1 }; }
    let count = 0;
    paths.forEach((raw) => {
      const path = raw.replace(/^\.\//, "");
      const known = path in this.worktree || path in this.index;
      if (!known) return;
      if (this.worktree[path] === undefined) delete this.index[path];
      else this.index[path] = this.worktree[path];
      if (this.conflicts[path] && !hasMarkers(this.worktree[path])) delete this.conflicts[path];
      count += 1;
    });
    return { all: false, count };
  };

  GitSim.prototype.restorePath = function restorePath(path, staged) {
    const head = this.commits[this.headSha()];
    if (staged) {
      const snapshot = head ? head.files : {};
      [].concat(path).forEach((p) => {
        if (snapshot[p] === undefined) delete this.index[p];
        else this.index[p] = snapshot[p];
      });
      return;
    }
    [].concat(path).forEach((p) => {
      if (this.index[p] === undefined) delete this.worktree[p];
      else this.worktree[p] = this.index[p];
    });
  };

  GitSim.prototype.trackedDirty = function trackedDirty() {
    const head = this.commits[this.headSha()];
    const headSnap = head ? head.files : {};
    return Object.keys(this.worktree).some((path) => {
      if (!(path in this.index) && !(path in headSnap)) return false;
      return this.worktree[path] !== this.index[path];
    }) || Object.keys(this.index).some((path) => this.index[path] !== headSnap[path]);
  };

  GitSim.prototype.switchBranch = function switchBranch(name, opts) {
    const o = opts || {};
    if (o.create) {
      if (this.branches[name]) return { ok: false, error: "fatal: a branch named '" + name + "' already exists" };
      if (this.trackedDirty() && !o.force) {
        return { ok: false, error: "error: Your local changes would be overwritten by checkout. Hãy commit hoặc stash trước." };
      }
      const from = o.from || this.branch;
      if (!this.createBranch(name, from)) return { ok: false, error: "fatal: invalid reference: " + from };
      this.changeBranch(name, this.branches[name], {});
      return { ok: true, message: "Switched to a new branch '" + name + "'" };
    }
    if (this.branches[name]) {
      if (this.trackedDirty() && !o.force) {
        return { ok: false, error: "error: Your local changes would be overwritten by checkout. Hãy commit hoặc stash trước." };
      }
      this.changeBranch(name, this.branches[name], {});
      return { ok: true, message: "Switched to branch '" + name + "'" };
    }
    const sha = this.resolve(name);
    if (sha) {
      if (this.trackedDirty() && !o.force) {
        return { ok: false, error: "error: Your local changes would be overwritten by checkout." };
      }
      this.changeBranch("(detached)", sha, { detached: true });
      return { ok: true, message: "Note: switching to '" + short(sha) + "'. HEAD is now detached." };
    }
    return { ok: false, error: "fatal: invalid reference: " + name };
  };

  GitSim.prototype.deleteBranch = function deleteBranch(name, force) {
    if (!this.branches[name]) return { ok: false, error: "error: branch '" + name + "' not found." };
    if (name === this.branch) return { ok: false, error: "error: cannot delete branch '" + name + "' checked out at current worktree" };
    if (!force) {
      const local = this.branches[name];
      const upstream = this.upstream[name] ? this.resolve(this.upstream[name]) : null;
      if (upstream && !this.isAncestor(local, upstream)) {
        return { ok: false, error: "error: branch '" + name + "' is not fully merged. Dùng -D nếu chắc chắn." };
      }
    }
    const sha = this.branches[name];
    delete this.branches[name];
    this.logRef("refs/heads/" + name, sha, null, "branch: deleted");
    return { ok: true, message: "Deleted branch " + name + " (was " + short(sha) + ")." };
  };

  GitSim.prototype.stagedDiff = function stagedDiff() {
    const head = this.commits[this.headSha()];
    const headSnap = head ? head.files : {};
    const paths = new Set([...Object.keys(headSnap), ...Object.keys(this.index)]);
    const list = [];
    paths.forEach((path) => {
      if (headSnap[path] !== this.index[path]) list.push(path);
    });
    return list;
  };

  GitSim.prototype.commit = function commit(opts) {
    const o = opts || {};
    if (Object.keys(this.conflicts).length) {
      return { ok: false, error: "error: Committing is not possible because you have unmerged files.\nhint: Sửa tệp, chạy git add <tệp> rồi git commit." };
    }
    if (o.all) {
      const head = this.commits[this.headSha()];
      const headSnap = head ? head.files : {};
      Object.keys(this.index).forEach((path) => {
        if (this.worktree[path] === undefined) delete this.index[path];
        else if (this.worktree[path] !== this.index[path]) this.index[path] = this.worktree[path];
        else if (headSnap[path] !== this.index[path] && this.worktree[path] === undefined) delete this.index[path];
      });
    }
    const staged = this.stagedDiff();
    const merging = this.mergeState && (this.mergeState.type === "merge" || this.mergeState.type === "cherry-pick" || this.mergeState.type === "revert");
    const amending = !!o.amend;
    if (!staged.length && !merging && !amending) {
      return { ok: false, error: "nothing to commit, working tree clean" };
    }
    if (!o.message) return { ok: false, error: "Aborting commit due to empty commit message." };
    const sha = this.headSha();
    const previous = sha ? this.commits[sha] : null;
    const merge = this.mergeState;
    let parents = sha ? [sha] : [];
    let message = o.message;
    if (amending) {
      if (!previous) return { ok: false, error: "fatal: You have nothing to amend." };
      parents = previous.parents.slice();
      if (!o.message || o.message === true) message = previous.message;
    } else if (merge && merge.type === "merge") {
      parents = [merge.oursSha, merge.theirsSha];
      if (!o.message || o.message === true) message = "Merge branch '" + merge.from + "' into " + this.branch;
    } else if (merge && merge.type === "cherry-pick") {
      parents = sha ? [sha] : [];
    }
    const newSha = this.makeCommit({
      files: clone(this.index),
      message,
      author: o.author || this.role,
      parents
    });
    const changed = staged.length;
    if (this.detachedSha) this.detachedSha = newSha;
    else this.branches[this.branch] = newSha;
    this.mergeState = null;
    this.conflicts = {};
    this.logRef("HEAD", sha, newSha, (amending ? "commit (amend): " : "commit: ") + subject(message));
    if (!this.detachedSha && this.branch === "main") {
      const closer = /(?:closes|fixes|resolves)\s+#(\d+)/gi;
      let hit = closer.exec(message);
      while (hit) {
        const issue = this.issueByNumber(hit[1]);
        if (issue && issue.state === "open") {
          issue.state = "closed";
          issue.closedAt = this.clock;
          issue.closedBy = this.role;
          issue.comments.push({ author: this.role, body: "Đã giải quyết trong " + short(newSha) + ".", time: this.clock });
        }
        hit = closer.exec(message);
      }
    }
    this.emit("commit", { sha: newSha, message, author: o.author || this.role, changed, branch: this.branch, amend: amending });
    return {
      ok: true,
      lines: [
        line("[" + (this.detachedSha ? "detached HEAD" : this.branch) + " " + short(newSha) + "] " + subject(message), "ok"),
        line(" " + changed + " tệp thay đổi", "muted")
      ]
    };
  };

  GitSim.prototype.finishMerge = function finishMerge() {
    if (!this.mergeState || this.mergeState.type !== "merge") return { ok: false, error: "There is no merge in progress." };
    if (Object.keys(this.conflicts).length) return { ok: false, error: "error: còn tệp xung đột chưa được git add." };
    const state = this.mergeState;
    const newSha = this.makeCommit({
      files: clone(this.index),
      message: "Merge branch '" + state.from + "' into " + this.branch,
      author: this.role,
      parents: [state.oursSha, state.theirsSha]
    });
    const old = this.branches[this.branch];
    this.branches[this.branch] = newSha;
    this.mergeState = null;
    this.logRef("HEAD", old, newSha, "merge " + state.from + ": Merge made by the 'ort' strategy.");
    this.emit("merge", { branch: this.branch, from: state.from, sha: newSha });
    return { ok: true, lines: [line("Merge made by the 'ort' strategy.", "ok"), line(" " + short(old) + ".." + short(newSha) + "  " + this.branch + " -> " + this.branch, "muted")] };
  };

  GitSim.prototype.mergeRef = function mergeRef(refName, opts) {
    const o = opts || {};
    if (this.detachedSha) return { ok: false, error: "fatal: không merge khi HEAD đang detached." };
    const theirsSha = this.resolve(refName);
    if (!theirsSha) return { ok: false, error: "merge: " + refName + " - not something we can merge" };
    if (this.trackedDirty()) return { ok: false, error: "error: Your local changes would be overwritten by merge. Hãy commit hoặc stash trước." };
    const oursSha = this.headSha();
    if (!oursSha) return { ok: false, error: "fatal: không có commit nào để merge." };
    if (this.isAncestor(theirsSha, oursSha)) return { ok: true, lines: [line("Already up to date.", "ok")] };
    if (this.isAncestor(oursSha, theirsSha)) {
      this.branches[this.branch] = theirsSha;
      this.updateIndexAndWorktree(clone(this.commits[theirsSha].files), true);
      this.logRef("HEAD", oursSha, theirsSha, "merge " + refName + ": Fast-forward");
      this.emit("merge", { branch: this.branch, from: refName, sha: theirsSha, fastForward: true });
      return { ok: true, lines: [line("Fast-forward", "ok"), line(" " + short(oursSha) + ".." + short(theirsSha) + "  " + this.branch + " -> " + this.branch, "muted")] };
    }
    const baseSha = this.mergeBase(oursSha, theirsSha);
    const base = baseSha ? this.commits[baseSha].files : {};
    const ours = this.commits[oursSha].files;
    const theirs = this.commits[theirsSha].files;
    const result = this.mergeSnapshots(base, ours, theirs, refName);
    const conflictPaths = Object.keys(result.conflicts);
    if (!conflictPaths.length) {
      const newSha = this.makeCommit({
        files: result.files,
        message: "Merge branch '" + refName + "' into " + this.branch,
        author: this.role,
        parents: [oursSha, theirsSha]
      });
      this.branches[this.branch] = newSha;
      this.updateIndexAndWorktree(clone(result.files), true);
      this.logRef("HEAD", oursSha, newSha, "merge " + refName + ": Merge made by the 'ort' strategy.");
      this.emit("merge", { branch: this.branch, from: refName, sha: newSha });
      return { ok: true, lines: [line("Merge made by the 'ort' strategy.", "ok"), line(" " + short(oursSha) + ".." + short(newSha) + "  " + this.branch + " -> " + this.branch, "muted")] };
    }
    const beforeWorktree = clone(this.worktree);
    const beforeIndex = clone(this.index);
    this.conflicts = result.conflicts;
    this.worktree = clone(result.files);
    this.index = clone(result.files);
    conflictPaths.forEach((path) => { this.index[path] = ours[path]; });
    this.mergeState = {
      type: "merge",
      from: refName,
      oursSha,
      theirsSha,
      baseSha,
      branch: this.branch,
      beforeWorktree,
      beforeIndex
    };
    this.emit("conflict", { paths: conflictPaths, from: refName });
    const lines = [line("Auto-merging thất bại ở " + conflictPaths.length + " tệp:", "warn")];
    conflictPaths.forEach((path) => {
      lines.push(line("CONFLICT (content): Merge conflict in " + path, "error"));
    });
    lines.push(line("hint: Sửa các dấu <<<<<<< trong tệp, git add <tệp>, rồi git commit.", "muted"));
    return { ok: false, error: "Merge conflict", lines };
  };

  GitSim.prototype.mergeAbort = function mergeAbort() {
    const state = this.mergeState;
    if (!state) return { ok: false, error: "There is no merge to abort." };
    this.worktree = state.beforeWorktree || clone(this.worktree);
    this.index = state.beforeIndex || clone(this.index);
    this.conflicts = {};
    this.mergeState = null;
    return { ok: true, lines: [line("Merge aborted.", "ok")] };
  };

  GitSim.prototype.applyCommitOnto = function applyCommitOnto(commitSha, baseSha, snapshot) {
    const commit = this.commits[commitSha];
    const parent = commit.parents[0] ? this.commits[commit.parents[0]] : { files: {} };
    const paths = this.commitPaths(commitSha);
    const next = clone(snapshot);
    const conflicts = [];
    paths.forEach((path) => {
      const before = parent.files[path];
      const after = commit.files[path];
      const current = next[path];
      if (current !== before && current !== after) {
        conflicts.push({ path, base: before, ours: current, theirs: after });
        next[path] = conflictText(current, after, short(commitSha));
      } else if (after === undefined) {
        delete next[path];
      } else {
        next[path] = after;
      }
    });
    return { snapshot: next, conflicts };
  };

  GitSim.prototype.rebaseOnto = function rebaseOnto(upstreamRef) {
    if (this.detachedSha) return { ok: false, error: "fatal: không rebase khi HEAD đang detached." };
    const ontoSha = this.resolve(upstreamRef);
    if (!ontoSha) return { ok: false, error: "fatal: invalid upstream '" + upstreamRef + "'" };
    if (this.trackedDirty()) return { ok: false, error: "error: cannot rebase: You have unstaged changes. Hãy commit hoặc stash trước." };
    const headSha = this.headSha();
    if (!headSha) return { ok: false, error: "fatal: cần ít nhất một commit trước khi rebase." };
    if (this.isAncestor(ontoSha, headSha)) return { ok: true, lines: [line("Current branch " + this.branch + " is up to date.", "ok")] };
    if (this.isAncestor(headSha, ontoSha)) {
      const old = headSha;
      this.branches[this.branch] = ontoSha;
      this.updateIndexAndWorktree(clone(this.commits[ontoSha].files), true);
      this.logRef("HEAD", old, ontoSha, "rebase finished: Fast-forward");
      return { ok: true, lines: [line("Fast-forwarded " + this.branch + " to " + upstreamRef + ".", "ok")] };
    }
    const base = this.mergeBase(headSha, ontoSha);
    const chain = [];
    let cur = headSha;
    while (cur && cur !== base) {
      chain.push(cur);
      const c = this.commits[cur];
      if (!c) break;
      cur = c.parents[0] || null;
    }
    chain.reverse();
    if (!chain.length) return { ok: true, lines: [line("Current branch " + this.branch + " is up to date.", "ok")] };
    let snapshot = clone(this.commits[ontoSha].files);
    let tip = ontoSha;
    const applied = [];
    for (let i = 0; i < chain.length; i += 1) {
      const source = this.commits[chain[i]];
      const result = this.applyCommitOnto(chain[i], tip, snapshot);
      if (result.conflicts.length) {
        this.rebaseState = {
          type: "rebase",
          onto: upstreamRef,
          ontoSha,
          originalHead: headSha,
          branch: this.branch,
          chain,
          index: i,
          remaining: chain.slice(i + 1),
          tip,
          snapshot: result.snapshot,
          conflicts: result.conflicts,
          beforeWorktree: clone(this.worktree),
          beforeIndex: clone(this.index)
        };
        this.worktree = clone(result.snapshot);
        this.index = clone(result.snapshot);
        this.conflicts = {};
        result.conflicts.forEach((c) => { this.conflicts[c.path] = { base: c.base, ours: c.ours, theirs: c.theirs }; });
        const lines = [line("Rebasing (" + (i + 1) + "/" + chain.length + ")", "muted")];
        result.conflicts.forEach((c) => lines.push(line("CONFLICT (content): " + c.path, "error")));
        lines.push(line("hint: Sửa xung đột, git add <tệp>, rồi git rebase --continue.", "muted"));
        this.emit("conflict", { paths: result.conflicts.map((c) => c.path), from: upstreamRef });
        return { ok: false, error: "Rebase conflict", lines };
      }
      snapshot = result.snapshot;
      tip = this.makeCommit({
        files: snapshot,
        message: source.message,
        author: source.author,
        parents: [tip]
      });
      applied.push(tip);
    }
    this.branches[this.branch] = tip;
    this.worktree = clone(snapshot);
    this.index = clone(snapshot);
    this.conflicts = {};
    this.logRef("HEAD", headSha, tip, "rebase finished: returning to refs/heads/" + this.branch);
    this.emit("rebase", { branch: this.branch, onto: upstreamRef, commits: applied.length });
    return {
      ok: true,
      lines: [
        line("Successfully rebased and updated refs/heads/" + this.branch + ".", "ok"),
        line(" " + applied.length + " commit đã được áp lại lên " + upstreamRef, "muted")
      ]
    };
  };

  GitSim.prototype.rebaseContinue = function rebaseContinue(message) {
    const state = this.rebaseState;
    if (!state) return { ok: false, error: "No rebase in progress?" };
    if (Object.keys(this.conflicts).length) {
      return { ok: false, error: "error: còn tệp xung đột chưa được git add." };
    }
    const source = this.commits[state.chain[state.index]];
    let tip = this.makeCommit({
      files: clone(this.index),
      message: message || source.message,
      author: source.author,
      parents: [state.tip]
    });
    let snapshot = clone(this.index);
    const remaining = state.remaining;
    for (let i = 0; i < remaining.length; i += 1) {
      const result = this.applyCommitOnto(remaining[i], tip, snapshot);
      if (result.conflicts.length) {
        state.tip = tip;
        state.index = state.chain.length - remaining.length + i;
        state.remaining = remaining.slice(i + 1);
        state.snapshot = result.snapshot;
        this.worktree = clone(result.snapshot);
        this.index = clone(result.snapshot);
        this.conflicts = {};
        result.conflicts.forEach((c) => { this.conflicts[c.path] = c; });
        return { ok: false, error: "Rebase conflict", lines: result.conflicts.map((c) => line("CONFLICT (content): " + c.path, "error")) };
      }
      snapshot = result.snapshot;
      const src = this.commits[remaining[i]];
      tip = this.makeCommit({ files: snapshot, message: src.message, author: src.author, parents: [tip] });
    }
    this.branches[state.branch] = tip;
    this.worktree = clone(snapshot);
    this.index = clone(snapshot);
    this.conflicts = {};
    this.rebaseState = null;
    this.logRef("HEAD", state.originalHead, tip, "rebase finished: returning to refs/heads/" + state.branch);
    this.emit("rebase", { branch: state.branch, onto: state.onto });
    return { ok: true, lines: [line("Successfully rebased and updated refs/heads/" + state.branch + ".", "ok")] };
  };

  GitSim.prototype.rebaseAbort = function rebaseAbort() {
    const state = this.rebaseState;
    if (!state) return { ok: false, error: "No rebase in progress?" };
    this.branches[state.branch] = state.originalHead;
    this.worktree = state.beforeWorktree || clone(this.worktree);
    this.index = state.beforeIndex || clone(this.index);
    this.conflicts = {};
    this.rebaseState = null;
    return { ok: true, lines: [line("Rebase aborted; " + state.branch + " trở về " + short(state.originalHead) + ".", "ok")] };
  };

  GitSim.prototype.cherryPick = function cherryPick(refName) {
    const sha = this.resolve(refName);
    if (!sha) return { ok: false, error: "fatal: bad revision '" + refName + "'" };
    if (this.trackedDirty()) return { ok: false, error: "error: your local changes would be overwritten by cherry-pick." };
    const result = this.applyCommitOnto(sha, this.headSha(), clone(this.worktree));
    const source = this.commits[sha];
    if (result.conflicts.length) {
      this.worktree = clone(result.snapshot);
      this.index = clone(result.snapshot);
      this.conflicts = {};
      result.conflicts.forEach((c) => { this.conflicts[c.path] = c; });
      this.mergeState = { type: "cherry-pick", from: refName, oursSha: this.headSha(), theirsSha: sha, beforeWorktree: clone(this.worktree), beforeIndex: clone(this.index) };
      return { ok: false, error: "Cherry-pick conflict", lines: result.conflicts.map((c) => line("CONFLICT (content): " + c.path, "error")) };
    }
    const newSha = this.makeCommit({
      files: result.snapshot,
      message: source.message,
      author: source.author,
      parents: this.headSha() ? [this.headSha()] : []
    });
    this.branches[this.branch] = newSha;
    this.worktree = clone(result.snapshot);
    this.index = clone(result.snapshot);
    this.logRef("HEAD", this.headSha(), newSha, "cherry-pick: " + subject(source.message));
    return { ok: true, lines: [line("[" + this.branch + " " + short(newSha) + "] " + subject(source.message), "ok")] };
  };

  GitSim.prototype.revertCommit = function revertCommit(refName) {
    const sha = this.resolve(refName);
    if (!sha) return { ok: false, error: "fatal: bad revision '" + refName + "'" };
    const commit = this.commits[sha];
    const parent = commit.parents[0] ? this.commits[commit.parents[0]] : { files: {} };
    const snapshot = clone(this.commits[this.headSha()] ? this.commits[this.headSha()].files : {});
    this.commitPaths(sha).forEach((path) => {
      if (parent.files[path] === undefined) delete snapshot[path];
      else snapshot[path] = parent.files[path];
    });
    const message = "Revert \"" + subject(commit.message) + "\"\n\nThis reverts commit " + sha + ".";
    const newSha = this.makeCommit({ files: snapshot, message, author: this.role, parents: this.headSha() ? [this.headSha()] : [] });
    this.branches[this.branch] = newSha;
    this.worktree = clone(snapshot);
    this.index = clone(snapshot);
    this.logRef("HEAD", this.headSha(), newSha, "revert: " + subject(message));
    this.emit("revert", { sha: newSha, reverted: sha });
    return { ok: true, lines: [line("[" + this.branch + " " + short(newSha) + "] " + subject(message), "ok")] };
  };

  GitSim.prototype.resetTo = function resetTo(mode, refName) {
    const target = this.resolve(refName);
    if (!target) return { ok: false, error: "fatal: ambiguous argument '" + refName + "': unknown revision" };
    const old = this.headSha();
    const snapshot = clone(this.commits[target].files);
    if (mode === "soft") {
      if (this.detachedSha) this.detachedSha = target;
      else this.branches[this.branch] = target;
    } else if (mode === "mixed") {
      if (this.detachedSha) this.detachedSha = target;
      else this.branches[this.branch] = target;
      this.index = clone(snapshot);
      this.conflicts = {};
    } else {
      if (this.detachedSha) this.detachedSha = target;
      else this.branches[this.branch] = target;
      this.updateIndexAndWorktree(snapshot, true);
    }
    this.mergeState = null;
    this.conflicts = {};
    this.logRef("HEAD", old, target, "reset: moving to " + refName);
    this.emit("reset", { sha: target, mode });
    return { ok: true, lines: [line("HEAD is now at " + short(target) + " " + subject(this.commits[target].message), "ok")] };
  };

  GitSim.prototype.fetchRemote = function fetchRemote() {
    const lines = [line("remote: Enumerating objects: done.", "muted")];
    let updated = 0;
    Object.entries(this.remote.branches).forEach(([name, sha]) => {
      const key = "origin/" + name;
      if (this.remoteRefs[key] !== sha) {
        this.remoteRefs[key] = sha;
        lines.push(line(" * [new branch]      " + name + " -> origin/" + name, "muted"));
        updated += 1;
      }
    });
    lines.push(line(updated ? "Đã cập nhật " + updated + " nhánh từ origin." : "Already up to date.", "muted"));
    return { ok: true, lines };
  };

  GitSim.prototype.pull = function pull(opts) {
    const o = opts || {};
    const lines = [];
    const fetched = this.fetchRemote();
    lines.push(...fetched.lines);
    const upstream = this.upstream[this.branch] || ("origin/" + this.branch);
    if (this.remote.branches[this.branch] == null) {
      return { ok: false, error: "There is no tracking information for the current branch.", lines };
    }
    if (o.rebase) {
      const rebased = this.rebaseOnto(upstream);
      return { ok: rebased.ok, lines: lines.concat(rebased.lines || []), error: rebased.error };
    }
    const merged = this.mergeRef(upstream, {});
    return { ok: merged.ok, lines: lines.concat(merged.lines || []), error: merged.error };
  };

  GitSim.prototype.push = function push(opts) {
    const o = opts || {};
    const lines = [];
    if (o.remove) {
      const name = o.remove;
      if (this.remote.branches[name] == null) return { ok: false, error: "error: unable to delete '" + name + "': remote ref does not exist" };
      delete this.remote.branches[name];
      delete this.remoteRefs["origin/" + name];
      this.emit("push-delete", { branch: name });
      return { ok: true, lines: [line(" - [deleted]         " + name, "ok")] };
    }
    if (o.tag) {
      const tag = this.tags[o.tag];
      if (!tag) return { ok: false, error: "error: tag '" + o.tag + "' không tồn tại. Tạo bằng git tag -a." };
      this.remote.tags[o.tag] = clone(tag);
      lines.push(line(" * [new tag]         " + o.tag + " -> " + o.tag, "muted"));
      this.emit("push-tag", { tag: o.tag });
      if (this.workflows.deploy) {
        this.runSeq += 1;
        this.runs.push({
          id: this.runSeq, workflow: "Deploy Pages", branch: o.tag, sha: tag.sha,
          status: "completed", conclusion: "success", time: this.clock,
          log: ["Deploy workflow khởi chạy cho tag " + o.tag, "Build thành công", "Đã phát hành lên GitHub Pages"]
        });
      }
      return { ok: true, lines };
    }
    const branchName = o.branch || this.branch;
    if (this.detachedSha) return { ok: false, error: "fatal: bạn đang ở detached HEAD; hãy chuyển về một nhánh trước khi push." };
    const sha = this.branches[branchName];
    if (!sha) return { ok: false, error: "error: src refspec " + branchName + " does not match any" };
    const protection = this.protection[branchName];
    if (protection && protection.prRequired && !protection.directPush) {
      const msg = "! [remote rejected] " + branchName + " -> " + branchName + " (protected branch hook declined)\n" +
        "error: failed to push some refs\n" +
        "hint: Nhánh " + branchName + " được bảo vệ: hãy tạo nhánh, mở pull request, cần approval và check xanh.";
      this.lastError = msg;
      this.emit("push-rejected", { branch: branchName });
      return { ok: false, error: msg };
    }
    const remoteSha = this.remote.branches[branchName];
    if (remoteSha && !this.isAncestor(remoteSha, sha) && !o.force) {
      const msg = "! [rejected]        " + branchName + " -> " + branchName + " (non-fast-forward)\n" +
        "error: failed to push some refs\n" +
        "hint: remote có commit mới. Chạy git pull --rebase rồi push, hoặc dùng --force-with-lease nếu đã rebase nhánh riêng.";
      this.lastError = msg;
      return { ok: false, error: msg };
    }
    const isNew = !remoteSha;
    this.remote.branches[branchName] = sha;
    this.remoteRefs["origin/" + branchName] = sha;
    if (o.setUpstream) this.upstream[branchName] = "origin/" + branchName;
    lines.push(line((isNew ? " * [new branch]      " : "   ") + branchName + " -> " + branchName, "ok"));
    const pr = this.prs.find((item) => item.head === branchName && item.state === "open");
    if (pr) {
      pr.headSha = sha;
      pr.mergeable = this.threeWayPreview(branchName, pr.base).conflicts.length === 0;
    }
    if (this.workflows.ci) {
      const run = this.runCI(branchName);
      lines.push(line("remote: GitHub Actions " + (run.conclusion === "success" ? "passed" : "failed") + " (" + run.workflow + ")", run.conclusion === "success" ? "ok" : "error"));
    }
    this.emit("push", { branch: branchName, sha });
    return { ok: true, lines };
  };

  GitSim.prototype.makeTag = function makeTag(name, opts) {
    const o = opts || {};
    if (this.tags[name]) return { ok: false, error: "fatal: tag '" + name + "' already exists" };
    const sha = this.resolve(o.ref || "HEAD");
    if (!sha) return { ok: false, error: "fatal: failed to resolve HEAD" };
    this.tags[name] = { sha, annotated: !!o.message, message: o.message || "" };
    this.emit("tag", { name, sha });
    return { ok: true, lines: [line("Đã tạo tag " + (o.message ? "annotated " : "") + name + " tại " + short(sha), "ok")] };
  };

  GitSim.prototype.stashSave = function stashSave(message) {
    const head = this.commits[this.headSha()];
    const headSnap = head ? head.files : {};
    const dirty = this.worktree;
    const changed = Object.keys(dirty).some((p) => dirty[p] !== this.index[p]) || this.stagedDiff().length > 0;
    if (!changed) return { ok: false, error: "No local changes to save" };
    this.stash.unshift({
      message: message || "WIP on " + this.branch + ": " + short(this.headSha()) + " " + subject(head ? head.message : ""),
      worktree: clone(this.worktree),
      index: clone(this.index),
      branch: this.branch,
      time: this.clock
    });
    this.worktree = clone(headSnap);
    this.index = clone(headSnap);
    this.conflicts = {};
    this.emit("stash", { size: this.stash.length });
    return { ok: true, lines: [line("Saved working directory and index state " + this.stash[0].message, "ok")] };
  };

  GitSim.prototype.stashPop = function stashPop() {
    if (!this.stash.length) return { ok: false, error: "No stash entries found." };
    const entry = this.stash.shift();
    this.worktree = clone(entry.worktree);
    this.index = clone(entry.index);
    return { ok: true, lines: [line("Dropped refs/stash@{0} (" + entry.message + ")", "ok")] };
  };

  GitSim.prototype.diffOutput = function diffOutput(staged, pathFilter) {
    const head = this.commits[this.headSha()];
    const headSnap = head ? head.files : {};
    const other = staged ? headSnap : this.index;
    const target = staged ? this.index : this.worktree;
    const paths = new Set([...Object.keys(other), ...Object.keys(target)]);
    const lines = [];
    Array.from(paths).sort().forEach((path) => {
      if (pathFilter && path !== pathFilter) return;
      if (other[path] === target[path]) return;
      lines.push(line("diff --git a/" + path + " b/" + path, "diff-head"));
      lines.push(line("--- " + (other[path] === undefined ? "/dev/null" : "a/" + path), "diff-head"));
      lines.push(line("+++ " + (target[path] === undefined ? "/dev/null" : "b/" + path), "diff-head"));
      lines.push(...diffLines(other[path], target[path]));
    });
    if (!lines.length) lines.push(line("Không có thay đổi.", "muted"));
    return lines;
  };

  GitSim.prototype.logOutput = function logOutput(opts) {
    const o = opts || {};
    let commits;
    if (o.all) {
      commits = this.listCommits(["main", ...Object.keys(this.branches), ...Object.keys(this.remoteRefs)]);
    } else {
      commits = [];
      let cur = this.headSha();
      while (cur) {
        commits.push(this.commits[cur]);
        cur = this.commits[cur].parents[0] || null;
      }
    }
    if (o.limit) commits = commits.slice(0, o.limit);
    const lines = [];
    commits.forEach((commit) => {
      const refs = [];
      Object.entries(this.branches).forEach(([name, sha]) => { if (sha === commit.sha) refs.push(name === this.branch ? "HEAD -> " + name : name); });
      Object.entries(this.remote.branches).forEach(([name, sha]) => { if (sha === commit.sha) refs.push("origin/" + name); });
      Object.entries(this.tags).forEach(([name, tag]) => { if (tag.sha === commit.sha) refs.push("tag: " + name); });
      if (o.oneline) {
        lines.push(line(short(commit.sha) + " " + (refs.length ? "(" + refs.join(", ") + ") " : "") + subject(commit.message), commit.parents.length > 1 ? "commit-merge" : ""));
      } else {
        lines.push(line("commit " + commit.sha + (refs.length ? " (" + refs.join(", ") + ")" : ""), "commit-head"));
        lines.push(line("Author: " + commit.name + " <" + commit.email + ">", "muted"));
        lines.push(line("Date:   " + global.RepoEngine.formatTime(commit.time), "muted"));
        lines.push(line(""));
        commit.message.split("\n").forEach((row) => lines.push(line("    " + row)));
        lines.push(line(""));
      }
    });
    if (!lines.length) lines.push(line("fatal: your current branch does not have any commits yet", "error"));
    return lines;
  };

  GitSim.prototype.reflogOutput = function reflogOutput() {
    const lines = [];
    this.reflog.slice().reverse().forEach((entry, i) => {
      lines.push(line(short(entry.new || entry.old) + " HEAD@{ " + i + "}: " + entry.message, "muted"));
    });
    if (!lines.length) lines.push(line("HEAD reflog trống.", "muted"));
    return lines;
  };

  GitSim.prototype.branchOutput = function branchOutput(opts) {
    const o = opts || {};
    const lines = [];
    Object.keys(this.branches).sort().forEach((name) => {
      const prefix = name === this.branch && !this.detachedSha ? "* " : "  ";
      const head = this.commits[this.branches[name]];
      lines.push(line(prefix + name + "  " + short(this.branches[name]) + " " + subject(head.message), name === this.branch ? "branch-current" : ""));
    });
    if (o.remote) {
      Object.keys(this.remote.branches).sort().forEach((name) => {
        lines.push(line("  remotes/origin/" + name + "  " + short(this.remote.branches[name]), "muted"));
      });
    }
    return lines;
  };

  GitSim.prototype.statusOutput = function statusOutput() {
    const info = this.statusInfo();
    const lines = [line(this.headLabel(), "ok")];
    if (!this.detachedSha) {
      const up = this.upstream[this.branch] || ("origin/" + this.branch);
      if (this.remote.branches[this.branch] && this.remoteRefs[up] != null) {
        const ab = this.branchAheadBehind(this.branch, up);
        if (ab.ahead && ab.behind) lines.push(line("Your branch and '" + up + "' have diverged, " + ab.ahead + " and " + ab.behind + " different commits each.", "warn"));
        else if (ab.ahead) lines.push(line("Your branch is ahead of '" + up + "' by " + ab.ahead + " commit(s).", "warn"));
        else if (ab.behind) lines.push(line("Your branch is behind '" + up + "' by " + ab.behind + " commit(s).", "warn"));
        else lines.push(line("Your branch is up to date with '" + up + "'.", "muted"));
      }
    }
    if (this.mergeState) lines.push(line("Bạn đang trong quá trình " + this.mergeState.type + ".", "warn"));
    if (info.conflicts.length) {
      lines.push(line("Unmerged paths:", "error"));
      info.conflicts.forEach((path) => lines.push(line("  both modified:   " + path, "error")));
    }
    if (info.staged.length) {
      lines.push(line("Changes to be committed:", "ok"));
      info.staged.forEach((item) => lines.push(line("  " + item.type + ":   " + item.path, "diff-add")));
    }
    const unstaged = info.unstaged.filter((item) => item.type !== "untracked");
    if (unstaged.length) {
      lines.push(line("Changes not staged for commit:", "warn"));
      unstaged.forEach((item) => lines.push(line("  " + item.type + ":   " + item.path, "diff-del")));
    }
    if (info.untracked.length) {
      lines.push(line("Untracked files:", "warn"));
      info.untracked.forEach((path) => lines.push(line("  " + path, "diff-del")));
    }
    if (!info.dirty && !info.conflicts.length) lines.push(line("", ""), line("nothing to commit, working tree clean", "muted"));
    return lines;
  };

  /* ---------------- CI và GitHub ---------------- */

  GitSim.prototype.evaluateCI = function evaluateCI(sha) {
    const commit = this.commits[sha];
    if (!commit) return { ok: false, fails: ["Không tìm thấy commit."], files: {} };
    const files = commit.files;
    const fails = [];
    const rule = this.ciRule || {};
    (rule.failIf || []).forEach((cond) => {
      const text = files[cond.path];
      if (text != null && (!cond.includes || text.includes(cond.includes))) {
        fails.push(cond.message || (cond.path + " chứa \"" + cond.includes + "\""));
      }
    });
    (rule.require || []).forEach((cond) => {
      const text = files[cond.path];
      if (text == null || (cond.includes && !text.includes(cond.includes))) {
        fails.push(cond.message || (cond.path + " thiếu \"" + cond.includes + "\""));
      }
    });
    const pages = Object.keys(files).filter((path) => /\.html$/.test(path)).sort();
    if (!files["index.html"]) fails.push("Thiếu trang chủ index.html.");
    pages.forEach((path) => {
      const html = files[path] || "";
      if (!/<!doctype\s+html>/i.test(html)) fails.push(path + " thiếu <!doctype html>.");
      if (!/<html[^>]*\blang=/i.test(html)) fails.push(path + " thiếu thuộc tính lang trên thẻ html.");
      if (!/<meta[^>]+name=["']viewport["']/i.test(html)) fails.push(path + " thiếu meta viewport.");
    });
    Object.keys(files).filter((path) => /\.css$/.test(path)).forEach((path) => {
      const css = files[path] || "";
      const opens = (css.match(/\{/g) || []).length;
      const closes = (css.match(/\}/g) || []).length;
      if (opens !== closes) fails.push(path + " có dấu ngoặc nhọn không cân.");
    });
    return { ok: fails.length === 0, fails, files, tests: pages.length };
  };

  GitSim.prototype.runCI = function runCI(branchName) {
    const branch = branchName || this.branch;
    const sha = this.resolve(branch) || this.headSha();
    const result = this.evaluateCI(sha);
    this.clock += 30;
    this.runSeq += 1;
    const log = [
      "Run ci/pages cho " + branch + " (" + short(sha) + ")",
      "npm ci --no-audit --no-fund",
      "npm run check:html",
      "npm run check:css"
    ];
    if (result.tests) log.push("PASS  " + result.tests + " trang HTML đã kiểm tra");
    result.fails.forEach((reason) => log.push("FAIL  " + reason));
    if (result.ok) log.push("Kết luận: success");
    else log.push("Kết luận: failure");
    const run = {
      id: this.runSeq,
      workflow: "CI",
      branch,
      sha,
      status: "completed",
      conclusion: result.ok ? "success" : "failure",
      log,
      time: this.clock,
      actor: this.role
    };
    this.runs.push(run);
    this.emit("ci", { branch, sha, conclusion: run.conclusion, runId: run.id });
    return run;
  };

  GitSim.prototype.latestRun = function latestRun(sha) {
    for (let i = this.runs.length - 1; i >= 0; i -= 1) {
      if (this.runs[i].sha === sha && this.runs[i].workflow === "CI") return this.runs[i];
    }
    return null;
  };

  GitSim.prototype.nextNumber = function nextNumber() {
    const nums = this.issues.map((item) => item.number).concat(this.prs.map((item) => item.number));
    return (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  };

  GitSim.prototype.issueByNumber = function issueByNumber(num) {
    return this.issues.find((issue) => issue.number === Number(num)) || null;
  };

  GitSim.prototype.prByNumber = function prByNumber(num) {
    return this.prs.find((pr) => pr.number === Number(num)) || null;
  };

  GitSim.prototype.prHeadRef = function prHeadRef(pr) {
    return this.branches[pr.head] ? pr.head : "origin/" + pr.head;
  };

  GitSim.prototype.prApprovals = function prApprovals(pr) {
    const latest = {};
    pr.reviews.forEach((review) => {
      if (review.author !== pr.author) latest[review.author] = review.state;
    });
    return Object.values(latest).filter((state) => state === "approved").length;
  };

  GitSim.prototype.prChecks = function prChecks(pr) {
    const run = this.latestRun(pr.headSha);
    if (!run) return [];
    return [{ name: "ci/pages", status: "completed", conclusion: run.conclusion, runId: run.id }];
  };

  GitSim.prototype.prState = function prState(pr) {
    if (pr.state !== "open") return pr.state;
    const preview = this.threeWayPreview(pr.headSha, pr.base);
    const approvals = this.prApprovals(pr);
    const rules = this.protection[pr.base] || PROTECTED_DEFAULT;
    const checks = this.prChecks(pr);
    const required = (rules.checks || []).map((name) => {
      const found = checks.find((check) => check.name === name);
      return { name, ok: !!(found && found.conclusion === "success") };
    });
    const reasons = [];
    if (preview.conflicts.length) reasons.push("Xung đột với " + pr.base);
    if (approvals < (rules.reviews || 0)) reasons.push("Cần " + rules.reviews + " approval (hiện có " + approvals + ")");
    const failedCheck = required.find((check) => !check.ok);
    if (failedCheck) reasons.push("Check " + failedCheck.name + " chưa xanh");
    return {
      mergeable: !preview.conflicts.length,
      conflicts: preview.conflicts,
      approvals,
      requiredReviews: rules.reviews || 0,
      required,
      blocked: reasons,
      canMerge: !reasons.length
    };
  };

  GitSim.prototype.addIssue = function addIssue(opts) {
    const o = opts || {};
    const number = this.nextNumber();
    const issue = {
      number,
      title: o.title || "(không tiêu đề)",
      body: o.body || "",
      state: "open",
      labels: (o.labels || []).slice(),
      author: o.author || this.role,
      assignee: o.assignee || null,
      milestone: o.milestone || null,
      comments: [],
      createdAt: this.clock,
      closedAt: null
    };
    this.issues.push(issue);
    this.emit("issue-opened", { number });
    return issue;
  };

  GitSim.prototype.closeIssue = function closeIssue(num, by, note) {
    const issue = this.issueByNumber(num);
    if (!issue) return { ok: false, error: "issue #" + num + " không tồn tại." };
    if (issue.state === "closed") return { ok: false, error: "issue #" + num + " đã đóng." };
    issue.state = "closed";
    issue.closedAt = this.clock;
    issue.closedBy = by || this.role;
    if (note) issue.comments.push({ author: by || this.role, body: note, time: this.clock });
    this.emit("issue-closed", { number: Number(num) });
    return { ok: true, issue };
  };

  GitSim.prototype.addPR = function addPR(opts) {
    const o = opts || {};
    const head = o.head || this.branch;
    const base = o.base || "main";
    if (head === base) return { ok: false, error: "head và base phải là hai nhánh khác nhau." };
    if (!this.resolve(head)) return { ok: false, error: "Nhánh '" + head + "' không tồn tại." };
    if (!this.resolve(base)) return { ok: false, error: "Nhánh '" + base + "' không tồn tại." };
    const dup = this.prs.find((pr) => pr.state === "open" && pr.head === head && pr.base === base);
    if (dup) return { ok: false, error: "Đã có pull request #" + dup.number + " cho " + head + " -> " + base + "." };
    const number = this.nextNumber();
    const headSha = this.resolve(head);
    const body = o.body || "";
    const closes = [];
    const re = /(?:closes|fixes|resolves)\s+#(\d+)/gi;
    let m = re.exec(body);
    while (m) { closes.push(Number(m[1])); m = re.exec(body); }
    const pr = {
      number,
      title: o.title || subject(this.commits[headSha].message),
      body,
      state: "open",
      draft: !!o.draft,
      author: o.author || this.role,
      head,
      base,
      headSha,
      closes,
      reviews: [],
      comments: [],
      createdAt: this.clock,
      mergedAt: null,
      mergeCommit: null,
      mergeable: this.threeWayPreview(headSha, base).conflicts.length === 0
    };
    this.prs.push(pr);
    this.emit("pr-opened", { number, head, base });
    return { ok: true, pr };
  };

  GitSim.prototype.mergePR = function mergePR(num, method) {
    const pr = this.prByNumber(num);
    if (!pr) return { ok: false, error: "PR #" + num + " không tồn tại." };
    if (pr.state !== "open") return { ok: false, error: "PR #" + num + " đã " + (pr.state === "merged" ? "được merge" : "đóng") + "." };
    if (pr.author === this.role) {
      const rules = this.protection[pr.base];
      if (rules && rules.prRequired) {
        return { ok: false, error: "Bạn không thể tự approve/merge PR của chính mình khi nhánh bảo vệ yêu cầu review. Hãy nhờ thành viên khác." };
      }
    }
    const baseSha = this.resolve(pr.base);
    const preview = this.threeWayPreview(pr.headSha, pr.base);
    if (preview.conflicts.length) {
      return { ok: false, error: "PR không merge được: xung đột ở " + preview.conflicts.join(", ") + ". Hãy rebase nhánh và push lại." };
    }
    const rules = this.protection[pr.base] || PROTECTED_DEFAULT;
    const approvals = this.prApprovals(pr);
    if (approvals < (rules.reviews || 0)) {
      return { ok: false, error: "Cần " + rules.reviews + " approval từ người khác; hiện có " + approvals + "." };
    }
    const checks = this.prChecks(pr);
    const missing = (rules.checks || []).find((name) => {
      const found = checks.find((check) => check.name === name);
      return !found || found.conclusion !== "success";
    });
    if (missing) {
      return { ok: false, error: "Check bắt buộc '" + missing + "' chưa xanh. Xem bằng gh pr checks " + num + "." };
    }
    const headSha = this.resolve(pr.head);
    const kind = method || "squash";
    let sha;
    if (kind === "merge") {
      sha = this.makeCommit({
        files: preview.files,
        message: "Merge pull request #" + num + " from " + pr.head + "\n\n" + pr.title,
        author: this.role,
        parents: [baseSha, headSha]
      });
    } else if (kind === "rebase") {
      sha = this.makeCommit({
        files: preview.files,
        message: pr.title + " (#" + num + ")",
        author: pr.author,
        parents: [baseSha]
      });
    } else {
      sha = this.makeCommit({
        files: preview.files,
        message: pr.title + " (#" + num + ")",
        author: pr.author,
        parents: [baseSha]
      });
    }
    this.remote.branches[pr.base] = sha;
    this.remoteRefs["origin/" + pr.base] = sha;
    pr.state = "merged";
    pr.mergedAt = this.clock;
    pr.mergeCommit = sha;
    pr.mergedBy = this.role;
    pr.mergeMethod = kind;
    pr.closes.forEach((issueNum) => {
      const issue = this.issueByNumber(issueNum);
      if (issue && issue.state === "open") {
        issue.state = "closed";
        issue.closedAt = this.clock;
        issue.closedBy = this.role;
        issue.comments.push({ author: this.role, body: "Đã giải quyết bởi PR #" + num + " (" + short(sha) + ").", time: this.clock });
      }
    });
    if (this.workflows.ci) this.runCI(pr.base);
    this.emit("pr-merged", { number: pr.number, sha, method: kind });
    return { ok: true, pr, sha, method: kind };
  };

  GitSim.prototype.updateProtection = function updateProtection(branch, patch) {
    const current = Object.assign(clone(PROTECTED_DEFAULT), this.protection[branch] || {});
    this.protection[branch] = Object.assign(current, patch);
    if (this.protection[branch].prRequired) this.protection[branch].directPush = false;
    this.emit("protection", { branch });
    return this.protection[branch];
  };

  GitSim.prototype.writeFile = function writeFile(path, content) {
    this.worktree[path] = content;
    if (this.conflicts[path] && !hasMarkers(content)) delete this.conflicts[path];
    this.emit("file-write", { path });
    return { ok: true };
  };

  GitSim.prototype.deleteWorkFile = function deleteWorkFile(path) {
    delete this.worktree[path];
    this.emit("file-delete", { path });
    return { ok: true };
  };

  GitSim.prototype.graphModel = function graphModel(limit) {
    const refNames = {};
    Object.entries(this.branches).forEach(([name, sha]) => {
      (refNames[sha] = refNames[sha] || []).push({ name, kind: "branch", current: name === this.branch && !this.detachedSha });
    });
    Object.entries(this.remoteRefs).forEach(([name, sha]) => {
      (refNames[sha] = refNames[sha] || []).push({ name, kind: "remote" });
    });
    Object.entries(this.tags).forEach(([name, tag]) => {
      (refNames[tag.sha] = refNames[tag.sha] || []).push({ name, kind: "tag" });
    });
    if (this.detachedSha) (refNames[this.detachedSha] = refNames[this.detachedSha] || []).push({ name: "HEAD", kind: "head" });
    const commits = this.listCommits(Object.keys(this.branches).concat(Object.keys(this.remoteRefs)), limit || 60);
    const laneOf = new Map();
    const laneNames = [];
    const pushLane = (name) => { if (!laneNames.includes(name)) laneNames.push(name); return laneNames.indexOf(name); };
    pushLane("main");
    Object.keys(this.branches).forEach(pushLane);
    const nodes = [];
    const edges = [];
    const ordered = [];
    Object.entries(this.branches).forEach(([name, sha]) => {
      const lane = laneNames.indexOf(name);
      const localSeen = new Set();
      let cur = sha;
      while (cur && !localSeen.has(cur)) {
        localSeen.add(cur);
        if (!laneOf.has(cur)) {
          laneOf.set(cur, lane);
          ordered.push(cur);
        }
        const commit = this.commits[cur];
        if (!commit) break;
        cur = commit.parents[0] || null;
      }
    });
    Object.keys(this.commits).forEach((sha) => {
      if (!laneOf.has(sha)) { laneOf.set(sha, 0); ordered.push(sha); }
    });
    const rows = new Map();
    ordered.sort((a, b) => this.commits[b].time - this.commits[a].time);
    ordered.forEach((sha, index) => rows.set(sha, index));
    ordered.forEach((sha) => {
      const commit = this.commits[sha];
      if (!commit) return;
      nodes.push({
        sha,
        row: rows.get(sha),
        lane: laneOf.get(sha) || 0,
        short: short(sha),
        message: subject(commit.message),
        author: commit.author,
        name: commit.name,
        time: commit.time,
        parents: commit.parents.slice(),
        refs: refNames[sha] || [],
        merge: commit.parents.length > 1
      });
      commit.parents.forEach((parent) => {
        if (rows.has(parent)) edges.push({ from: sha, to: parent, laneFrom: laneOf.get(sha) || 0, laneTo: laneOf.get(parent) || 0 });
      });
    });
    return { nodes, edges, lanes: Math.max(1, laneNames.length) };
  };

  /* ---------------- Terminal ---------------- */

  const GIT_VALUE_FLAGS = ["m", "b", "n"];

  function parseArgs(tokens, valueFlags) {
    const flags = { _: [] };
    const setValue = (key, index) => {
      const next = tokens[index + 1];
      if (next == null) { flags[key] = true; return index; }
      flags[key] = next;
      return index + 1;
    };
    for (let i = 0; i < tokens.length; i += 1) {
      const tok = tokens[i];
      if (tok === "--") { flags._.push(...tokens.slice(i + 1)); break; }
      if (tok.startsWith("--")) {
        const eq = tok.indexOf("=");
        if (eq > -1) { flags[tok.slice(2, eq)] = tok.slice(eq + 1); continue; }
        const key = tok.slice(2);
        const next = tokens[i + 1];
        const known = ["base", "head", "title", "body", "label", "comment", "notes", "tag", "name", "state", "limit", "color", "message", "description", "assignee", "milestone"];
        if (next != null && !next.startsWith("-") && known.includes(key)) { flags[key] = next; i += 1; }
        else flags[key] = true;
        continue;
      }
      if (tok.startsWith("-") && tok.length > 1) {
        const cluster = tok.slice(1);
        for (let c = 0; c < cluster.length; c += 1) {
          const key = cluster[c];
          if ((valueFlags || GIT_VALUE_FLAGS).includes(key)) {
            const rest = cluster.slice(c + 1);
            if (rest) { flags[key] = rest; c = cluster.length; }
            else i = setValue(key, i);
            break;
          }
          flags[key] = true;
        }
        continue;
      }
      flags._.push(tok);
    }
    return flags;
  }

  GitSim.prototype.shortStatus = function shortStatus() {
    const info = this.statusInfo();
    const lines = [];
    info.staged.forEach((item) => lines.push(line((item.type === "added" ? "A" : item.type === "deleted" ? "D" : "M") + "  " + item.path, "diff-add")));
    info.unstaged.filter((item) => item.type !== "untracked").forEach((item) => lines.push(line((item.type === "deleted" ? " D" : " M") + " " + item.path, "diff-del")));
    info.untracked.forEach((path) => lines.push(line("?? " + path, "diff-del")));
    info.conflicts.forEach((path) => lines.push(line("UU " + path, "error")));
    return lines;
  };

  GitSim.prototype.execGit = function execGit(tokens) {
    const sub = tokens[0];
    if (!sub) return { ok: false, error: "usage: git <lệnh> [tham số]" };
    if (!this.initialized && sub !== "init") {
      return { ok: false, error: "fatal: not a git repository (or any of the parent directories): .git\nhint: Chạy git init trước." };
    }
    if (sub === "init") {
      if (this.initialized) return { ok: true, lines: [line("Reinitialized existing Git repository in ~/moc-coffee/.git/", "muted")] };
      this.initialized = true;
      return { ok: true, lines: [line("Initialized empty Git repository in ~/moc-coffee/.git/", "ok"), line("hint: Đặt danh tính bằng git config user.name và user.email.", "muted")] };
    }
    if (sub === "config") {
      const key = tokens[1] || "";
      const value = tokens[2];
      if (!value) return { ok: true, lines: [line(key + "=" + (key === "user.name" ? this.user().name : this.user().email || ""), "muted")] };
      if (key === "user.name" || key === "user.email") {
        this.identity = this.identity || {};
        if (key === "user.name") this.identity.name = value;
        else this.identity.email = value;
        return { ok: true, lines: [line("Đã đặt " + key + " = " + value + " cho kho bài tập này.", "muted")] };
      }
      return { ok: true, lines: [] };
    }
    if (sub === "status") {
      const flags = parseArgs(tokens.slice(1));
      if (flags.s) return { ok: true, lines: this.shortStatus() };
      return { ok: true, lines: this.statusOutput() };
    }
    if (sub === "add") {
      const flags = parseArgs(tokens.slice(1));
      const paths = flags._.slice();
      if (!paths.length) return { ok: false, error: "Nothing specified, nothing added.\nhint: Dùng git add . để thêm toàn bộ." };
      const result = this.stagePaths(paths);
      if (!result.all && !result.count) return { ok: false, error: "fatal: pathspec không khớp tệp nào." };
      return { ok: true, lines: [line("Đã stage " + (result.all ? "toàn bộ thay đổi" : result.count + " tệp") + ".", "muted")] };
    }
    if (sub === "rm") {
      const flags = parseArgs(tokens.slice(1));
      const path = flags._[0];
      if (!path) return { ok: false, error: "fatal: cần tên tệp." };
      if (flags.cached) {
        delete this.index[path];
        return { ok: true, lines: [line("rm '" + path + "' (chỉ bỏ khỏi index, giữ tệp trong thư mục làm việc)", "muted")] };
      }
      delete this.index[path];
      delete this.worktree[path];
      return { ok: true, lines: [line("rm '" + path + "'", "muted")] };
    }
    if (sub === "commit") {
      const flags = parseArgs(tokens.slice(1));
      const message = typeof flags.m === "string" ? flags.m : null;
      return this.commit({ message, all: !!(flags.a || flags.am), amend: !!flags.amend });
    }
    if (sub === "log") {
      const flags = parseArgs(tokens.slice(1));
      return { ok: true, lines: this.logOutput({ oneline: !!flags.oneline, all: !!flags.all, limit: flags.n ? Number(flags.n) : (flags._[0] ? Number(flags._[0]) : 0) }) };
    }
    if (sub === "diff") {
      const flags = parseArgs(tokens.slice(1));
      const staged = !!(flags.staged || flags.cached);
      return { ok: true, lines: this.diffOutput(staged, flags._[0]) };
    }
    if (sub === "branch") {
      const flags = parseArgs(tokens.slice(1));
      const name = flags._[0];
      if (flags.d || flags.D) {
        const res = this.deleteBranch(name, !!flags.D);
        return res.ok ? res : { ok: false, error: res.error };
      }
      if (flags.m) {
        const oldName = flags._[0];
        if (!this.branches[oldName]) return { ok: false, error: "error: refname '" + oldName + "' không tồn tại." };
        this.branches[flags.m] = this.branches[oldName];
        delete this.branches[oldName];
        if (this.branch === oldName) this.branch = flags.m;
        return { ok: true, lines: [line("Đã đổi tên nhánh " + oldName + " thành " + flags.m, "ok")] };
      }
      if (name) {
        if (this.branches[name]) return { ok: false, error: "fatal: a branch named '" + name + "' already exists" };
        if (!this.createBranch(name, flags._[1] || this.branch)) return { ok: false, error: "fatal: không tạo được nhánh." };
        return { ok: true, lines: [line("Đã tạo nhánh " + name + " từ " + (flags._[1] || this.branch), "ok")] };
      }
      return { ok: true, lines: this.branchOutput({ remote: !!(flags.a || flags.r) }) };
    }
    if (sub === "switch" || sub === "checkout") {
      const flags = parseArgs(tokens.slice(1));
      if (sub === "checkout" && flags._[0] === "--") {
        this.restorePath(flags._.slice(1), false);
        return { ok: true, lines: [line("Đã khôi phục " + flags._.slice(1).join(", ") + " từ index.", "muted")] };
      }
      const target = flags._[0];
      if (!target) return { ok: false, error: "fatal: cần tên nhánh hoặc commit." };
      const create = !!(flags.b || flags.c || (sub === "checkout" && flags.b));
      const res = this.switchBranch(target, { create, from: flags._[1], force: !!flags.f });
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, lines: [line(res.message, "ok")] };
    }
    if (sub === "merge") {
      const flags = parseArgs(tokens.slice(1));
      if (flags.abort) return this.mergeAbort();
      if (flags.continue) {
        const res = this.finishMerge();
        return res.ok ? res : { ok: false, error: res.error };
      }
      const target = flags._[0];
      if (!target) return { ok: false, error: "fatal: cần tên nhánh để merge." };
      return this.mergeRef(target, {});
    }
    if (sub === "rebase") {
      const flags = parseArgs(tokens.slice(1));
      if (flags.abort) return this.rebaseAbort();
      if (flags.continue) return this.rebaseContinue();
      const target = flags._[0];
      if (!target) return { ok: false, error: "fatal: cần upstream để rebase." };
      return this.rebaseOnto(target);
    }
    if (sub === "fetch") return this.fetchRemote();
    if (sub === "pull") {
      const flags = parseArgs(tokens.slice(1));
      return this.pull({ rebase: !!flags.rebase });
    }
    if (sub === "push") {
      const flags = parseArgs(tokens.slice(1));
      if (flags.delete || flags.d) {
        const name = typeof flags.delete === "string" ? flags.delete : (flags._.length > 1 ? flags._[flags._.length - 1] : flags._[0]);
        return this.push({ remove: name });
      }
      const tagArg = flags._.find((arg) => this.tags[arg]);
      if (tagArg) return this.push({ tag: tagArg });
      const target = flags._[0];
      if (target && this.tags[target]) return this.push({ tag: target });
      return this.push({ branch: flags._[1] || this.branch, setUpstream: !!(flags.u || flags["set-upstream"]), force: !!(flags.force || flags["force-with-lease"] || flags.f) });
    }
    if (sub === "remote") {
      if (tokens[1] === "add") {
        this.remote.name = tokens[2] || "origin";
        this.remote.url = tokens[3] || this.remote.url;
        return { ok: true, lines: [line("Đã thêm remote " + this.remote.name + " -> " + this.remote.url, "ok")] };
      }
      if (tokens[1] === "remove" || tokens[1] === "rm") {
        return { ok: true, lines: [line("Đã xoá remote " + (tokens[2] || "origin") + " (mô phỏng).", "muted")] };
      }
      return { ok: true, lines: [line(this.remote.name + "\t" + this.remote.url + " (fetch)", "muted"), line(this.remote.name + "\t" + this.remote.url + " (push)", "muted")] };
    }
    if (sub === "tag") {
      const flags = parseArgs(tokens.slice(1));
      const name = flags._[0];
      if (!name) {
        const lines = Object.entries(this.tags).sort().map(([tag, def]) => line(tag + "  " + short(def.sha), "muted"));
        return { ok: true, lines: lines.length ? lines : [line("Chưa có tag nào.", "muted")] };
      }
      return this.makeTag(name, { message: typeof flags.m === "string" ? flags.m : (typeof flags.message === "string" ? flags.message : ""), ref: flags._[1] });
    }
    if (sub === "stash") {
      const flags = parseArgs(tokens.slice(1));
      const action = flags._[0];
      if (action === "pop" || action === "apply") return this.stashPop();
      if (action === "list") {
        return { ok: true, lines: this.stash.length ? this.stash.map((entry, i) => line("stash@{" + i + "}: " + entry.message, "muted")) : [line("Chưa có stash nào.", "muted")] };
      }
      return this.stashSave(typeof flags.m === "string" ? flags.m : (typeof flags.message === "string" ? flags.message : ""));
    }
    if (sub === "cherry-pick") {
      const flags = parseArgs(tokens.slice(1));
      if (flags.abort) {
        if (this.mergeState) { this.mergeState = null; this.conflicts = {}; }
        return { ok: true, lines: [line("Cherry-pick aborted.", "ok")] };
      }
      if (flags.continue) return this.commit({ message: this.mergeState && this.mergeState.type === "cherry-pick" ? this.commits[this.mergeState.theirsSha].message : "cherry-pick" });
      const target = flags._[0];
      if (!target) return { ok: false, error: "fatal: cần commit để cherry-pick." };
      return this.cherryPick(target);
    }
    if (sub === "revert") {
      const flags = parseArgs(tokens.slice(1));
      const target = flags._[0];
      if (!target) return { ok: false, error: "fatal: cần commit để revert." };
      return this.revertCommit(target);
    }
    if (sub === "reset") {
      const flags = parseArgs(tokens.slice(1));
      const mode = flags.soft ? "soft" : flags.hard ? "hard" : "mixed";
      const target = flags._[0] || "HEAD";
      return this.resetTo(mode, target);
    }
    if (sub === "restore") {
      const flags = parseArgs(tokens.slice(1));
      const paths = flags._.length ? flags._ : ["."];
      if (flags._.length === 0) {
        this.index = clone(this.commits[this.headSha()] ? this.commits[this.headSha()].files : {});
        this.worktree = clone(this.index);
      } else {
        this.restorePath(paths, !!flags.staged);
      }
      return { ok: true, lines: [line("Đã khôi phục " + paths.join(", ") + ".", "muted")] };
    }
    if (sub === "reflog") return { ok: true, lines: this.reflogOutput() };
    if (sub === "show") {
      const target = tokens[1] || "HEAD";
      if (target.includes(":")) {
        const [ref, path] = target.split(":");
        const commit = this.commitOf(ref);
        if (!commit || commit.files[path] === undefined) return { ok: false, error: "fatal: path '" + path + "' không tồn tại trong " + ref };
        return { ok: true, lines: commit.files[path].split("\n").map((row) => line(row)) };
      }
      const commit = this.commitOf(target);
      if (!commit) return { ok: false, error: "fatal: bad revision '" + target + "'" };
      const lines = [line("commit " + commit.sha, "commit-head"), line("Author: " + commit.name + " <" + commit.email + ">", "muted"), line(""), line("    " + subject(commit.message), "")];
      this.commitPaths(commit.sha).forEach((path) => {
        lines.push(line("diff --git a/" + path + " b/" + path, "diff-head"));
        lines.push(...diffLines(commit.parents[0] ? this.commits[commit.parents[0]].files[path] : undefined, commit.files[path]));
      });
      return { ok: true, lines };
    }
    if (sub === "help" || sub === "--help") {
      return { ok: true, lines: [line("Lệnh mô phỏng: git status/add/commit/log/diff/branch/switch/checkout/merge/rebase/fetch/pull/push/tag/stash/cherry-pick/revert/reset/restore/rm/reflog", "muted")] };
    }
    return { ok: false, error: "git: '" + sub + "' chưa được mô phỏng. Xem Cheatsheet để biết lệnh hỗ trợ." };
  };

  GitSim.prototype.execGh = function execGh(tokens) {
    const cmd = tokens[0];
    const r = this.github;
    const repo = r.owner + "/" + r.repo;
    const url = (path) => "https://github.com/" + repo + path;
    if (!cmd) return { ok: false, error: "usage: gh <issue|pr|run|release|label|repo|auth> ..." };
    if (cmd === "auth") return { ok: true, lines: [line("github.com", "ok"), line("  Tài khoản " + this.user().name + " (" + this.user().email + ")", "muted"), line("  Token: mô phỏng, không có token thật trong FELab.", "muted")] };
    if (cmd === "repo") {
      if (tokens[1] === "view") {
        return { ok: true, lines: [line(r.owner + "/" + r.repo, "ok"), line("Mô tả: Mộc Coffee — website tĩnh sáu trang bằng Bootstrap 5", "muted"), line("Nhánh mặc định: main", "muted"), line("Quyền: " + (this.role === "minh" ? "Admin" : "Write"), "muted")] };
      }
      return { ok: false, error: "gh repo: chỉ hỗ trợ 'view' trong mô phỏng." };
    }
    if (cmd === "label") {
      if (tokens[1] === "list") {
        return { ok: true, lines: this.labels.map((labelDef) => line(labelDef.name + "  " + (labelDef.description || ""), "muted")) };
      }
      if (tokens[1] === "create") {
        const flags = parseArgs(tokens.slice(2));
        const name = flags._[0];
        if (!name) return { ok: false, error: "cần tên label." };
        if (this.labels.some((item) => item.name === name)) return { ok: false, error: "label '" + name + "' đã tồn tại." };
        this.labels.push({ name, color: flags.color || "ededed", description: flags.description || "" });
        return { ok: true, lines: [line("Đã tạo label " + name, "ok")] };
      }
      return { ok: false, error: "gh label: hỗ trợ list/create." };
    }
    if (cmd === "issue") {
      const sub = tokens[1];
      const flags = parseArgs(tokens.slice(2));
      if (sub === "list") {
        const state = flags.state || "open";
        const list = this.issues.filter((issue) => state === "all" || issue.state === state);
        if (!list.length) return { ok: true, lines: [line("Không có issue " + state + ".", "muted")] };
        return { ok: true, lines: list.map((issue) => line("#" + issue.number + "  " + issue.title + "  [" + issue.labels.join(", ") + "]  (" + issue.state + ")", issue.state === "open" ? "" : "muted")) };
      }
      if (sub === "view") {
        const issue = this.issueByNumber(flags._[0]);
        if (!issue) return { ok: false, error: "issue #" + flags._[0] + " không tồn tại." };
        const lines = [
          line("#" + issue.number + " " + issue.title, "commit-head"),
          line("Trạng thái: " + issue.state + " — tác giả: " + TEAM[issue.author].short, "muted"),
          line("Labels: " + (issue.labels.join(", ") || "không có"), "muted"),
          line(""),
          line(issue.body || "(không có mô tả)")
        ];
        issue.comments.forEach((comment) => {
          lines.push(line(""), line("— " + (TEAM[comment.author] ? TEAM[comment.author].short : comment.author) + ":", "muted"), line(comment.body));
        });
        return { ok: true, lines };
      }
      if (sub === "create") {
        const title = flags.title;
        if (!title) return { ok: false, error: "Thiếu --title." };
        const labels = flags.label ? String(flags.label).split(",").map((name) => name.trim()) : [];
        const unknown = labels.find((name) => !this.labels.some((item) => item.name === name));
        if (unknown) return { ok: false, error: "label '" + unknown + "' chưa tồn tại. Xem gh label list." };
        const issue = this.addIssue({ title, body: flags.body || "", labels, assignee: flags.assignee || null, milestone: flags.milestone || null });
        return { ok: true, lines: [line("Đã mở issue #" + issue.number + ": " + issue.title, "ok"), line(url("/issues/" + issue.number), "muted")] };
      }
      if (sub === "close") {
        const res = this.closeIssue(flags._[0], this.role, flags.comment || "");
        return res.ok ? { ok: true, lines: [line("Đã đóng issue #" + flags._[0] + ".", "ok")] } : { ok: false, error: res.error };
      }
      if (sub === "comment") {
        const issue = this.issueByNumber(flags._[0]);
        if (!issue) return { ok: false, error: "issue không tồn tại." };
        if (!flags.body) return { ok: false, error: "Thiếu --body." };
        issue.comments.push({ author: this.role, body: flags.body, time: this.clock });
        return { ok: true, lines: [line("Đã bình luận vào issue #" + issue.number + ".", "ok")] };
      }
      if (sub === "edit") {
        const issue = this.issueByNumber(flags._[0]);
        if (!issue) return { ok: false, error: "issue không tồn tại." };
        if (flags["add-label"]) {
          const labels = String(flags["add-label"]).split(",").map((name) => name.trim());
          const unknown = labels.find((name) => !this.labels.some((item) => item.name === name));
          if (unknown) return { ok: false, error: "label '" + unknown + "' chưa tồn tại." };
          labels.forEach((name) => { if (!issue.labels.includes(name)) issue.labels.push(name); });
        }
        if (flags.assignee) issue.assignee = flags.assignee;
        if (flags.title) issue.title = flags.title;
        return { ok: true, lines: [line("Đã cập nhật issue #" + issue.number + ".", "ok")] };
      }
      return { ok: false, error: "gh issue: hỗ trợ list/view/create/close/comment/edit." };
    }
    if (cmd === "pr") {
      const sub = tokens[1];
      const flags = parseArgs(tokens.slice(2));
      if (sub === "list") {
        const state = flags.state || "open";
        const list = this.prs.filter((pr) => state === "all" || (state === "merged" ? pr.state === "merged" : pr.state === state));
        if (!list.length) return { ok: true, lines: [line("Không có pull request " + state + ".", "muted")] };
        return { ok: true, lines: list.map((pr) => line("#" + pr.number + "  " + pr.title + "  (" + pr.head + " -> " + pr.base + ")  [" + pr.state + "]", pr.state === "open" ? "" : "muted")) };
      }
      if (sub === "view") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR #" + flags._[0] + " không tồn tại." };
        const state = this.prState(pr);
        const lines = [
          line("#" + pr.number + " " + pr.title, "commit-head"),
          line(pr.state.toUpperCase() + " — " + pr.head + " -> " + pr.base, "muted"),
          line("Tác giả: " + TEAM[pr.author].short + " — thay đổi: " + short(pr.headSha), "muted"),
          line("Approvals: " + state.approvals + "/" + state.requiredReviews, state.approvals >= state.requiredReviews ? "ok" : "warn"),
          line("")
        ];
        if (pr.body) { pr.body.split("\n").forEach((row) => lines.push(line(row))); lines.push(line("")); }
        lines.push(line("Review:", "muted"));
        if (!pr.reviews.length) lines.push(line("  (chưa có review)", "muted"));
        pr.reviews.forEach((review) => lines.push(line("  " + TEAM[review.author].short + ": " + review.state + (review.body ? " — " + review.body : ""), review.state === "approved" ? "ok" : "warn")));
        lines.push(line("Check:", "muted"));
        const checks = this.prChecks(pr);
        if (!checks.length) lines.push(line("  (chưa chạy)", "muted"));
        checks.forEach((check) => lines.push(line("  " + check.name + ": " + check.conclusion, check.conclusion === "success" ? "ok" : "error")));
        if (state.blocked.length) lines.push(line("Chưa merge được: " + state.blocked.join("; "), "warn"));
        else lines.push(line("Đủ điều kiện merge.", "ok"));
        return { ok: true, lines };
      }
      if (sub === "create") {
        if (flags.draft && flags.title === undefined) return { ok: false, error: "Thiếu --title." };
        const res = this.addPR({ title: flags.title, body: flags.body, base: flags.base || "main", head: flags.head || this.branch, draft: !!flags.draft });
        if (!res.ok) return { ok: false, error: res.error };
        return { ok: true, lines: [line("Đã mở pull request #" + res.pr.number + ": " + res.pr.title, "ok"), line(url("/pull/" + res.pr.number), "muted")] };
      }
      if (sub === "review" || sub === "approve") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR không tồn tại." };
        if (pr.state !== "open") return { ok: false, error: "PR đã đóng/merge." };
        if (pr.author === this.role) return { ok: false, error: "Bạn không thể review PR của chính mình. Hãy đổi vai trò sang thành viên khác." };
        let state = "commented";
        if (sub === "approve" || flags.approve) state = "approved";
        else if (flags["request-changes"]) state = "changes_requested";
        pr.reviews.push({ author: this.role, state, body: flags.body || "", time: this.clock });
        this.emit("pr-review", { number: pr.number, state, author: this.role });
        return { ok: true, lines: [line("Đã gửi review " + state + " cho PR #" + pr.number + ".", "ok")] };
      }
      if (sub === "comment") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR không tồn tại." };
        if (!flags.body) return { ok: false, error: "Thiếu --body." };
        pr.comments.push({ author: this.role, body: flags.body, time: this.clock });
        return { ok: true, lines: [line("Đã bình luận vào PR #" + pr.number + ".", "ok")] };
      }
      if (sub === "checks") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR không tồn tại." };
        const checks = this.prChecks(pr);
        if (!checks.length) return { ok: true, lines: [line("Chưa có check nào chạy cho PR này. Hãy push nhánh để kích hoạt CI.", "warn")] };
        return { ok: true, lines: checks.map((check) => line(check.name + "\t" + check.conclusion + "\t#run " + check.runId, check.conclusion === "success" ? "ok" : "error")) };
      }
      if (sub === "checkout") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR không tồn tại." };
        if (this.branches[pr.head]) return { ok: true, lines: [line((this.switchBranch(pr.head, {}).message || "Đã chuyển nhánh."), "ok")] };
        const remoteSha = this.remote.branches[pr.head];
        if (!remoteSha) return { ok: false, error: "Nhánh " + pr.head + " không còn trên remote." };
        this.branches[pr.head] = remoteSha;
        this.switchBranch(pr.head, { force: true });
        return { ok: true, lines: [line("Đã checkout PR #" + pr.number + " tại nhánh " + pr.head + ".", "ok")] };
      }
      if (sub === "close") {
        const pr = this.prByNumber(flags._[0]);
        if (!pr) return { ok: false, error: "PR không tồn tại." };
        if (pr.state !== "open") return { ok: false, error: "PR đã đóng/merge." };
        pr.state = "closed";
        return { ok: true, lines: [line("Đã đóng PR #" + pr.number + " (không merge).", "ok")] };
      }
      if (sub === "merge") {
        if (flags.admin) return { ok: false, error: "Mô phỏng không cho phép --admin: mục tiêu là học quy trình đúng, không vượt bảo vệ nhánh." };
        const method = flags.merge ? "merge" : flags.rebase ? "rebase" : "squash";
        const res = this.mergePR(flags._[0], method);
        if (!res.ok) return { ok: false, error: res.error };
        const lines = [line("Đã merge PR #" + res.pr.number + " bằng " + method + ".", "ok"), line("Commit trên " + res.pr.base + ": " + short(res.sha), "muted")];
        if (flags["delete-branch"]) {
          const name = res.pr.head;
          if (this.remote.branches[name]) {
            delete this.remote.branches[name];
            delete this.remoteRefs["origin/" + name];
            lines.push(line("Đã xoá nhánh remote " + name + ".", "muted"));
          }
        }
        return { ok: true, lines };
      }
      return { ok: false, error: "gh pr: hỗ trợ list/view/create/review/approve/comment/checks/checkout/merge/close." };
    }
    if (cmd === "run") {
      const sub = tokens[1];
      if (sub === "list") {
        if (!this.runs.length) return { ok: true, lines: [line("Chưa có workflow run nào.", "muted")] };
        return { ok: true, lines: this.runs.slice().reverse().map((run) => line("#" + run.id + "  " + run.workflow + "  " + run.branch + "  " + run.conclusion + "  " + short(run.sha), run.conclusion === "success" ? "ok" : "error")) };
      }
      if (sub === "view") {
        const run = this.runs.find((item) => item.id === Number(tokens[2]));
        if (!run) return { ok: false, error: "run #" + tokens[2] + " không tồn tại." };
        const lines = [line(run.workflow + " #" + run.id + " — " + run.conclusion, run.conclusion === "success" ? "ok" : "error")];
        if (tokens.includes("--log") || tokens.includes("-l")) lines.push(...run.log.map((row) => line(row, "muted")));
        else lines.push(line("Dùng --log để xem chi tiết.", "muted"));
        return { ok: true, lines };
      }
      return { ok: false, error: "gh run: hỗ trợ list/view." };
    }
    if (cmd === "release") {
      const sub = tokens[1];
      const flags = parseArgs(tokens.slice(2));
      if (sub === "list") {
        return { ok: true, lines: this.releases.length ? this.releases.map((release) => line(release.tag + "  " + (release.title || ""), "muted")) : [line("Chưa có release nào.", "muted")] };
      }
      if (sub === "create") {
        const tag = flags._[0];
        if (!tag) return { ok: false, error: "cần tên tag: gh release create v1.0.0 --title ... --notes ..." };
        if (!this.tags[tag]) return { ok: false, error: "tag '" + tag + "' chưa tồn tại. Tạo tag và push trước." };
        if (!this.remote.tags[tag]) return { ok: false, error: "tag '" + tag + "' chưa được push lên origin." };
        if (this.releases.some((release) => release.tag === tag)) return { ok: false, error: "release cho " + tag + " đã tồn tại." };
        this.releases.push({ tag, title: flags.title || tag, notes: flags.notes || "", author: this.role, prerelease: !!flags.prerelease, createdAt: this.clock });
        this.emit("release", { tag });
        return { ok: true, lines: [line("Đã phát hành " + tag + ": " + (flags.title || tag), "ok"), line(url("/releases/tag/" + tag), "muted")] };
      }
      return { ok: false, error: "gh release: hỗ trợ list/create." };
    }
    if (cmd === "api") return { ok: false, error: "gh api chưa mô phỏng. Dùng tab Settings để xem protection, hoặc các lệnh gh issue/pr/run/release." };
    return { ok: false, error: "gh: '" + cmd + "' chưa được mô phỏng. Gõ help để xem phạm vi." };
  };

  GitSim.prototype.localTest = function localTest() {
    const res = this.evaluateCI(this.headSha());
    const lines = [line("> moc-coffee@1.0.0 check", "muted")];
    if (res.tests) lines.push(line("Đạt  " + res.tests + " trang HTML đã kiểm tra", "ok"));
    res.fails.forEach((reason) => lines.push(line("Lỗi  " + reason, "error")));
    lines.push(line(res.ok ? "Trang tĩnh đạt kiểm tra." : "Có lỗi cần sửa trước khi mở PR.", res.ok ? "ok" : "error"));
    return { ok: res.ok, lines, error: res.ok ? "" : "Kiểm tra trang tĩnh thất bại." };
  };

  GitSim.prototype.exec = function exec(input) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: true, lines: [] };
    this.lastError = "";
    const tokens = tokenize(raw);
    const cmd = tokens[0];
    let result;
    if (cmd === "git") result = this.execGit(tokens.slice(1));
    else if (cmd === "gh") result = this.execGh(tokens.slice(1));
    else if (cmd === "npm") {
      const sub = tokens[1];
      if (sub === "test" || (sub === "run" && ["test", "check", "check:html"].includes(tokens[2]))) result = this.localTest();
      else if (sub === "install" || sub === "ci") result = { ok: true, lines: [line("Đã cài dependencies (mô phỏng nhanh).", "muted")] };
      else result = { ok: false, error: "npm: chỉ mô phỏng install/ci/test/run check." };
    } else if (cmd === "ls") {
      const dirs = new Set();
      Object.keys(this.worktree).sort().forEach((path) => {
        const top = path.split("/")[0];
        dirs.add(path.includes("/") ? top + "/" : path);
      });
      result = { ok: true, lines: dirs.size ? Array.from(dirs).map((name) => line(name, "muted")) : [line("(thư mục trống)", "muted")] };
    } else if (cmd === "cat") {
      const path = tokens[1];
      if (!path) result = { ok: false, error: "cat: thiếu tên tệp." };
      else if (this.worktree[path] == null) result = { ok: false, error: "cat: " + path + ": No such file or directory" };
      else result = { ok: true, lines: this.worktree[path].split("\n").map((row) => line(row)) };
    } else if (cmd === "edit") {
      const path = tokens[1];
      if (!path) result = { ok: false, error: "edit: thiếu tên tệp." };
      else result = { ok: true, lines: [], action: { type: "edit", path } };
    } else if (cmd === "echo" || cmd === "printf") {
      const target = raw.match(/^[^\s]+\s+(.*?)\s*(>>|>)\s*([^\s]+)$/);
      if (!target) result = { ok: false, error: cmd + ": cú pháp ghi tệp là: " + cmd + " \"nội dung\" > đường/dẫn" };
      else {
        const text = target[1].replace(/^["']|["']$/g, "");
        const append = target[2] === ">>";
        this.worktree[target[3]] = append ? (this.worktree[target[3]] || "") + text + "\n" : text + "\n";
        result = { ok: true, lines: [line((append ? "Đã ghi nối" : "Đã ghi") + " " + target[3] + ".", "muted")] };
      }
    } else if (cmd === "touch") {
      const path = tokens[1];
      if (!path) result = { ok: false, error: "touch: thiếu tên tệp." };
      else { if (this.worktree[path] == null) this.worktree[path] = ""; result = { ok: true, lines: [] }; }
    } else if (cmd === "clear") {
      result = { ok: true, lines: [], action: { type: "clear" } };
    } else if (cmd === "help") {
      result = {
        ok: true,
        lines: [
          line("Nhóm lệnh được mô phỏng:", "ok"),
          line("  git status/add/commit/log/diff/branch/switch/checkout/merge/rebase", "muted"),
          line("  git fetch/pull/push/tag/stash/cherry-pick/revert/reset/restore/rm/reflog", "muted"),
          line("  gh issue/pr/run/release/label/repo/auth", "muted"),
          line("  npm run check, ls, cat, edit <tệp>, echo \"...\" > <tệp>, clear", "muted"),
          line("Mẹo: mở Cheatsheet ở thanh trên để xem kịch bản mẫu.", "muted")
        ]
      };
    } else {
      result = { ok: false, error: "'" + cmd + "' chưa được hỗ trợ trong FELab. Gõ help." };
    }
    if (result.error) this.lastError = result.error;
    this.lastLines = result.lines || [];
    return result;
  };

  global.RepoEngine = {
    GitSim,
    TEAM,
    TEAM_IDS,
    short,
    tokenize,
    line,
    hasMarkers,
    diffLines,
    formatTime(time) {
      const date = new Date(BASE_TIME + Number(time || 0) * 60000);
      const pad = (n) => String(n).padStart(2, "0");
      return pad(date.getUTCDate()) + "/" + pad(date.getUTCMonth() + 1) + " " + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes());
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

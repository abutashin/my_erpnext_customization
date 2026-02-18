(() => {
  const TREE_KEY = "__so_items_tree_state";

  const STYLE = `
    .so-tree-actions{
      position:absolute;
      left:6px;
      bottom:2px;
      display:inline-flex;
      gap:6px;
      align-items:center;
      font-weight:600;
      z-index:5;
      pointer-events:auto;
    }
    [data-fieldname="item_code"]{ position:relative; }

    .so-tree-btn{
      cursor:pointer;
      opacity:.65;
      user-select:none;
      padding:0 4px;
      border-radius:4px;
      line-height:1.2;
    }
    .so-tree-btn:hover{ opacity:1; }
  `;

  function ensureStyle() {
    if (document.getElementById("so-tree-style")) return;
    const el = document.createElement("style");
    el.id = "so-tree-style";
    el.innerHTML = STYLE;
    document.head.appendChild(el);
  }

  function ensureState(frm) {
    frm[TREE_KEY] ||= { collapsed: new Set(), labels: new Map() };
    return frm[TREE_KEY];
  }

  // Fast repaint
  function scheduleDecorate(frm) {
    if (frm.__so_tree_raf) return;
    frm.__so_tree_raf = requestAnimationFrame(() => {
      frm.__so_tree_raf = null;
      decorateGrid(frm);
    });
  }

  // Stable id generator
  function genTreeId() {
    // modern browsers
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    // fallback
    return "t_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Ensure every row has tree_id (so it persists across save)
  function ensureTreeIds(frm) {
    let changed = false;
    (frm.doc.items || []).forEach(r => {
      if (!r.tree_id) {
        r.tree_id = genTreeId();
        changed = true;
      }
      if (r.indent === undefined || r.indent === null) {
        r.indent = 0;
      }
    });
    return changed;
  }

  function getChildrenMapByTreeId(items) {
    const children = new Map(); // key: parent_tree_id ("" for root)
    for (const it of (items || [])) {
      const pid = it.parent_tree_id || "";
      if (!children.has(pid)) children.set(pid, []);
      children.get(pid).push(it);
    }
    // keep sibling order by idx
    for (const arr of children.values()) arr.sort((a, b) => (a.idx || 0) - (b.idx || 0));
    return children;
  }

  function buildLabels(frm) {
    const state = ensureState(frm);
    state.labels = new Map();

    const items = frm.doc.items || [];
    const children = getChildrenMapByTreeId(items);

    function walk(parentTreeId, prefix) {
      const kids = children.get(parentTreeId) || [];
      kids.forEach((k, i) => {
        const label = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        // store label by row.name (row.name is what grid rows use)
        state.labels.set(k.name, label);
        walk(k.tree_id, label);
      });
    }

    walk("", "");
  }

  function hasChildren(frm, row) {
    const tid = row.tree_id;
    if (!tid) return false;
    return (frm.doc.items || []).some(r => r.parent_tree_id === tid);
  }

  function isHiddenByAncestor(frm, rowDoc) {
    const state = ensureState(frm);
    let pid = rowDoc.parent_tree_id;

    while (pid) {
      if (state.collapsed.has(pid)) return true;
      const parentDoc = (frm.doc.items || []).find(r => r.tree_id === pid);
      pid = parentDoc?.parent_tree_id;
    }
    return false;
  }

  function toggleCollapse(frm, row) {
    const state = ensureState(frm);
    const tid = row.tree_id;
    if (!tid) return;

    if (state.collapsed.has(tid)) state.collapsed.delete(tid);
    else state.collapsed.add(tid);

    scheduleDecorate(frm);
  }

  // Tree order (so 1.x stays under 1)
  function normalizeTreeOrder(frm) {
    const items = frm.doc.items || [];
    if (!items.length) return false;

    const children = getChildrenMapByTreeId(items);
    const ordered = [];

    const walk = (parentTreeId) => {
      const kids = children.get(parentTreeId) || [];
      for (const k of kids) {
        ordered.push(k);
        walk(k.tree_id);
      }
    };

    walk("");

    if (ordered.length !== items.length) return false;

    let changed = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i] !== ordered[i]) { changed = true; break; }
    }
    if (!changed) return false;

    frm.doc.items = ordered;
    frm.doc.items.forEach((r, i) => (r.idx = i + 1));
    return true;
  }

  function addChild(frm, parentRowName) {
    ensureTreeIds(frm);

    const items = frm.doc.items || [];
    const parent = items.find(r => r.name === parentRowName);
    if (!parent) return;

    if (!parent.tree_id) parent.tree_id = genTreeId();

    const child = frm.add_child("items");
    child.tree_id = genTreeId();
    child.parent_tree_id = parent.tree_id;
    child.indent = (parent.indent || 0) + 1;

    // keep tree order
    normalizeTreeOrder(frm);

    // important for “last row” render
    frm.refresh_field("items");
    scheduleDecorate(frm);
  }

  function patchGridToReapplyTree(frm) {
    const grid = frm.fields_dict.items?.grid;
    if (!grid || grid.__so_tree_patched) return;

    grid.__so_tree_patched = true;

    const wrap = (obj, fn) => {
      if (!obj || typeof obj[fn] !== "function") return;
      const orig = obj[fn].bind(obj);
      obj[fn] = function () {
        const out = orig(...arguments);
        scheduleDecorate(frm);
        return out;
      };
    };

    wrap(grid, "refresh");
    wrap(grid, "refresh_row");
    wrap(grid, "render_result");
  }

  function decorateGrid(frm) {
    ensureStyle();
    ensureTreeIds(frm);

    const grid = frm.fields_dict.items?.grid;
    if (!grid) return;

    patchGridToReapplyTree(frm);
    buildLabels(frm);
    const state = ensureState(frm);

    // Bind once
    if (!grid.wrapper.data("so-tree-bound")) {
      grid.wrapper.data("so-tree-bound", true);

      // stop link editor from stealing clicks
      grid.wrapper.on("mousedown", ".so-tree-add, .so-tree-toggle", function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });

      grid.wrapper.on("click", ".so-tree-add", function (e) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const rowName = $(this).closest(".grid-row").attr("data-name");
        addChild(frm, rowName);
      });

      grid.wrapper.on("click", ".so-tree-toggle", function (e) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const rowName = $(this).closest(".grid-row").attr("data-name");
        const row = (frm.doc.items || []).find(r => r.name === rowName);
        if (row) toggleCollapse(frm, row);
      });
    }

    setTimeout(() => {
      (grid.grid_rows || []).forEach(gr => {
        const d = gr.doc;

        // hide if ancestor collapsed
        gr.row.toggle(!isHiddenByAncestor(frm, d));

        // numbering
        const label = state.labels.get(d.name) || `${d.idx || ""}`;
        gr.row.find(".row-index").text(label);

        // indent
        const indent = d.indent || 0;
        const $cell = gr.row.find('[data-fieldname="item_code"]');
        $cell.css("padding-left", `${indent * 18}px`);

        // buttons
        if (!$cell.find(".so-tree-actions").length) {
          $cell.append(`
            <span class="so-tree-actions">
              <span class="so-tree-btn so-tree-add" title="Add child">＋</span>
              <span class="so-tree-btn so-tree-toggle" title="Expand/Collapse">▾</span>
            </span>
          `);
        }

        // show toggle only if children exist
        $cell.find(".so-tree-toggle").toggle(hasChildren(frm, d));
      });
    }, 0);
  }

  frappe.ui.form.on("Sales Order", {
    refresh(frm) {
      scheduleDecorate(frm);
    },

    items_add(frm) {
      scheduleDecorate(frm);
    },

    items_on_form_rendered(frm) {
      scheduleDecorate(frm);
    },

    // ensure ids exist right before saving
    before_save(frm) {
      const changed = ensureTreeIds(frm);
      if (changed) frm.refresh_field("items");
      normalizeTreeOrder(frm);
    },

    // after_save exists in frappe form events (frm.save triggers it) :contentReference[oaicite:2]{index=2}
    after_save(frm) {
      scheduleDecorate(frm);
    }
  });
})();

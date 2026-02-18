import uuid

def before_save_sales_order(doc, method=None):
    """
    Persist tree hierarchy + labels so it survives save/reload.
    Uses: item.tree_id, item.parent_tree_id, item.indent, item.tree_label
    """

    # 1) Ensure every row has a stable tree_id
    for it in doc.items:
        if not getattr(it, "tree_id", None):
            it.tree_id = str(uuid.uuid4())
        if getattr(it, "indent", None) is None:
            it.indent = 0

    # 2) Build children map by parent_tree_id (stable)
    children = {}
    by_tid = {}

    for it in doc.items:
        by_tid[it.tree_id] = it
        pid = getattr(it, "parent_tree_id", None) or ""
        children.setdefault(pid, []).append(it)

    # keep sibling order by idx
    for pid in children:
        children[pid].sort(key=lambda x: x.idx or 0)

    # 3) Assign tree_label like 1, 1.1, 1.1.1...
    def walk(parent_tid: str, prefix: str):
        for i, child in enumerate(children.get(parent_tid, []), start=1):
            label = f"{prefix}.{i}" if prefix else str(i)
            child.tree_label = label
            # enforce indent from label depth (optional but keeps it consistent)
            child.indent = label.count(".")
            walk(child.tree_id, label)

    walk("", "")

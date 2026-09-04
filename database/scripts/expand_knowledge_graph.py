"""Expand the knowledge graph from the CC-BY GI registry snapshot.

Source: database/gi_registry.csv (Geographical Indications Registry, Govt. of
India, via JusticeHub, CC BY 4.0 -- see database/SOURCES.md for attribution).
Only rows with Goods in {Handicraft, Handicrafts} are imported.

For each craft row the script ensures:
  - craft node   {id: craft-<slug>, label, type: ArtForm}
  - state node(s) {id: region-<slug>, label, type: State}  (multi-state cells split)
  - GI tag node  {id: gi-<slug>, label: "GI Tag: <craft>", type: GITag}
  - edges (craft -> state, ORIGINATES_IN), (craft -> gi-tag, HAS_CERTIFICATE)

Existing nodes/edges are reused, never duplicated. Also (re)writes a single
RAG summary document (id "doc-gi-summary") into database/documents.json.

Usage:
    python3 database/scripts/expand_knowledge_graph.py [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from collections import Counter

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GI_CSV = os.path.join(REPO_ROOT, "database", "gi_registry.csv")
KG_PATH = os.path.join(REPO_ROOT, "database", "knowledge_graph.json")
DOCS_PATH = os.path.join(REPO_ROOT, "database", "documents.json")

CRAFT_GOODS = {"Handicraft", "Handicrafts"}

# Canonical ids already used in the seed graph for well-known states.
STATE_ALIASES = {
    "jammu & kashmir": ("region-kashmir", "Kashmir"),
    "kashmir": ("region-kashmir", "Kashmir"),
    "uttar pradesh": ("region-up", "Uttar Pradesh"),
    "andhra pradesh": ("region-ap", "Andhra Pradesh"),
}


def slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def split_states(cell: str) -> list[str]:
    """Split registry state cells like 'India(Karnataka & Maharashtra)'."""
    cell = cell.replace("India", "")
    parts = re.split(r"[,&;()]", cell)
    states = []
    for part in parts:
        name = re.sub(r"\s+", " ", part).strip(" .-")
        if name:
            states.append(name)
    # Preserve order, drop duplicates.
    return list(dict.fromkeys(states))


def state_node(state: str) -> tuple[str, str]:
    alias = STATE_ALIASES.get(state.lower())
    if alias:
        return alias
    return f"region-{slug(state)}", state


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with open(GI_CSV, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    goods_col = [c for c in rows[0].keys() if "Goods" in c][0]
    crafts = [r for r in rows if (r.get(goods_col) or "").strip() in CRAFT_GOODS]
    print(f"registry rows={len(rows)} handicraft rows={len(crafts)}")

    with open(KG_PATH, encoding="utf-8") as f:
        kg = json.load(f)
    nodes: dict[str, dict] = {n["id"]: n for n in kg.get("nodes", [])}
    edges: set[tuple[str, str, str]] = {
        (e["source"], e["target"], e.get("relation", "")) for e in kg.get("edges", [])
    }
    added_nodes = added_edges = 0

    state_counter: Counter[str] = Counter()
    for row in crafts:
        craft = (row.get("Geographical Indications") or "").strip()
        if not craft:
            continue
        cid = f"craft-{slug(craft)}"
        if cid not in nodes:
            nodes[cid] = {"id": cid, "label": craft, "type": "ArtForm"}
            added_nodes += 1
        gid = f"gi-{slug(craft)}"
        if gid not in nodes:
            nodes[gid] = {"id": gid, "label": f"GI Tag: {craft}", "type": "GITag"}
            added_nodes += 1
        edge = (cid, gid, "HAS_CERTIFICATE")
        if edge not in edges:
            edges.add(edge)
            added_edges += 1
        for state in split_states(row.get("State", "")):
            rid, label = state_node(state)
            if rid not in nodes:
                nodes[rid] = {"id": rid, "label": label, "type": "State"}
                added_nodes += 1
            edge = (cid, rid, "ORIGINATES_IN")
            if edge not in edges:
                edges.add(edge)
                added_edges += 1
            state_counter[label] += 1

    print(f"new nodes={added_nodes} new edges={added_edges} "
          f"total nodes={len(nodes)} total edges={len(edges)}")
    top = ", ".join(f"{s} ({c})" for s, c in state_counter.most_common(5))
    years = sorted({(r.get("Year") or "").strip() for r in crafts if r.get("Year")})
    summary = (
        f"India's GI registry records {len(crafts)} handicraft geographical indications "
        f"(JusticeHub extract, registrations {years[0]} to {years[-1]}). "
        f"States with the most registered handicraft GIs include {top}. "
        "Each registered craft links its origin state to a GI certification tag, "
        "which is how Viraasat verifies artisan provenance. "
        "Source: Geographical Indications Registry, Government of India, via "
        "JusticeHub (CC BY 4.0)."
    )

    if args.dry_run:
        print("dry-run: nothing written")
        print("summary doc preview:", summary[:200], "...")
        return 0

    kg["nodes"] = sorted(nodes.values(), key=lambda n: n["id"])
    kg["edges"] = sorted(
        ({"source": s, "target": t, "relation": r} for s, t, r in edges),
        key=lambda e: (e["source"], e["target"], e["relation"]),
    )
    with open(KG_PATH, "w", encoding="utf-8") as f:
        json.dump(kg, f, indent=2, ensure_ascii=False)
        f.write("\n")

    with open(DOCS_PATH, encoding="utf-8") as f:
        docs: list = json.load(f)
    doc = {"id": "doc-gi-summary",
           "title": "Registered GI Handicrafts of India (Registry Summary)",
           "text": summary}
    for i, d in enumerate(docs):
        if d.get("id") == "doc-gi-summary":
            docs[i] = doc
            break
    else:
        docs.append(doc)
    with open(DOCS_PATH, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("wrote knowledge_graph.json + documents.json (doc-gi-summary)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Knowledge graph built from the configured store.

The graph is loaded lazily on first call and cached in process memory.
For multi-worker deployments, each worker will build its own copy once,
which is cheap (tens of nodes / edges).
"""
from __future__ import annotations

import json
import os
import threading
from typing import Dict, List, Tuple

import networkx as nx

_G: nx.Graph | None = None
_G_LOCK = threading.Lock()


def _seed_from_json() -> Tuple[List[dict], List[dict]]:
    """Return (nodes, edges) from the seed JSON if the store is empty."""
    paths = [
        os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../database/knowledge_graph.json")
        ),
        "database/knowledge_graph.json",
        "../database/knowledge_graph.json",
    ]
    for path in paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                data = json.load(f)
            return data.get("nodes", []), data.get("edges", [])
    return [], []


def _load_graph() -> nx.Graph:
    global _G
    if _G is not None:
        return _G
    with _G_LOCK:
        if _G is not None:
            return _G

        from app.services.storage import get_store

        store = get_store()
        nodes, edges = store.get_knowledge_graph()
        if not nodes and not edges:
            # First run: seed from JSON into the store so future restarts
            # don't need the JSON file.
            nodes, edges = _seed_from_json()
            if nodes or edges:
                store.replace_knowledge_graph(nodes, edges)

        g = nx.Graph()
        for node in nodes:
            g.add_node(node["id"], label=node["label"], type=node.get("type", ""))
        for edge in edges:
            g.add_edge(edge["source"], edge["target"], relation=edge.get("relation", ""))
        _G = g
        print(f"NetworkX Graph built: {g.number_of_nodes()} nodes, {g.number_of_edges()} edges.")
        return g


def traverse_knowledge_graph(query: str) -> dict:
    G = _load_graph()
    if G.number_of_nodes() == 0:
        return {
            "query": query,
            "matched_nodes": [],
            "connected_nodes": [],
            "paths": [],
            "total_nodes_in_subgraph": 0,
            "centrality_ranking": [],
            "gi_certification_paths": [],
            "is_simulated": False,
        }

    matching_nodes = []
    for node_id, data in G.nodes(data=True):
        label = data.get("label", "")
        if query.lower() in label.lower() or query.lower() in node_id.lower():
            matching_nodes.append(
                {"id": node_id, "label": label, "type": data.get("type", "")}
            )

    relationships = []
    connected_node_ids = set()
    for match in matching_nodes:
        m_id = match["id"]
        for neighbor in G.neighbors(m_id):
            edge_data = G.get_edge_data(m_id, neighbor)
            relation = edge_data.get("relation", "CONNECTED_TO") if edge_data else "CONNECTED_TO"
            relationships.append({"source": m_id, "target": neighbor, "relation": relation})
            connected_node_ids.add(neighbor)

    connected_nodes = []
    for node_id in connected_node_ids:
        if any(m["id"] == node_id for m in matching_nodes):
            continue
        data = G.nodes[node_id]
        connected_nodes.append(
            {"id": node_id, "label": data.get("label", ""), "type": data.get("type", "")}
        )

    subgraph_nodes = [m["id"] for m in matching_nodes] + list(connected_node_ids)
    centrality_results = []
    if subgraph_nodes:
        sub_G = G.subgraph(subgraph_nodes)
        deg_centrality = nx.degree_centrality(sub_G)
        for n_id in subgraph_nodes:
            label = G.nodes[n_id].get("label", n_id)
            centrality_results.append(
                {"id": n_id, "label": label, "centrality": round(deg_centrality.get(n_id, 0.0), 3)}
            )
        centrality_results.sort(key=lambda x: x["centrality"], reverse=True)

    gi_paths = []
    gi_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "GITag"]
    for match in matching_nodes:
        m_id = match["id"]
        for gi_id in gi_nodes:
            if m_id != gi_id and nx.has_path(G, m_id, gi_id):
                path = nx.shortest_path(G, source=m_id, target=gi_id)
                if len(path) <= 3:
                    gi_paths.append(
                        {
                            "from": match["label"],
                            "to": G.nodes[gi_id].get("label", gi_id),
                            "path": [G.nodes[step].get("label", step) for step in path],
                        }
                    )

    return {
        "query": query,
        "matched_nodes": matching_nodes,
        "connected_nodes": connected_nodes,
        "paths": relationships,
        "total_nodes_in_subgraph": len(subgraph_nodes),
        "centrality_ranking": centrality_results[:5],
        "gi_certification_paths": gi_paths,
        "is_simulated": False,
    }

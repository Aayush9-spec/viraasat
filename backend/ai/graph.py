import os
import json
import networkx as nx
from typing import Dict, List

# Global Graph Object
G = nx.Graph()
graph_data = {"nodes": [], "edges": []}

def load_and_build_graph():
    global G, graph_data
    paths_to_try = [
        "backend/data/knowledge_graph.json",
        "data/knowledge_graph.json",
        "../data/knowledge_graph.json"
    ]
    
    loaded = False
    for path in paths_to_try:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    graph_data = json.load(f)
                loaded = True
                break
            except Exception as e:
                print(f"Error loading path {path}: {e}")
                
    if not loaded:
        print("Warning: Knowledge Graph JSON file not found. Building empty graph.")
        graph_data = {"nodes": [], "edges": []}
        
    G.clear()
    # Populate NetworkX Graph
    for node in graph_data.get("nodes", []):
        G.add_node(node["id"], label=node["label"], type=node["type"])
        
    for edge in graph_data.get("edges", []):
        G.add_edge(edge["source"], edge["target"], relation=edge["relation"])
        
    print(f"NetworkX Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")

# Build graph on module load
load_and_build_graph()

def traverse_knowledge_graph(query: str) -> dict:
    if G.number_of_nodes() == 0:
        # Rebuild if empty
        load_and_build_graph()
        
    matching_nodes = []
    
    # 1. Locate matched nodes
    for node_id, data in G.nodes(data=True):
        label = data.get("label", "")
        if query.lower() in label.lower() or query.lower() in node_id.lower():
            matching_nodes.append({
                "id": node_id,
                "label": label,
                "type": data.get("type", "")
            })
            
    # 2. Extract first-degree relationships (neighbors)
    relationships = []
    connected_node_ids = set()
    
    for match in matching_nodes:
        m_id = match["id"]
        for neighbor in G.neighbors(m_id):
            edge_data = G.get_edge_data(m_id, neighbor)
            relation = edge_data.get("relation", "CONNECTED_TO")
            
            # Form relationship structure
            relationships.append({
                "source": m_id,
                "target": neighbor,
                "relation": relation
            })
            connected_node_ids.add(neighbor)
            
    connected_nodes = []
    for node_id in connected_node_ids:
        # Avoid duplicating matched nodes in connected_nodes
        if any(m["id"] == node_id for m in matching_nodes):
            continue
        data = G.nodes[node_id]
        connected_nodes.append({
            "id": node_id,
            "label": data.get("label", ""),
            "type": data.get("type", "")
        })
        
    # 3. Compute network centrality metrics for the matched sub-graph
    subgraph_nodes = [m["id"] for m in matching_nodes] + list(connected_node_ids)
    centrality_results = []
    
    if subgraph_nodes:
        sub_G = G.subgraph(subgraph_nodes)
        # Degree centrality in the sub-graph
        deg_centrality = nx.degree_centrality(sub_G)
        
        for n_id in subgraph_nodes:
            label = G.nodes[n_id].get("label", n_id)
            centrality_results.append({
                "id": n_id,
                "label": label,
                "centrality": round(deg_centrality.get(n_id, 0.0), 3)
            })
        # Sort by centrality score descending
        centrality_results.sort(key=lambda x: x["centrality"], reverse=True)
        
    # 4. Find paths to GI Tags (demonstrating validation traversal)
    gi_paths = []
    gi_nodes = [node_id for node_id, data in G.nodes(data=True) if data.get("type") == "GITag"]
    
    for match in matching_nodes:
        m_id = match["id"]
        for gi_id in gi_nodes:
            if m_id != gi_id and nx.has_path(G, m_id, gi_id):
                path = nx.shortest_path(G, source=m_id, target=gi_id)
                if len(path) <= 3:  # Only capture close relationships (<= 3 hops)
                    gi_paths.append({
                        "from": match["label"],
                        "to": G.nodes[gi_id].get("label", gi_id),
                        "path": [G.nodes[step].get("label", step) for step in path]
                    })
                    
    return {
        "query": query,
        "matched_nodes": matching_nodes,
        "connected_nodes": connected_nodes,
        "paths": relationships,
        "total_nodes_in_subgraph": len(subgraph_nodes),
        "centrality_ranking": centrality_results[:5],  # Top 5 central elements
        "gi_certification_paths": gi_paths,
        "is_simulated": False
    }

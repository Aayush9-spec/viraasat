import json

def load_knowledge_graph():
    try:
        with open("backend/data/knowledge_graph.json", "r") as f:
            return json.load(f)
    except Exception as e:
        # Fallback if executing from a different path
        try:
            with open("data/knowledge_graph.json", "r") as f:
                return json.load(f)
        except Exception:
            print(f"Error loading Knowledge Graph: {e}")
            return {"nodes": [], "edges": []}

def traverse_knowledge_graph(query: str) -> dict:
    graph = load_knowledge_graph()
    matching_nodes = []
    
    # 1. Locate root matches
    for node in graph["nodes"]:
        if query.lower() in node["label"].lower() or query.lower() in node["id"].lower():
            matching_nodes.append(node)
            
    # 2. Extract first-degree hops (paths)
    relationships = []
    connected_node_ids = set()
    
    for edge in graph["edges"]:
        source_match = any(node["id"] == edge["source"] for node in matching_nodes)
        target_match = any(node["id"] == edge["target"] for node in matching_nodes)
        
        if source_match or target_match:
            relationships.append(edge)
            connected_node_ids.add(edge["source"])
            connected_node_ids.add(edge["target"])
            
    # Add connected nodes to output
    connected_nodes = [n for n in graph["nodes"] if n["id"] in connected_node_ids and n not in matching_nodes]
    
    return {
        "query": query,
        "matched_nodes": matching_nodes,
        "connected_nodes": connected_nodes,
        "paths": relationships,
        "total_nodes_in_subgraph": len(matching_nodes) + len(connected_nodes)
    }

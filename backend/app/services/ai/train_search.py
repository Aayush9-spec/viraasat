import os
import json
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Indian handicraft domain synonyms and semantic associations for query enrichment
CRAFT_SYNONYM_MAP = {
    "diya": ["deepam", "deepak", "earthen lamp", "terracotta lamp", "clay lamp", "puja", "pooja", "diwali", "devotional"],
    "deepam": ["diya", "deepak", "lamp", "clay", "brass"],
    "lamp": ["diya", "deepam", "lantern", "earthen", "terracotta"],
    "pashmina": ["cashmere", "changthangi", "wool", "shawl", "stole", "winter", "kashmir"],
    "shawl": ["pashmina", "cashmere", "wool", "chaddar", "wrap", "stole"],
    "pottery": ["ceramic", "terracotta", "clay", "urn", "vase", "jaipur", "blue pottery", "earthenware"],
    "clay": ["terracotta", "pottery", "earthen", "multani mitti", "diya"],
    "brass": ["bell metal", "dhokra", "dokra", "bronze", "metallic", "idol", "statue"],
    "dhokra": ["dokra", "bell metal", "lost wax", "brass", "tribal craft", "bastar"],
    "toy": ["channapatna", "wooden toy", "lacquer", "train", "plaything", "softwood"],
    "saree": ["sari", "zari", "silk", "handloom", "drape", "kanjeevaram", "chanderi", "banarasi"],
    "wood": ["sheesham", "teak", "carved", "channapatna", "wooden", "timber"],
    "silk": ["zari", "saree", "handloom", "mulberry", "tussar", "muga"],
    "cotton": ["khadi", "handloom", "dhurrie", "chikankari", "natural fabric"],
    "painting": ["madhubani", "mithila", "pattachitra", "warli", "folk art", "canvas"],
    "madhubani": ["mithila", "folk painting", "natural pigments", "bihar", "wall art"],
    "chikan": ["chikankari", "lucknow", "embroidery", "hand embroidered", "shadow work"]
}

def load_products():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "../../../../database/products.json")),
        os.path.abspath(os.path.join(current_dir, "../../database/products.json")),
        os.path.abspath(os.path.join(os.getcwd(), "database/products.json")),
        os.path.abspath(os.path.join(os.getcwd(), "../database/products.json"))
    ]
    path = next((c for c in candidates if os.path.exists(c)), candidates[0])
    if not os.path.exists(path):
        raise FileNotFoundError(f"Products database not found at {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        products = json.load(f)
    return products

def enrich_product_text(p: dict) -> str:
    name = p.get("name", "")
    desc = p.get("description", "")
    cat = p.get("category", "")
    region = p.get("region", "")
    
    # Extract AI insights if available
    insights = p.get("ai_insights") or p.get("aiInsights") or {}
    features = " ".join(insights.get("keyFeatures", []))
    tags = " ".join(insights.get("styleTags", []))
    uses = " ".join(insights.get("useCases", []))
    
    # Build text tokens and add synonym expansions
    text_content = f"{name} {name} {name} {cat} {cat} {region} {desc} {features} {tags} {uses}".lower()
    
    expanded = []
    for word, syns in CRAFT_SYNONYM_MAP.items():
        if word in text_content:
            expanded.extend(syns)
            
    return f"{text_content} {' '.join(expanded)}"

def load_kaggle_search_products(max_items: int = 500) -> list:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "../../../../database/kaggle_data/flipkart_com-ecommerce_sample.csv")),
        os.path.abspath(os.path.join(current_dir, "../../database/kaggle_data/flipkart_com-ecommerce_sample.csv")),
        os.path.abspath(os.path.join(os.getcwd(), "database/kaggle_data/flipkart_com-ecommerce_sample.csv")),
        os.path.abspath(os.path.join(os.getcwd(), "../database/kaggle_data/flipkart_com-ecommerce_sample.csv")),
    ]
    fk_path = next((c for c in candidates if os.path.exists(c)), None)
    if not fk_path:
        return []

    try:
        import pandas as pd
        df = pd.read_csv(fk_path).dropna(subset=["product_name", "description"])
        craft_keywords = [
            "handicraft", "handmade", "pottery", "saree", "silk", "brass", "wood",
            "terracotta", "clay", "channapatna", "pashmina", "shawl", "carpet",
            "embroider", "zari", "jhumka", "bangle", "painting", "madhubani", "warli", "dokra", "dhokra"
        ]
        pattern = "|".join(craft_keywords)
        mask = df["product_name"].str.contains(pattern, case=False, na=False) | df["description"].str.contains(pattern, case=False, na=False)
        filtered = df[mask].head(max_items)
        
        kaggle_products = []
        for idx, r in filtered.iterrows():
            name = str(r["product_name"]).strip()
            desc = str(r["description"]).strip()
            price = float(r["retail_price"]) if pd.notna(r.get("retail_price")) else 1000.0
            
            region = "India"
            for state in ["Rajasthan", "Kashmir", "Kutch", "Gujarat", "Uttar Pradesh", "West Bengal", "Kerala", "Tamil Nadu", "Karnataka", "Bihar", "Odisha", "Maharashtra"]:
                if state.lower() in desc.lower() or state.lower() in name.lower():
                    region = state
                    break
                    
            kaggle_products.append({
                "id": f"kg-{idx}",
                "name": name,
                "category": "Textiles" if ("saree" in name.lower() or "silk" in name.lower()) else "Home Decor",
                "region": region,
                "price": price,
                "description": desc
            })
        print(f"Enriched search catalog with {len(kaggle_products)} authentic craft products from Kaggle.")
        return kaggle_products
    except Exception as e:
        print(f"Notice: Failed to load Kaggle products for search: {e}")
        return []

def train_and_evaluate_search_model():
    print("Loading authentic Viraasat artisan product catalog...")
    products = load_products()
    print(f"Loaded {len(products)} products from platform catalog.")
    
    kaggle_prods = load_kaggle_search_products()
    all_products = products + kaggle_prods
    
    corpus = []
    product_ids = []
    product_metadata = []
    
    for p in all_products:
        p_id = p.get("id") or p.get("_id")
        product_ids.append(p_id)
        corpus.append(enrich_product_text(p))
        product_metadata.append({
            "id": p_id,
            "name": p.get("name", ""),
            "category": p.get("category", ""),
            "region": p.get("region", ""),
            "price": p.get("price", 0),
            "description": p.get("description", "")
        })
        
    print("Fitting TfidfVectorizer with unigram + bigram n-grams & sublinear scaling...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        stop_words="english"
    )
    
    doc_vectors = vectorizer.fit_transform(corpus)
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)} tokens/n-grams.")
    
    # Benchmark retrieval accuracy against real test queries
    test_queries = [
        ("diya", "Diya"),
        ("terracotta lamp", "Diya"),
        ("channapatna toy train", "Channapatna Wooden Toy Train"),
        ("blue pottery urn", "Jaipur Cobalt Blue Pottery Urn"),
        ("pashmina wool", "Pashmina"),
        ("brass idol", "Dhokra"),
        ("lucknow chikankari", "Chikankari"),
        ("madhubani painting", "Madhubani")
    ]
    
    correct_top_1 = 0
    correct_top_3 = 0
    total_queries = 0
    
    for query, expected_keyword in test_queries:
        # Check if keyword exists in catalog
        has_match = any(expected_keyword.lower() in p["name"].lower() for p in product_metadata)
        if not has_match:
            continue
            
        total_queries += 1
        q_vec = vectorizer.transform([query.lower()])
        sims = cosine_similarity(q_vec, doc_vectors).flatten()
        top_indices = np.argsort(sims)[::-1]
        
        top_names = [product_metadata[idx]["name"] for idx in top_indices[:3]]
        if expected_keyword.lower() in top_names[0].lower():
            correct_top_1 += 1
        if any(expected_keyword.lower() in name.lower() for name in top_names):
            correct_top_3 += 1
            
    top_1_accuracy = round(correct_top_1 / max(1, total_queries), 4)
    top_3_accuracy = round(correct_top_3 / max(1, total_queries), 4)
    
    print(f"Evaluated on {total_queries} domain queries:")
    print(f"Top-1 Precision: {top_1_accuracy * 100:.1f}%")
    print(f"Top-3 Recall:    {top_3_accuracy * 100:.1f}%")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.abspath(os.path.join(current_dir, "../../database"))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "search_model.pkl")
    
    payload = {
        "vectorizer": vectorizer,
        "doc_vectors": doc_vectors,
        "product_ids": product_ids,
        "product_metadata": product_metadata,
        "evaluation_metrics": {
            "top_1_accuracy": top_1_accuracy,
            "top_3_accuracy": top_3_accuracy,
            "vocabulary_size": len(vectorizer.vocabulary_),
            "catalog_size": len(products),
            "is_evaluated": True
        }
    }
    
    with open(model_path, "wb") as f:
        pickle.dump(payload, f)
        
    print(f"Trained Search Vector Model saved successfully to {model_path}")
    
    # Also save to root database directory if present
    root_db_path = os.path.abspath(os.path.join(current_dir, "../../../../database/search_model.pkl"))
    if os.path.exists(os.path.dirname(root_db_path)):
        with open(root_db_path, "wb") as f:
            pickle.dump(payload, f)
        print(f"Also replicated to {root_db_path}")

if __name__ == "__main__":
    train_and_evaluate_search_model()

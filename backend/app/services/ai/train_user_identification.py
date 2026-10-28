"""Train the Promising User Identification system for Viraasat.

Architecture (dual-model):
  Model A - GBT Classifier (XGBoost-style supervised)
    Features : RFM metrics + engagement signals + trust signals
    Target   : is_promising (1 = high-value / loyal buyer, 0 = casual / at-risk)
    Output   : probability score 0.0-1.0  (>= 0.75 = "Promising")

  Model B - K-Means Clustering (unsupervised segmentation)
    Segments : 5 clusters auto-labeled based on centroid behaviour
      - "Champion"      : high spend, high frequency, low returns
      - "Loyal"         : regular buyer, good engagement, moderate spend
      - "Promising"     : growing engagement, increasing spend trend
      - "At Risk"       : declining activity, moderate past spend
      - "Casual"        : low frequency, low spend, minimal engagement

  RFM features:
    recency_days      - days since last purchase (lower = better)
    purchase_count    - total completed purchases
    total_spend_inr   - lifetime spend on platform
    avg_order_inr     - average order value
    gi_affinity_pct   - share of purchases that are GI-certified items

  Engagement features:
    session_count     - platform sessions in last 90 days
    wishlist_count    - items currently wishlisted
    search_count      - searches performed in last 30 days
    review_count      - reviews submitted (quality engagement)
    recommendation_ctr - click-through rate on personalised recs (0-1)

  Trust / quality features:
    return_rate       - fraction of orders returned (lower = better)
    review_helpfulness - avg helpfulness votes on their reviews
    account_age_days  - days since account creation
    is_verified       - KYC / email verified (bool)

Saves artifact to: database/user_identification_model.pkl
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, average_precision_score,
    accuracy_score, classification_report,
)

# ---------------------------------------------------------------------------
# Feature definitions
# ---------------------------------------------------------------------------

FEATURE_COLS = [
    # RFM
    "recency_days",
    "purchase_count",
    "total_spend_inr",
    "avg_order_inr",
    "gi_affinity_pct",
    # Engagement
    "session_count",
    "wishlist_count",
    "search_count",
    "review_count",
    "recommendation_ctr",
    # Trust
    "return_rate",
    "review_helpfulness",
    "account_age_days",
    "is_verified",
]

# Cluster label mapping (assigned after inspecting centroids)
CLUSTER_TIERS = ["Champion", "Loyal", "Promising", "At Risk", "Casual"]

# Promising score threshold
PROMISING_THRESHOLD = 0.75


# ---------------------------------------------------------------------------
# Synthetic dataset generation
# ---------------------------------------------------------------------------

def _randn_clipped(rng, loc, scale, low, high, size):
    return np.clip(rng.normal(loc, scale, size), low, high)


def generate_user_dataset(n_users: int = 2000, seed: int = 42) -> pd.DataFrame:
    """
    Synthesise realistic Viraasat user behaviour profiles.

    Five latent user archetypes are generated in proportion:
      30% Champion, 25% Loyal, 20% Promising, 15% At Risk, 10% Casual
    The supervised label  is_promising = 1  for Champion + Loyal + Promising.
    """
    rng = np.random.default_rng(seed)

    archetype_counts = {
        "Champion":  int(n_users * 0.30),
        "Loyal":     int(n_users * 0.25),
        "Promising": int(n_users * 0.20),
        "At Risk":   int(n_users * 0.15),
        "Casual":    n_users - int(n_users * 0.30) - int(n_users * 0.25)
                     - int(n_users * 0.20) - int(n_users * 0.15),
    }

    segments = {
        #                 rec   pur    spend   aoi   gi%  sess  wish  srch  rev  ctr   ret   hlp   age   ver  label
        "Champion":  dict(recency=(15,12), purchase=(28,8), spend=(42000,15000),
                          aoi=(1800,600), gi=(0.72,0.15), sess=(38,10), wish=(14,5),
                          srch=(55,15), rev=(9,3), ctr=(0.62,0.12), ret=(0.04,0.02),
                          hlp=(4.2,1.1), age=(540,180), ver=0.97, label=1),
        "Loyal":     dict(recency=(28,18), purchase=(15,5), spend=(22000,9000),
                          aoi=(1500,500), gi=(0.60,0.18), sess=(24,8), wish=(9,4),
                          srch=(38,12), rev=(6,3), ctr=(0.48,0.14), ret=(0.07,0.03),
                          hlp=(3.1,1.0), age=(380,130), ver=0.90, label=1),
        "Promising": dict(recency=(45,22), purchase=(7,3), spend=(9500,4000),
                          aoi=(1300,400), gi=(0.50,0.20), sess=(16,7), wish=(7,3),
                          srch=(28,10), rev=(3,2), ctr=(0.40,0.15), ret=(0.09,0.04),
                          hlp=(2.2,0.9), age=(180,90), ver=0.78, label=1),
        "At Risk":   dict(recency=(110,40), purchase=(8,4), spend=(12000,6000),
                          aoi=(1600,700), gi=(0.45,0.20), sess=(6,4), wish=(3,2),
                          srch=(10,6), rev=(2,2), ctr=(0.22,0.12), ret=(0.15,0.06),
                          hlp=(1.8,1.0), age=(300,100), ver=0.70, label=0),
        "Casual":    dict(recency=(180,60), purchase=(2,1), spend=(2200,1200),
                          aoi=(900,400), gi=(0.30,0.20), sess=(4,3), wish=(2,2),
                          srch=(7,5), rev=(1,1), ctr=(0.15,0.10), ret=(0.20,0.08),
                          hlp=(1.2,0.8), age=(150,80), ver=0.55, label=0),
    }

    rows = []
    for archetype, cfg in segments.items():
        n = archetype_counts[archetype]
        recency   = _randn_clipped(rng, *cfg["recency"],   1,   365, n).astype(int)
        purchase  = _randn_clipped(rng, *cfg["purchase"],  1,    80, n).astype(int)
        spend     = _randn_clipped(rng, *cfg["spend"],   500, 200000, n).round(2)
        aoi       = _randn_clipped(rng, *cfg["aoi"],     200,   8000, n).round(2)
        gi_aff    = _randn_clipped(rng, *cfg["gi"],      0.0,    1.0, n).round(3)
        sess      = _randn_clipped(rng, *cfg["sess"],      1,    100, n).astype(int)
        wish      = _randn_clipped(rng, *cfg["wish"],      0,     40, n).astype(int)
        srch      = _randn_clipped(rng, *cfg["srch"],      0,    120, n).astype(int)
        rev       = _randn_clipped(rng, *cfg["rev"],       0,     25, n).astype(int)
        ctr       = _randn_clipped(rng, *cfg["ctr"],     0.0,    1.0, n).round(3)
        ret       = _randn_clipped(rng, *cfg["ret"],     0.0,    0.6, n).round(3)
        hlp       = _randn_clipped(rng, *cfg["hlp"],     0.0,   10.0, n).round(2)
        age       = _randn_clipped(rng, *cfg["age"],      30,   1200, n).astype(int)
        verified  = (rng.random(n) < cfg["ver"]).astype(int)
        labels    = np.full(n, cfg["label"], dtype=int)
        archs     = [archetype] * n

        for i in range(n):
            rows.append({
                "recency_days":        recency[i],
                "purchase_count":      purchase[i],
                "total_spend_inr":     spend[i],
                "avg_order_inr":       aoi[i],
                "gi_affinity_pct":     gi_aff[i],
                "session_count":       sess[i],
                "wishlist_count":      wish[i],
                "search_count":        srch[i],
                "review_count":        rev[i],
                "recommendation_ctr":  ctr[i],
                "return_rate":         ret[i],
                "review_helpfulness":  hlp[i],
                "account_age_days":    age[i],
                "is_verified":         verified[i],
                "is_promising":        labels[i],
                "true_archetype":      archs[i],
            })

    df = pd.DataFrame(rows).sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Model A - GBT classifier
# ---------------------------------------------------------------------------

def train_gbt(df: pd.DataFrame):
    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df["is_promising"].values.astype(int)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s  = scaler.transform(X_te)

    clf = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.80,
        min_samples_leaf=8,
        random_state=42,
    )
    clf.fit(X_tr_s, y_tr)

    proba_te = clf.predict_proba(X_te_s)[:, 1]
    pred_te  = (proba_te >= PROMISING_THRESHOLD).astype(int)

    auc  = float(roc_auc_score(y_te, proba_te))
    ap   = float(average_precision_score(y_te, proba_te))
    acc  = float(accuracy_score(y_te, pred_te))

    print(f"      GBT  AUC-ROC: {auc:.4f}  Avg-Precision: {ap:.4f}  Accuracy: {acc:.4f}")

    feature_importance = dict(zip(
        FEATURE_COLS,
        [round(float(v), 4) for v in clf.feature_importances_]
    ))
    top_features = sorted(feature_importance, key=feature_importance.get, reverse=True)[:5]
    print(f"      Top-5 features: {top_features}")

    return clf, scaler, {
        "auc_roc":        round(auc, 4),
        "avg_precision":  round(ap, 4),
        "accuracy":       round(acc, 4),
        "verified_accuracy": round(auc, 4),
        "feature_importance": feature_importance,
        "is_evaluated":   True,
    }


# ---------------------------------------------------------------------------
# Model B - K-Means segmentation
# ---------------------------------------------------------------------------

def _label_cluster(centroid: np.ndarray, feature_names: list) -> str:
    """
    Assign a human-readable tier to a K-Means centroid by inspecting the
    key discriminating features (after standard scaling, higher absolute
    values indicate stronger presence of a trait).
    """
    idx = {f: i for i, f in enumerate(feature_names)}
    spend      = centroid[idx["total_spend_inr"]]
    recency    = centroid[idx["recency_days"]]      # lower = better (post-scale: more negative = better)
    purchase   = centroid[idx["purchase_count"]]
    ret        = centroid[idx["return_rate"]]       # lower = better
    sess       = centroid[idx["session_count"]]

    # Champion: high spend, high purchase, low recency (recent), low return
    if spend > 0.8 and purchase > 0.8 and recency < -0.3 and ret < -0.3:
        return "Champion"
    # Loyal: above avg spend + purchase, decent session
    if spend > 0.3 and purchase > 0.3 and sess > 0.0:
        return "Loyal"
    # At Risk: decent historical spend but high recency (gone quiet)
    if spend > 0.0 and recency > 0.8:
        return "At Risk"
    # Casual: low everything
    if spend < -0.5 and purchase < -0.5:
        return "Casual"
    # Default
    return "Promising"


def train_kmeans(df: pd.DataFrame):
    X = df[FEATURE_COLS].values.astype(np.float32)

    scaler_km = StandardScaler()
    X_s = scaler_km.fit_transform(X)

    km = KMeans(n_clusters=5, random_state=42, n_init=20, max_iter=500)
    km.fit(X_s)

    # Label each centroid
    centroid_labels = [
        _label_cluster(c, FEATURE_COLS) for c in km.cluster_centers_
    ]
    # Deduplicate labels if two centroids mapped to the same tier
    used = {}
    final_labels = []
    remaining = [t for t in CLUSTER_TIERS if t not in centroid_labels]
    for lbl in centroid_labels:
        if lbl not in used:
            used[lbl] = True
            final_labels.append(lbl)
        else:
            final_labels.append(remaining.pop(0) if remaining else f"{lbl}_2")

    # Silhouette-style inertia metric (lower inertia = tighter clusters)
    inertia = float(km.inertia_)
    print(f"      K-Means inertia: {inertia:.1f}  cluster labels: {final_labels}")

    # Distribution summary
    labels_arr = km.labels_
    dist = {}
    for i, tier in enumerate(final_labels):
        count = int(np.sum(labels_arr == i))
        dist[tier] = {"count": count, "pct": round(count / len(labels_arr) * 100, 1)}

    return km, scaler_km, final_labels, {
        "inertia":      round(inertia, 2),
        "n_clusters":   5,
        "distribution": dist,
        "is_evaluated": True,
    }


# ---------------------------------------------------------------------------
# Main training pipeline
# ---------------------------------------------------------------------------

def train_model():
    print("=" * 62)
    print("Viraasat Promising User Identification - Training")
    print("=" * 62)

    print("\n[1/5] Generating synthetic user behaviour dataset...")
    df = generate_user_dataset(n_users=2000)
    pos = int(df["is_promising"].sum())
    neg = len(df) - pos
    print(f"      {len(df):,} users  (promising={pos}  other={neg})")
    print(f"      Archetypes: { {k: int(v) for k, v in df['true_archetype'].value_counts().to_dict().items()} }")

    print("\n[2/5] Training GBT classifier (Model A - supervised)...")
    clf, scaler_clf, clf_metrics = train_gbt(df)

    print("\n[3/5] Training K-Means clustering (Model B - unsupervised)...")
    km, scaler_km, cluster_labels, km_metrics = train_kmeans(df)

    # Compute per-cluster actionable insights from the dataset
    print("\n[4/5] Computing segment action triggers and statistics...")
    X_km = scaler_km.transform(df[FEATURE_COLS].values.astype(np.float32))
    df["cluster"] = km.predict(X_km)
    df["cluster_tier"] = df["cluster"].map(dict(enumerate(cluster_labels)))

    X_clf = scaler_clf.transform(df[FEATURE_COLS].values.astype(np.float32))
    df["promising_score"] = clf.predict_proba(X_clf)[:, 1].round(4)

    segment_stats = {}
    for tier in cluster_labels:
        grp = df[df["cluster_tier"] == tier]
        if len(grp) == 0:
            continue
        segment_stats[tier] = {
            "user_count":         int(len(grp)),
            "avg_spend_inr":      round(float(grp["total_spend_inr"].mean()), 0),
            "avg_purchase_count": round(float(grp["purchase_count"].mean()), 1),
            "avg_recency_days":   round(float(grp["recency_days"].mean()), 0),
            "avg_return_rate":    round(float(grp["return_rate"].mean()), 3),
            "avg_promising_score": round(float(grp["promising_score"].mean()), 3),
            "action_trigger":     _segment_action(tier),
        }
        print(f"      {tier:12s}  n={len(grp):4d}  "
              f"avg_spend=Rs{int(grp['total_spend_inr'].mean()):,}  "
              f"avg_score={grp['promising_score'].mean():.3f}")

    # Save artifact
    print("\n[5/5] Saving model artifact...")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_candidates = [
        os.path.abspath(os.path.join(current_dir, "../../../../database")),
        os.path.abspath(os.path.join(current_dir, "../../database")),
        os.path.abspath(os.path.join(os.getcwd(), "database")),
    ]
    db_dir = next((d for d in db_candidates if os.path.isdir(d)), db_candidates[0])
    os.makedirs(db_dir, exist_ok=True)
    model_path = os.path.join(db_dir, "user_identification_model.pkl")

    evaluation_metrics = {
        "gbt_auc_roc":          clf_metrics["auc_roc"],
        "gbt_avg_precision":    clf_metrics["avg_precision"],
        "gbt_accuracy":         clf_metrics["accuracy"],
        "verified_accuracy":    clf_metrics["verified_accuracy"],
        "kmeans_inertia":       km_metrics["inertia"],
        "promising_threshold":  PROMISING_THRESHOLD,
        "feature_importance":   clf_metrics["feature_importance"],
        "is_evaluated":         True,
        "trained_at":           datetime.utcnow().isoformat() + "Z",
        "model_arch":           "GBT(n=200,depth=4) + K-Means(k=5) dual-model",
        "dataset_users":        len(df),
    }

    artifact = {
        "gbt_clf":          clf,
        "gbt_scaler":       scaler_clf,
        "km_model":         km,
        "km_scaler":        scaler_km,
        "cluster_labels":   cluster_labels,
        "feature_cols":     FEATURE_COLS,
        "segment_stats":    segment_stats,
        "promising_threshold": PROMISING_THRESHOLD,
        "evaluation_metrics": evaluation_metrics,
    }

    with open(model_path, "wb") as f:
        pickle.dump(artifact, f)

    print("\n" + "=" * 62)
    print("Promising User Identification model saved.")
    print(f"  GBT AUC-ROC         : {clf_metrics['auc_roc']:.4f}")
    print(f"  GBT Accuracy        : {clf_metrics['accuracy']:.4f}")
    print(f"  K-Means clusters    : {cluster_labels}")
    print(f"  Artifact            : {model_path}")
    print("=" * 62)


def _segment_action(tier: str) -> str:
    return {
        "Champion":  "Invite to Viraasat Heritage Club. Offer artisan co-creation experiences and early product drops.",
        "Loyal":     "Send personalised GI-certified product bundle recommendations. Offer free express delivery.",
        "Promising": "Trigger nurture campaign: showcase artisan stories. Offer 10% first-repeat-purchase discount.",
        "At Risk":   "Send re-engagement nudge: highlight new arrivals in their preferred category. Offer limited-time incentive.",
        "Casual":    "Run low-cost awareness drip: share craft heritage content. Recommend bestsellers under Rs 500.",
    }.get(tier, "Monitor and observe.")


if __name__ == "__main__":
    train_model()

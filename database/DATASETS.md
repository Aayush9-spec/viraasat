# Viraasat Platform Datasets

This directory contains open-source and Kaggle-standard mock datasets tailored for the **Viraasat Indian Handicrafts & Heritage Artisan Platform**.

---

## 1. Summary of Available Datasets

| File | Format | Rows / Items | Description & Domain | Origin / License |
|---|---|---|---|---|
| `mock_kaggle_handicrafts.json` / `.csv` | JSON / CSV | 15+ crafts | Traditional Indian handicraft items, GI-tagged artifacts, pricing, raw materials, labor hours, and artisan links. | Kaggle Indian Handicrafts & GI Registry standard (CC BY 4.0) |
| `mock_kaggle_artisans.json` / `.csv` | JSON / CSV | 10 artisans | Master craftspeople profiles across 10 Indian states (Jaipur, Varanasi, Kutch, Bastar, Channapatna, Srinagar, etc.) | Craft Clusters of India & Ministry of Textiles Directory |
| `mock_kaggle_reviews.json` / `.csv` | JSON / CSV | 8+ reviews | E-commerce buyer reviews for handcrafted artifacts with star ratings, helpfulness votes, and sentiment. | Kaggle E-Commerce Handicraft Product Reviews standard |
| `mock_kaggle_craft_market_trends.json` / `.csv` | JSON / CSV | 8 crafts | Search volume index, seasonal demand peaks (Diwali, winter, wedding season), and export trends. | Kaggle India Craft Search Index & Trade Archive |
| `gi_registry.csv` | CSV | 491 records | Official Geographical Indications Registry of India (2004–2023 snapshot). | Intellectual Property India via JusticeHub (CC BY 4.0) |
| `users.json` | JSON | 12 users | Development & API users seed file (artisans, collectors, buyers, admins). | Platform synthetic seed |
| `knowledge_graph.json` | JSON | 100+ nodes/edges | Indian crafts, regional states, raw materials, and GI tag relationships. | Auto-generated from GI Registry |

---

## 2. Dataset Schemas

### A. Indian Handicrafts Dataset (`mock_kaggle_handicrafts.csv` / `.json`)

- `id`: Unique product identifier (e.g. `prod-1`, `prod-12`)
- `name`: Handcrafted artifact title
- `category`: Marketplace craft category (`Home Decor`, `Textiles`, `Kitchenware`, `Accessories`, etc.)
- `region`: State of origin in India (e.g. `Rajasthan`, `Uttar Pradesh`, `Kashmir`, `Karnataka`)
- `craft_type`: Specific Indian heritage craft technique (e.g. `Jaipur Blue Pottery`, `Channapatna Toys & Dolls`, `Bastar Dhokra`)
- `price`: Fair artisan retail price in INR (₹)
- `currency`: Currency code (`INR`)
- `stock`: Current available artisan inventory count
- `material`: Indigenous raw materials used (e.g. `Terracotta & Natural Clay`, `Pure Chandi / Silver Alloy`, `Changthangi Cashmere Wool`)
- `labor_hours`: Approximate human crafting time in hours
- `size_sqft`: Physical surface area / scale in square feet
- `gi_tag_certified`: Boolean indicator if the product craft holds an official Geographical Indication
- `artisanId`: Unique ID referencing the master artisan creator in `mock_kaggle_artisans` / `users.json`
- `artisanName`: Name of the master artisan
- `description`: Complete craft narrative highlighting hand techniques
- `tagline`: One-line provenance statement
- `images`: Pipe-separated list of high-resolution curated craft imagery
- `features`: Pipe-separated key product highlights
- `styleTags`: Aesthetic tags (e.g. `Heritage`, `Bohemian`, `Eco-friendly`)
- `useCases`: Practical and decorative applications
- `rating`: Customer satisfaction score (1.0 to 5.0)
- `reviewCount`: Total buyer reviews count

### B. Artisans Directory (`mock_kaggle_artisans.csv` / `.json`)

- `id`: Artisan identifier (e.g. `artisan-1`)
- `name`: Full name of master craftsperson
- `shopName`: Artisan guild / workshop title
- `craft`: Primary heritage art form
- `experienceYears`: Decades / years of family tradition practice
- `award`: Honors (e.g. *Shilp Guru*, *National Handicrafts Award*, *State Fellowship*)
- `bio`: Concise professional craft biography
- `story`: In-depth cultural heritage and personal journey
- `location`: District and city
- `state`: Indian state
- `contactEmail` & `phone`: Contact channel for platform coordination
- `socialLinks`: Social media channels (Instagram, Facebook)

### C. Handicraft Reviews Dataset (`mock_kaggle_reviews.csv` / `.json`)

- `id`: Unique review record ID (`rev-1`, `rev-2`, etc.)
- `product_id`: Associated craft product ID
- `reviewer_id`: Reviewer user ID
- `reviewer_name`: Name of customer
- `reviewer_avatar`: Avatar image link
- `rating`: Star rating integer (1 to 5)
- `verified_purchase`: Verified transaction badge
- `sentiment`: Sentiment classification (`positive`, `neutral`, `negative`)
- `comment`: Customer review text evaluating texture, packaging, and craft authenticity
- `helpful_votes`: Community upvotes
- `created_at`: ISO timestamp

### D. Craft Market Trends (`mock_kaggle_craft_market_trends.csv` / `.json`)

- `craft_name`: Craft title
- `category`: Craft sector
- `state`: Primary producing state
- `peak_season`: Peak consumer and festive purchasing window
- `search_index_annual`: Normalized consumer interest index (0–100)
- `export_growth_pct`: Year-over-year global export demand growth rate
- `artisan_cluster`: Key production clusters & villages
- `raw_materials`: Primary input supplies

---

## 3. How to Regenerate or Expand

To regenerate all mock datasets from the generator script:

```bash
python3 database/scripts/generate_kaggle_mock_dataset.py
```

The script will validate, format, and generate both JSON and CSV versions simultaneously.

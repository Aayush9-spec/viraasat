# AI Pipelines and LLM Orchestration

This document details the multi-agent AI features and vision classifiers driving the Viraasat platform.

---

## 🤖 Multi-Agent Chat Coordinator

The floating assistant uses **Google Genkit** to manage specialized sub-agents:

*   **Buyer Agent**: Analyzes catalog JSON to recommend products matching user preferences and budgets.
*   **Cultural Research Agent**: Explains GI tags, regional craft histories, and natural raw materials.
*   **Inventory Agent**: Evaluates stock logistics and estimated shipping intervals.

---

## 🔍 Retrieval-Augmented Generation (RAG)

*   **Document Store**: Built from GI registry extracts inside `backend/data/documents.json`.
*   **Semantic Matching**: Matches queries using keyword overlaps and vector hash representations.
*   **Prompt Injector**: Maps retrieved context directly into the Genkit prompt context prior to model generation.

---

## 👁️ Computer Vision Classifier

*   **Model**: Vision Transformer (ViT) wrapper.
*   **Input**: Base64 encoded image strings from artisan uploads.
*   **Output**: Product categories, suggested listing titles, origin regions, and raw material classifications.

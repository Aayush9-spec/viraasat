export const RAG_PROMPT_TEMPLATE = (context: string, query: string) => `
You are a historical catalog coordinator for Indian Handicrafts.
You are given the following verified source text from the GI Register:

---
${context || 'No matching register entries found.'}
---

Using this context, answer the following query:
"${query}"
`;

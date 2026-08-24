import fs from 'fs';
import path from 'path';

export class HeritageRetriever {
  static retrieveMatchedContext(query: string): string {
    try {
      const docsPath = fs.existsSync(path.join(process.cwd(), 'database/documents.json'))
        ? path.join(process.cwd(), 'database/documents.json')
        : path.join(process.cwd(), '../database/documents.json');
      if (fs.existsSync(docsPath)) {
        const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        const queryWords = query.toLowerCase().split(/\s+/);
        const matchedDocs = docs.filter((d: any) => 
          queryWords.some(word => word.length > 3 && (d.text.toLowerCase().includes(word) || d.title.toLowerCase().includes(word)))
        );
        if (matchedDocs.length > 0) {
          return matchedDocs.map((d: any) => `[Source: ${d.title}]\n${d.text}`).join('\n\n');
        }
      }
    } catch (e) {
      console.warn("RAG retriever: using default memory database.");
    }
    return '';
  }
}

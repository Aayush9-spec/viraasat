import { toCategorySlug, slugToCategory, listCategorySlugs, formatCategoryName } from '@/lib/categories';
import { journalArticles, findArticle } from '@/features/journal/articles';

describe('category slugs', () => {
  it('slugifies display names into URL-safe kebab-case', () => {
    expect(toCategorySlug('Home Decor')).toBe('home-decor');
    expect(toCategorySlug('Textiles')).toBe('textiles');
    expect(toCategorySlug('Home & Living')).toBe('home-living');
  });

  it('round-trips slugs back to the known category', () => {
    const categories = ['Home Decor', 'Textiles', 'Kitchenware', 'Accessories'];
    expect(slugToCategory('home-decor', categories)).toBe('Home Decor');
    expect(slugToCategory('handwoven-baskets', categories)).toBeUndefined();
  });

  it('returns sorted unique slugs', () => {
    expect(listCategorySlugs(['Textiles', 'Home Decor'])).toEqual(['home-decor', 'textiles']);
  });

  it('humanizes unknown slugs for display', () => {
    expect(formatCategoryName('blue-pottery')).toBe('Blue Pottery');
  });
});

describe('heritage journal', () => {
  it('has unique slugs and a non-empty body for every article', () => {
    const slugs = journalArticles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const article of journalArticles) {
      expect(article.body.length).toBeGreaterThan(100);
      expect(article.title.length).toBeGreaterThan(0);
    }
  });

  it('looks up articles by slug and misses unknown slugs', () => {
    expect(findArticle(journalArticles[0].slug)?.title).toBe(journalArticles[0].title);
    expect(findArticle('does-not-exist')).toBeUndefined();
  });
});
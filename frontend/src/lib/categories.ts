export const toCategorySlug = (category: string) =>
  category.toLowerCase().replace(/[\s&]+/g, '-');

export const slugToCategory = (slug: string, knownCategories: string[]) =>
  knownCategories.find((category) => toCategorySlug(category) === slug);

export const listCategorySlugs = (knownCategories: string[]) =>
  knownCategories.sort().map(toCategorySlug);

export const formatCategoryName = (slug: string) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
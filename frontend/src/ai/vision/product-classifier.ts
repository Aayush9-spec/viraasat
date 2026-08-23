export class ProductClassifier {
  static classifyCraft(labels: string[]): { category: string; region: string } {
    const text = labels.join(' ').toLowerCase();
    let category = 'Home Decor';
    let region = 'Rajasthan';

    if (text.includes('textile') || text.includes('wool') || text.includes('cotton')) {
      category = 'Textiles';
      region = text.includes('kashmir') ? 'Kashmir' : 'Gujarat';
    } else if (text.includes('ring') || text.includes('silver') || text.includes('jewelry')) {
      category = 'Jewelry';
      region = 'Varanasi';
    } else if (text.includes('pot') || text.includes('mug') || text.includes('vase')) {
      category = 'Home Decor';
      region = 'Rajasthan';
    }

    return { category, region };
  }
}

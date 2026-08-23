export class SalesAnalytics {
  static getCarbonOffset(salesCount: number): number {
    return salesCount * 4.2; // 4.2kg carbon offset per artisan product purchase
  }

  static getCommunityInvestment(totalRevenue: number): number {
    return totalRevenue * 0.15; // 15% direct community development fund
  }
}

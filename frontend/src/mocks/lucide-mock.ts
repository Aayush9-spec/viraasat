import React from 'react';

function svgIcon(testId: string) {
  return function Icon(props: Record<string, unknown>) {
    return React.createElement('svg', { 'data-testid': testId, ...props });
  };
}

export const Heart = svgIcon('heart-icon');
export const ShoppingCart = svgIcon('cart-icon');

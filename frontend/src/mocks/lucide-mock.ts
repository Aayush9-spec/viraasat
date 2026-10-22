import React from "react";

function svgIcon(testId: string) {
  const IconComponent = (props: Record<string, unknown>) => {
    return React.createElement("svg", { "data-testid": testId, ...props });
  };
  IconComponent.displayName = testId;
  return IconComponent;
}

export const Heart = svgIcon("heart-icon");
export const ShoppingCart = svgIcon("cart-icon");

const icons: Record<string, any> = {
  Heart,
  ShoppingCart,
  default: {},
  __esModule: true,
};

const proxyHandler = {
  get(target: any, prop: string) {
    if (prop === "__esModule") return true;
    if (prop === "default") return target;
    if (!(prop in target)) {
      target[prop] = svgIcon(`${String(prop).toLowerCase()}-icon`);
    }
    return target[prop];
  },
};

const proxyExport = new Proxy(icons, proxyHandler);
module.exports = proxyExport;
export default proxyExport;

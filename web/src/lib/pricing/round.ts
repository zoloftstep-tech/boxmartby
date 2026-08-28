/** Round blank area to 2 decimals before price calculation (formula v2). */
export function roundAreaForPrice(area: number): number {
  return Math.round(area * 100) / 100;
}

/** Round unit/total price to 2 decimals. */
export function roundPrice(amount: number): number {
  return Math.round(amount * 100) / 100;
}

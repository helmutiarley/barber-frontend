export type BasketLine = { productId: string; quantity: number | string };

export type ShelfProduct = { id: string; name: string; stockQuantity: number };

/** A blank or fractional entry counts as nothing, so subtotals stay honest while typing. */
export function lineQuantity(line: BasketLine): number {
  const parsed = Number(line.quantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

/**
 * What stops the counter from sending a basket the API will refuse: a product
 * listed twice is a 400, and more units than the shelf holds is a 409 — the
 * second one after the customer has already been told a total.
 */
export function basketProblems(lines: BasketLine[], products: ShelfProduct[]): string[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const line of lines) {
    if (!line.productId) continue;
    if (seen.has(line.productId)) repeated.add(line.productId);
    seen.add(line.productId);
  }

  const problems: string[] = [];
  const reported = new Set<string>();

  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product || reported.has(product.id)) continue;

    if (repeated.has(product.id)) {
      reported.add(product.id);
      problems.push(`${product.name} está duas vezes na cesta — some as quantidades.`);
      continue;
    }
    if (lineQuantity(line) > product.stockQuantity) {
      reported.add(product.id);
      problems.push(
        `${product.name}: ${lineQuantity(line)} pedido(s), ${product.stockQuantity} em estoque.`,
      );
    }
  }

  return problems;
}

export function basketTotalCents(
  lines: BasketLine[],
  products: { id: string; priceCents: number }[],
): number {
  const byId = new Map(products.map((product) => [product.id, product]));
  return lines.reduce((sum, line) => {
    const product = byId.get(line.productId);
    return product ? sum + product.priceCents * lineQuantity(line) : sum;
  }, 0);
}

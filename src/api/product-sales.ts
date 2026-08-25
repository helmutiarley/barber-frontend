import { apiRequest, apiRequestPaged } from '@/api/client';
import type {
  PagedResult,
  PaymentMethod,
  ProductSaleDto,
  ProductSaleLineDto,
} from '@/api/types';

export type SellItemInput = {
  productId: string;
  quantity: number;
};

export type SellInput = {
  items: SellItemInput[];
  /** One method for the whole basket — what keeps the void unambiguous. */
  method: PaymentMethod;
  soldByBarberId?: string | null;
  clientId?: string | null;
};

export type ListProductSalesQuery = {
  productId?: string;
  barberId?: string;
  clientId?: string;
  from?: string;
  to?: string;
  voided?: boolean;
  limit?: number;
  offset?: number;
};

export function sellProducts(body: SellInput): Promise<ProductSaleDto> {
  return apiRequest<ProductSaleDto>('/product-sales', {
    method: 'POST',
    body: {
      items: body.items,
      method: body.method,
      ...(body.soldByBarberId ? { soldByBarberId: body.soldByBarberId } : {}),
      ...(body.clientId ? { clientId: body.clientId } : {}),
    },
  });
}

/** Lists lines, not baskets: several rows can share one `paymentId`. */
export function listProductSales(
  query: ListProductSalesQuery = {},
): Promise<PagedResult<ProductSaleLineDto>> {
  const params = new URLSearchParams();
  if (query.productId) params.set('productId', query.productId);
  if (query.barberId) params.set('barberId', query.barberId);
  if (query.clientId) params.set('clientId', query.clientId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.voided !== undefined) params.set('voided', String(query.voided));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<ProductSaleLineDto>(`/product-sales${qs ? `?${qs}` : ''}`);
}

/** Any line id answers with every line of its basket. */
export function getProductSale(id: string): Promise<ProductSaleLineDto[]> {
  return apiRequest<ProductSaleLineDto[]>(`/product-sales/${id}`);
}

/** Same-day, ADMIN, whole basket: restocks, voids the payment, zeroes commissions. */
export function voidProductSale(id: string, reason?: string): Promise<ProductSaleLineDto[]> {
  return apiRequest<ProductSaleLineDto[]>(`/product-sales/${id}/void`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
}

/** What the basket was rung up for, from its snapshotted line totals. */
export function saleTotalCents(lines: ProductSaleLineDto[]): number {
  return lines.reduce((sum, line) => sum + line.totalCents, 0);
}

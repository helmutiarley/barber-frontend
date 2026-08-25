import { apiRequest, apiRequestPaged } from '@/api/client';
import type {
  PagedResult,
  ProductDto,
  StockAdjustmentDto,
  StockAdjustmentReason,
} from '@/api/types';

export type CreateProductInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  costCents?: number | null;
  /** An opening count, which the API records as a `purchase` adjustment. */
  stockQuantity?: number;
  lowStockThreshold?: number;
};

/** `stockQuantity` is absent on purpose: stock only moves through an adjustment or a sale. */
export type UpdateProductInput = {
  name?: string;
  description?: string | null;
  priceCents?: number;
  costCents?: number | null;
  lowStockThreshold?: number;
};

export type AdjustStockInput = {
  /** Signed, never zero. */
  delta: number;
  reason: StockAdjustmentReason;
  notes?: string | null;
};

export type ListProductsQuery = {
  lowStock?: boolean;
  includeInactive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export function createProduct(body: CreateProductInput): Promise<ProductDto> {
  return apiRequest<ProductDto>('/products', {
    method: 'POST',
    body: {
      name: body.name,
      priceCents: body.priceCents,
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.costCents !== undefined ? { costCents: body.costCents } : {}),
      ...(body.stockQuantity !== undefined ? { stockQuantity: body.stockQuantity } : {}),
      ...(body.lowStockThreshold !== undefined
        ? { lowStockThreshold: body.lowStockThreshold }
        : {}),
    },
  });
}

export function listProducts(query: ListProductsQuery = {}): Promise<PagedResult<ProductDto>> {
  const params = new URLSearchParams();
  if (query.lowStock) params.set('lowStock', 'true');
  if (query.includeInactive) params.set('includeInactive', 'true');
  if (query.search) params.set('search', query.search);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<ProductDto>(`/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id: string): Promise<ProductDto> {
  return apiRequest<ProductDto>(`/products/${id}`);
}

export function updateProduct(id: string, body: UpdateProductInput): Promise<ProductDto> {
  return apiRequest<ProductDto>(`/products/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

/** Soft-deactivates (`active = false`). Adjustments still work on a retired row. */
export function deactivateProduct(id: string): Promise<ProductDto> {
  return apiRequest<ProductDto>(`/products/${id}`, { method: 'DELETE' });
}

export function adjustStock(id: string, body: AdjustStockInput): Promise<StockAdjustmentDto> {
  return apiRequest<StockAdjustmentDto>(`/products/${id}/stock-adjustments`, {
    method: 'POST',
    body: {
      delta: body.delta,
      reason: body.reason,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });
}

export function listStockAdjustments(
  id: string,
  query: { limit?: number; offset?: number } = {},
): Promise<PagedResult<StockAdjustmentDto>> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<StockAdjustmentDto>(
    `/products/${id}/stock-adjustments${qs ? `?${qs}` : ''}`,
  );
}

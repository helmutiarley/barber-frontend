import { apiRequest } from '@/api/client';
import type {
  AverageTicketReportDto,
  BarberSummaryReportDto,
  ClientsReportDto,
  DreReportDto,
  NoShowsReportDto,
  OccupancyReportDto,
  ProductsReportDto,
  RevenueGrouping,
  RevenueReportDto,
  TopServicesReportDto,
} from '@/api/types';

/**
 * Both ends are inclusive shop-local calendar dates, never instants: "July" is a
 * run of shop days, and there is deliberately no `tz` — buckets are cut in the
 * shop's zone, the same one a commission period closes in.
 */
export type ReportRangeQuery = {
  from?: string;
  to?: string;
};

function rangeParams(query: ReportRangeQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ''}`;
}

export function getRevenueReport(
  query: ReportRangeQuery & { groupBy?: RevenueGrouping } = {},
): Promise<RevenueReportDto> {
  const params = rangeParams(query);
  if (query.groupBy) params.set('groupBy', query.groupBy);
  return apiRequest<RevenueReportDto>(withQuery('/reports/revenue', params));
}

export function getAverageTicketReport(
  query: ReportRangeQuery = {},
): Promise<AverageTicketReportDto> {
  return apiRequest<AverageTicketReportDto>(
    withQuery('/reports/average-ticket', rangeParams(query)),
  );
}

export function getTopServicesReport(
  query: ReportRangeQuery & { limit?: number } = {},
): Promise<TopServicesReportDto> {
  const params = rangeParams(query);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  return apiRequest<TopServicesReportDto>(withQuery('/reports/top-services', params));
}

export function getProductsReport(query: ReportRangeQuery = {}): Promise<ProductsReportDto> {
  return apiRequest<ProductsReportDto>(withQuery('/reports/products', rangeParams(query)));
}

export function getDreReport(query: ReportRangeQuery = {}): Promise<DreReportDto> {
  return apiRequest<DreReportDto>(withQuery('/reports/dre', rangeParams(query)));
}

export function getOccupancyReport(query: ReportRangeQuery = {}): Promise<OccupancyReportDto> {
  return apiRequest<OccupancyReportDto>(withQuery('/reports/occupancy', rangeParams(query)));
}

export function getNoShowsReport(query: ReportRangeQuery = {}): Promise<NoShowsReportDto> {
  return apiRequest<NoShowsReportDto>(withQuery('/reports/no-shows', rangeParams(query)));
}

export function getClientsReport(query: ReportRangeQuery = {}): Promise<ClientsReportDto> {
  return apiRequest<ClientsReportDto>(withQuery('/reports/clients', rangeParams(query)));
}

/** A barber may only read their own; the API answers 403 for anyone else's. */
export function getBarberSummary(
  barberId: string,
  query: ReportRangeQuery = {},
): Promise<BarberSummaryReportDto> {
  return apiRequest<BarberSummaryReportDto>(
    withQuery(`/reports/barbers/${barberId}/summary`, rangeParams(query)),
  );
}

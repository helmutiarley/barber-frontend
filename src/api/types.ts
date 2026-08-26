import type { UserRole } from '@/lib/roles';

export interface UserDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface SessionDto {
  id: string;
  status: 'open' | 'closed';
  openedBy: string;
  openedAt: string;
  openingBalanceCents: number;
  closedBy: string | null;
  closedAt: string | null;
  expectedBalanceCents: number | null;
  countedBalanceCents: number | null;
  differenceCents: number | null;
  notes: string | null;
}

export interface CurrentSessionDto {
  session: SessionDto;
  totals: {
    inCents: number;
    outCents: number;
    expectedBalanceCents: number;
  };
}

export type CashMovementType = 'in' | 'out';

export type CashMovementSource =
  | 'payment'
  | 'expense'
  | 'withdrawal'
  | 'deposit'
  | 'advance'
  | 'payout'
  | 'adjustment';

export type ManualCashMovementSource = 'withdrawal' | 'deposit' | 'adjustment';

export interface CashMovementDto {
  id: string;
  sessionId: string;
  type: CashMovementType;
  source: CashMovementSource;
  amountCents: number;
  paymentId: string | null;
  expenseId: string | null;
  advanceId: string | null;
  periodId: string | null;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

export interface SessionDetailDto {
  session: SessionDto;
  movements: CashMovementDto[];
}

/** Staff-facing barber profile (create / patch / soft-delete responses). */
export interface BarberDto {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string | null;
  specialties: string[];
  active: boolean;
  createdAt: string;
}

/** Public list/detail — active-only on list; no userId or active flag. */
export interface PublicBarberDto {
  id: string;
  displayName: string;
  photoUrl: string | null;
  specialties: string[];
}

/** Weekday 0 = Sunday … 6 = Saturday. Times are shop-local `HH:MM:SS`. */
export interface ScheduleDayDto {
  weekday: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface BlockDto {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface AvailabilityDto {
  barberId: string;
  date: string;
  timezone: string;
  free: { startsAt: string; endsAt: string }[];
  slots?: string[];
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  /** Integer cents at the API edge. */
  priceCents: number;
  durationMinutes: number;
  active: boolean;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit';

export interface AppointmentDto {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  durationMinutes: number;
  notes: string | null;
  cancelledReason: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PagedResult<T> {
  data: T[];
  meta: PageMeta;
}

export interface ClientListItemDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  birthday: string | null;
  preferences: string | null;
  internalNotes: string | null;
}

export interface ClientStatsDto {
  visits: number;
  lastVisitAt: string | null;
  /** Completed appointment price snapshots (cents); becomes net paid after payments. */
  averageTicketCents: number | null;
  noShows: number;
}

/** ADMIN / MANAGER detail — contact + notes + stats. */
export interface StaffClientDto extends ClientListItemDto {
  stats: ClientStatsDto;
}

/** BARBER detail — no contact dump, no internal notes. */
export interface BarberClientDto {
  id: string;
  name: string;
  birthday: string | null;
  preferences: string | null;
  stats: ClientStatsDto;
}

/** CLIENT self — no internal notes, no stats. */
export interface SelfClientDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  preferences: string | null;
}

export type ClientDetailDto = StaffClientDto | BarberClientDto | SelfClientDto;

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'products'
  | 'salaries'
  | 'maintenance'
  | 'other';

export type ExpenseKind = 'fixed' | 'variable';

export interface ExpenseDto {
  id: string;
  description: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amountCents: number;
  /** Calendar date `YYYY-MM-DD`; no timezone ever touches it. */
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  recurring: boolean;
  /** Derived server-side from the shop-local today — never stored. */
  overdue: boolean;
  createdBy: string;
  createdAt: string;
}

export interface PaymentDto {
  id: string;
  appointmentId: string | null;
  amountCents: number;
  method: PaymentMethod;
  cardFeeCents: number;
  netAmountCents: number;
  cashRegisterSessionId: string | null;
  receivedBy: string;
  paidAt: string;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  costCents: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  /** Derived on every read from the row's own threshold — never a column. */
  lowStock: boolean;
  active: boolean;
}

/** `sale` is absent on purpose: a sale writes its own row, not an adjustment. */
export type StockAdjustmentReason = 'purchase' | 'loss' | 'correction';

export interface StockAdjustmentDto {
  id: string;
  productId: string;
  /** Signed and never zero. */
  delta: number;
  reason: StockAdjustmentReason;
  /** Snapshot of the shelf once this applied; sales move stock without a row here. */
  resultingQuantity: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ProductSaleLineDto {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  /** Null is a house sale: the shop earns it, nobody is credited. */
  soldByBarberId: string | null;
  clientId: string | null;
  /** The lines of one basket share this, which makes it the sale's identity. */
  paymentId: string;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdBy: string;
  createdAt: string;
}

/** What one trip to the counter produced. Only `POST /product-sales` returns it. */
export interface ProductSaleDto {
  lines: ProductSaleLineDto[];
  paymentId: string;
  totalCents: number;
  cardFeeCents: number;
  netTotalCents: number;
  method: PaymentMethod;
  /** Empty for a house sale, or when the seller has no `products` rule. */
  commissionEntryIds: string[];
}

/** What the rate multiplies: the appointment price, or what landed after card fees. */
export type CommissionBase = 'gross' | 'net';

export type CommissionAppliesTo = 'services' | 'products';

/** There is no `open`: a period exists only once it is closed. */
export type CommissionPeriodStatus = 'closed' | 'paid';

export interface CommissionRuleDto {
  id: string;
  /** Null is the wildcard: every barber, or every service. */
  barberId: string | null;
  serviceId: string | null;
  /** A fraction, not a percentage: `0.4` is 40%. */
  rate: number;
  base: CommissionBase;
  appliesTo: CommissionAppliesTo;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionEntryDto {
  id: string;
  barberId: string;
  /** Exactly one of these two names what the entry was earned on. */
  appointmentId: string | null;
  productSaleId: string | null;
  ruleId: string;
  rate: number;
  base: CommissionBase;
  baseAmountCents: number;
  amountCents: number;
  /** Null while unsettled; set to the period that closed over it. */
  periodId: string | null;
  createdAt: string;
}

export interface CommissionAdvanceDto {
  id: string;
  barberId: string;
  amountCents: number;
  periodId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CommissionPeriodDto {
  id: string;
  barberId: string;
  startsOn: string;
  endsOn: string;
  status: CommissionPeriodStatus;
  totalEntriesCents: number;
  totalAdvancesCents: number;
  /** Entries minus advances. Negative when the barber drew more than they earned. */
  totalDueCents: number;
  closedBy: string;
  closedAt: string;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
}

/** A period with the rows its totals were snapshotted from. */
export interface CommissionStatementDto {
  period: CommissionPeriodDto;
  entries: CommissionEntryDto[];
  advances: CommissionAdvanceDto[];
}

export type RevenueGrouping = 'day' | 'week' | 'month' | 'barber' | 'service' | 'method';

/** Every report echoes the range it ran over, since both ends may be defaults. */
export interface ReportRange {
  from: string;
  to: string;
}

export interface RevenueBucketDto {
  /** Null is unattributable: a house sale grouped by barber, a product grouped by service. */
  key: string | null;
  /** A display name for `barber` and `service`; null where the key says it all. */
  label: string | null;
  grossCents: number;
  netCents: number;
  cardFeeCents: number;
  payments: number;
}

export interface RevenueReportDto extends ReportRange {
  groupBy: RevenueGrouping;
  totals: {
    grossCents: number;
    netCents: number;
    cardFeeCents: number;
    serviceGrossCents: number;
    productGrossCents: number;
    payments: number;
  };
  buckets: RevenueBucketDto[];
}

export interface BarberTicketDto {
  barberId: string;
  barberName: string;
  grossCents: number;
  appointments: number;
  /** Null when a barber took money in the range without completing a cut in it. */
  averageTicketCents: number | null;
}

export interface AverageTicketReportDto extends ReportRange {
  overall: {
    grossCents: number;
    appointments: number;
    averageTicketCents: number | null;
  };
  barbers: BarberTicketDto[];
}

export interface TopServiceDto {
  serviceId: string;
  serviceName: string;
  appointments: number;
  grossCents: number;
}

export interface TopServicesReportDto extends ReportRange {
  services: TopServiceDto[];
}

export interface ProductLineDto {
  productId: string;
  productName: string;
  units: number;
  revenueCents: number;
  /** The product's cost *today* — the sale never snapshotted one. */
  costCents: number | null;
  /** Null when the product has no recorded cost: a margin nobody can compute. */
  marginCents: number | null;
}

export interface LowStockRowDto {
  productId: string;
  productName: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface ProductsReportDto extends ReportRange {
  totals: {
    units: number;
    revenueCents: number;
    /** Covers only the products whose cost is known. */
    marginCents: number;
    productsWithoutCost: number;
  };
  products: ProductLineDto[];
  lowStock: LowStockRowDto[];
}

export interface ExpenseCategoryRowDto {
  category: ExpenseCategory;
  amountCents: number;
}

export interface DreReportDto extends ReportRange {
  revenue: {
    grossCents: number;
    serviceGrossCents: number;
    productGrossCents: number;
    cardFeeCents: number;
    /** Gross minus card fees: what actually reached the shop. */
    netCents: number;
  };
  expenses: {
    totalCents: number;
    byCategory: ExpenseCategoryRowDto[];
  };
  commissionsCents: number;
  /** `netCents − expenses − commissions`. Negative is a loss, reported as one. */
  resultCents: number;
}

export interface OccupancyBarberDto {
  barberId: string;
  barberName: string;
  bookedMinutes: number;
  scheduledMinutes: number;
  /** A fraction in `[0, 1]`; null when the barber had no scheduled minutes. */
  occupancyRate: number | null;
}

export interface OccupancyReportDto extends ReportRange {
  overall: {
    bookedMinutes: number;
    scheduledMinutes: number;
    occupancyRate: number | null;
  };
  barbers: OccupancyBarberDto[];
}

export interface NoShowBarberDto {
  barberId: string;
  barberName: string;
  completed: number;
  noShows: number;
  cancelled: number;
  total: number;
  noShowRate: number | null;
  cancellationRate: number | null;
}

export interface NoShowsReportDto extends ReportRange {
  overall: {
    completed: number;
    noShows: number;
    cancelled: number;
    total: number;
    noShowRate: number | null;
    cancellationRate: number | null;
  };
  barbers: NoShowBarberDto[];
}

export interface ClientsReportDto extends ReportRange {
  newClients: number;
  recurringClients: number;
  /** Clients with no completed appointment at or after `from`. */
  inactiveClients: number;
}

export interface BarberSummaryReportDto extends ReportRange {
  barberId: string;
  barberName: string;
  cuts: number;
  /** Service + product takings attributed to this barber, by `paidAt`. */
  revenueCents: number;
  commissionCents: number;
  noShows: number;
  cancelled: number;
  appointments: number;
  noShowRate: number | null;
  averageTicketCents: number | null;
}

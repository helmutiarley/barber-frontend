import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { installGuards } from '@/app/guards';
import type { UserRole } from '@/lib/roles';

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    guest?: boolean;
    roles?: UserRole[];
    /** Accessible without auth and without guest redirect (404). */
    public?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { title: 'Entrar', guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { title: 'Criar conta', guest: true },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomeRedirectPage.vue'),
    meta: { title: 'Início' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
    meta: { title: 'Acesso negado' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { title: 'Perfil', roles: ['ADMIN', 'MANAGER', 'BARBER', 'CLIENT'] },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/pages/users/UsersListPage.vue'),
    meta: { title: 'Usuários', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/users/new',
    name: 'users-new',
    component: () => import('@/pages/users/UsersCreatePage.vue'),
    meta: { title: 'Novo usuário', roles: ['ADMIN'] },
  },
  {
    path: '/users/:id',
    name: 'users-edit',
    component: () => import('@/pages/users/UsersEditPage.vue'),
    meta: { title: 'Editar usuário', roles: ['ADMIN'] },
  },
  {
    path: '/barbers',
    name: 'barbers',
    component: () => import('@/pages/barbers/BarbersListPage.vue'),
    meta: { title: 'Barbeiros', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/barbers/new',
    name: 'barbers-new',
    component: () => import('@/pages/barbers/BarbersCreatePage.vue'),
    meta: { title: 'Novo barbeiro', roles: ['ADMIN'] },
  },
  {
    path: '/barbers/:id',
    name: 'barbers-detail',
    component: () => import('@/pages/barbers/BarbersDetailPage.vue'),
    meta: { title: 'Barbeiro', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/barbers/:id/schedule',
    name: 'barbers-schedule',
    component: () => import('@/pages/barbers/BarbersSchedulePage.vue'),
    meta: { title: 'Horário', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/barbers/:id/blocks',
    name: 'barbers-blocks',
    component: () => import('@/pages/barbers/BarbersBlocksPage.vue'),
    meta: { title: 'Bloqueios', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('@/pages/services/ServicesListPage.vue'),
    meta: { title: 'Serviços', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/services/new',
    name: 'services-new',
    component: () => import('@/pages/services/ServicesCreatePage.vue'),
    meta: { title: 'Novo serviço', roles: ['ADMIN'] },
  },
  {
    path: '/services/:id',
    name: 'services-edit',
    component: () => import('@/pages/services/ServicesEditPage.vue'),
    meta: { title: 'Editar serviço', roles: ['ADMIN'] },
  },
  {
    path: '/agenda',
    name: 'agenda',
    component: () => import('@/pages/appointments/AgendaPage.vue'),
    meta: { title: 'Agenda', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('@/pages/appointments/AppointmentsListPage.vue'),
    meta: { title: 'Agendamentos', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/appointments/new',
    name: 'appointments-new',
    component: () => import('@/pages/appointments/AppointmentBookPage.vue'),
    meta: { title: 'Novo horário', roles: ['ADMIN', 'MANAGER', 'CLIENT'] },
  },
  {
    path: '/appointments/:id/pay',
    name: 'appointments-pay',
    component: () => import('@/pages/appointments/AppointmentPayPage.vue'),
    meta: { title: 'Receber', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/appointments/:id',
    name: 'appointments-detail',
    component: () => import('@/pages/appointments/AppointmentDetailPage.vue'),
    meta: {
      title: 'Horário',
      roles: ['ADMIN', 'MANAGER', 'BARBER', 'CLIENT'],
    },
  },
  {
    path: '/clients',
    name: 'clients',
    component: () => import('@/pages/clients/ClientsListPage.vue'),
    meta: { title: 'Clientes', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/clients/:id/edit',
    name: 'clients-edit',
    component: () => import('@/pages/clients/ClientsEditPage.vue'),
    meta: { title: 'Editar cliente', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/clients/:id',
    name: 'clients-detail',
    component: () => import('@/pages/clients/ClientsDetailPage.vue'),
    meta: { title: 'Cliente', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/cash-register',
    name: 'cash-register',
    component: () => import('@/pages/cash-register/CashRegisterPage.vue'),
    meta: { title: 'Caixa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/cash-register/open',
    name: 'cash-register-open',
    component: () => import('@/pages/cash-register/CashRegisterOpenPage.vue'),
    meta: { title: 'Abrir caixa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/cash-register/close',
    name: 'cash-register-close',
    component: () => import('@/pages/cash-register/CashRegisterClosePage.vue'),
    meta: { title: 'Fechar caixa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/cash-register/sessions',
    name: 'cash-register-sessions',
    component: () => import('@/pages/cash-register/CashRegisterSessionsPage.vue'),
    meta: { title: 'Histórico de caixa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/cash-register/sessions/:id',
    name: 'cash-register-session',
    component: () => import('@/pages/cash-register/CashRegisterSessionDetailPage.vue'),
    meta: { title: 'Sessão de caixa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/payments',
    name: 'payments',
    component: () => import('@/pages/payments/PaymentsListPage.vue'),
    meta: { title: 'Pagamentos', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/pages/expenses/ExpensesListPage.vue'),
    meta: { title: 'Despesas', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/expenses/new',
    name: 'expenses-new',
    component: () => import('@/pages/expenses/ExpensesCreatePage.vue'),
    meta: { title: 'Nova despesa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/expenses/:id',
    name: 'expenses-detail',
    component: () => import('@/pages/expenses/ExpensesDetailPage.vue'),
    meta: { title: 'Despesa', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    // A barber reads the shelf because they are the one selling off it, but the
    // catalog is staff-only — unlike services, a client has no reason to browse stock.
    path: '/products',
    name: 'products',
    component: () => import('@/pages/products/ProductsListPage.vue'),
    meta: { title: 'Produtos', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/products/new',
    name: 'products-new',
    component: () => import('@/pages/products/ProductsCreatePage.vue'),
    meta: { title: 'Novo produto', roles: ['ADMIN'] },
  },
  {
    path: '/products/:id',
    name: 'products-detail',
    component: () => import('@/pages/products/ProductsDetailPage.vue'),
    meta: { title: 'Produto', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/products/:id/stock',
    name: 'products-stock',
    component: () => import('@/pages/products/ProductsStockPage.vue'),
    meta: { title: 'Estoque', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/product-sales',
    name: 'product-sales',
    component: () => import('@/pages/products/ProductSalesListPage.vue'),
    meta: { title: 'Vendas', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/product-sales/new',
    name: 'product-sales-new',
    component: () => import('@/pages/products/ProductSalesCheckoutPage.vue'),
    meta: { title: 'Nova venda', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/product-sales/:id',
    name: 'product-sales-detail',
    component: () => import('@/pages/products/ProductSaleDetailPage.vue'),
    meta: { title: 'Venda', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    // The nav points at the module, not a screen; periods is what people come for.
    path: '/commissions',
    redirect: '/commissions/periods',
  },
  {
    path: '/commissions/rules',
    name: 'commission-rules',
    component: () => import('@/pages/commissions/CommissionRulesPage.vue'),
    meta: { title: 'Regras de comissão', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/commissions/entries',
    name: 'commission-entries',
    component: () => import('@/pages/commissions/CommissionEntriesPage.vue'),
    meta: { title: 'Lançamentos', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/commissions/advances',
    name: 'commission-advances',
    component: () => import('@/pages/commissions/CommissionAdvancesPage.vue'),
    meta: { title: 'Adiantamentos', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/commissions/periods',
    name: 'commission-periods',
    component: () => import('@/pages/commissions/CommissionPeriodsPage.vue'),
    meta: { title: 'Períodos', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  // Before `/:id`, or the router would read "close" as a period id.
  {
    path: '/commissions/periods/close',
    name: 'commission-periods-close',
    component: () => import('@/pages/commissions/CommissionPeriodClosePage.vue'),
    meta: { title: 'Fechar período', roles: ['ADMIN'] },
  },
  {
    path: '/commissions/periods/:id/pay',
    name: 'commission-period-pay',
    component: () => import('@/pages/commissions/CommissionPeriodPayPage.vue'),
    meta: { title: 'Pagar período', roles: ['ADMIN'] },
  },
  {
    path: '/commissions/periods/:id',
    name: 'commission-period',
    component: () => import('@/pages/commissions/CommissionPeriodDetailPage.vue'),
    meta: { title: 'Extrato', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/pages/reports/ReportsHubPage.vue'),
    meta: { title: 'Relatórios', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/revenue',
    name: 'reports-revenue',
    component: () => import('@/pages/reports/RevenueReportPage.vue'),
    meta: { title: 'Faturamento', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/occupancy',
    name: 'reports-occupancy',
    component: () => import('@/pages/reports/OccupancyReportPage.vue'),
    meta: { title: 'Ocupação', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/average-ticket',
    name: 'reports-average-ticket',
    component: () => import('@/pages/reports/AverageTicketReportPage.vue'),
    meta: { title: 'Ticket médio', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/no-shows',
    name: 'reports-no-shows',
    component: () => import('@/pages/reports/NoShowsReportPage.vue'),
    meta: { title: 'Faltas', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/top-services',
    name: 'reports-top-services',
    component: () => import('@/pages/reports/TopServicesReportPage.vue'),
    meta: { title: 'Serviços mais vendidos', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/clients',
    name: 'reports-clients',
    component: () => import('@/pages/reports/ClientsReportPage.vue'),
    meta: { title: 'Clientes', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/products',
    name: 'reports-products',
    component: () => import('@/pages/reports/ProductsReportPage.vue'),
    meta: { title: 'Produtos', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    path: '/reports/dre',
    name: 'reports-dre',
    component: () => import('@/pages/reports/DreReportPage.vue'),
    meta: { title: 'DRE', roles: ['ADMIN', 'MANAGER'] },
  },
  {
    // The hub is staff-only, so a barber gets a door of their own: this resolves
    // their id and forwards to their summary.
    path: '/reports/me',
    name: 'reports-me',
    component: () => import('@/pages/reports/MyReportRedirectPage.vue'),
    meta: { title: 'Meus números', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    // A barber is allowed in, and the API refuses an id that is not theirs.
    path: '/reports/barbers/:id',
    name: 'reports-barber',
    component: () => import('@/pages/reports/BarberSummaryReportPage.vue'),
    meta: { title: 'Resumo do barbeiro', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('@/pages/appointments/AppointmentBookPage.vue'),
    meta: { title: 'Agendar', roles: ['CLIENT'] },
    props: { mode: 'client' },
  },
  {
    path: '/me/appointments',
    name: 'me-appointments',
    component: () => import('@/pages/appointments/MyAppointmentsPage.vue'),
    meta: { title: 'Meus horários', roles: ['CLIENT'] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Não encontrado', public: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installGuards(router);

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Barber` : 'Barber';
});

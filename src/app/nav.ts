import type { UserRole } from '@/lib/roles';

export type NavItem = {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
  activePaths?: string[];
};

export type NavSection = {
  id: string;
  /** Rendered as a small group header; omitted for the primary group. */
  label?: string;
  items: NavItem[];
};

const STAFF: UserRole[] = ['ADMIN', 'MANAGER', 'BARBER'];
const MANAGEMENT: UserRole[] = ['ADMIN', 'MANAGER'];
const BARBER: UserRole[] = ['BARBER'];

export const staffNavSections: NavSection[] = [
  {
    id: 'main',
    items: [
      {
        path: '/agenda',
        label: 'Agenda',
        icon: 'ic-calendar-24',
        roles: STAFF,
        activePaths: ['/appointments'],
      },
      { path: '/clients', label: 'Clientes', icon: 'ic-person-24', roles: MANAGEMENT },
    ],
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    items: [
      { path: '/services', label: 'Serviços', icon: 'ic-tag-24', roles: STAFF },
      { path: '/products', label: 'Produtos', icon: 'ic-box-24', roles: STAFF },
      { path: '/barbers', label: 'Barbeiros', icon: 'ic-user-24', roles: MANAGEMENT },
    ],
  },
  {
    id: 'finance',
    label: 'Financeiro',
    items: [
      { path: '/cash-register', label: 'Caixa', icon: 'ic-wallet-24', roles: MANAGEMENT },
      { path: '/product-sales', label: 'Vendas', icon: 'ic-cart-24', roles: MANAGEMENT },
      { path: '/payments', label: 'Pagamentos', icon: 'ic-credit-card-24', roles: MANAGEMENT },
      { path: '/expenses', label: 'Despesas', icon: 'ic-dollar-sign-sack-24', roles: MANAGEMENT },
      { path: '/commissions', label: 'Comissões', icon: 'ic-percent-24', roles: STAFF },
      // The reports hub is management-only, so a barber reaches their own summary here.
      { path: '/reports/me', label: 'Meus números', icon: 'ic-graph-arrow-up-24', roles: BARBER },
    ],
  },
  {
    id: 'management',
    label: 'Gestão',
    items: [
      { path: '/reports', label: 'Relatórios', icon: 'ic-dashboard-24', roles: MANAGEMENT },
      { path: '/users', label: 'Usuários', icon: 'ic-user-circle-24', roles: MANAGEMENT },
    ],
  },
];

/** Pinned under the drawer divider, away from the scrolling section list. */
export const staffBottomNavItems: NavItem[] = [
  { path: '/profile', label: 'Perfil', icon: 'ic-gear-24', roles: STAFF },
];

export const staffNavItems: NavItem[] = staffNavSections.flatMap((section) => section.items);

export const clientNavItems: NavItem[] = [
  { path: '/book', label: 'Agendar', icon: 'ic-calendar-24', roles: ['CLIENT'] },
  {
    path: '/me/appointments',
    label: 'Meus horários',
    icon: 'ic-clock-circle-24',
    roles: ['CLIENT'],
  },
  { path: '/profile', label: 'Perfil', icon: 'ic-user-24', roles: ['CLIENT'] },
];

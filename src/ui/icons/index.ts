export const ICONS: Record<string, string> = {
  'ic-add': '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'ic-arrow-left': '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  'ic-arrow-right-square':
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8.5 12h7"/><path d="M13 9.5l2.5 2.5-2.5 2.5"/>',
  'ic-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11.5v4.5"/><path d="M12 8h.01"/>',
  'ic-warning-circle':
    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.5h.01"/>',
  'ic-close': '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  'ic-menu': '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  'ic-shop':
    '<path d="M4.5 9.5h15V20h-15z"/><path d="M3 9.5L4.6 4.5h14.8L21 9.5"/><path d="M10 20v-5h4v5"/>',
  'ic-bars-bullets-numbers':
    '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/><path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',
  'ic-box':
    '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
  'ic-calendar':
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10h17"/>',
  'ic-cart':
    '<path d="M3 4h2.2l2.4 10.5h9.6L19 7.2H6"/><circle cx="9.5" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>',
  'ic-clock-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
  'ic-credit-card':
    '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M7 14.5h4"/>',
  'ic-dashboard':
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="4" rx="1.5"/><rect x="13" y="10" width="7" height="10" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/>',
  'ic-dollar-sign-sack':
    '<path d="M8.5 3h7l-1.6 3.2H10.1L8.5 3z"/><path d="M10.1 6.2C6.6 8.2 5 12 5.9 16.2 6.6 19.3 8.9 21 12 21s5.4-1.7 6.1-4.8C19 12 17.4 8.2 13.9 6.2"/><path d="M12 10v7.5"/><path d="M14 12.2c0-1-.9-1.7-2-1.7s-2 .7-2 1.7.9 1.6 2 1.6 2 .7 2 1.7-.9 1.7-2 1.7-2-.7-2-1.7"/>',
  'ic-gear':
    '<circle cx="12" cy="12" r="3.2"/><path d="M17.2 12h2.6"/><path d="M15.68 15.68l1.84 1.84"/><path d="M12 17.2v2.6"/><path d="M8.32 15.68L6.48 17.52"/><path d="M6.8 12H4.2"/><path d="M8.32 8.32L6.48 6.48"/><path d="M12 6.8V4.2"/><path d="M15.68 8.32l1.84-1.84"/>',
  'ic-graph-arrow-up':
    '<path d="M4 18l5.5-5.5 3.5 3.5L20 9"/><path d="M15 9h5v5"/>',
  'ic-percent':
    '<path d="M6 18L18 6"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  'ic-person': '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
  'ic-user': '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
  'ic-user-circle':
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.6a6.5 6.5 0 0111.6 0"/>',
  'ic-tag':
    '<path d="M3.5 12.2V4.5a1 1 0 011-1h7.7a1 1 0 01.7.3l7.3 7.3a1 1 0 010 1.4l-7.7 7.7a1 1 0 01-1.4 0L3.8 12.9a1 1 0 01-.3-.7z"/><circle cx="8.5" cy="8.5" r="1.6"/>',
  'ic-wallet':
    '<path d="M20 8.5V7a2 2 0 00-2-2H5.5A2.5 2.5 0 003 7.5v9A2.5 2.5 0 005.5 19H18a2 2 0 002-2v-1.5"/><path d="M21 8.5h-4a3.5 3.5 0 000 7h4v-7z"/><path d="M17.2 12h.01"/>',
};

export function iconMarkup(name: string): string {
  return ICONS[name] ?? ICONS[name.replace(/-\d+$/, '')] ?? '';
}

export const iconNames = Object.keys(ICONS);

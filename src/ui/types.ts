export type BTextVariant =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'body-2'
  | 'body-2-bold'
  | 'body-3'
  | 'body-3-bold'
  | 'button-3';

export type BTextTag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

export type BButtonColor = 'primary' | 'neutral' | 'danger';
export type BButtonVariant = 'contain' | 'outline' | 'text';
export type BButtonSize = 'small' | 'medium';

export type BLabelColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'gray'
  | 'grayLight';

export type BToastSeverity = 'success' | 'failure' | 'warning';

export interface BSelectOption {
  label: string;
  value: string;
}

export interface BTabValue {
  label: string;
  value: string;
  to?: string;
  isActive?: boolean;
}

export interface BSegment {
  id: string;
  label: string;
}

export interface BToastMessage {
  message: string;
  severity?: BToastSeverity;
  timeout?: number;
}

export function resolveColorToken(color?: string): string | undefined {
  if (!color) {
    return undefined;
  }

  return color.startsWith('b-') ? `var(--${color})` : color;
}

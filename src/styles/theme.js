export const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    secondary: '#64748b',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
    background: '#f1f5f9',
    surface: '#ffffff',
    text: '#17212b',
    mutedText: '#64748b',
  },
  spacing: {
    page: {
      mobile: '1rem',
      desktop: '1.5rem',
    },
    panel: {
      mobile: '0.75rem',
      desktop: '1rem',
    },
    gridGap: '1rem',
  },
  radius: {
    control: '0.375rem',
    panel: '0.5rem',
  },
  touch: {
    minTarget: '44px',
  },
};

export const financialStatusColors = {
  pago: theme.colors.success,
  recebido: theme.colors.success,
  aberto: theme.colors.warning,
  vencido: theme.colors.danger,
  atrasado: theme.colors.danger,
};

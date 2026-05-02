export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button type={type} className={`${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}

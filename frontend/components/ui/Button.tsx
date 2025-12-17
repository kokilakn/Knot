import React from 'react';
import styles from './Button.module.css';

/* ==========================================================================
   Button Component
   
   Props:
   - variant: 'primary' | 'secondary' | 'ghost' (default: 'primary')
   - size: 'sm' | 'md' | 'lg' (default: 'md')
   - color: 'accent' | 'ink' | 'paper' (default: 'accent')
   - fullWidth: boolean (default: false)
   - disabled: boolean
   - All standard button HTML attributes
   
   Usage:
   <Button variant="primary" size="lg">Click me</Button>
   <Button variant="secondary" color="ink">Outlined</Button>
   <Button variant="ghost" size="sm">Ghost</Button>
   ========================================================================== */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'accent' | 'ink' | 'paper' | 'logo';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Color theme from design system */
  color?: ButtonColor;
  /** Custom text color override (CSS color value) */
  textColor?: string;
  /** Full width button */
  fullWidth?: boolean;
  /** Button content */
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      color = 'accent',
      textColor,
      fullWidth = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.btn,
      styles[`btn--${variant}`],
      styles[`btn--${size}`],
      styles[`btn--color-${color}`],
      fullWidth && styles['btn--full'],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const customStyle = textColor
      ? { ...style, '--btn-text-color': textColor } as React.CSSProperties
      : style;

    return (
      <button
        ref={ref}
        className={classNames}
        style={customStyle}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* ==========================================================================
   Button with Icon Helper
   ========================================================================== */

export interface ButtonIconProps {
  children: React.ReactNode;
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({ children }) => {
  return <span className={styles.btn__icon}>{children}</span>;
};

export default Button;

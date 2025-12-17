import React from 'react';
import styles from './ActionCard.module.css';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  prominent?: boolean;
  trailingIcon?: React.ReactNode;
  onClick?: () => void;
}

export default function ActionCard({
  icon,
  title,
  description,
  prominent = false,
  trailingIcon,
  onClick
}: ActionCardProps) {
  return (
    <button
      type="button"
      className={prominent ? styles.prominent : styles.card}
      onClick={onClick}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.texts}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {trailingIcon && (
        <span className={styles.trailingIcon}>{trailingIcon}</span>
      )}
    </button>
  );
}

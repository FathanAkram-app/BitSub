import React from 'react';
import { CardProps } from '../../types';

interface CardComponentProps extends CardProps {
  [key: string]: any;
}

export function Card({ children, className = '', ...props }: CardComponentProps): React.ReactElement {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  );
}
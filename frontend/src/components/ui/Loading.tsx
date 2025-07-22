import React from 'react';

interface LoadingProps {
  text?: string;
}

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Loading({ text = "Loading..." }: LoadingProps): React.ReactElement {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <span>{text}</span>
    </div>
  );
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps): React.ReactElement {
  return (
    <div className="error">
      <span>Error: {error}</span>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
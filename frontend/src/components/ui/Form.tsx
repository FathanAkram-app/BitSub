import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { FormFieldProps } from '../../types';

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  icon?: React.ReactNode;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

interface ExtendedFormFieldProps extends FormFieldProps {
  options?: SelectOption[];
  rows?: number;
  icon?: React.ReactNode;
  helpText?: string;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  error,
  options,
  rows = 4,
  icon,
  helpText,
  ...props
}: ExtendedFormFieldProps): React.ReactElement {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const renderInput = () => {
    if (type === 'select' && options) {
      return (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="input select"
          style={error ? {borderColor: 'var(--error-500)'} : {}}
          {...props}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="input textarea"
          style={error ? {borderColor: 'var(--error-500)'} : {}}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--text-muted)'}}>
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`input ${icon ? 'pl-10' : ''}`}
          style={error ? {borderColor: 'var(--error-500)'} : {}}
          {...props}
        />
      </div>
    );
  };

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span style={{color: 'var(--error-600)', marginLeft: 'var(--space-1)'}}>*</span>}
      </label>
      
      {renderInput()}
      
      {helpText && (
        <p className="form-help-text">
          {helpText}
        </p>
      )}
      
      {error && (
        <p className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormGroup({ children, label, className = '' }: FormGroupProps): React.ReactElement {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}

export function Input({ label, help, error, icon, ...props }: InputProps): React.ReactElement {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--text-muted)'}}>
            {icon}
          </div>
        )}
        <input 
          className={`input ${icon ? 'pl-10' : ''}`}
          style={error ? {borderColor: 'var(--error-500)'} : {}}
          {...props} 
        />
      </div>
      {help && <p className="form-help-text">{help}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function TextArea({ label, help, error, ...props }: TextAreaProps): React.ReactElement {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <textarea 
        className="input textarea"
        style={error ? {borderColor: 'var(--error-500)'} : {}}
        {...props} 
      />
      {help && <p className="form-help-text">{help}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, ...props }: SelectProps): React.ReactElement {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <select 
        className="input select" 
        style={error ? {borderColor: 'var(--error-500)'} : {}}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function FormActions({ children, className = '' }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <div className={`form-actions ${className}`}>
      {children}
    </div>
  );
}
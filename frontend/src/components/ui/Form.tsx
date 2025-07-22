import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function FormGroup({ children, label }: FormGroupProps): React.ReactElement {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ label, help, ...props }: InputProps): React.ReactElement {
  return (
    <FormGroup label={label}>
      <input {...props} />
      {help && <small className="form-help">{help}</small>}
    </FormGroup>
  );
}

export function TextArea({ label, help, ...props }: TextAreaProps): React.ReactElement {
  return (
    <FormGroup label={label}>
      <textarea {...props} />
      {help && <small className="form-help">{help}</small>}
    </FormGroup>
  );
}

export function Select({ label, options, ...props }: SelectProps): React.ReactElement {
  return (
    <FormGroup label={label}>
      <select className="form-select" {...props}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormGroup>
  );
}
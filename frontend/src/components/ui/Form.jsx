export function FormGroup({ children, label }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {children}
    </div>
  )
}

export function Input({ label, help, ...props }) {
  return (
    <FormGroup label={label}>
      <input {...props} />
      {help && <small className="form-help">{help}</small>}
    </FormGroup>
  )
}

export function TextArea({ label, help, ...props }) {
  return (
    <FormGroup label={label}>
      <textarea {...props} />
      {help && <small className="form-help">{help}</small>}
    </FormGroup>
  )
}

export function Select({ label, options, ...props }) {
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
  )
}
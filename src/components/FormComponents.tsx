import React from 'react';
import { Field, ErrorMessage } from 'formik';

interface FormInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface FormFileUploadProps {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  className?: string;
  onFileSelect?: (files: File[]) => void;
}

interface FormErrorProps {
  name: string;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  name, 
  label, 
  type = 'text', 
  placeholder,
  required = false,
  className = '',
  autoComplete = 'off'
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className={`form-label ${label === 'Username' || label === 'Password' ? 'sr-only' : ''}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Field name={name}>
      {({ field, form, meta }: any) => (
        <div>
          <input
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`form-input ${className} ${
              meta.touched && meta.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${
              meta.touched && !meta.error && field.value ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
            }`}
          />
          {meta.touched && meta.error && (
            <div className="text-red-500 text-sm mt-1">{meta.error}</div>
          )}
        </div>
      )}
    </Field>
  </div>
);

export const FormTextarea: React.FC<FormTextareaProps> = ({ 
  name, 
  label, 
  placeholder,
  required = false,
  rows = 3,
  className = ''
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Field name={name}>
      {({ field, form, meta }: any) => (
        <div>
          <textarea
            {...field}
            id={name}
            placeholder={placeholder}
            rows={rows}
            className={`form-textarea ${className} ${
              meta.touched && meta.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${
              meta.touched && !meta.error && field.value ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
            }`}
          />
          {meta.touched && meta.error && (
            <div className="text-red-500 text-sm mt-1">{meta.error}</div>
          )}
        </div>
      )}
    </Field>
  </div>
);

export const FormSelect: React.FC<FormSelectProps> = ({ 
  name, 
  label, 
  options,
  placeholder,
  required = false,
  className = ''
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Field name={name}>
      {({ field, form, meta }: any) => (
        <div>
          <select
            {...field}
            id={name}
            className={`form-select ${className} ${
              meta.touched && meta.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${
              meta.touched && !meta.error && field.value ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
            }`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {meta.touched && meta.error && (
            <div className="text-red-500 text-sm mt-1">{meta.error}</div>
          )}
        </div>
      )}
    </Field>
  </div>
);

export const FormFileUpload: React.FC<FormFileUploadProps> = ({
  name,
  label,
  accept = "*",
  multiple = false,
  required = false,
  className = '',
  onFileSelect
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Field name={name}>
      {({ field, form, meta }: any) => (
        <div>
          <input
            type="file"
            id={name}
            accept={accept}
            multiple={multiple}
            className={`form-input ${className} ${
              meta.touched && meta.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              form.setFieldValue(name, multiple ? files : files[0]);
              if (onFileSelect) {
                onFileSelect(files);
              }
            }}
          />
          {meta.touched && meta.error && (
            <div className="text-red-500 text-sm mt-1">{meta.error}</div>
          )}
        </div>
      )}
    </Field>
  </div>
);

export const FormError: React.FC<FormErrorProps> = ({ name, className = '' }) => (
  <ErrorMessage name={name}>
    {(msg) => <div className={`text-red-500 text-sm ${className}`}>{msg}</div>}
  </ErrorMessage>
);

export const FormSubmitButton: React.FC<{
  isSubmitting: boolean;
  isValid: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isSubmitting, isValid, children, className = '' }) => (
  <button
    type="submit"
    disabled={isSubmitting || !isValid}
    className={`btn btn-primary ${className} ${
      isSubmitting || !isValid ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isSubmitting ? (
      <div className="flex items-center space-x-2">
        <div className="spinner h-4 w-4"></div>
        <span>Processing...</span>
      </div>
    ) : (
      children
    )}
  </button>
);

export const FormCancelButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`btn btn-outline ${className}`}
  >
    {children}
  </button>
);

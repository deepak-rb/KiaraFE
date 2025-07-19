import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';
import theme from '../theme/materialTheme';

// Styled TextField to match the existing form styling exactly
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.5rem', // rounded-lg equivalent
    backgroundColor: 'white',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', // Match form-input background
    fontSize: '0.875rem',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Match form-input transition
    '& fieldset': {
      borderColor: '#d1d5db', // border-gray-300
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#93c5fd', // Match form-input hover
    },
    '&.Mui-focused fieldset': {
      borderColor: 'transparent', // Match form-input focus
      borderWidth: '1px',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)', // Match form-input focus transform
      boxShadow: '0 0 0 2px #3b82f6, 0 10px 25px rgba(59, 130, 246, 0.15)', // Match form-input focus ring and shadow
    },
    '&.Mui-error fieldset': {
      borderColor: '#ef4444', // border-red-500 to match error state
    },
  },
  '& .MuiInputLabel-root': {
    display: 'none', // Hide the MUI label since we're using external label
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 16px', // Match form-input px-4 py-3 (16px horizontal, 12px vertical)
    fontSize: '0.875rem',
    color: '#111827',
    height: 'auto',
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '0',
  },
  '& .MuiSvgIcon-root': {
    color: '#6b7280', // gray-500 for the calendar icon
  },
}));

interface MaterialDatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maxDate?: Dayjs;
  minDate?: Dayjs;
  placeholder?: string;
}

const MaterialDatePicker: React.FC<MaterialDatePickerProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  maxDate,
  minDate,
  placeholder = 'Select date',
}) => {
  const handleDateChange = (date: Dayjs | null) => {
    if (date && date.isValid()) {
      // Format as YYYY-MM-DD for compatibility with existing form logic
      onChange(date.format('YYYY-MM-DD'));
    } else {
      onChange('');
    }
  };

  // Convert string value to Dayjs object
  const dayjsValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="space-y-1">
          <label className="form-label">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <div>
            <DatePicker
              value={dayjsValue}
              onChange={handleDateChange}
              maxDate={maxDate}
              minDate={minDate}
              disabled={disabled}
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: StyledTextField,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  onBlur: onBlur,
                  placeholder: placeholder,
                  size: 'small',
                  variant: 'outlined',
                },
                popper: {
                  placement: 'bottom-start',
                },
              }}
              format="DD/MM/YYYY"
              views={['year', 'month', 'day']}
              openTo="year"
            />
            {error && (
              <div className="text-red-500 text-sm mt-1">{error}</div>
            )}
          </div>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default MaterialDatePicker;

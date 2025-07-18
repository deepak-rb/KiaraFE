import * as Yup from 'yup';

// Custom phone validation
const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,14}$/;
const indianPhoneRegex = /^[6-9]\d{9}$/;

// Login validation schema
export const loginSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .matches(/^[a-zA-Z0-9_]*$/, 'Username can only contain letters, numbers, and underscores'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password cannot exceed 50 characters')
});

// Patient validation schema
export const patientSchema = Yup.object({
  patientId: Yup.string()
    .optional()
    .matches(/^[a-zA-Z0-9]*$/, 'Patient ID can only contain letters and numbers')
    .max(20, 'Patient ID cannot exceed 20 characters'),
  name: Yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Age must be between 0 and 150 years', function(value) {
      if (!value) return false;
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      return age >= 0 && age <= 150;
    }),
  age: Yup.number()
    .required('Age is required')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age cannot exceed 150')
    .integer('Age must be a whole number'),
  sex: Yup.string()
    .required('Sex is required')
    .oneOf(['Male', 'Female', 'Other'], 'Please select a valid sex'),
  phone: Yup.string()
    .required('Phone number is required')
    .test('phone', 'Please enter a valid 10-digit Indian mobile number', function(value) {
      if (!value) return false;
      return indianPhoneRegex.test(value);
    }),
  address: Yup.string()
    .required('Address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  emergencyContactName: Yup.string()
    .required('Emergency contact name is required')
    .min(2, 'Contact name must be at least 2 characters')
    .max(50, 'Contact name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  emergencyContactRelation: Yup.string()
    .required('Emergency contact relation is required')
    .min(2, 'Relation must be at least 2 characters')
    .max(30, 'Relation cannot exceed 30 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Relation can only contain letters and spaces'),
  emergencyContactPhone: Yup.string()
    .required('Emergency contact phone is required')
    .test('phone', 'Please enter a valid 10-digit Indian mobile number', function(value) {
      if (!value) return false;
      return indianPhoneRegex.test(value);
    }),
  allergies: Yup.string()
    .max(500, 'Allergies cannot exceed 500 characters'),
  chronicIllnesses: Yup.string()
    .max(500, 'Chronic illnesses cannot exceed 500 characters'),
  pastSurgeries: Yup.string()
    .max(500, 'Past surgeries cannot exceed 500 characters'),
  medications: Yup.string()
    .max(500, 'Current medications cannot exceed 500 characters'),
  additionalNotes: Yup.string()
    .max(1000, 'Additional notes cannot exceed 1000 characters')
});

// Prescription validation schema
export const prescriptionSchema = Yup.object({
  patientId: Yup.string()
    .required('Please select a patient'),
  symptoms: Yup.string()
    .required('Symptoms are required')
    .min(10, 'Symptoms must be at least 10 characters')
    .max(2000, 'Symptoms cannot exceed 2000 characters')
    .test('meaningful', 'Please provide meaningful symptom description', function(value) {
      if (!value) return false;
      const words = value.trim().split(/\s+/);
      return words.length >= 3; // At least 3 words
    }),
  prescription: Yup.string()
    .required('Prescription details are required')
    .min(10, 'Prescription must be at least 10 characters')
    .max(2000, 'Prescription cannot exceed 2000 characters')
    .test('meaningful', 'Please provide meaningful prescription details', function(value) {
      if (!value) return false;
      const words = value.trim().split(/\s+/);
      return words.length >= 3; // At least 3 words
    }),
  nextFollowUp: Yup.date()
    .nullable()
    .optional()
    .min(new Date(), 'Follow-up date cannot be in the past')
    .test('reasonable', 'Follow-up date should be within 1 year', function(value) {
      if (!value) return true; // Optional field
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      return new Date(value) <= oneYearFromNow;
    }),
  notes: Yup.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
});

// Doctor profile validation schema
export const doctorProfileSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s\.]*$/, 'Name can only contain letters, spaces, and dots'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required')
    .max(100, 'Email cannot exceed 100 characters'),
  specialization: Yup.string()
    .required('Specialization is required')
    .min(2, 'Specialization must be at least 2 characters')
    .max(50, 'Specialization cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Specialization can only contain letters and spaces'),
  clinicName: Yup.string()
    .required('Clinic name is required')
    .min(2, 'Clinic name must be at least 2 characters')
    .max(100, 'Clinic name cannot exceed 100 characters'),
  clinicAddress: Yup.string()
    .required('Clinic address is required')
    .min(10, 'Clinic address must be at least 10 characters')
    .max(200, 'Clinic address cannot exceed 200 characters'),
  phone: Yup.string()
    .required('Phone number is required')
    .test('phone', 'Please enter a valid 10-digit Indian mobile number', function(value) {
      if (!value) return false;
      return indianPhoneRegex.test(value);
    })
});

// Password change validation schema
export const passwordChangeSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(6, 'New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
});

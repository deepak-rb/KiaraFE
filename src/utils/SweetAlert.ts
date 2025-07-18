import Swal from 'sweetalert2';

// Custom SweetAlert2 configurations for the clinic management system
export const SweetAlert = {
  // Success alerts
  success: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 3000,
      timerProgressBar: true
    });
  },

  // Error alerts
  error: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#EF4444'
    });
  },

  // Warning alerts
  warning: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#F59E0B'
    });
  },

  // Info alerts
  info: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3B82F6'
    });
  },

  // Confirmation dialogs
  confirm: (title: string, message: string, confirmText = 'Yes', cancelText = 'No') => {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      reverseButtons: true
    });
  },

  // Delete confirmation
  confirmDelete: (itemName: string) => {
    return Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${itemName}. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      reverseButtons: true
    });
  },

  // Loading alerts
  loading: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  // Close loading alert
  close: () => {
    Swal.close();
  },

  // Form validation error
  validationError: (message: string) => {
    return Swal.fire({
      title: 'Validation Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#EF4444',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  },

  // Login success
  loginSuccess: (doctorName: string) => {
    return Swal.fire({
      title: 'Welcome Back!',
      text: `Hello, Dr. ${doctorName}`,
      icon: 'success',
      confirmButtonText: 'Continue',
      confirmButtonColor: '#10B981',
      timer: 2000,
      timerProgressBar: true
    });
  },

  // Patient added successfully
  patientAdded: (patientName: string) => {
    return Swal.fire({
      title: 'Patient Added Successfully!',
      text: `${patientName} has been added to the system`,
      icon: 'success',
      confirmButtonText: 'View Dashboard',
      confirmButtonColor: '#10B981',
      showCancelButton: true,
      cancelButtonText: 'Add Another Patient',
      cancelButtonColor: '#6B7280'
    });
  },

  // Patient updated successfully
  patientUpdated: (patientName: string) => {
    return Swal.fire({
      title: 'Patient Updated Successfully!',
      text: `${patientName}'s information has been updated`,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 2000,
      timerProgressBar: true
    });
  },

  // Prescription created successfully
  prescriptionCreated: (prescriptionId: string) => {
    return Swal.fire({
      title: 'Prescription Created Successfully!',
      text: `Prescription ID: ${prescriptionId}`,
      icon: 'success',
      confirmButtonText: 'View Prescription',
      confirmButtonColor: '#10B981',
      showCancelButton: true,
      cancelButtonText: 'Create Another',
      cancelButtonColor: '#6B7280'
    });
  },

  // Prescription updated successfully
  prescriptionUpdated: () => {
    return Swal.fire({
      title: 'Prescription Updated Successfully!',
      text: 'The prescription has been updated with the latest information',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 2000,
      timerProgressBar: true
    });
  },

  // Profile updated successfully
  profileUpdated: () => {
    return Swal.fire({
      title: 'Profile Updated Successfully!',
      text: 'Your profile information has been saved',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 2000,
      timerProgressBar: true
    });
  },

  // Network error
  networkError: () => {
    return Swal.fire({
      title: 'Network Error',
      text: 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: 'error',
      confirmButtonText: 'Retry',
      confirmButtonColor: '#EF4444'
    });
  },

  // Session expired
  sessionExpired: () => {
    return Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired. Please log in again.',
      icon: 'warning',
      confirmButtonText: 'Login',
      confirmButtonColor: '#F59E0B',
      allowOutsideClick: false,
      allowEscapeKey: false
    });
  },

  // Custom toast notification
  toast: (message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon,
      title: message,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  // File upload success
  uploadSuccess: (fileName: string) => {
    return Swal.fire({
      title: 'Upload Successful!',
      text: `${fileName} has been uploaded successfully`,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 2000,
      timerProgressBar: true
    });
  },

  // Search results
  noSearchResults: (searchTerm: string) => {
    return Swal.fire({
      title: 'No Results Found',
      text: `No results found for "${searchTerm}". Try adjusting your search criteria.`,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3B82F6'
    });
  }
};

export default SweetAlert;

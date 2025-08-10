import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import Navbar from '../components/Navbar';
import PrescriptionHistoryModal from '../components/PrescriptionHistoryModal';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  address: string;
  photo?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalHistory: {
    allergies?: string;
    chronicIllnesses?: string;
    pastSurgeries?: string;
    medications?: string;
    additionalNotes?: string;
  };
  createdAt: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  createdAt: string;
}

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  address: string;
  photo?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalHistory: {
    allergies?: string;
    chronicIllnesses?: string;
    pastSurgeries?: string;
    medications?: string;
    additionalNotes?: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const SearchPatients: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [patientSelectTimeout, setPatientSelectTimeout] = useState<NodeJS.Timeout | null>(null);
  const [prescriptionsCache, setPrescriptionsCache] = useState<{[key: string]: Prescription[]}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Changed default from 10 to 5
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Helper function to get patient photo URL
  const getPatientPhotoUrl = (patient: Patient): string => {
    console.log('Patient data:', {
      name: patient.name,
      photo: patient.photo,
      hasPhoto: !!patient.photo
    }); // Debug log
    
    if (!patient.photo) {
      console.log('No photo, using fallback avatar for:', patient.name);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=80`;
    }
    
    // Try both approaches - first the direct uploads path, then the custom endpoint
    const directUrl = `http://localhost:5000/${patient.photo}`;
    console.log('Generated direct URL:', directUrl);
    
    return directUrl;
  };

  // Load patients with pagination on component mount
  useEffect(() => {
    console.log('Mount/pagination effect triggered, isSearchMode:', isSearchMode, 'currentPage:', currentPage); // Debug log
    if (!isSearchMode) {
      fetchPatients(currentPage);
    }
  }, [currentPage, itemsPerPage, isSearchMode]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (patientSelectTimeout) {
        clearTimeout(patientSelectTimeout);
      }
    };
  }, [searchTimeout, patientSelectTimeout]);

  // Real-time search effect
  useEffect(() => {
    console.log('Real-time search effect triggered, searchQuery:', searchQuery); // Debug log
    
    if (searchQuery.trim() === '') {
      console.log('Search query empty, resetting to normal mode'); // Debug log
      setIsSearchMode(false);
      setIsSearching(false);
      setCurrentPage(1);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    setIsSearching(true);
    const timeout = setTimeout(() => {
      setIsSearchMode(true);
      performSearch(searchQuery);
    }, 500); // Increased to 500ms for better performance

    setSearchTimeout(timeout);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('patient-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('patient-search') as HTMLInputElement;
        if (selectedPatient && searchInput !== document.activeElement) {
          // Close patient details if open and search input is not focused
          handleClosePatientDetails();
        } else if (searchInput === document.activeElement) {
          searchInput.blur();
          if (searchQuery) {
            setSearchQuery('');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery, selectedPatient]);

  const fetchPatients = async (page: number = 1) => {
    console.log('fetchPatients called with page:', page); // Debug log
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/patients?page=${page}&limit=${itemsPerPage}`);
      console.log('fetchPatients response:', response.data); // Debug log
      setPatients(response.data.patients);
      setPagination(response.data.pagination);
      setCurrentPage(page);
      
      if (response.data.patients.length === 0) {
        setError('No patients found');
      }
    } catch (err: any) {
      console.error('fetchPatients error:', err); // Debug log
      setError('No Patients Found');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearchMode(false);
      setIsSearching(false);
      return;
    }

    setError('');
    
    try {
      const response = await api.get(`/patients/search?query=${encodeURIComponent(query)}`);
      setPatients(response.data.patients || []);
      setPagination(null); // Clear pagination for search results
      
      if (response.data.patients.length === 0) {
        SweetAlert.noSearchResults(query);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    await performSearch(searchQuery);
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1) && !isSearchMode) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPaginationNumbers = () => {
    if (!pagination) return [];
    
    const { currentPage, totalPages } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  const handlePatientSelect = async (patient: Patient) => {
    // Prevent rapid consecutive calls
    if (patientSelectTimeout) {
      clearTimeout(patientSelectTimeout);
    }
    
    // Check cache first
    if (prescriptionsCache[patient._id]) {
      setSelectedPatient(patient);
      setPrescriptions(prescriptionsCache[patient._id]);
      return;
    }
    
    // Debounce patient selection to prevent rate limiting
    const timeout = setTimeout(async () => {
      setSelectedPatient(patient);
      setLoading(true);
      
      try {
        const response = await api.get(`/prescriptions/patient/${patient._id}`);
        const fetchedPrescriptions = response.data.prescriptions;
        setPrescriptions(fetchedPrescriptions);
        
        // Cache the result for 5 minutes
        setPrescriptionsCache(prev => ({
          ...prev,
          [patient._id]: fetchedPrescriptions
        }));
        
        // Clear cache after 5 minutes
        setTimeout(() => {
          setPrescriptionsCache(prev => {
            const newCache = { ...prev };
            delete newCache[patient._id];
            return newCache;
          });
        }, 5 * 60 * 1000); // 5 minutes
        
      } catch (err: any) {
        console.error('Error fetching prescriptions:', err);
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
          SweetAlert.error('Rate Limit', 'Too many requests. Please wait a moment and try again.');
        } else {
          setError(err.response?.data?.message || 'Error fetching patient history');
        }
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce for patient selection
    
    setPatientSelectTimeout(timeout);
  };

  const handleClosePatientDetails = () => {
    setSelectedPatient(null);
    setPrescriptions([]);
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark key={index} className="bg-yellow-200 font-semibold">{part}</mark>;
      }
      return part;
    });
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    const result = await SweetAlert.confirmDelete(patientName);
    if (!result.isConfirmed) {
      return;
    }

    setDeleting(patientId);
    setError('');

    try {
      await api.delete(`/patients/${patientId}`);
      
      // Remove patient from current list
      setPatients(patients.filter(p => p._id !== patientId));
      
      // Clear selected patient if it was deleted
      if (selectedPatient?._id === patientId) {
        setSelectedPatient(null);
        setPrescriptions([]);
      }
      
      // Refresh the patient list
      if (!isSearchMode) {
        fetchPatients(currentPage);
      }
      
      // Show success message
      SweetAlert.success('Patient Deleted', `Patient "${patientName}" has been deleted successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting patient');
      SweetAlert.error('Delete Failed', err.response?.data?.message || 'Error deleting patient');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditPatient = (patientId: string) => {
    navigate(`/patients/edit/${patientId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleOpenPrescriptionModal = () => {
    setShowPrescriptionModal(true);
  };

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Patient History</h1> */}
          
          {/* Search Bar */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            {/* Search Input Section */}
            <div className="mb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="patient-search"
                    type="text"
                    placeholder="Search by patient name, ID, or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    autoComplete="off"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isSearching ? (
                      <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        title="Clear search"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || isSearching}
                  className={`w-24 px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                    loading || isSearching
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm'
                  }`}
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <div className="text-gray-600">
                    {searchQuery ? (
                      <>
                        <span className="font-medium">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''} found
                        <span> for "<span className="font-medium">{searchQuery}</span>"</span>
                      </>
                    ) : (
                      <>
                        {isSearchMode ? (
                          <>Search results: <span className="font-medium">{patients.length}</span> patients found</>
                        ) : (
                          <>
                            Showing <span className="font-medium">{patients.length}</span> patients
                            {pagination && (
                              <> of <span className="font-medium">{pagination.totalPatients}</span> total</>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {isSearchMode ? (
                      `Found: ${patients.length}`
                    ) : (
                      `Total: ${pagination?.totalPatients || 0}`
                    )}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Search by patient name, ID, or phone number • Real-time search enabled
                </div>

                {/* Pagination Controls in Header */}
                {!isSearchMode && pagination && pagination.totalPages > 1 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      {/* Pagination Info */}
                      <div className="text-xs text-gray-600">
                        📄 Page {currentPage} of {pagination.totalPages} • 👥 Viewing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.totalPatients)} of {pagination.totalPatients} patients
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          ← Prev
                        </button>

                        {/* Page Numbers (compact) */}
                        <div className="flex items-center gap-1">
                          {(() => {
                            const paginationNumbers = getPaginationNumbers();
                            // Always show current page and adjacent pages
                            let visiblePages = [];
                            
                            if (paginationNumbers.length <= 3) {
                              // If 3 or fewer pages, show all
                              visiblePages = paginationNumbers;
                            } else {
                              // Find current page index
                              const currentIndex = paginationNumbers.findIndex(p => p === currentPage);
                              
                              if (currentIndex !== -1) {
                                // Show current page and one on each side if possible
                                const start = Math.max(0, currentIndex - 1);
                                const end = Math.min(paginationNumbers.length, start + 3);
                                visiblePages = paginationNumbers.slice(start, end);
                              } else {
                                // Fallback to first 3
                                visiblePages = paginationNumbers.slice(0, 3);
                              }
                            }
                            
                            return visiblePages.map((page, index) => (
                              <button
                                key={index}
                                onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                                disabled={typeof page !== 'number'}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : typeof page === 'number'
                                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    : 'bg-white text-gray-400 cursor-default'
                                }`}
                              >
                                {page}
                              </button>
                            ));
                          })()}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                            currentPage === pagination.totalPages
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Next →
                        </button>

                        {/* Items per page selector (compact) */}
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="ml-1 border border-gray-300 rounded px-1 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-8 ${selectedPatient ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {/* Search Results */}
            <div className={`bg-white shadow rounded-lg ${selectedPatient ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
                
                {patients.length > 0 ? (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <div
                        key={patient._id}
                        className={`${selectedPatient ? 'p-2' : 'p-4'} rounded-lg border transition-colors ${
                          selectedPatient?._id === patient._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className={`flex items-center ${selectedPatient ? 'space-x-2' : 'space-x-4'} flex-1 cursor-pointer`}
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="flex-shrink-0">
                              {patient.photo ? (
                                <img
                                  className={`${selectedPatient ? 'h-8 w-8' : 'h-12 w-12'} rounded-full object-cover`}
                                  src={getPatientPhotoUrl(patient)}
                                  alt={patient.name}
                                  onLoad={() => console.log('✅ Image rendered successfully for:', patient.name)}
                                  onError={(e) => {
                                    console.error('❌ Image failed to render for:', patient.name, 'URL:', e.currentTarget.src);
                                    // Fallback to avatar if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=80`;
                                  }}
                                />
                              ) : (
                                <div className={`${selectedPatient ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gray-300 flex items-center justify-center`}>
                                  <span className={`${selectedPatient ? 'text-sm' : 'text-lg'} font-medium text-gray-600`}>
                                    {patient.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`${selectedPatient ? 'text-sm' : 'text-lg'} font-medium text-gray-900 truncate`}>
                                {highlightSearchTerm(patient.name, searchQuery)}
                              </h4>
                              {!selectedPatient && (
                                <>
                                  <p className="text-sm text-gray-500">
                                    ID: {highlightSearchTerm(patient.patientId, searchQuery)} • Age: {patient.age} • {patient.sex}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Phone: {highlightSearchTerm(patient.phone, searchQuery)}
                                  </p>
                                </>
                              )}
                              {selectedPatient && (
                                <p className="text-xs text-gray-500 truncate">
                                  ID: {highlightSearchTerm(patient.patientId, searchQuery)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {!selectedPatient && (
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPatient(patient._id);
                                }}
                                className="btn btn-sm btn-secondary"
                                title="Edit Patient"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePatient(patient._id, patient.name);
                                }}
                                disabled={deleting === patient._id}
                                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
                                title="Delete Patient"
                              >
                                {deleting === patient._id ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                          {selectedPatient && selectedPatient._id === patient._id && (
                            <div className="flex items-center ml-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchQuery 
                        ? `No patients found matching "${searchQuery}"`
                        : loading 
                          ? 'Loading patients...'
                          : 'Start typing to search for patients'
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details & History */}
            <div className={`bg-white shadow rounded-lg ${selectedPatient ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Patient Details & History</h3>
                  {selectedPatient && (
                    <button
                      onClick={handleClosePatientDetails}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Close patient details"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close
                    </button>
                  )}
                </div>
                
                {selectedPatient ? (
                  <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {selectedPatient.photo ? (
                          <img
                            className="h-16 w-16 rounded-full object-cover"
                            src={getPatientPhotoUrl(selectedPatient)}
                            alt={selectedPatient.name}
                            onLoad={() => console.log('✅ Large image rendered successfully for:', selectedPatient.name)}
                            onError={(e) => {
                              console.error('❌ Large image failed to render for:', selectedPatient.name, 'URL:', e.currentTarget.src);
                              // Fallback to avatar if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=0d6efd&color=fff&size=80`;
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xl font-medium text-gray-600">
                              {selectedPatient.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xl font-medium text-gray-900">{selectedPatient.name}</h4>
                          <p className="text-sm text-gray-500">
                            ID: {selectedPatient.patientId} • Age: {selectedPatient.age} • {selectedPatient.sex}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">Phone:</p>
                          <p className="text-gray-600">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Emergency Contact:</p>
                          <p className="text-gray-600">
                            {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation})
                          </p>
                          <p className="text-gray-600">{selectedPatient.emergencyContact.phone}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-medium text-gray-900">Address:</p>
                        <p className="text-gray-600">{selectedPatient.address}</p>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div className="border-b border-gray-200 pb-6">
                      <h5 className="font-medium text-gray-900 mb-3">Medical History</h5>
                      <div className="space-y-2 text-sm">
                        {selectedPatient.medicalHistory.allergies && (
                          <div>
                            <p className="font-medium text-gray-900">Allergies:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.allergies}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.chronicIllnesses && (
                          <div>
                            <p className="font-medium text-gray-900">Chronic Illnesses:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.chronicIllnesses}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.pastSurgeries && (
                          <div>
                            <p className="font-medium text-gray-900">Past Surgeries:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.pastSurgeries}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.medications && (
                          <div>
                            <p className="font-medium text-gray-900">Medications:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.medications}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescription History */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Prescription History</h5>
                      {prescriptions.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{prescriptions.length}</span> prescription{prescriptions.length !== 1 ? 's' : ''} found
                          </p>
                          <p className="text-xs text-gray-500">
                            Latest: {new Date(prescriptions[0]?.createdAt).toLocaleDateString('en-GB')}
                            {prescriptions.length > 1 && (
                              <span> • Oldest: {new Date(prescriptions[prescriptions.length - 1]?.createdAt).toLocaleDateString('en-GB')}</span>
                            )}
                          </p>
                          <button
                            onClick={handleOpenPrescriptionModal}
                            className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            View Prescription History
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No prescriptions found for this patient.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Select a patient to view their details and history
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription History Modal */}
      <PrescriptionHistoryModal
        isOpen={showPrescriptionModal}
        onClose={handleClosePrescriptionModal}
        patient={selectedPatient}
        prescriptions={prescriptions}
      />
    </div>
  );
};

export default SearchPatients;

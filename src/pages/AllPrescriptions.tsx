import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  phone: string;
  address: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  clinicName: string;
  clinicAddress: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: Patient;
  doctorId: Doctor;
  patientName: string;
  patientAge: number;
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  digitalSignature?: string;
  notes?: string;
  createdAt: string;
}

const AllPrescriptions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchAllPrescriptions();
  }, []);

  useEffect(() => {
    // Check for filter parameter in URL
    const filter = searchParams.get('filter');
    if (filter === 'followups') {
      setFilterType('followups');
    } else {
      setFilterType('all');
    }
  }, [searchParams]);

  useEffect(() => {
    // Apply filter when filterType or prescriptions change
    if (filterType === 'followups') {
      const followUpPrescriptions = prescriptions.filter(prescription => prescription.nextFollowUp);
      setFilteredPrescriptions(followUpPrescriptions);
    } else {
      setFilteredPrescriptions(prescriptions);
    }
  }, [filterType, prescriptions]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('prescription-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('prescription-search') as HTMLInputElement;
        if (searchInput === document.activeElement) {
          searchInput.blur();
          if (searchQuery) {
            clearSearch();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]);

  const fetchAllPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions');
      setPrescriptions(response.data.prescriptions);
      setFilteredPrescriptions(response.data.prescriptions);
    } catch (err: any) {
      setError('No Prescription found');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (query.trim() === '') {
      // Apply filter type when clearing search
      if (filterType === 'followups') {
        const followUpPrescriptions = prescriptions.filter(prescription => prescription.nextFollowUp);
        setFilteredPrescriptions(followUpPrescriptions);
      } else {
        setFilteredPrescriptions(prescriptions);
      }
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/prescriptions/search/${encodeURIComponent(query)}`);
      let searchResults = response.data.prescriptions;
      
      // Apply filter type to search results
      if (filterType === 'followups') {
        searchResults = searchResults.filter((prescription: Prescription) => prescription.nextFollowUp);
      }
      
      setFilteredPrescriptions(searchResults);
    } catch (err: any) {
      console.error('Search error:', err);
      // If search fails, fall back to local filtering
      let localFiltered = prescriptions.filter(prescription => {
        const patientPhone = prescription.patientId?.phone || '';
        return (
          prescription.prescriptionId.toLowerCase().includes(query.toLowerCase()) ||
          prescription.patientName.toLowerCase().includes(query.toLowerCase()) ||
          patientPhone.toLowerCase().includes(query.toLowerCase()) ||
          prescription.symptoms.toLowerCase().includes(query.toLowerCase())
        );
      });
      
      // Apply filter type to local search results
      if (filterType === 'followups') {
        localFiltered = localFiltered.filter(prescription => prescription.nextFollowUp);
      }
      
      setFilteredPrescriptions(localFiltered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    if (query.trim()) {
      const timeout = setTimeout(() => {
        performSearch(query);
      }, 300); // 300ms debounce
      setSearchTimeout(timeout);
    } else {
      // Apply filter type when clearing search
      if (filterType === 'followups') {
        const followUpPrescriptions = prescriptions.filter(prescription => prescription.nextFollowUp);
        setFilteredPrescriptions(followUpPrescriptions);
      } else {
        setFilteredPrescriptions(prescriptions);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPrescriptions(prescriptions);
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

  const handleViewPrescription = (prescriptionId: string) => {
    navigate(`/prescriptions/${prescriptionId}`);
  };

  const handleEditPrescription = (prescriptionId: string) => {
    navigate(`/prescriptions/edit/${prescriptionId}`);
  };

  const handleDeletePrescription = async (prescriptionId: string, prescriptionCode: string) => {
    const result = await SweetAlert.confirmDelete(`prescription "${prescriptionCode}"`);
    if (!result.isConfirmed) {
      return;
    }

    setDeleting(prescriptionId);
    setError('');

    try {
      await api.delete(`/prescriptions/${prescriptionId}`);
      
      // Remove prescription from the list
      setPrescriptions(prescriptions.filter(p => p._id !== prescriptionId));
      setFilteredPrescriptions(filteredPrescriptions.filter(p => p._id !== prescriptionId));
      
      // Show success message
      SweetAlert.success('Prescription Deleted', `Prescription "${prescriptionCode}" has been deleted successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting prescription');
      SweetAlert.error('Delete Failed', err.response?.data?.message || 'Error deleting prescription');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
                {filterType === 'followups' ? 'Follow-up Prescriptions' : 'All Prescriptions'}
              </h1>
              {filterType === 'followups' && (
                <p className="text-gray-600 mt-1">Prescriptions with scheduled follow-up dates</p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setFilterType(filterType === 'followups' ? 'all' : 'followups');
                  navigate(filterType === 'followups' ? '/prescriptions/all' : '/prescriptions/all?filter=followups');
                }}
                className="btn btn-secondary"
              >
                {filterType === 'followups' ? 'Show All' : 'Show Follow-ups Only'}
              </button>
              <button
                onClick={() => navigate('/prescriptions/new')}
                className="btn btn-primary"
              >
                New Prescription
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="prescription-search"
                type="text"
                placeholder="Search by prescription ID, patient name, or mobile number... (Ctrl+F to focus, Esc to clear)"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    clearSearch();
                  }
                }}
                autoComplete="off"
                aria-label="Search prescriptions"
                aria-describedby="search-description"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
                  title="Clear search"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {isSearching && (
              <div className="mt-2 text-sm text-blue-600 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {searchQuery && !isSearching ? (
                  <>
                    <span className="font-medium">{filteredPrescriptions.length}</span> prescription{filteredPrescriptions.length !== 1 ? 's' : ''} found for "<span className="font-medium">{searchQuery}</span>"
                    {filteredPrescriptions.length === 0 && (
                      <span className="ml-2 text-gray-500">
                        • Try a different search term or 
                        <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 ml-1">clear search</button>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {filterType === 'followups' ? (
                      <>
                        Showing <span className="font-medium">{filteredPrescriptions.length}</span> follow-up prescriptions
                        <span className="text-orange-600 ml-2">• Follow-ups only</span>
                      </>
                    ) : (
                      <>
                        Showing <span className="font-medium">{filteredPrescriptions.length}</span> of <span className="font-medium">{prescriptions.length}</span> total prescriptions
                      </>
                    )}
                  </>
                )}
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                filterType === 'followups' 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-green-600 bg-green-50'
              }`}>
                {filterType === 'followups' 
                  ? `Follow-ups: ${prescriptions.filter(p => p.nextFollowUp).length}` 
                  : `Total: ${prescriptions.length} prescriptions`
                }
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Search by prescription ID, patient name, mobile number, or symptoms
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {filteredPrescriptions.length === 0 && !loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="mx-auto h-24 w-24 mb-6">
                <svg className="h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchQuery ? 'No Prescriptions Found' : 'No Prescriptions Found'}
              </h3>
              <p className="text-gray-500 text-base mb-6">
                {searchQuery 
                  ? `No prescriptions match your search for "${searchQuery}". Try a different search term.`
                  : 'You haven\'t created any prescriptions yet. Start by creating your first prescription for a patient.'
                }
              </p>
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="btn btn-secondary mr-4"
                >
                  Clear Search
                </button>
              ) : null}
              <button
                onClick={() => navigate('/prescriptions/new')}
                className="btn btn-primary"
              >
                {searchQuery ? 'Create New Prescription' : 'Create First Prescription'}
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <li key={prescription._id}>
                    <div className="px-4 py-6 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Left section - Prescription details */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Prescription ID and Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-lg font-semibold text-blue-600 truncate">
                              {highlightSearchTerm(prescription.prescriptionId, searchQuery)}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                              {prescription.nextFollowUp && new Date(prescription.nextFollowUp) < new Date() && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-700 w-16">Patient:</span>
                                <span className="text-gray-900">{highlightSearchTerm(prescription.patientName, searchQuery)} ({prescription.patientAge} years)</span>
                              </div>
                              {prescription.patientId?.phone && (
                                <div className="flex items-center text-sm">
                                  <span className="font-medium text-gray-700 w-16">Mobile:</span>
                                  <span className="text-gray-600">{highlightSearchTerm(prescription.patientId.phone, searchQuery)}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-700 w-16">Created:</span>
                                <span className="text-gray-600">{formatDate(prescription.createdAt)}</span>
                              </div>
                              {prescription.nextFollowUp && (
                                <div className="flex items-center text-sm">
                                  <span className="font-medium text-gray-700 w-16">Follow-up:</span>
                                  <span className={`${
                                    new Date(prescription.nextFollowUp) < new Date() ? 'text-red-600 font-medium' : 'text-amber-600'
                                  }`}>
                                    {formatDate(prescription.nextFollowUp)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Symptoms */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700 block mb-1">Symptoms:</span>
                              <p className="text-gray-600 leading-relaxed">
                                {highlightSearchTerm(prescription.symptoms, searchQuery)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right section - Action buttons */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 lg:gap-3 flex-shrink-0">
                          <button
                            onClick={() => handleViewPrescription(prescription._id)}
                            className="btn btn-primary btn-sm flex-1 lg:flex-none lg:w-20"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditPrescription(prescription._id)}
                            className="btn btn-secondary btn-sm flex items-center justify-center w-10 h-8 lg:w-20"
                            title="Edit Prescription"
                          >
                            <svg className="h-4 w-4 lg:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePrescription(prescription._id, prescription.prescriptionId)}
                            disabled={deleting === prescription._id}
                            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 flex items-center justify-center w-10 h-8 lg:w-20"
                            title="Delete Prescription"
                          >
                            {deleting === prescription._id ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <svg className="h-4 w-4 lg:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden lg:inline">Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
};

export default AllPrescriptions;

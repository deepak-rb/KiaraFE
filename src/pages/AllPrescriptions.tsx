import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPrescriptions: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [allSearchResults, setAllSearchResults] = useState<Prescription[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (!isSearchActive) {
      fetchAllPrescriptions(currentPage);
    }
  }, [currentPage, itemsPerPage, filterType]); // Added filterType to dependencies

  // Handle search result pagination when currentPage changes during search
  useEffect(() => {
    if (isSearchActive && allSearchResults.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageResults = allSearchResults.slice(startIndex, endIndex);
      setFilteredPrescriptions(pageResults);
      
      // Update pagination info
      const totalResults = allSearchResults.length;
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      setPagination({
        currentPage: currentPage,
        totalPages: totalPages,
        totalPrescriptions: totalResults,
        limit: itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      });
    }
  }, [currentPage, itemsPerPage, allSearchResults, isSearchActive]);

  useEffect(() => {
    // Check for filter parameter in URL
    const filter = searchParams.get('filter');
    if (filter === 'followups') {
      setFilterType('followups');
    } else {
      setFilterType('all');
    }
  }, [searchParams]);

  // Removed client-side filtering effect since backend now handles filtering

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

  const fetchAllPrescriptions = async (page: number = 1) => {
    try {
      setLoading(true);
      // Add filter parameter to API call based on current filter type
      const filterParam = filterType === 'followups' ? '&filter=followups' : '';
      const response = await api.get(`/prescriptions?page=${page}&limit=${itemsPerPage}${filterParam}`);
      
      console.log('Prescription data received:', response.data.prescriptions?.slice(0, 2)); // Debug log
      
      // Additional debug: Check if any prescriptions have follow_up_completed status
      const completedFollowUps = response.data.prescriptions?.filter((p: any) => p.status === 'follow_up_completed');
      console.log('🔍 Prescriptions with follow_up_completed status:', completedFollowUps);
      
      setPrescriptions(response.data.prescriptions);
      setFilteredPrescriptions(response.data.prescriptions);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      setError('No Prescription found');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    console.log('🔍 Performing search for:', query);
    
    if (query.trim() === '') {
      // Reset search state and go back to normal pagination
      setIsSearchActive(false);
      setAllSearchResults([]);
      setCurrentPage(1);
      fetchAllPrescriptions(1);
      return;
    }

    setIsSearching(true);
    setIsSearchActive(true);
    
    try {
      console.log('🌐 Making API call to:', `/prescriptions/search/${encodeURIComponent(query)}`);
      const response = await api.get(`/prescriptions/search/${encodeURIComponent(query)}`);
      console.log('📊 Search response:', response.data);
      
      let searchResults = response.data.prescriptions;
      console.log('📋 Raw search results count:', searchResults.length);
      
      // Apply filter type to search results (client-side for search since backend search doesn't have filter param yet)
      if (filterType === 'followups') {
        searchResults = searchResults.filter((prescription: Prescription) => prescription.nextFollowUp);
        console.log('📋 After follow-up filter:', searchResults.length);
      }
      
      // Store all search results
      setAllSearchResults(searchResults);
      
      // Apply pagination to search results
      const totalResults = searchResults.length;
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageResults = searchResults.slice(startIndex, endIndex);
      
      console.log('📄 Pagination details:', {
        totalResults,
        totalPages,
        currentPage,
        itemsPerPage,
        startIndex,
        endIndex,
        currentPageResults: currentPageResults.length
      });
      
      setFilteredPrescriptions(currentPageResults);
      setPagination({
        currentPage: currentPage,
        totalPages: totalPages,
        totalPrescriptions: totalResults,
        limit: itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      });
    } catch (err: any) {
      console.error('❌ Search API error:', err);
      console.log('🔄 Falling back to local search');
      
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
      
      console.log('📋 Local search results:', localFiltered.length);
      
      // Apply filter type to local search results
      if (filterType === 'followups') {
        localFiltered = localFiltered.filter(prescription => prescription.nextFollowUp);
      }
      
      // Store all search results
      setAllSearchResults(localFiltered);
      
      // Apply local pagination
      const totalResults = localFiltered.length;
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageResults = localFiltered.slice(startIndex, endIndex);
      
      setFilteredPrescriptions(currentPageResults);
      setPagination({
        currentPage: currentPage,
        totalPages: totalPages,
        totalPrescriptions: totalResults,
        limit: itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      });
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
    
    // Reset to first page when starting a new search
    if (query.trim() && currentPage !== 1) {
      setCurrentPage(1);
    }
    
    // Set new timeout for debounced search
    if (query.trim()) {
      const timeout = setTimeout(() => {
        performSearch(query);
      }, 300); // 300ms debounce
      setSearchTimeout(timeout);
    } else {
      // Clear search and reset pagination
      setIsSearchActive(false);
      setAllSearchResults([]);
      setCurrentPage(1);
      fetchAllPrescriptions(1);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setIsSearchActive(false);
    setAllSearchResults([]);
    fetchAllPrescriptions(1);
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

  const handleCreateFollowUp = (prescription: Prescription) => {
    // Navigate to new prescription page with patient pre-selected
    const patientData = {
      patientObjectId: prescription.patientId._id, // Keep object ID for API calls
      patientId: prescription.patientId.patientId, // Human-readable patient ID
      patientName: prescription.patientName,
      patientAge: prescription.patientAge,
      patientPhone: prescription.patientId.phone,
      followUp: true,
      originalPrescriptionId: prescription._id,
      originalPrescriptionCode: prescription.prescriptionId // Human-readable prescription ID
    };
    
    const queryParams = new URLSearchParams();
    queryParams.set('patientObjectId', patientData.patientObjectId); // For API calls
    queryParams.set('patientId', patientData.patientId); // Human-readable ID for display
    queryParams.set('patientName', patientData.patientName);
    queryParams.set('patientAge', patientData.patientAge.toString());
    queryParams.set('patientPhone', patientData.patientPhone || '');
    queryParams.set('followUp', 'true');
    queryParams.set('originalPrescriptionId', patientData.originalPrescriptionId);
    queryParams.set('originalPrescriptionCode', patientData.originalPrescriptionCode);
    
    navigate(`/prescriptions/new?${queryParams.toString()}`);
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

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setCurrentPage(page);
      
      // If search is active, paginate through search results
      if (isSearchActive && allSearchResults.length > 0) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageResults = allSearchResults.slice(startIndex, endIndex);
        setFilteredPrescriptions(pageResults);
        
        // Update pagination info
        if (pagination) {
          setPagination({
            ...pagination,
            currentPage: page,
            hasNextPage: page < pagination.totalPages,
            hasPrevPage: page > 1
          });
        }
      }
      // If no search is active, fetch from server
      else if (!isSearchActive) {
        fetchAllPrescriptions(page);
      }
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getPaginationNumbers = () => {
    if (!pagination) return [];
    
    const { currentPage, totalPages } = pagination;
    const delta = 2; // Number of pages to show on each side of current page
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
        
            </div>
            <div className="flex space-x-4">
              <motion.button
                onClick={() => {
                  setIsFilterTransitioning(true);
                  setTimeout(() => {
                    setCurrentPage(1); // Reset to first page when changing filter
                    setFilterType(filterType === 'followups' ? 'all' : 'followups');
                    navigate(filterType === 'followups' ? '/prescriptions/all' : '/prescriptions/all?filter=followups');
                    setTimeout(() => setIsFilterTransitioning(false), 100);
                  }, 150);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`btn transition-all duration-300 ${
                  filterType === 'followups'
                    ? 'btn-secondary bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                    : 'btn-secondary'
                }`}
                animate={filterType === 'followups' ? { 
                  boxShadow: ["0 0 0 0 rgba(249, 115, 22, 0.4)", "0 0 0 8px rgba(249, 115, 22, 0)", "0 0 0 0 rgba(249, 115, 22, 0)"] 
                } : {}}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                {filterType === 'followups' ? 'Show All' : 'Show Follow-ups Only'}
              </motion.button>
              <button
                onClick={() => navigate('/prescriptions/new')}
                className="btn btn-primary"
              >
                New Prescription
              </button>
            </div>
          </div>

          {/* Search Bar - Professional UI */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <input
                id="prescription-search"
                type="text"
                placeholder="Search prescriptions by ID, patient name, mobile, or symptoms..."
                className="block w-full pl-12 pr-12 py-4 text-base border-2 border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200 shadow-sm"
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
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Search status and info */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <motion.div
                className="flex items-center space-x-3"
              >
                {isSearching ? (
                  <span className="flex items-center text-green-600 text-sm font-medium">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center text-gray-700 text-sm">
                    <motion.span
                      key={searchQuery ? `results-${filteredPrescriptions.length}` : filterType === 'followups' ? 'followups' : 'total'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className={searchQuery ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium' : filterType === 'followups' ? 'text-orange-600' : 'text-gray-700'}
                      style={{ display: 'inline-block' }}
                    >
                      {searchQuery
                        ? `${filteredPrescriptions.length} result${filteredPrescriptions.length !== 1 ? 's' : ''}`
                        : filterType === 'followups'
                          ? `Showing ${filteredPrescriptions.length} follow-up prescription${filteredPrescriptions.length !== 1 ? 's' : ''}`
                          : `Showing ${filteredPrescriptions.length} of ${prescriptions.length} total prescriptions`}
                    </motion.span>
                    {searchQuery && (
                      <span className="ml-2">for "<span className="font-semibold">{searchQuery}</span>"</span>
                    )}
                    {searchQuery && filteredPrescriptions.length === 0 && (
                      <button onClick={clearSearch} className="ml-3 text-green-600 hover:text-green-800 text-sm font-medium transition-colors">Clear search</button>
                    )}
                    {filterType === 'followups' && !searchQuery && (
                      <span className="ml-2">• Follow-ups only</span>
                    )}
                  </span>
                )}
              </motion.div>
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
            <div className="relative">
              {isFilterTransitioning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-10 flex items-center justify-center rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="text-orange-600 font-medium">
                      {filterType === 'all' ? 'Loading follow-ups...' : 'Loading all prescriptions...'}
                    </span>
                  </div>
                </motion.div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={filterType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  className="bg-white shadow overflow-hidden sm:rounded-lg"
                >
                  {/* Table Header */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-2">Prescription ID</div>
                      <div className="col-span-2">Patient</div>
                      <div className="col-span-2">Age/Phone</div>
                      <div className="col-span-3">Symptoms</div>
                      <div className="col-span-2">Date/Follow-up</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {filteredPrescriptions.map((prescription, index) => (
                      <motion.div
                        key={prescription._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: index * 0.03,
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                        className={`px-6 py-4 transition-all duration-200 ${
                          filterType === 'followups' && prescription.nextFollowUp
                            ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 hover:from-orange-100 hover:to-yellow-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Prescription ID */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-green-600 truncate">
                                {highlightSearchTerm(prescription.prescriptionId, searchQuery)}
                              </span>
                              {filterType === 'followups' && prescription.nextFollowUp && (
                                <span className="flex-shrink-0">
                                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              {(() => {
                                console.log(`Prescription ${prescription.prescriptionId} status:`, prescription.status, 'nextFollowUp:', prescription.nextFollowUp, 'updatedAt:', prescription.updatedAt);
                                
                                // Format date function
                                const formatCompletedDate = (dateString: string): string => {
                                  const date = new Date(dateString);
                                  const day = date.getDate().toString().padStart(2, '0');
                                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const month = months[date.getMonth()];
                                  const year = date.getFullYear();
                                  return `${day}-${month}-${year}`;
                                };
                                
                                // Show custom labels based on status
                                if (prescription.status === 'follow_up_completed') {
                                  return (
                                    <div className="flex flex-col items-center">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                        Review Completed
                                      </span>
                                      {prescription.updatedAt && (
                                        <span className="text-xs text-gray-500 mt-1 text-center">
                                          {formatCompletedDate(prescription.updatedAt)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                } else if (prescription.nextFollowUp) {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      Review Pending
                                    </span>
                                  );
                                } else if (prescription.status === 'active') {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Resolved
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Resolved
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>

                          {/* Patient Name */}
                          <div className="col-span-2">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {highlightSearchTerm(prescription.patientName, searchQuery)}
                            </div>
                            {prescription.nextFollowUp && new Date(prescription.nextFollowUp) < new Date() && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Age and Phone */}
                          <div className="col-span-2">
                            <div className="text-sm text-gray-900">{prescription.patientAge} years</div>
                            {prescription.patientId?.phone && (
                              <div className="text-sm text-gray-600 truncate">
                                {highlightSearchTerm(prescription.patientId.phone, searchQuery)}
                              </div>
                            )}
                          </div>

                          {/* Symptoms */}
                          <div className="col-span-3">
                            <div className="text-sm text-gray-900 overflow-hidden">
                              <div className="line-clamp-2">
                                {highlightSearchTerm(prescription.symptoms.length > 80 ? prescription.symptoms.substring(0, 80) + '...' : prescription.symptoms, searchQuery)}
                              </div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="col-span-2">
                            <div className="text-sm text-gray-600">
                              <div>Created: {formatDate(prescription.createdAt)}</div>
                              {prescription.nextFollowUp && (
                                <div className={`${
                                  new Date(prescription.nextFollowUp) < new Date() ? 'text-red-600 font-medium' : 'text-amber-600'
                                }`}>
                                  Follow-up: {formatDate(prescription.nextFollowUp)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleViewPrescription(prescription._id)}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                                title="View Prescription"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditPrescription(prescription._id)}
                                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                                title="Edit Prescription"
                              >
                                Edit
                              </button>
                              {filterType === 'followups' && prescription.nextFollowUp && prescription.status !== 'follow_up_completed' && (
                                <button
                                  onClick={() => handleCreateFollowUp(prescription)}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                                  title="Create Follow-up Prescription"
                                >
                                  Follow-up
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePrescription(prescription._id, prescription.prescriptionId)}
                                disabled={deleting === prescription._id}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors disabled:bg-red-400"
                                title="Delete Prescription"
                              >
                                {deleting === prescription._id ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                                ) : (
                                  'Del'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

            {/* Compact Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Top row - Items per page and info */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 mb-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalPrescriptions)} of {pagination.totalPrescriptions}
                  </div>
                </div>

                {/* Bottom row - Page navigation */}
                <div className="flex justify-center items-center space-x-1">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  {/* Page numbers */}
                  {getPaginationNumbers().map((page, index) => (
                    <span key={index}>
                      {page === '...' ? (
                        <span className="px-2 py-1 text-sm text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page as number)}
                          disabled={loading}
                          className={`px-2 py-1 text-sm font-medium rounded min-w-[32px] ${
                            pagination.currentPage === page
                              ? 'text-white bg-blue-600 border border-blue-600'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {page}
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
    </div>
  );
};

export default AllPrescriptions;

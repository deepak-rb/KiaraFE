import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useLoading } from '../context/LoadingContext';
import AnimatedCard from '../components/AnimatedCard';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  photo?: string;
  createdAt: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: {
    _id: string;
    name: string;
    patientId: string;
  };
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  createdAt: string;
}

interface FollowUp {
  _id: string;
  prescriptionId: string;
  patientName: string;
  patientId: string;
  nextFollowUp: string;
  daysUntilFollowUp: number;
  isOverdue: boolean;
}

interface Stats {
  totalPatients: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  weekPrescriptions: number;
  monthPrescriptions: number;
  totalFollowUps: number;
  followUpsToday: number;
  overdueFollowUps: number;
}

const Dashboard: React.FC = () => {
  const { startLoading, stopLoading } = useLoading();
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalPrescriptions: 0,
    todayPrescriptions: 0,
    weekPrescriptions: 0,
    monthPrescriptions: 0,
    totalFollowUps: 0,
    followUpsToday: 0,
    overdueFollowUps: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get patient photo URL
  const getPatientPhotoUrl = (patient: Patient): string => {
    console.log('Dashboard - Patient photo data:', patient.photo); // Debug log
    if (!patient.photo) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=40`;
    }
    
    // Extract just the filename from the stored path
    const filename = patient.photo.split('/').pop();
    // Use the new patient-image endpoint
    const photoUrl = `http://localhost:5000/patient-image/${filename}`;
    console.log('Dashboard - Generated photo URL:', photoUrl); // Debug log
    return photoUrl;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      startLoading();
      
      // Fetch statistics from the dedicated stats endpoint
      const statsRes = await api.get('/stats/dashboard');
      const statsData = statsRes.data;

      // Fetch recent data (limited amounts for display)
      const [recentPrescriptionsRes, recentPatientsRes] = await Promise.all([
        api.get('/prescriptions?page=1&limit=5'),
        api.get('/patients?page=1&limit=5')
      ]);

      const recentPatientsData = recentPatientsRes.data.patients || [];
      const recentPrescriptionsData = recentPrescriptionsRes.data.prescriptions || [];

      // Set recent data
      setRecentPrescriptions(recentPrescriptionsData);
      setRecentPatients(recentPatientsData);

      // For follow-ups, we need to fetch some prescriptions with nextFollowUp
      const followUpRes = await api.get('/prescriptions?page=1&limit=50'); // Get more to find follow-ups
      const prescriptionsData = followUpRes.data.prescriptions || [];

      // Process follow-ups from prescriptions
      const followUpData: FollowUp[] = prescriptionsData
        .filter((p: Prescription) => p.nextFollowUp)
        .map((p: Prescription): FollowUp => {
          const followUpDate = new Date(p.nextFollowUp!);
          const todayDate = new Date();
          const timeDiff = followUpDate.getTime() - todayDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          return {
            _id: p._id,
            prescriptionId: p.prescriptionId,
            patientName: p.patientId.name,
            patientId: p.patientId.patientId,
            nextFollowUp: p.nextFollowUp!,
            daysUntilFollowUp: daysDiff,
            isOverdue: daysDiff < 0
          };
        })
        .sort((a: FollowUp, b: FollowUp) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime());

      setUpcomingFollowUps(followUpData.slice(0, 5));

      // Use the statistics from the backend
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Dashboard
        </motion.h1>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Total Patients */}
            <AnimatedCard delay={0.1} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPatients}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>

            {/* Total Prescriptions */}
            <AnimatedCard delay={0.2} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Prescriptions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPrescriptions}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>

            {/* Today's Prescriptions */}
            <AnimatedCard delay={0.3} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Prescriptions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayPrescriptions}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>

            {/* This Week */}
            <AnimatedCard delay={0.4} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">This Week</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.weekPrescriptions}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Second Row of Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Total Follow-ups */}
            <AnimatedCard delay={0.5} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Follow-ups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFollowUps}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>

            {/* Follow-ups Today */}
            <AnimatedCard delay={0.6} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Follow-ups Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.followUpsToday}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>

            {/* Overdue Follow-ups */}
            <AnimatedCard delay={0.7} className="hover-lift">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Overdue Follow-ups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdueFollowUps}</p>
                  </div>
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Follow-up Details Section */}
          <motion.div 
            className="bg-white shadow rounded-lg p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Follow-up Details</h2>
              <Link 
                to="/prescriptions/all?filter=followups" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all follow-ups →
              </Link>
            </div>
            
            {/* Follow-up Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.followUpsToday}</div>
                <div className="text-sm text-blue-800">Follow-ups Today</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{upcomingFollowUps.filter(f => f.daysUntilFollowUp <= 3 && f.daysUntilFollowUp > 0).length}</div>
                <div className="text-sm text-yellow-800">Next 3 Days</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.overdueFollowUps}</div>
                <div className="text-sm text-red-800">Overdue</div>
              </div>
            </div>

            {/* Upcoming Follow-ups List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upcoming Follow-ups</h3>
              {upcomingFollowUps.length === 0 ? (
                <p className="text-gray-500">No upcoming follow-ups</p>
              ) : (
                <div className="space-y-3">
                  {upcomingFollowUps.slice(0, 5).map((followUp) => (
                    <div key={followUp._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{followUp.patientName}</div>
                        <div className="text-sm text-gray-500">Patient ID: {followUp.patientId}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          followUp.isOverdue 
                            ? 'text-red-600' 
                            : followUp.daysUntilFollowUp === 0 
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                        }`}>
                          {followUp.isOverdue 
                            ? `${Math.abs(followUp.daysUntilFollowUp)} days overdue`
                            : followUp.daysUntilFollowUp === 0 
                              ? 'Today'
                              : `In ${followUp.daysUntilFollowUp} days`
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(followUp.nextFollowUp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {/* Recent Prescriptions */}
            <motion.div 
              className="bg-white shadow rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Prescriptions
                  </h3>
                  <Link 
                    to="/prescriptions/all" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all →
                  </Link>
                </div>
                
                {recentPrescriptions.length === 0 ? (
                  <p className="text-gray-500">No prescriptions yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentPrescriptions.map((prescription) => (
                      <div key={prescription._id} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              {prescription.patientId.name}
                            </p>
                            <p className="text-sm text-blue-600">
                              ID: {prescription.prescriptionId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600">
                              {new Date(prescription.createdAt).toLocaleDateString()}
                            </p>
                            <Link
                              to={`/prescriptions/view/${prescription._id}`}
                              className="text-xs text-blue-800 hover:text-blue-900 font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Patients */}
            <motion.div 
              className="bg-white shadow rounded-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Patients
                  </h3>
                  <Link 
                    to="/patients/search" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all →
                  </Link>
                </div>
                
                {recentPatients.length === 0 ? (
                  <p className="text-gray-500">No patients yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentPatients.map((patient) => (
                      <div key={patient._id} className="border-l-4 border-green-400 bg-green-50 p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <img
                              src={getPatientPhotoUrl(patient)}
                              alt={patient.name}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                              onError={(e) => {
                                // Fallback to avatar if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=40`;
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {patient.name}
                              </p>
                              <p className="text-sm text-green-600">
                                {patient.age} years, {patient.sex}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-600">
                              ID: {patient.patientId}
                            </p>
                            <p className="text-xs text-green-500">
                              {new Date(patient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
    </div>
  );
};

export default Dashboard;

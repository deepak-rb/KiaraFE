import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';

interface Doctor {
  id: string;
  username: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  clinicName: string;
  clinicAddress?: string;
  phone?: string;
  digitalSignature?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  doctor: Doctor | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateDoctor: (doctor: Doctor) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: Doctor }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_DOCTOR'; payload: Doctor }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, doctor: action.payload, loading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, isAuthenticated: false, doctor: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, doctor: null, loading: false, error: null };
    case 'UPDATE_DOCTOR':
      return { ...state, doctor: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  doctor: null,
  loading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const doctorData = localStorage.getItem('doctor');
    
    if (token && doctorData) {
      try {
        const doctor = JSON.parse(doctorData);
        dispatch({ type: 'LOGIN_SUCCESS', payload: doctor });
        
        // Fetch fresh doctor data from backend to ensure all fields are present
        fetchDoctorProfile();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('doctor');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const doctor = response.data.doctor;
      localStorage.setItem('doctor', JSON.stringify(doctor));
      dispatch({ type: 'UPDATE_DOCTOR', payload: doctor });
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      // If fetching fails, don't logout the user, just continue with cached data
    }
  };

  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('Making login request to:', api.defaults.baseURL + '/auth/login');
      console.log('Login data:', { username, password });
      
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response.data);
      
      const { token, doctor } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('doctor', JSON.stringify(doctor));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: doctor });
      SweetAlert.loginSuccess(doctor.name);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor');
    dispatch({ type: 'LOGOUT' });
  };

  const updateDoctor = (doctor: Doctor) => {
    localStorage.setItem('doctor', JSON.stringify(doctor));
    dispatch({ type: 'UPDATE_DOCTOR', payload: doctor });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateDoctor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../utils/validationSchemas';
import { FormInput, FormSubmitButton } from '../components/FormComponents';
import { SweetAlert } from '../utils/SweetAlert';

const Login: React.FC = () => {
  const { login } = useAuth();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
    } catch (err: any) {
      SweetAlert.error('Login Failed', err.message || 'Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mx-auto h-12 w-auto flex justify-center">
            <motion.div 
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-6 py-3 text-xl font-bold shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✚ Kiara Clinic
            </motion.div>
          </div>
          <motion.h2 
            className="mt-6 text-center text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Doctor Login
          </motion.h2>
          <motion.p 
            className="mt-2 text-center text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Sign in to your Kiara Clinic account
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ isSubmitting, isValid }) => (
              <Form className="mt-8 space-y-6 bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.4 }}
                  >
                    <FormInput
                      name="username"
                      label="Username"
                      type="text"
                      placeholder="Enter your username"
                      required
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                  >
                    <FormInput
                      name="password"
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                >
                  <FormSubmitButton
                    isSubmitting={isSubmitting}
                    isValid={isValid}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-105"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </FormSubmitButton>
                </motion.div>
              </Form>
            )}
          </Formik>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

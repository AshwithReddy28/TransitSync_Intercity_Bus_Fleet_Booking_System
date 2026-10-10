import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomerRoute, AdminRoute } from './components/ProtectedRoutes';

// Customer Pages
import HomeSearch from './pages/customer/HomeSearch';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import SeatSelectionBooking from './pages/customer/SeatSelectionBooking';
import TicketConfirmation from './pages/customer/TicketConfirmation';
import MyBookings from './pages/customer/MyBookings';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import FleetManagement from './pages/admin/FleetManagement';
import RoutesAndDrivers from './pages/admin/RoutesAndDrivers';
import TripScheduling from './pages/admin/TripScheduling';
import AdminBookings from './pages/admin/AdminBookings';
import MaintenanceManagement from './pages/admin/MaintenanceManagement';
import UsersAndAdmins from './pages/admin/UsersAndAdmins';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Customer Portal Routes */}
          <Route path="/" element={<HomeSearch />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/book/:tripId" element={<SeatSelectionBooking />} />
          <Route path="/ticket/:bookingId" element={
            <CustomerRoute>
              <TicketConfirmation />
            </CustomerRoute>
          } />
          <Route path="/my-bookings" element={
            <CustomerRoute>
              <MyBookings />
            </CustomerRoute>
          } />

          {/* Admin Portal Routes (Separate access and design) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/fleet" element={
            <AdminRoute>
              <FleetManagement />
            </AdminRoute>
          } />
          <Route path="/admin/routes" element={
            <AdminRoute>
              <RoutesAndDrivers />
            </AdminRoute>
          } />
          <Route path="/admin/trips" element={
            <AdminRoute>
              <TripScheduling />
            </AdminRoute>
          } />
          <Route path="/admin/bookings" element={
            <AdminRoute>
              <AdminBookings />
            </AdminRoute>
          } />
          <Route path="/admin/maintenance" element={
            <AdminRoute>
              <MaintenanceManagement />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <UsersAndAdmins />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

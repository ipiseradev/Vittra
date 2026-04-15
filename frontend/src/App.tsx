import { Navigate, Route, Routes } from "react-router-dom";

import { ClinicLayout } from "./layouts/ClinicLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { ClinicDashboard } from "./features/dashboard/ClinicDashboard";
import { PatientsList } from "./features/patients/PatientsList";
import { AppointmentsPage } from "./features/appointments/AppointmentsPage";
import { MedicalRecordsPage } from "./features/medical-records/MedicalRecordsPage";
import { PrescriptionsPage } from "./features/prescriptions/PrescriptionsPage";
import { BillingPage } from "./features/billing/BillingPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AttendancePage } from "./features/attendance/AttendancePage";
import { ClientsPage } from "./features/clients/ClientsPage";
import { PaymentsPage } from "./features/payments/PaymentsPage";
import { ReservationsPage } from "./features/reservations/ReservationsPage";
import { SessionsPage } from "./features/sessions/SessionsPage";
import { PrivateRoute } from "./components/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <PrivateRoute>
            <ClinicLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<ClinicDashboard />} />
        <Route path="/patients" element={<PatientsList />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/medical-records" element={<MedicalRecordsPage />} />
        <Route path="/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
} 
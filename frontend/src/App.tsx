import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingSpinner } from "./components";
import { PrivateRoute } from "./components/PrivateRoute";
import { ClinicLayout } from "./layouts/ClinicLayout";

const LoginPage = lazy(() =>
  import("./features/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  }))
);
const ClinicDashboard = lazy(() =>
  import("./features/dashboard/ClinicDashboard").then((module) => ({
    default: module.ClinicDashboard,
  }))
);
const PatientsList = lazy(() =>
  import("./features/patients/PatientsList").then((module) => ({
    default: module.PatientsList,
  }))
);
const AppointmentsPage = lazy(() =>
  import("./features/appointments/AppointmentsPage").then((module) => ({
    default: module.AppointmentsPage,
  }))
);
const MedicalRecordsPage = lazy(() =>
  import("./features/medical-records/MedicalRecordsPage").then((module) => ({
    default: module.MedicalRecordsPage,
  }))
);
const PrescriptionsPage = lazy(() =>
  import("./features/prescriptions/PrescriptionsPage").then((module) => ({
    default: module.PrescriptionsPage,
  }))
);
const BillingPage = lazy(() =>
  import("./features/billing/BillingPage").then((module) => ({
    default: module.BillingPage,
  }))
);
const SettingsPage = lazy(() =>
  import("./features/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  }))
);
const AttendancePage = lazy(() =>
  import("./features/attendance/AttendancePage").then((module) => ({
    default: module.AttendancePage,
  }))
);
const PaymentsPage = lazy(() =>
  import("./features/payments/PaymentsPage").then((module) => ({
    default: module.PaymentsPage,
  }))
);
const ReservationsPage = lazy(() =>
  import("./features/reservations/ReservationsPage").then((module) => ({
    default: module.ReservationsPage,
  }))
);
const SessionsPage = lazy(() =>
  import("./features/sessions/SessionsPage").then((module) => ({
    default: module.SessionsPage,
  }))
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingSpinner fullscreen />}>{element}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={withSuspense(<LoginPage />)} />

      <Route
        element={
          <PrivateRoute>
            <ClinicLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={withSuspense(<ClinicDashboard />)} />
        <Route path="/patients" element={withSuspense(<PatientsList />)} />
        <Route path="/appointments" element={withSuspense(<AppointmentsPage />)} />
        <Route
          path="/medical-records"
          element={withSuspense(<MedicalRecordsPage />)}
        />
        <Route path="/prescriptions" element={withSuspense(<PrescriptionsPage />)} />
        <Route path="/billing" element={withSuspense(<BillingPage />)} />
        <Route path="/settings" element={withSuspense(<SettingsPage />)} />
        <Route path="/attendance" element={withSuspense(<AttendancePage />)} />
        <Route path="/clients" element={<Navigate to="/patients" replace />} />
        <Route path="/payments" element={withSuspense(<PaymentsPage />)} />
        <Route path="/reservations" element={withSuspense(<ReservationsPage />)} />
        <Route path="/sessions" element={withSuspense(<SessionsPage />)} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

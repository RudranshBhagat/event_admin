import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ThankYou from './pages/ThankYou.jsx';
import RetrieveTicket from './pages/RetrieveTicket.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminScanner from './pages/admin/AdminScanner.jsx';

export default function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<LandingPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/retrieve-ticket" element={<RetrieveTicket />} /> */}
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin/scan" element={<AdminScanner />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-900 px-6 text-center">
      <p className="label-eyebrow">404</p>
      <h1 className="font-display text-4xl text-bone-100">Page not found</h1>
      <a href="/" className="btn-secondary mt-4">Back home</a>
    </div>
  );
}

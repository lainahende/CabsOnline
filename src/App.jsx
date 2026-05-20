import { Routes, Route, NavLink } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import TrackerPage from './pages/TrackerPage';
import DriverPage from './pages/DriverPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <>
      <nav>
        <NavLink to="/" className="brand">
          🚕 CabsOnline
        </NavLink>
        <NavLink to="/" end>
          Book a Cab
        </NavLink>
        <NavLink to="/track">Track Booking</NavLink>
        <NavLink to="/driver">Driver Panel</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/track" element={<TrackerPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  );
}

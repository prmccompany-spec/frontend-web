import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ToastContainer from './components/Toast/ToastContainer';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
        <Footer />
        <ToastContainer />
      </AuthProvider>
    </Router>
  );
}

export default App;

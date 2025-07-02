import { useNavigate } from 'react-router-dom';
import './Header.css';
import espeLogo from '../assets/espe-logo.png';
import { useEffect, useState } from 'react';

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");

  // Actualiza el rol cada vez que el usuario cambia
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    } else {
      setRole("user");
    }
  }, [user]);

  // Maneja el cierre de sesión
  const handleLogout = () => {
    if (onLogout) {
      onLogout(); // Limpia la sesión desde App.jsx
    }
    navigate("/login"); // Redirige al login
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={espeLogo} alt="ESPE Logo" className="logo-espe" />
      </div>

      <div className="header-center">
        <button className="header-btn" onClick={() => navigate('/')}>
          Analyze Cyber Grooming and Cyber Sexting
        </button>

        {role === "admin" && (
          <>
            <button className="header-btn" onClick={() => navigate('/historial')}>
              History
            </button>
            <button className="header-btn" onClick={() => navigate('/users')}>
              User Management
            </button>
          </>
        )}
      </div>

      <div className="header-right">
        <span style={{ marginRight: "1rem", fontWeight: "bold", color: "#fff" }}>
          Role: {role}
        </span>
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}

export default Header;

import { useNavigate } from 'react-router-dom';
import './Header.css';
import espeLogo from '../assets/espe-logo.png';
import { useEffect, useState } from 'react';

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    } else {
      setRole("user");
    }
  }, [user]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
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
          <button className="header-btn" onClick={() => navigate('/auditoria')}>
            Audit Log
          </button>
          <button className="header-btn" onClick={() => navigate('/dashboard')}>
            Reports & Dashboard
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

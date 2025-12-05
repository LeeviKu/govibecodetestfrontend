import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export function HomePage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>GoTest Frontend</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      <main className="home-main">
        <p>Welcome! You are logged in.</p>
      </main>
    </div>
  );
}

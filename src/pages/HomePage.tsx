import { useAuth } from '../context/AuthContext';
import { FileExplorer } from '../components/FileExplorer';
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
        <FileExplorer />
      </main>
    </div>
  );
}

import "./top-bar.css"
import { Link, useNavigate } from "react-router-dom";

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="top-bar">
      <div 
        className="top-bar-brand" 
        onClick={() => navigate("/")}
      >
        📡 NetSim
      </div>

      <nav 
        className="top-bar-nav"
      >
        <Link to="/">Editor</Link>
      </nav>

      <div 
        className="top-bar-actions"
      >
        <button 
        className="btn btn-primary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
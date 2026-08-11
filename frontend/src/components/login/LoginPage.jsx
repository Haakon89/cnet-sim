import "./login-page.css"
export default function LoginPage() {
  const loginWithGoogle = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  const loginWithMicrosoft = () => {
    window.location.href = "http://localhost:3000/api/auth/microsoft";
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <div className="login-icon">🧪</div>
          <h1>Network Simulation Lab</h1>
          <p>
            Log in to create and run your own isolated simulation environment.
            Work in progress, go to http://localhost:5173/ for the app
          </p>
        </div>

        <div className="login-actions">
          <button 
            className="btn btn-full btn-primary" 
            onClick={loginWithGoogle}
          >
            <span>G</span>
            Continue with Google
          </button>

          <button
            className="btn btn-full btn-primary"
            onClick={loginWithMicrosoft}
          >
            <span>▦</span>
            Continue with Microsoft
          </button>
        </div>

        <div className="login-note">
          Use your university account if available.
        </div>
      </section>
    </main>
  );
}
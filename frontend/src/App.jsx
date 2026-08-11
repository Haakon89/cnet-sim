import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/login/LoginPage";
import TopologyEditor from "./components/topology/TopologyEditor";
import RunEnvironmentPage from "./components/run/RunEnvironmentPage";
import InteractiveModePage from "./components/interactive/InteractiveModePage";
import AnimationPage from "./components/animation/AnimationPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopologyEditor />} />
        <Route path="/run/:runId" element={<RunEnvironmentPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/interactive/:runId" element={<InteractiveModePage />} />
        <Route path="/animation/" element={<AnimationPage />} />
      </Routes>
    </BrowserRouter>
  );
}
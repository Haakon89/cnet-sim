import "@xyflow/react/dist/style.css";
import Sidebar from "./Sidebar";
import TopologyCanvas from "./TopologyCanvas";
import { useTopologyState } from "../../hooks/useTopologyState";
//combines the graphical elements and runs the scripts to build the pages
export default function TopologyEditor() {
  const topology = useTopologyState();

  return (
    <div className="app-layout">
      <Sidebar {...topology} />
      <TopologyCanvas {...topology} />
    </div>
  );
}
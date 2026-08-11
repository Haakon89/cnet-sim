import "@xyflow/react/dist/style.css";
import AnimationSidebar from "./AnimationSidebar";
import AnimationCanvas from "./AnimationCanvas";
import { useAnimationState } from "../../hooks/useAnimationState"
//combines the graphical elements and runs the scripts to build the page
export default function AnimationPage() {
  const animator = useAnimationState();
  return (
    <div className="app-layout">
      <AnimationSidebar {...animator} />
      <AnimationCanvas {...animator} />
    </div>
  );
}
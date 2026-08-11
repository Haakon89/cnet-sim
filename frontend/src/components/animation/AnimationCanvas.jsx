import "./animation-page.css"
import {
  ReactFlow,
  Background,
  Controls,
} from "@xyflow/react";

import PacketLayer from "./PacketLayer";

export default function AnimationCanvas({
  nodes = [],
  edges = [],
  nodeTypes,
  packets = [],
  currentTime = 0,
  onPacketClick = () => {},
  onNodeClick = () => {},
}) { 

  return (
    <main className="canvas-area animation-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(event, node) => onNodeClick(node.id)}
        onPaneClick={() => onNodeClick(null)}
        defaultEdgeOptions={{
          type: "straight",
        }}
        fitView
      >

        <PacketLayer
        nodes={nodes}
        packets={packets}
        
        currentTime={currentTime}
        onPacketClick={onPacketClick}
        />

        <Background />
        <Controls />
      </ReactFlow>
    </main>
  );
}
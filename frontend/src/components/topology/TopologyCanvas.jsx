import {
  ReactFlow,
  Background,
  Controls,
} from "@xyflow/react";

//interactive canvas used to display the network topologies
export default function TopologyCanvas({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  setSelectedNodes,
  setInspectedNodeId,
  setSelectedEdgeId,
}) {
  return (
    <main className="canvas-area">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={({ nodes, edges }) => {
          setSelectedNodes(nodes);

          if (nodes.length === 1) {
            setInspectedNodeId(nodes[0].id);
            setSelectedEdgeId(null);
          } else {
            setInspectedNodeId(null);
          }

          if (edges.length === 1) {
            setSelectedEdgeId(edges[0].id);
            setInspectedNodeId(null);
          } else {
            setSelectedEdgeId(null);
          }
        }}
        fitView
      >

        <Background />
        <Controls />
      </ReactFlow>
    </main>
  );
}
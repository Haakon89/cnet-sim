import { useEffect, useMemo, useRef, useState } from "react";
import NodeGraphic from "../components/topology/NodeGraphic";
import { loadAnimations, loadAnimation } from "../api/animationApi";
import {
  buildCanvasElements,
} from "../utils/animationGraphicsBuilder";

const initialNodes = [];
const initialEdges = [];

export function useAnimationState() {
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);

  const [playbackDuration, setPlaybackDuration] = useState(5000);

  const [animations, setAnimations] = useState([]);
  const [selectedAnimation, setSelectedAnimation] = useState("");
  const [loadedAnimation, setLoadedAnimation] = useState("");

  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edges, setEdges] = useState(initialEdges);
  const [networks, setNetworks] = useState([]);
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);

  const previousFrameTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  

  const nodeTypes = useMemo(
    () => ({
      roleNode: NodeGraphic,
    }),
    []
  );

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  const playbackSpeed = useMemo(() => {
    if (maxTime <= 0 || playbackDuration <= 0) {
      return 1;
    }

    return maxTime / playbackDuration;
  }, [maxTime, playbackDuration]);

  useEffect(() => {
    async function fetchAnimations() {
      try {
        const data = await loadAnimations();
        const animationList = data.animations ?? [];

        setAnimations(animationList);
        setSelectedAnimation(animationList[0] ?? "");
      } catch {
        alert("Failed to load animations");
      }
    }

    fetchAnimations();
  }, []);

  async function loadSelectedAnimation() {
    if (!selectedAnimation) return;

    try {
      const animationJson = await loadAnimation(selectedAnimation);
      const canvas = buildCanvasElements(animationJson);

      setNodes(canvas.nodes);
      setEdges(canvas.edges);
      setNetworks(canvas.networks);
      setPackets(canvas.packets);
      setMaxTime(canvas.maxTime);
      setCurrentTime(0);
      setIsPlaying(false);

      setSelectedNodeId(null);
      setSelectedPacket(null);

      setLoadedAnimation(selectedAnimation);
    } catch {
      alert("Failed to load selected animation");
    }
  }

  useEffect(() => {
    if (!isPlaying) {
      previousFrameTimeRef.current = null;
      return;
    }

    function animate(frameTime) {
      if (previousFrameTimeRef.current === null) {
        previousFrameTimeRef.current = frameTime;
      }

      const elapsedRealMilliseconds =
        frameTime - previousFrameTimeRef.current;

      previousFrameTimeRef.current = frameTime;

      setCurrentTime((time) => {
        const nextTime = time + elapsedRealMilliseconds * playbackSpeed;

        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }

        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      previousFrameTimeRef.current = null;
    };
  }, [isPlaying, playbackSpeed, maxTime]);

  function togglePlayback() {
    if (currentTime >= maxTime) {
      setCurrentTime(0);
    }

    setIsPlaying((playing) => !playing);
  }

  function restartAnimation() {
    setIsPlaying(false);
    setCurrentTime(0);
  }

  return {
    animations,
    selectedAnimation,
    setSelectedAnimation,
    loadSelectedAnimation,
    loadedAnimation,

    nodes,
    edges,
    nodeTypes,
    networks,
    packets,

    currentTime,
    setCurrentTime,
    maxTime,

    isPlaying,
    setIsPlaying,
    togglePlayback,
    restartAnimation,

    playbackDuration,
    setPlaybackDuration,
    playbackSpeed,

    selectedNodeId,
    selectedNode,
    setSelectedNodeId,
    onNodeClick: setSelectedNodeId,

    selectedPacket,
    setSelectedPacket,
    onPacketClick: setSelectedPacket,
  };
}
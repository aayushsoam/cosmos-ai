import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import './MindMap.css';

interface MindMapNode {
  id: string;
  label: string;
  content: string;
  children?: MindMapNode[];
  x?: number;
  y?: number;
  collapsed?: boolean;
}

interface MindMapProps {
  data: MindMapNode;
  onNodeClick: (node: MindMapNode) => void;
  selectedNode: MindMapNode | null;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, selectedNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewState, setViewState] = useState({ scale: 0.9, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [is3D, setIs3D] = useState(false); // New 3D State

  // Initialize expanded state
  useEffect(() => {
    if (data) {
      const initialExpanded = new Set(['root']);
      if (data.id) initialExpanded.add(data.id);
      if (data.children) {
        data.children.forEach(child => initialExpanded.add(child.id));
      }
      setExpandedNodes(initialExpanded);
    }
  }, [data]);

  // Handle Resize and Initial Centering
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
        if (viewState.x === 0 && viewState.y === 0) {
          setViewState(prev => ({ ...prev, x: clientWidth / 2, y: clientHeight / 2 }));
        }
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // --- Layout Algorithm ---
  const calculateLayout = useCallback((root: MindMapNode, expandedSet: Set<string>) => {
    const LEVEL_WIDTH = 300;
    const NODE_HEIGHT = 80;

    if (!root) return { nodes: [], links: [] };

    const hierarchy = JSON.parse(JSON.stringify(root));
    const nodes: any[] = [];
    const links: any[] = [];

    const traverse = (node: any, depth: 0, parent: any = null) => {
      node.depth = depth;
      node.parent = parent;
      nodes.push(node);

      if (node.children && expandedSet.has(node.id)) {
        node.children.forEach((child: any) => traverse(child, depth + 1, node));
      } else {
        node.children = null;
      }
    };
    traverse(hierarchy, 0);

    let leafIndex = 0;
    const assignLeafY = (node: any) => {
      if (!node.children || node.children.length === 0) {
        node.y = leafIndex * NODE_HEIGHT;
        leafIndex++;
      } else {
        node.children.forEach(assignLeafY);
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.y = (firstChild.y + lastChild.y) / 2;
      }
    };
    assignLeafY(hierarchy);

    const totalHeight = leafIndex * NODE_HEIGHT;
    const yOffset = -totalHeight / 2;

    const finalize = (node: any) => {
      node.targetX = node.depth * LEVEL_WIDTH;
      node.targetY = node.y + yOffset;

      if (node.children) {
        node.children.forEach((child: any) => {
          links.push({ source: node, target: child });
          finalize(child);
        });
      }
    };
    finalize(hierarchy);

    return { nodes, links };
  }, []);

  const { nodes: plottedNodes, links: plottedLinks } = useMemo(() => {
    return calculateLayout(data, expandedNodes);
  }, [data, expandedNodes, calculateLayout]);

  // --- Interactions ---

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const scaleFactor = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? viewState.scale * scaleFactor : viewState.scale / scaleFactor;
      const clampedScale = Math.max(0.1, Math.min(newScale, 5));
      setViewState(prev => ({ ...prev, scale: clampedScale }));
    } else {
      setViewState(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const startPan = (e: React.MouseEvent) => {
    if ((e.target as Element).tagName === 'svg' || (e.target as Element).id === 'mindmap-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    }
  };

  const doPan = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewState(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const endPan = () => setIsDragging(false);

  const toggleNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    doPan(e);
    if (hoveredNode) {
      setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
    }
  };

  // --- Rendering ---
  const renderLink = (link: any) => {
    const { source, target } = link;
    const sourceX = source.targetX + (source.depth === 0 ? 125 : 100);
    const targetX = target.targetX - 100;
    const sourceY = source.targetY;
    const targetY = target.targetY;

    const midX = (sourceX + targetX) / 2;
    const d = `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;

    return (
      <path
        key={`link-${source.id}-${target.id}`}
        d={d}
        className="mindmap-link"
        stroke="#4f46e5"
        strokeWidth={Math.max(1, 3 - source.depth * 0.5)}
        opacity={0.6}
      />
    );
  };

  const renderNode = (node: any) => {
    const isRoot = node.depth === 0;
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = findNodeInTree(data, node.id)?.children?.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    const width = isRoot ? 250 : 200;
    const height = isRoot ? 80 : 60;
    const cornerRadius = 10;

    return (
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.targetX}, ${node.targetY})`}
        className="mindmap-node-group"
        onClick={e => {
          e.stopPropagation();
          onNodeClick(findNodeInTree(data, node.id) || node);
        }}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        style={
          is3D
            ? { transform: `translate3d(${node.targetX}px, ${node.targetY}px, ${isSelected ? 50 : 0}px)` }
            : undefined
        } // Add depth in 3D mode
      >
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={cornerRadius}
          className={`mindmap-node-rect ${isRoot ? 'root' : ''} ${isSelected ? 'selected' : ''}`}
        />

        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          className="mindmap-label"
          fontSize={isRoot ? 16 : 13}>
          {node.label.length > 25 ? node.label.substring(0, 25) + '...' : node.label}
        </text>

        {hasChildren && !isRoot && (
          <g
            className="mindmap-expander"
            transform={`translate(${width / 2}, 0)`}
            onClick={e => toggleNode(e, node.id)}
            style={{ cursor: 'pointer' }}>
            <circle r={9} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <text y={1} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={14} fontWeight="bold">
              {isExpanded ? '-' : '+'}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`mindmap-container ${is3D ? 'view-3d' : ''}`} // Apply 3D class
      onWheel={handleWheel}
      onMouseDown={startPan}
      onMouseMove={handleMouseMove}
      onMouseUp={endPan}
      onMouseLeave={endPan}>
      <div id="mindmap-bg" style={{ position: 'absolute', inset: 0 }} />

      <svg
        ref={svgRef}
        className="mindmap-svg"
        viewBox={`${-viewState.x + dimensions.width / 2} ${-viewState.y + dimensions.height / 2} ${dimensions.width} ${dimensions.height}`}
        style={
          is3D
            ? {
                transform: 'rotateX(25deg) rotateY(0deg) scale(0.9)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s ease',
              }
            : { transition: 'transform 0.5s ease' }
        }>
        <g
          transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}
          style={{ transformStyle: 'preserve-3d' }}>
          {plottedLinks.map(renderLink)}
          {plottedNodes.map(renderNode)}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredNode && !isDragging && (
        <div className={`mindmap-tooltip visible`} style={{ top: tooltipPos.y, left: tooltipPos.x }}>
          <div className="mindmap-tooltip-title">{hoveredNode.label}</div>
          <div className="mindmap-tooltip-content">{hoveredNode.content}</div>
        </div>
      )}

      {/* 3D Toggle */}
      <div className="view-controls" style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
        <button
          className={`view-btn ${is3D ? 'active' : ''}`}
          onClick={() => setIs3D(!is3D)}
          style={{
            background: is3D ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.6)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            backdropFilter: 'blur(8px)',
            boxShadow: is3D ? '0 0 15px rgba(99, 102, 241, 0.5)' : 'none',
            transition: 'all 0.3s ease',
          }}>
          {is3D ? 'Default View' : '3D View'}
        </button>
      </div>

      {/* Controls */}
      <button
        className="fit-btn"
        onClick={() => setViewState({ x: dimensions.width / 2, y: dimensions.height / 2, scale: 0.9 })}>
        ⌂ Recenter
      </button>

      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => setViewState(s => ({ ...s, scale: Math.min(s.scale * 1.2, 5) }))}>
          +
        </button>
        <button className="zoom-btn" onClick={() => setViewState(s => ({ ...s, scale: Math.max(s.scale / 1.2, 0.1) }))}>
          −
        </button>
      </div>
    </div>
  );
};

// Helper: Find original data node
function findNodeInTree(root: any, id: string): any {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeInTree(child, id);
      if (found) return found;
    }
  }
  return null;
}

export default MindMap;

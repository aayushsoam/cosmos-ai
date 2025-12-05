import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import './MindMap.css';

interface MindMapNode {
  id: string;
  label: string;
  content: string;
  children?: MindMapNode[];
  x?: number;
  y?: number;
  aiAnswer?: string;
}

interface MindMapProps {
  data: MindMapNode;
  onNodeClick: (node: MindMapNode) => void;
  selectedNode: MindMapNode | null;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, selectedNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate positions for left-to-right layout (like notebook LLM)
  const calculatePositions = useCallback(
    (
      node: MindMapNode,
      level: number = 0,
      index: number = 0,
      siblings: number = 1,
      parentY?: number,
      startY?: number,
      height: number = 800,
    ): { node: MindMapNode; totalHeight: number } => {
      const horizontalSpacing = 300; // Space between columns (increased for better spacing)
      const verticalSpacing = 100; // Space between nodes in same column (increased)
      const startX = 80; // Left margin
      const startYPos = 120; // Top margin

      let currentY = startY || startYPos;
      let totalHeight = 0;

      // Calculate node position
      node.x = startX + level * horizontalSpacing;

      if (level === 0) {
        // Root node - center vertically
        node.y = height / 2;
        totalHeight = 60; // Node height
      } else {
        // Calculate vertical position based on siblings
        if (parentY !== undefined && startY !== undefined) {
          // Position relative to parent and siblings
          const siblingOffset = (index - (siblings - 1) / 2) * verticalSpacing;
          node.y = parentY + siblingOffset;
        } else {
          node.y = currentY;
        }
        totalHeight = 50; // Node height
      }

      // Process children
      let childrenHeight = 0;
      if (node.children && node.children.length > 0) {
        let childStartY = node.y - ((node.children.length - 1) * verticalSpacing) / 2;

        node.children = node.children.map((child, i) => {
          const result = calculatePositions(
            child,
            level + 1,
            i,
            node.children!.length,
            node.y,
            childStartY + i * verticalSpacing,
            height,
          );
          childrenHeight = Math.max(childrenHeight, result.totalHeight);
          return result.node;
        });
      }

      totalHeight = Math.max(totalHeight, childrenHeight);
      return { node, totalHeight };
    },
    [],
  );

  const positionedData = useMemo(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      try {
        const clonedData = JSON.parse(JSON.stringify(data));
        return calculatePositions(clonedData, 0, 0, 1, undefined, undefined, dimensions.height).node;
      } catch (error) {
        console.error('Error calculating positions:', error);
        return data;
      }
    }
    return data;
  }, [data, dimensions.width, dimensions.height]);

  const getNodeColor = (level: number, isRoot: boolean): string => {
    // Match image style - all nodes have dark background
    return '#1f2937'; // Dark grey for all nodes
  };

  const getNodeStrokeColor = (level: number, isRoot: boolean): string => {
    // Match image style - subtle borders
    if (isRoot) return '#4b5563';
    if (level === 1) return '#4b5563';
    if (level === 2) return '#4b5563';
    return '#6b7280'; // Lighter stroke for detail nodes
  };

  const renderNode = (node: MindMapNode, parent?: MindMapNode, level: number = 0): React.ReactNode => {
    if (!node.x || !node.y) return null;

    const isSelected = selectedNode?.id === node.id;
    const isRoot = node.id === 'root';
    const hasChildren = node.children && node.children.length > 0;

    // Node dimensions - match image style
    const boxWidth = isRoot ? 280 : level === 1 ? 200 : level === 2 ? 180 : 160;
    const boxHeight = isRoot ? 60 : level <= 2 ? 50 : 45;
    const cornerRadius = 6;

    const nodeColor = getNodeColor(level, isRoot);
    const strokeColor = isSelected ? '#3b82f6' : getNodeStrokeColor(level, isRoot);

    // Calculate curved path for connection
    const getCurvedPath = (): string => {
      if (!parent || !parent.x || !parent.y) return '';

      const startX = parent.x + (isRoot ? 110 : 80);
      const startY = parent.y;
      const endX = node.x;
      const endY = node.y;

      // Create a smooth curve
      const controlX1 = startX + (endX - startX) * 0.5;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.5;
      const controlY2 = endY;

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    };

    return (
      <g key={node.id}>
        {/* Draw curved line from parent to child with arrow */}
        {parent && parent.x && parent.y && (
          <path
            d={getCurvedPath()}
            fill="none"
            stroke={isSelected ? '#3b82f6' : '#6b7280'}
            strokeWidth={isSelected ? '2.5' : '1.5'}
            className="mindmap-line"
            opacity="0.6"
            markerEnd="url(#arrowhead)"
          />
        )}

        {/* Node rectangle (notebook LLM style) */}
        <rect
          x={node.x}
          y={node.y - boxHeight / 2}
          width={boxWidth}
          height={boxHeight}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={isSelected ? '#3b82f6' : nodeColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? '3' : '2'}
          className="mindmap-node"
          onClick={() => onNodeClick(node)}
          style={{ cursor: 'pointer' }}
        />

        {/* Node label text - wrap long text */}
        <text
          x={node.x + boxWidth / 2}
          y={node.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={isRoot ? '15' : level === 1 ? '13' : level === 2 ? '12' : '11'}
          fontWeight={isRoot ? 'bold' : level <= 1 ? '600' : 'normal'}
          className="mindmap-label"
          onClick={() => onNodeClick(node)}
          style={{ cursor: 'pointer', pointerEvents: 'none' }}>
          {node.label.length > 30 ? node.label.substring(0, 27) + '...' : node.label}
        </text>

        {/* Expand indicator (+) for nodes with children - match image style */}
        {hasChildren && (
          <text
            x={node.x + boxWidth - 15}
            y={node.y - boxHeight / 2 + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#9ca3af"
            fontSize="16"
            fontWeight="bold"
            className="expand-indicator"
            style={{ pointerEvents: 'none' }}>
            +
          </text>
        )}

        {/* Render children */}
        {node.children?.map((child, i) => renderNode(child, node, level + 1))}
      </g>
    );
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="mindmap-container">
      <svg
        ref={svgRef}
        className="mindmap-svg"
        width="100%"
        height="100%"
        viewBox={dimensions.width > 0 ? `0 0 ${dimensions.width} ${dimensions.height}` : '0 0 1200 800'}
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left',
        }}>
        {dimensions.width > 0 && positionedData && renderNode(positionedData, undefined, 0)}
      </svg>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
          +
        </button>
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
          −
        </button>
        <button className="zoom-btn" onClick={handleZoomReset} title="Reset Zoom">
          ⌂
        </button>
      </div>
    </div>
  );
};

export default MindMap;

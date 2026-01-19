// src/components/MindNode.tsx
import { MindMapNode } from "../types/mindMap";

interface Props {
  node: MindMapNode;
  onToggle: (node: MindMapNode) => void;
}

const colors: Record<string, string> = {
  root: "#0f172a",
  primary: "#0284c7",
  danger: "#dc2626",
};

export default function MindNode({ node, onToggle }: Props) {
  return (
    <g onClick={() => onToggle(node)} style={{ cursor: "pointer" }}>
      <rect
        x={node.x}
        y={node.y}
        rx={12}
        ry={12}
        width={260}
        height={40}
        fill="#e0f2fe"
        stroke={colors[node.category || "primary"]}
        strokeWidth={2}
      />
      <text
        x={(node.x ?? 0) + 130}
        y={(node.y ?? 0) + 26}
        textAnchor="middle"
        fontSize={14}
        fill="#0f172a"
      >
        {node.label}
      </text>
    </g>
  );
}

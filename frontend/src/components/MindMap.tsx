// src/components/MindMap.tsx
import { useState } from "react";
import { MindMapNode } from "../types/mindMap";
import MindNode from "./MindNode";
import useZoomPan from "./useZoomPan";

const NODE_W = 260;
const NODE_H = 40;
const X_GAP = 140;
const Y_GAP = 70;

const layoutTree = (
  node: MindMapNode,
  depth = 0,
  yRef = { y: 0 }
) => {
  node.x = depth * (NODE_W + X_GAP);

  if (!node.children || !node.expanded) {
    node.y = yRef.y;
    yRef.y += NODE_H + Y_GAP;
  } else {
    const childYs: number[] = [];
    node.children.forEach((child) => {
      layoutTree(child, depth + 1, yRef);
      if (child.y !== undefined) childYs.push(child.y);
    });
    node.y = (Math.min(...childYs) + Math.max(...childYs)) / 2;
  }
};

const flattenTree = (node: MindMapNode, arr: MindMapNode[] = []) => {
  arr.push(node);
  if (node.expanded) {
    node.children?.forEach((c) => flattenTree(c, arr));
  }
  return arr;
};

interface Props {
  data: MindMapNode;
}

export default function MindMap({ data }: Props) {
  const [tree, setTree] = useState<MindMapNode>(structuredClone(data));
  const { scale, offset, onWheel, onMouseDown } = useZoomPan();

  layoutTree(tree);
  const nodes = flattenTree(tree);

  const toggleNode = (node: MindMapNode) => {
    node.expanded = !node.expanded;
    setTree({ ...tree });
  };

  return (
    <svg
      width="100%"
      height="600"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      style={{ background: "#f8fafc", borderRadius: 12 }}
    >
      <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
        {/* Lines */}
        {nodes.map(
          (n) =>
            n.expanded &&
            n.children?.map((c) => (
              <line
                key={`${n.id}-${c.id}`}
                x1={(n.x ?? 0) + NODE_W}
                y1={(n.y ?? 0) + NODE_H / 2}
                x2={c.x ?? 0}
                y2={(c.y ?? 0) + NODE_H / 2}
                stroke="#94a3b8"
                strokeWidth={2}
              />
            ))
        )}

        {/* Nodes */}
        {nodes.map((n) => (
          <MindNode key={n.id} node={n} onToggle={toggleNode} />
        ))}
      </g>
    </svg>
  );
}

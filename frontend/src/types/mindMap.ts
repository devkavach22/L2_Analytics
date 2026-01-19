// src/types/mindMap.ts
export interface MindMapNode {
  id: string;
  label: string;
  category?: "root" | "primary" | "danger";
  expanded?: boolean;
  x?: number;
  y?: number;
  children?: MindMapNode[];
}

// src/data/mindMapData.ts
import { MindMapNode } from "../types/mindMap";

export const mindMapData: MindMapNode = {
  id: "root",
  label: "Hello World: Being Human in the Age of Algorithms",
  category: "root",
  expanded: true,
  children: [
    {
      id: "foundations",
      label: "Foundations",
      category: "primary",
      expanded: true,
      children: [
        {
          id: "hm",
          label: "Human–Machine Partnership",
        },
      ],
    },
    {
      id: "power",
      label: "Power and Control",
      category: "primary",
      expanded: true,
      children: [
        { id: "trust", label: "Algorithm Aversion vs Over-trust" },
        { id: "authority", label: "Redressing Authority Bias" },
        { id: "transparency", label: "Redesigning for Transparency" },
      ],
    },
    {
      id: "justice",
      label: "Justice and Law",
      category: "danger",
      expanded: true,
      children: [
        { id: "bias", label: "Judicial Inconsistency" },
        { id: "compas", label: "Recidivism Risk Scores (COMPAS)" },
        { id: "predpol", label: "Predictive Policing (PredPol)" },
      ],
    },
  ],
};

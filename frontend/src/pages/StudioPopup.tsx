// components/StudioPopup.tsx
import React from "react";

interface StudioPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const studioButtons = [
  { label: "Audio Overview", color: "bg-blue-50 text-blue-700", icon: "🎵" },
  { label: "Video Overview", color: "bg-green-50 text-green-700", icon: "🎥" },
  { label: "Mind Map", color: "bg-purple-50 text-purple-700", icon: "🧠" },
  { label: "Reports", color: "bg-yellow-50 text-yellow-700", icon: "📄" },
  { label: "Flashcards", color: "bg-pink-50 text-pink-700", icon: "📇" },
  { label: "Quiz", color: "bg-cyan-50 text-cyan-700", icon: "❓" },
  {
    label: "Infographic",
    color: "bg-indigo-50 text-indigo-700",
    icon: "📊",
    beta: true,
  },
  {
    label: "Slide Deck",
    color: "bg-gray-50 text-gray-700",
    icon: "🖼️",
    beta: true,
  },
  {
    label: "Folder Search",
    color: "bg-purple-50 text-purple-700",
    icon: "📊",
    beta: true,
  },
  {
    label: "Web Search",
    color: "bg-cyan-50 text-cyan-700",
    icon: "🖼️",
    beta: true,
  },
];

const StudioPopup: React.FC<StudioPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl h-full p-6 overflow-y-auto transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Studio</h2>
          <button
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {studioButtons.map((btn) => (
            <button
              key={btn.label}
              className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition duration-150 font-medium ${btn.color}`}
            >
              <span>{btn.label}</span>
              <span className="ml-2">
                {btn.beta ? (
                  <span className="text-xs font-bold border px-1 rounded">
                    BETA
                  </span>
                ) : (
                  btn.icon
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudioPopup;

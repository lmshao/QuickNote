import { useEffect, useRef, type ReactNode } from "react";
import "./ContextMenu.css";

export interface ContextMenuAction {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Delay to avoid the triggering right-click itself closing the menu
    setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("contextmenu", handleClick);
      document.addEventListener("keydown", handleKey);
    }, 0);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Clamp position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - actions.length * 36 - 8);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          className={`context-menu-item ${action.danger ? "danger" : ""}`}
          onClick={() => {
            action.onClick();
            onClose();
          }}
        >
          {action.icon && <span className="context-menu-icon">{action.icon}</span>}
          <span className="context-menu-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

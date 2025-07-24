import type { ReactNode } from "react";

interface ToolTipProps {
  text: string;
  children: ReactNode;
  position?: "top" | "right" | "bottom" | "left";
}

export default function ToolTip({ text, children, position = "top" }: ToolTipProps) {
  return (
    <div className="group relative flex justify-center items-center">
      {children}
      <span className={`absolute z-50 hidden group-hover:block text-xs bg-black text-white px-2 py-1 rounded whitespace-nowrap
        ${position === "top" ? "bottom-full mb-2" :
          position === "right" ? "left-full ml-2" :
          position === "bottom" ? "top-full mt-2" :
          "right-full mr-2"
        }
      `}>
        {text}
      </span>
    </div>
  );
}

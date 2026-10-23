import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function Notice({ type = "info", children, onClose }) {
  const Icon = type === "error" ? AlertCircle : type === "success" ? CheckCircle2 : Info;
  return (
    <div className={`notice notice-${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon size={17} />
      <span>{children}</span>
      {onClose && <button aria-label="Cerrar mensaje" onClick={onClose}>×</button>}
    </div>
  );
}

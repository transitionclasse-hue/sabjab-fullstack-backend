import React from "react";

const STATUS_STYLES = {
  available: { bg: "#dbeafe", color: "#1d4ed8", label: "ACTIVE - NEW" },
  assigned: { bg: "#fef3c7", color: "#92400e", label: "ACTIVE - ASSIGNED" },
  confirmed: { bg: "#ffedd5", color: "#9a3412", label: "ACTIVE - ACCEPTED" },
  arriving: { bg: "#ede9fe", color: "#5b21b6", label: "ACTIVE - OUT FOR DELIVERY" },
  at_location: { bg: "#cffafe", color: "#155e75", label: "ACTIVE - AT LOCATION" },
  delivered: { bg: "#dcfce7", color: "#166534", label: "DELIVERED" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "CANCELLED" },
};

const baseBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  fontWeight: 800,
  fontSize: "11px",
  letterSpacing: "0.3px",
  whiteSpace: "nowrap",
};

const normalizeStatus = (status) => String(status || "").toLowerCase().trim();

const getStatusConfig = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_STYLES[normalized] || {
    bg: "#e5e7eb",
    color: "#374151",
    label: normalized ? normalized.toUpperCase() : "UNKNOWN",
  };
};

const OrderStatusBadge = ({ record }) => {
  const status = record?.params?.status;
  const config = getStatusConfig(status);

  return (
    <span
      style={{
        ...baseBadgeStyle,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
};

export default OrderStatusBadge;

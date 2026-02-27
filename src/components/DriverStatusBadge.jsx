import React from "react";

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

const DriverStatusBadge = ({ record }) => {
    const driver = record?.params?.deliveryPartner;
    const isAssigned = !!driver;

    if (isAssigned) {
        return (
            <span
                style={{
                    ...baseBadgeStyle,
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                }}
            >
                ✅ DRIVER ASSIGNED
            </span>
        );
    }

    return (
        <span
            style={{
                ...baseBadgeStyle,
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #991b1b",
            }}
        >
            🚨 NOT ASSIGNED
        </span>
    );
};

export default DriverStatusBadge;

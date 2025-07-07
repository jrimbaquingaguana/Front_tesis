import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Audit() {
  const [auditData, setAuditData] = useState([]);
  const [filterAction, setFilterAction] = useState("All");

  const actions = [
    "All",
    "create_user",
    "login",
    "update_user",
    "delete_user",
    "edit_history",
    "delete_history",
    "prediction",
  ];

  useEffect(() => {
    fetchFullAudit();
  }, []);

  async function fetchFullAudit() {
    try {
      const res = await axios.get("http://localhost:5000/auditoria");
      const data = res.data;
      data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setAuditData(data);
    } catch (error) {
      console.error("Error loading audit data:", error);
    }
  }

  function filterByAction(data, filter) {
    if (filter === "All") return data;
    return data.filter((item) => item.accion === filter);
  }

  return (
    <div
      style={{ maxWidth: 1100, margin: "90px auto 20px auto", fontFamily: "Arial, sans-serif" }}
    >
      <h2
        style={{
          backgroundColor: "#351c53",
          color: "white",
          padding: "15px 20px",
          userSelect: "none",
          marginBottom: 15,
          cursor: "default",
          fontSize: 20,
          fontWeight: 600,
          borderRadius: 4,
        }}
      >
        General Audit
      </h2>

      <label style={{ display: "block", marginBottom: 15, fontSize: 14 }}>
        Filter by action:&nbsp;
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{ padding: "6px 10px", fontSize: 14 }}
        >
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </label>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#351c53", color: "white" }}>
            <tr>
              <th style={cellStyle}>Actor User</th>
              <th style={cellStyle}>Action</th>
              <th style={cellStyle}>Affected User</th>
              <th style={cellStyle}>Detail</th>
              <th style={cellStyle}>Date</th>
              <th style={cellStyle}>IP</th>
            </tr>
          </thead>
          <tbody>
            {filterByAction(auditData, filterAction).map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "white" }}>
                <td style={cellStyle}>{item.usuario || item.usuario_actor || "unknown"}</td>
                <td style={cellStyle}>{item.accion}</td>
                <td style={cellStyle}>{item.usuario_afectado || "-"}</td>
                <td style={cellStyle}>{item.detalle || "-"}</td>
                <td style={cellStyle}>{item.fecha ? new Date(item.fecha).toLocaleString() : "N/A"}</td>
                <td style={cellStyle}>{item.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "12px 16px",
  border: "1px solid #ddd",
  fontSize: 14,
  textAlign: "left",
};

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  TimeScale,
  Tooltip,
  Legend
);

// 🎨 Colores pastel saturados optimizados para mejor contraste en gráficos
const COLORS = [
  "#4F91F3", // azul fuerte
  "#FF6384", // rosa fuerte
  "#36D399", // verde menta intensa
  "#FFA07A", // naranja claro fuerte
  "#FF6F91", // rosado más intenso
  "#A66DD4", // lila fuerte
  "#FF85E1", // rosa eléctrico
  "#6EE7B7", // verde agua brillante
  "#FFD700", // amarillo dorado intenso (nuevo)
  "#3DA5D9", // azul acero claro (nuevo)
  "#B8E986", // verde lima fuerte
  "#E4B7EB", // rosa lavanda
  "#00C49A", // verde esmeralda saturado (nuevo)
  "#5EDFFF", // celeste brillante
];

// Función para repetir y cortar colores para que coincidan con la cantidad necesaria
const getColors = (length) => {
  let repeated = [];
  while (repeated.length < length) {
    repeated = repeated.concat(COLORS);
  }
  return repeated.slice(0, length);
};

export default function Dashboard() {
  const [auditData, setAuditData] = useState([]);
  const [filterAction, setFilterAction] = useState("All");
  const [chartType, setChartType] = useState("bar");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const chartContainerRef = useRef(null);

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
    fetchAudit();
  }, []);

  async function fetchAudit() {
    try {
      const res = await axios.get("http://localhost:5000/auditoria");
      const sorted = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setAuditData(sorted);
    } catch (err) {
      console.error("Error loading audit data:", err);
    }
  }

  const isInRange = (fecha) => {
    const date = new Date(fecha);
    if (startDate && new Date(startDate) > date) return false;
    if (endDate && new Date(endDate) < date) return false;
    return true;
  };

  const filteredData = auditData.filter((item) => {
    const matchAction = filterAction === "All" || item.accion === filterAction;
    const matchDate = isInRange(item.fecha);
    return matchAction && matchDate;
  });

  const actionCounts = actions.slice(1).map((action) => ({
    action,
    count: filteredData.filter((item) => item.accion === action).length,
  }));

  // Cuenta ocurrencias agrupadas por fecha para la acción seleccionada
  const getDateCounts = () => {
    const counts = {};
    filteredData.forEach((item) => {
      const date = new Date(item.fecha).toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
    const values = labels.map((label) => counts[label]);
    return { labels, values };
  };

  const chartData =
    filterAction === "All"
      ? {
          labels: actionCounts.map((item) => item.action),
          datasets: [
            {
              label: "Total by Action",
              data: actionCounts.map((item) => item.count),
              backgroundColor: getColors(actionCounts.length),
            },
          ],
        }
      : (() => {
          const { labels, values } = getDateCounts();
          return {
            labels,
            datasets: [
              {
                label: `Occurrences of "${filterAction}"`,
                data: values,
                backgroundColor: "#4F91F3", // Un solo color azul para barras por fecha
              },
            ],
          };
        })();

  const downloadChartPDF = async () => {
    if (!chartContainerRef.current) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(20);
    pdf.setTextColor("#351c53");
    pdf.text("Reports & Dashboard", pageWidth / 2, 50, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor("#000");
    pdf.text(`Action filter: ${filterAction}`, margin, 90);
    pdf.text(`Date from: ${startDate || "N/A"}`, margin, 110);
    pdf.text(`Date to: ${endDate || "N/A"}`, margin, 130);
    pdf.text(`Chart type: ${chartType}`, margin, 150);
    pdf.text(`Total records: ${filteredData.length}`, margin, 170);

    const canvas = await html2canvas(chartContainerRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - margin * 2;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", margin, 190, pdfWidth, pdfHeight);
    pdf.save(`dashboard_${filterAction}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "90px auto 20px auto", fontFamily: "Arial, sans-serif" }}>
      <h2
        style={{
          backgroundColor: "#351c53",
          color: "white",
          padding: "15px 20px",
          marginBottom: 15,
          fontSize: 20,
          fontWeight: 600,
          borderRadius: 4,
        }}
      >
        Reports & Dashboard
      </h2>

      <div style={{ display: "flex", gap: "1rem", marginBottom: 20, flexWrap: "wrap" }}>
        <label>
          Action:&nbsp;
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

        <label>
          From:&nbsp;
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px", fontSize: 14 }}
          />
        </label>

        <label>
          To:&nbsp;
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px", fontSize: 14 }}
          />
        </label>

        <label>
          Chart:&nbsp;
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 14 }}
          >
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </label>

        <button
          onClick={downloadChartPDF}
          style={{
            padding: "8px 16px",
            backgroundColor: "#512b87",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
          }}
          title="Download chart as PDF"
        >
          📄 Download PDF
        </button>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          marginBottom: 30,
          backgroundColor: "#f4f4f4",
          padding: 15,
          borderRadius: 8,
          maxWidth: 700,
          marginLeft: "auto",
          marginRight: "auto",
          height: 400,
        }}
      >
        <h3 style={{ marginBottom: 10, fontSize: 16, textAlign: "center" }}>Action Chart</h3>
        {chartType === "bar" ? (
          <Bar
            data={chartData}
            height={240}
            options={{ maintainAspectRatio: false, responsive: true }}
          />
        ) : (
          <Pie
            data={chartData}
            height={240}
            options={{ maintainAspectRatio: false, responsive: true }}
          />
        )}
      </div>

      <button
        onClick={() => setShowLogs(!showLogs)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#6943a9",
          color: "white",
          border: "none",
          borderRadius: "20px",
          cursor: "pointer",
          marginBottom: 15,
        }}
      >
        {showLogs ? "Hide Logs" : "Show Logs"}
      </button>

      {showLogs && (
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
              {filteredData.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "white" }}>
                  <td style={cellStyle}>{item.usuario || item.usuario_actor || "unknown"}</td>
                  <td style={cellStyle}>{item.accion}</td>
                  <td style={cellStyle}>{item.usuario_afectado || "-"}</td>
                  <td style={cellStyle}>{item.detalle || "-"}</td>
                  <td style={dateCellStyle}>
                    {item.fecha ? new Date(item.fecha).toLocaleString() : "N/A"}
                  </td>
                  <td style={cellStyle}>{item.ip || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cellStyle = {
  padding: "12px 16px",
  border: "1px solid #ddd",
  fontSize: 14,
  textAlign: "left",
};

const dateCellStyle = {
  ...cellStyle,
  backgroundColor: "#dbe9f4", // azul pastel suave
  fontWeight: "600",
  color: "#2c5282",
};

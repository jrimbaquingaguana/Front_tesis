import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MySwal = withReactContent(Swal);

function History() {
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ texto_original: "", clasificacion: "" });
  const tableRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/historial");
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const exportToExcel = () => {
    const filteredHistory = history.map(({ probabilidad, id, fecha_creacion, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(filteredHistory);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "analyzed_messages_history.xlsx");
  };

  // Export Excel filtered by date range
  const exportByDateRangeExcel = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Select date range",
      html:
        `<label>From: </label><input type="date" id="startDate" class="swal2-input" required>` +
        `<label>To: </label><input type="date" id="endDate" class="swal2-input" required>`,
      focusConfirm: false,
      preConfirm: () => {
        const from = document.getElementById("startDate").value;
        const to = document.getElementById("endDate").value;
        if (!from || !to) {
          Swal.showValidationMessage("You must fill in both dates.");
          return;
        }
        return [from, to];
      },
    });

    if (!formValues) return;

    const [from, to] = formValues;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59);

    const filtered = history.filter((item) => {
      const date = new Date(item.fecha || item.fecha_creacion);
      return date >= fromDate && date <= toDate;
    });

    if (filtered.length === 0) {
      MySwal.fire("No results", "There are no records in the selected date range.", "info");
      return;
    }

    const filteredCleaned = filtered.map(({ probabilidad, id, fecha_creacion, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(filteredCleaned);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FilteredHistory");
    XLSX.writeFile(wb, `filtered_history_${from}_to_${to}.xlsx`);
  };

  // Export PDF filtered by date range usando jsPDF-AutoTable (corregido para Vite/React)
  const exportByDateRangePDF = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Select date range",
      html:
        `<label>From: </label><input type="date" id="startDatePDF" class="swal2-input" required>` +
        `<label>To: </label><input type="date" id="endDatePDF" class="swal2-input" required>`,
      focusConfirm: false,
      preConfirm: () => {
        const from = document.getElementById("startDatePDF").value;
        const to = document.getElementById("endDatePDF").value;
        if (!from || !to) {
          Swal.showValidationMessage("You must fill in both dates.");
          return;
        }
        return [from, to];
      },
    });

    if (!formValues) return;

    const [from, to] = formValues;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59);

    const filtered = history.filter((item) => {
      const date = new Date(item.fecha || item.fecha_creacion);
      return date >= fromDate && date <= toDate;
    });

    if (filtered.length === 0) {
      MySwal.fire("No results", "There are no records in the selected date range.", "info");
      return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    const titleY = 40;

    doc.setFontSize(22);
    doc.setTextColor("#351c53");
    doc.text("Filtered Analyzed Messages History", doc.internal.pageSize.getWidth() / 2, titleY, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setTextColor("#444");
    doc.text(`Date range: ${from} to ${to}`, margin, titleY + 25);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, titleY + 40);

    // Construir datos para la tabla
    const tableColumn = ["Original Message", "Classification", "Date"];
    const tableRows = filtered.map((item) => [
      item.texto_original || "",
      item.clasificacion || "",
      item.fecha
        ? new Date(item.fecha).toLocaleString()
        : item.fecha_creacion
        ? new Date(item.fecha_creacion).toLocaleString()
        : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: titleY + 60,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [53, 28, 83], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      tableLineColor: [221, 221, 221],
      tableLineWidth: 0.5,
    });

    doc.save(`filtered_history_${from}_to_${to}.pdf`);
  };

  // The rest of your editing and deleting code stays the same...

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditData({
      texto_original: record.texto_original || "",
      clasificacion: record.clasificacion || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ texto_original: "", clasificacion: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to update this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const currentUserRaw = localStorage.getItem("currentUser");
    const loggedInUser = currentUserRaw ? JSON.parse(currentUserRaw).username : "unknown";

    try {
      await axios.put(`http://localhost:5000/historial/${editingId}`, editData, {
        headers: {
          usuario: loggedInUser,
        },
      });
      setEditingId(null);
      setEditData({ texto_original: "", clasificacion: "" });
      fetchHistory();
      MySwal.fire("Updated!", "The record was successfully updated.", "success");
    } catch (error) {
      console.error("Error updating record:", error);
      MySwal.fire("Error", "Could not update the record.", "error");
    }
  };

  const deleteRecord = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const currentUserRaw = localStorage.getItem("currentUser");
    const loggedInUser = currentUserRaw ? JSON.parse(currentUserRaw).username : "unknown";

    try {
      await axios.delete(`http://localhost:5000/historial/${id}`, {
        headers: {
          usuario: loggedInUser,
        },
      });
      fetchHistory();
      MySwal.fire("Deleted!", "The record was successfully deleted.", "success");
    } catch (error) {
      console.error("Error deleting record:", error);
      MySwal.fire("Error", "Could not delete the record.", "error");
    }
  };

  // Exportar todo el historial a PDF usando jsPDF-AutoTable (corregido para Vite/React)
  const exportToPDF = async () => {
    if (!history.length) return;

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    const titleY = 40;

    doc.setFontSize(22);
    doc.setTextColor("#351c53");
    doc.text("Analyzed Messages History", doc.internal.pageSize.getWidth() / 2, titleY, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setTextColor("#444");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, titleY + 25);

    // Construir datos para la tabla
    const tableColumn = ["Original Message", "Classification", "Date"];
    const tableRows = history.map((item) => [
      item.texto_original || "",
      item.clasificacion || "",
      item.fecha
        ? new Date(item.fecha).toLocaleString()
        : item.fecha_creacion
        ? new Date(item.fecha_creacion).toLocaleString()
        : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: titleY + 40,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [53, 28, 83], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      tableLineColor: [221, 221, 221],
      tableLineWidth: 0.5,
    });

    doc.save(`history_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div style={{ padding: "100px 20px 20px", textAlign: "center" }}>
      <h1>Analyzed Messages History</h1>
      <p>Below is the list of messages and their classification.</p>

      {history.length > 0 ? (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={exportToExcel} style={buttonStyle("#6943a9")}>
              Download All Excel
            </button>

            <button onClick={exportByDateRangeExcel} style={buttonStyle("#351c53", "1rem")}>
              Export by Date Range (Excel)
            </button>

            <button onClick={exportByDateRangePDF} style={buttonStyle("#512b87", "1rem")}>
              Export by Date Range (PDF)
            </button>

            <button onClick={exportToPDF} style={buttonStyle("#421d6f", "1rem")}>
              📄 Download All PDF
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table ref={tableRef} style={tableStyle}>
              <thead style={{ backgroundColor: "#351c53", color: "#fff" }}>
                <tr>
                  <th style={cellStyle}>Original Message</th>
                  <th style={cellStyle}>Classification</th>
                  <th style={cellStyle}>Date</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    style={{ backgroundColor: item.id % 2 === 0 ? "#f9f9f9" : "#fff" }}
                  >
                    <td style={cellStyle}>
                      {editingId === item.id ? (
                        <input
                          type="text"
                          name="texto_original"
                          value={editData.texto_original}
                          onChange={handleEditChange}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        item.texto_original
                      )}
                    </td>
                    <td style={cellStyle}>
                      {editingId === item.id ? (
                        <select
                          name="clasificacion"
                          value={editData.clasificacion}
                          onChange={handleEditChange}
                          style={{ width: "100%" }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Cibersexting">Cibersexting</option>
                          <option value="CiberGrooming">CiberGrooming</option>
                        </select>
                      ) : (
                        item.clasificacion
                      )}
                    </td>
                    <td style={cellStyle}>
                      {item.fecha
                        ? new Date(item.fecha).toLocaleString()
                        : item.fecha_creacion
                        ? new Date(item.fecha_creacion).toLocaleString()
                        : "N/A"}
                    </td>
                    <td style={cellStyle}>
                      {editingId === item.id ? (
                        <>
                          <button onClick={saveEdit} style={actionButtonStyle}>
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ ...actionButtonStyle, backgroundColor: "#ccc", color: "#000" }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} style={actionButtonStyle}>
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRecord(item.id)}
                            style={{ ...actionButtonStyle, backgroundColor: "#d9534f" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No history available.</p>
      )}
    </div>
  );
}

const cellStyle = {
  padding: "10px 15px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const actionButtonStyle = {
  marginRight: "5px",
  padding: "0.3rem 0.6rem",
  backgroundColor: "#6943a9",
  color: "white",
  border: "none",
  borderRadius: 0,
  cursor: "pointer",
  fontWeight: "bold",
};

const buttonStyle = (color, marginLeft = "0") => ({
  padding: "0.6rem 1.2rem",
  marginLeft,
  backgroundColor: color,
  color: "#fff",
  border: "none",
  borderRadius: 0,
  cursor: "pointer",
  fontWeight: "bold",
});

const tableStyle = {
  margin: "0 auto",
  borderCollapse: "collapse",
  width: "90%",
  maxWidth: "1000px",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
};

export default History;

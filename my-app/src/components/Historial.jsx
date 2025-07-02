import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import * as XLSX from "xlsx";

const MySwal = withReactContent(Swal);

function Historial() {
  const [historial, setHistorial] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ texto_original: "", clasificacion: "" });

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const response = await axios.get("http://localhost:5000/historial");
      setHistorial(response.data);
    } catch (error) {
      console.error("Error fetching historial:", error);
    }
  };

  const exportarAExcel = () => {
    const historialSinProbabilidad = historial.map(({ probabilidad, id, fecha_creacion, ...resto }) => resto);

    const ws = XLSX.utils.json_to_sheet(historialSinProbabilidad);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, "historial_mensajes.xlsx");
  };

  const startEdit = (registro) => {
    setEditingId(registro.id);
    setEditData({
      texto_original: registro.texto_original || "",
      clasificacion: registro.clasificacion || "",
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
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/historial/${editingId}`, editData);
      setEditingId(null);
      setEditData({ texto_original: "", clasificacion: "" });
      fetchHistorial();
      MySwal.fire("Updated!", "The record has been updated.", "success");
    } catch (error) {
      console.error("Error updating historial:", error);
      MySwal.fire("Error!", "Failed to update the record.", "error");
    }
  };

  const deleteRegistro = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:5000/historial/${id}`);
      fetchHistorial();
      MySwal.fire("Deleted!", "The record has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting historial:", error);
      MySwal.fire("Error!", "Failed to delete the record.", "error");
    }
  };

  return (
    <div style={{ padding: "100px 20px 20px", textAlign: "center" }}>
      <h1>Message Analysis History</h1>
      <p>Below is the list of analyzed messages and their classification.</p>

      {historial.length > 0 ? (
        <>
          <button
            onClick={exportarAExcel}
            style={{
              marginBottom: "1rem",
              padding: "0.6rem 1.2rem",
              backgroundColor: "#6943a9", // morado
              color: "#fff",
              border: "none",
              borderRadius: 0, // sin bordes redondeados
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Download Excel
          </button>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                margin: "0 auto",
                borderCollapse: "collapse",
                width: "90%",
                maxWidth: "1000px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <thead style={{ backgroundColor: "#351c53", color: "#fff" }}>
                <tr>
                  <th style={cellStyle}>Original Message</th>
                  <th style={cellStyle}>Classification</th>
                  <th style={cellStyle}>Date</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: item.id % 2 === 0 ? "#f9f9f9" : "#fff",
                    }}
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
                            style={{ ...actionButtonStyle, backgroundColor: "#ccc", color: "#000", borderRadius: 0 }}
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
                            onClick={() => deleteRegistro(item.id)}
                            style={{ ...actionButtonStyle, backgroundColor: "#d9534f", borderRadius: 0 }}
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
  backgroundColor: "#6943a9", // morado
  color: "white",
  border: "none",
  borderRadius: 0, // sin bordes redondeados
  cursor: "pointer",
  fontWeight: "bold",
};

export default Historial;

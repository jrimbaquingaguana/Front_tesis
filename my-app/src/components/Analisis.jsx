import React, { useState } from "react";
import "./Analisis.css";
import icono from "../assets/icono-seguridad.png";

function Analisis() {
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  // Función para obtener color y recomendación según clasificación
  const getStatusProps = (clasificacion) => {
    switch (clasificacion) {
      case "Normal":
        return { color: "green", recommendation: "Message seems safe." };
      case "Cibersexting":
        return {
          color: "orange",
          recommendation: "Be cautious: possible sexting detected.",
        };
      case "CiberGrooming":
        return {
          color: "red",
          recommendation: "Warning! Potential grooming detected. Stay alert.",
          caution: "⚠️ This is a serious alert. Please take immediate precautions.",
        };
      default:
        return { color: "gray", recommendation: "" };
    }
  };

  const manejarRespuesta = async () => {
    setError("");
    setResultado(null);

    if (mensaje.trim() === "") {
      setError("Please enter a message in English.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/predecir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg += ` - ${errorData.error}`;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResultado(data);
    } catch (err) {
      setError(`Error connecting to the server. ${err.message}`);
      console.error(err);
    }
  };

  const statusProps = resultado ? getStatusProps(resultado.clasificacion) : {};

  return (
    <div className="app-container" style={{ textAlign: "center", padding: "1rem" }}>
      <img
        src={icono}
        alt="Seguridad"
        className="mensaje-icono"
        style={{ maxWidth: "450px", marginBottom: "1rem" }}
      />

      <h1 className="main-title" style={{ color: "#351c53", marginBottom: "2rem" }}>
        Cibergrooming y Cibersexting
      </h1>

      <div
        className="mensaje-card"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
          border: "1px solid #ddd",
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          boxShadow: "0 3px 8px rgb(0 0 0 / 0.1)",
          backgroundColor: "#fff",
          maxWidth: "600px",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <label
          htmlFor="inputMensaje"
          className="mensaje-label"
          style={{
            fontWeight: "600",
            color: "#351c53",
            minWidth: "180px",
            textAlign: "left",
          }}
        >
          Type your message in English:
        </label>

        <input
          id="inputMensaje"
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="mensaje-input"
          style={{
            flexGrow: 1,
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") manejarRespuesta();
          }}
        />
      </div>

      <button
        onClick={manejarRespuesta}
        className="mensaje-boton"
        style={{
          backgroundColor: "#6943a9",
          color: "#fff",
          padding: "0.7rem 1.5rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "1rem",
          boxShadow: "0 2px 6px rgb(53 28 83 / 0.4)",
        }}
      >
        Analyze Message
      </button>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            color: "red",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      {resultado && (
        <div
          className="mensaje-respuesta"
          style={{
            marginTop: "2rem",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: "#f5f0ff",
            borderRadius: "10px",
            padding: "1rem 1.5rem",
            boxShadow: "0 3px 12px rgb(53 28 83 / 0.2)",
            color: "#6943a9",
            fontWeight: "600",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: statusProps.color,
            }}
          ></span>

          <div style={{ textAlign: "left" }}>
            <div>
              <strong>Classification:</strong> {resultado.clasificacion}
            </div>

            <div style={{ marginTop: "0.5rem", fontWeight: "normal" }}>
              {statusProps.recommendation}
            </div>

            {statusProps.caution && (
              <div
                style={{
                  marginTop: "1rem",
                  color: "red",
                  fontWeight: "700",
                  fontSize: "1rem",
                }}
              >
                {statusProps.caution}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Analisis;

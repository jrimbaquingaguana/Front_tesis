import React, { useState } from "react";
import "./Analisis.css";
import icono from "../assets/icono-seguridad.png";

// URLs de gifs para cada clasificación
const gifSafe = "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif";
const gifCibersexting = "https://media.giphy.com/media/J4yF0FV16mSjwlGunf/giphy.gif";
const gifCibergrooming = "https://media.giphy.com/media/3oz8xqZsDaOSHaqLCw/giphy.gif";

function Analisis() {
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const getStatusProps = (clasificacion) => {
    switch (clasificacion) {
      case "Normal":
        return {
          color: "green",
          recommendation: "Message seems safe.",
          caution: "✅ All clear! No issues detected.",
          gif: gifSafe,
        };
      case "Cibersexting":
        return {
          color: "orange",
          recommendation: "Be cautious: possible sexting detected.",
          caution: "⚠️ Warning: Potential Cibersexting detected. Please be careful.",
          gif: gifCibersexting,
        };
      case "CiberGrooming":
        return {
          color: "red",
          recommendation: "Warning! Potential grooming detected. Stay alert.",
          caution: "⚠️ This is a serious alert. Please take immediate precautions.",
          gif: gifCibergrooming,
        };
      default:
        return { color: "gray", recommendation: "", caution: "", gif: null };
    }
  };

  const manejarRespuesta = async () => {
    setError("");
    setResultado(null);

    if (mensaje.trim() === "") {
      setError("Please enter a message in English.");
      return;
    }

    const currentUserRaw = localStorage.getItem("currentUser");
    const loggedInUser = currentUserRaw ? JSON.parse(currentUserRaw).username : "unknown";

    try {
      const response = await fetch("http://localhost:5000/predecir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          usuario: loggedInUser,
        },
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

      <div className="mensaje-card" style={cardStyle}>
        <label htmlFor="inputMensaje" className="mensaje-label" style={labelStyle}>
          Type your message in English:
        </label>

        <input
          id="inputMensaje"
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="mensaje-input"
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter") manejarRespuesta();
          }}
        />
      </div>

      <button onClick={manejarRespuesta} className="mensaje-boton" style={buttonStyle}>
        Analyze Message
      </button>

      {error && (
        <div style={{ marginTop: "1rem", color: "red", fontWeight: "600" }}>
          {error}
        </div>
      )}

      {resultado && (
        <div className="mensaje-respuesta" style={resultadoStyle(resultado.clasificacion)}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: statusProps.color,
              }}
            ></span>

            <div style={{ textAlign: "left", flex: 1 }}>
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
                    backgroundColor:
                      resultado.clasificacion === "Cibersexting"
                        ? "#fff3e0"
                        : resultado.clasificacion === "Normal"
                        ? "#e6f4ea"
                        : "#ffcccc",
                    color:
                      resultado.clasificacion === "Cibersexting"
                        ? "#e65100"
                        : resultado.clasificacion === "Normal"
                        ? "green"
                        : "darkred",
                    fontWeight: "bold",
                    padding: "0.6rem 1rem",
                    borderRadius: "6px",
                    border:
                      resultado.clasificacion === "Cibersexting"
                        ? "1px solid #ef6c00"
                        : resultado.clasificacion === "Normal"
                        ? "1px solid green"
                        : "1px solid red",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <img
                    src={statusProps.gif}
                    alt="alert gif"
                    style={{
                      width: "100px",
                      height: "80px",
                      borderRadius: "6px",
                    }}
                  />
                  <span>{statusProps.caution}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos reutilizables
const cardStyle = {
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
};

const labelStyle = {
  fontWeight: "600",
  color: "#351c53",
  minWidth: "180px",
  textAlign: "left",
};

const inputStyle = {
  flexGrow: 1,
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  outline: "none",
};

const buttonStyle = {
  backgroundColor: "#6943a9",
  color: "#fff",
  padding: "0.7rem 1.5rem",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "1rem",
  boxShadow: "0 2px 6px rgb(53 28 83 / 0.4)",
};

const resultadoStyle = (clasificacion) => ({
  marginTop: "2rem",
  maxWidth: "600px",
  marginLeft: "auto",
  marginRight: "auto",
  backgroundColor:
    clasificacion === "CiberGrooming"
      ? "#ffe6e6"
      : clasificacion === "Cibersexting"
      ? "#fff8e1"
      : "#e6f4ea",
  borderRadius: "10px",
  padding: "1rem 1.5rem",
  boxShadow: "0 3px 12px rgb(53 28 83 / 0.2)",
  color: "#351c53",
  fontWeight: "600",
  fontSize: "1.1rem",
  border:
    clasificacion === "CiberGrooming"
      ? "2px solid red"
      : clasificacion === "Cibersexting"
      ? "2px solid #ef6c00"
      : "2px solid green",
});

export default Analisis;

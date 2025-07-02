import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function UserManagement() {
  const [users, setUsers] = useState([]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/usuarios");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Show modal for create or edit
  const showUserForm = (user = null) => {
    MySwal.fire({
      title: user ? `Edit User: ${user.username}` : "Create New User",
      html: (
        <UserForm initialData={user} onSave={handleSave} />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        // No action needed here, UserForm controls own state
      },
      allowOutsideClick: false,
    });
  };

  // Save user (create or update)
  const handleSave = async (formData, closeModal) => {
    try {
      if (formData.isEditing) {
        // Update existing user
        const updateData = { ...formData };
        delete updateData.isEditing;
        if (!updateData.password) delete updateData.password;

        await axios.put(
          `http://localhost:5000/usuarios/${formData.username}`,
          updateData
        );
        MySwal.fire("Success", "User updated successfully", "success");
      } else {
        // Create new user (password required)
        if (!formData.password) {
          MySwal.fire("Error", "Password is required for new users", "error");
          return;
        }
        const createData = { ...formData };
        delete createData.isEditing;

        await axios.post("http://localhost:5000/usuarios", createData);
        MySwal.fire("Success", "User created successfully", "success");
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      MySwal.fire(
        "Error",
        error.response?.data?.error || "Failed to save user",
        "error"
      );
    }
  };

  // Delete user with confirmation
  const deleteUser = async (username) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: `Do you want to delete user "${username}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:5000/usuarios/${username}`);
      MySwal.fire("Deleted!", "User has been deleted.", "success");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      MySwal.fire("Error", "Failed to delete user.", "error");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <h1>User Management</h1>
      <button
        onClick={() => showUserForm(null)}
        style={{
          backgroundColor: "#6943a9", // morado
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: 0, // sin bordes redondeados
          cursor: "pointer",
          marginBottom: "1rem",
          fontWeight: "bold",
          boxShadow: "0 3px 8px rgba(105, 67, 169, 0.6)", // sombra morada
          fontSize: "1rem",
        }}
      >
        Create New User
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <thead style={{ backgroundColor: "#351c53", color: "white" }}>
          <tr>
            <th style={cellStyle}>Username</th>
            <th style={cellStyle}>Email</th>
            <th style={cellStyle}>Role</th>
            <th style={cellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
                No users found.
              </td>
            </tr>
          )}
          {users.map((user) => (
            <tr
              key={user.username}
              style={{
                backgroundColor:
                  user.username.charCodeAt(0) % 2 === 0 ? "#f9f9f9" : "#fff",
              }}
            >
              <td style={cellStyle}>{user.username}</td>
              <td style={cellStyle}>{user.email}</td>
              <td style={cellStyle}>{user.role}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => showUserForm(user)}
                  style={actionButtonStyle}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteUser(user.username)}
                  style={{ ...actionButtonStyle, backgroundColor: "#d9534f" }}
                  disabled={user.username === "admin"}
                  title={
                    user.username === "admin"
                      ? "Cannot delete admin user"
                      : "Delete user"
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserForm({ initialData, onSave }) {
  const [formData, setFormData] = useState({
    username: initialData?.username || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || "user",
    isEditing: !!initialData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ textAlign: "left", marginTop: "10px" }}>
      <label style={labelStyle}>
        Username:
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          disabled={formData.isEditing}
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Email:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Password:
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={formData.isEditing ? "(leave blank to keep)" : ""}
          {...(!formData.isEditing && { required: true })}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Role:
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          onClick={() => onSave(formData, () => MySwal.close())}
          style={{
            backgroundColor: "#6943a9", // morado
            color: "white",
            padding: "0.4rem 1rem",
            border: "none",
            borderRadius: 0, // sin bordes redondeados
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: "0.5rem",
          }}
        >
          {formData.isEditing ? "Save Changes" : "Create User"}
        </button>
        <button
          onClick={() => MySwal.close()}
          style={{
            backgroundColor: "#ccc",
            padding: "0.4rem 1rem",
            border: "none",
            borderRadius: 0, // sin bordes redondeados
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
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

const labelStyle = {
  display: "block",
  marginBottom: "0.6rem",
  fontWeight: "600",
  color: "#351c53",
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: 0, // sin bordes redondeados
  border: "1px solid #ccc",
  fontSize: "1rem",
  boxSizing: "border-box",
  marginTop: "0.25rem",
};

export default UserManagement;

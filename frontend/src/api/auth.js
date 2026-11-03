// src/api/auth.js
import { API_BASE_URL } from "../config/constants";

export const API_URL = `${API_BASE_URL}/auth/`;

export const registerUser = async (formData) => {
  try {
    const response = await fetch(`${API_URL}register.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    return {
      status: data.success ? "success" : "error",
      message: data.message || "Unknown error occurred",
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      status: "error",
      message: "Unable to reach server. Check your backend connection.",
    };
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    return {
      status: data.success ? "success" : "error",
      message: data.message,
      user: data.user || null,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      status: "error",
      message: "Unable to reach server. Check your backend connection.",
    };
  }
};

// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ role }) => {
  const links = {
    admin: [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Users", to: "/admin/users" },
    ],
    doctor: [
      { label: "Dashboard", to: "/doctor/dashboard" },
      { label: "Appointments", to: "/doctor/appointments" },
    ],
    patient: [
      { label: "Dashboard", to: "/patient/dashboard" },
      { label: "Book Appointment", to: "/patient/book-appointment" },
    ],
  };

  return (
    <aside className="sidebar">
      <ul>
        {links[role].map((link, idx) => (
          <li key={idx}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;

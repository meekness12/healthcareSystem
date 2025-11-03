// src/components/PatientSidebar.jsx
import React from "react";

const PatientSidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Book Appointment", key: "book" },
    { label: "My Appointments", key: "appointments" },
    { label: "Medical Records", key: "records" },
  ];

  return (
    <aside className="sidebar">
      <ul>
        {menuItems.map((item) => (
          <li
            key={item.key}
            className={activeMenu === item.key ? "active" : ""}
            onClick={() => setActiveMenu(item.key)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default PatientSidebar;

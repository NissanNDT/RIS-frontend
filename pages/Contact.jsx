import React, { useState } from "react";
import "../App.css";

const contacts = {
  Emergency: [
    { title: "EMERGENCIA A1", phone: "449 910 4030" },
    { title: "EMERGENCIA A2", phone: "449 994 3790" },
  ],
  Areas: [
    {
      title: "Encargados Shop A1",
      contacts: [
        { name: "Daniel Ramirez Flores", phone: "449 289 8608", description: "Offline, PDI, Carwash, Bodyshop", icon: "🚗" },
        { name: "Maria Lopez", phone: "449 123 4567", description: "Supervisor", icon: "👷" },
      ],
    },
    {
      title: "Seguridad A1 Y A2",
      contacts: [
        { name: "Jose Ignacio Zaldivar Guillen", phone: "777 189 9704", description: "Security Head", icon: "🚒" },
        { name: "Ana Torres", phone: "449 987 6543", description: "Assistant", icon: "👮" },{ name: "Ana Torres", phone: "449 987 6543", description: "Assistant", icon: "👮" }
      ],
    },
    {
      title: "Encargados Shop A2",
      contacts: [
        { name: "Marco Antonio Morales Avila", phone: "493 106 1827", description: "Manager", icon: "🏭" },
        { name: "Laura Fernandez", phone: "449 654 3210", description: "Coordinator", icon: "👩‍💼" },
      ],
    },
  ],
};

const Contact = () => {
  const [selectedArea, setSelectedArea] = useState(null);

  const handleCardClick = (area) => {
    setSelectedArea(area);
  };

  const closePopup = () => {
    setSelectedArea(null);
  };

  const handleOutsideClick = (e) => {
    if (e.target.className === "popup") {
      closePopup();
    }
  };

  return (
    <div className="contact-page">
      <h1>Contactos</h1>

      <div className="emergency-contacts">
        {contacts.Emergency.map((contact, index) => (
          <div key={index} className="emergency-card">
            <h2>{contact.title}</h2>
            <p>{contact.phone}</p>
          </div>
        ))}
      </div>

      <div className="contact-list">
        {contacts.Areas.map((area, index) => (
          <div
            key={index}
            className="contact-card red-card"
            onClick={() => handleCardClick(area)}
          >
            <h2>{area.title}</h2>
          </div>
        ))}
      </div>

      {selectedArea && (
        <div className="popup" onClick={handleOutsideClick}>
          <div className="popup-content">
            <h2>{selectedArea.title}</h2>
            {selectedArea.contacts.map((contact, index) => (
              <div key={index} className="popup-grid-item">
                <p><strong>Nombre:</strong> {contact.name}</p>
                <p><strong>Teléfono:</strong> {contact.phone}</p>
                <p><strong>Descripción:</strong> {contact.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
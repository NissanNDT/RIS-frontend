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
        {area: "WORKSHOP", name: "Daniel Ramirez Flores", phone: "449 289 8608", description: "Offline, PDI, Carwash, Bodyshop", icon: "🚗" },
        {area: "TRUCK", name: "Jose Ignacio Zaldivar Guillen", phone: "777 189 9704", description: "Supervisor", icon: "👷" },
        {area: "STORAGE", name: "Marco Antonio Morales Avila", phone: "493 106 1827", description: "Supervisor", icon: "👷" },
        {area: "RAIL", name: "Jocelyn Solis Constantino", phone: "449 283 9202", description: "Supervisor", icon: "👷" },
      ],
    },
    {
      title: "Seguridad A1 Y A2",
      contacts: [
        {area: "Seguridad", name: "Jesus Oswaldo Holguin Flores", phone: "55 3122 0796", description: "", icon: "🚒" },
        
      ],
    },
    {
      title: "Encargados Shop A2",
      contacts: [
        {area: "WORKSHOP", name: "Luis Angel Ramirez Cedillo", phone: "449 189 0579", description: "Offline, PDI, Carwash, Bodyshop", icon: "🚗" },
        {area: "TRUCK", name: "Eddie Josue Vazquez Alba", phone: "55 4192 0644", description: "Supervisor", icon: "👷" },
        {area: "STORAGE", name: "Jessica Alejandra Martinez Gonzalez", phone: "777 135 0714", description: "Supervisor", icon: "👷" },
        {area: "RAIL", name: "Montserrat Naranjo Esther", phone: "449 867 7511", description: "Supervisor", icon: "👷" },
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
                <p><strong>{contact.area}</strong></p>
                <p><strong>{contact.name}</strong></p>
                <p>{contact.phone}</p>
                <p>{contact.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
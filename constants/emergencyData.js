export const emergencyData = [
    { country: "India", code: "IN", police: "112", ambulance: "102", fire: "101" },
    { country: "USA", code: "US", police: "911", ambulance: "911", fire: "911" },
    { country: "United Kingdom", code: "UK", police: "999", ambulance: "999", fire: "999" },
    { country: "France", code: "FR", police: "112", ambulance: "15", fire: "18" },
    { country: "Germany", code: "DE", police: "110", ambulance: "112", fire: "112" },
    { country: "Japan", code: "JP", police: "110", ambulance: "119", fire: "119" },
    { country: "Australia", code: "AU", police: "000", ambulance: "000", fire: "000" },
    { country: "Canada", code: "CA", police: "911", ambulance: "911", fire: "911" },
    { country: "Thailand", code: "TH", police: "191", ambulance: "1669", fire: "199" },
    { country: "Singapore", code: "SG", police: "999", ambulance: "995", fire: "995" },
    { country: "Indonesia", code: "ID", police: "110", ambulance: "118", fire: "113" },
    { country: "Vietnam", code: "VN", police: "113", ambulance: "115", fire: "114" },
    { country: "Italy", code: "IT", police: "112", ambulance: "118", fire: "115" },
    { country: "Spain", code: "ES", police: "112", ambulance: "112", fire: "080" },
    { country: "Switzerland", code: "CH", police: "117", ambulance: "144", fire: "118" },
    { country: "UAE", code: "AE", police: "999", ambulance: "998", fire: "997" },
    { country: "Brazil", code: "BR", police: "190", ambulance: "192", fire: "193" },
    { country: "South Africa", code: "ZA", police: "10111", ambulance: "10177", fire: "10177" },
    // Default/International Fallback
    { country: "Europe", code: "EU", police: "112", ambulance: "112", fire: "112" },
    { country: "Global", code: "GL", police: "112", ambulance: "112", fire: "112" }
];

export const getEmergencyNumbers = (destinationInput) => {
    if (!destinationInput) return emergencyData.find(d => d.code === 'GL');

    const dest = destinationInput.toLowerCase();

    // Try to find exact country match in string
    const match = emergencyData.find(d => dest.includes(d.country.toLowerCase()));

    return match || emergencyData.find(d => d.code === 'GL');
};

export const emergencyData = [
    { country: "India", code: "IN", police: "100", ambulance: "102", fire: "101" },
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
    { country: "China", code: "CN", police: "110", ambulance: "120", fire: "119" },
    { country: "Russia", code: "RU", police: "102", ambulance: "103", fire: "101" },
    { country: "South Korea", code: "KR", police: "112", ambulance: "119", fire: "119" },
    { country: "Mexico", code: "MX", police: "911", ambulance: "911", fire: "911" },
    { country: "Argentina", code: "AR", police: "911", ambulance: "107", fire: "100" },
    { country: "Turkey", code: "TR", police: "155", ambulance: "112", fire: "110" },
    { country: "Egypt", code: "EG", police: "122", ambulance: "123", fire: "180" },
    { country: "Saudi Arabia", code: "SA", police: "999", ambulance: "997", fire: "998" },
    { country: "New Zealand", code: "NZ", police: "111", ambulance: "111", fire: "111" },
    { country: "Netherlands", code: "NL", police: "112", ambulance: "112", fire: "112" },
    { country: "Sweden", code: "SE", police: "112", ambulance: "112", fire: "112" },
    { country: "Norway", code: "NO", police: "112", ambulance: "113", fire: "110" },
    { country: "Denmark", code: "DK", police: "112", ambulance: "112", fire: "112" },
    { country: "Finland", code: "FI", police: "112", ambulance: "112", fire: "112" },
    { country: "Poland", code: "PL", police: "997", ambulance: "999", fire: "998" },
    { country: "Greece", code: "GR", police: "100", ambulance: "166", fire: "199" },
    { country: "Portugal", code: "PT", police: "112", ambulance: "112", fire: "112" },
    { country: "Ireland", code: "IE", police: "999", ambulance: "999", fire: "999" },
    { country: "Malaysia", code: "MY", police: "999", ambulance: "999", fire: "994" },
    { country: "Philippines", code: "PH", police: "911", ambulance: "911", fire: "911" },
    // Default/International Fallback
    { country: "Europe", code: "EU", police: "112", ambulance: "112", fire: "112" },
    { country: "Global", code: "GL", police: "112", ambulance: "112", fire: "112" }
];

export const getEmergencyNumbers = (destinationInput) => {
    // 1. Input Validation
    if (!destinationInput) return emergencyData.find(d => d.code === 'GL');

    // 2. Direct Code Match (Best)
    // If input is an object with countryCode
    if (typeof destinationInput === 'object' && destinationInput.countryCode) {
        const match = emergencyData.find(d => d.code === destinationInput.countryCode);
        if (match) return match;
    }

    // 3. String Search (Fallback)
    // If input is a string (Destination Name) or object without code
    const searchStr = (typeof destinationInput === 'string' ? destinationInput : (destinationInput.country || destinationInput.name || '')).toLowerCase();

    // Try to find exact country match in string
    const match = emergencyData.find(d => searchStr.includes(d.country.toLowerCase()));

    return match || emergencyData.find(d => d.code === 'GL');
};

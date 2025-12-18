const mongoose = require('mongoose');
const Destination = require('../models/Destination'); 
require('dotenv').config(); 

const MONGO_URI = "mongodb+srv://shashankchauhan134_db_user:LvQmheHOhSvks6gj@cluster0.r4ce7nv.mongodb.net/?appName=Cluster0";

const seedData = [
  {
    name: "Shimla",
    location: { lat: 31.1048, lng: 77.1734 },
    description: "The Queen of Hills, known for its colonial architecture, steep terrain, and the historic Toy Train.",
    
    accessibility: {
      nearest_airport: { 
        name: "Jubbarhatti Airport (Shimla)", 
        code: "SLV", 
        distance_km: 22 
      },
      nearest_railway: { 
        name: "Kalka Railway Station", 
        code: "KLK", 
        distance_km: 89 
      },
      last_mile_connectivity: { 
        mode: "Taxi", 
        avg_cost: 3000 
      }
    },

    local_rules: [
      {
        title: "Mall Road Vehicle Ban",
        description: "Private vehicles are strictly prohibited on Mall Road and The Ridge. Heavy fines apply.",
        severity: "Critical"
      },
      {
        title: "Monkey Menace",
        description: "Jakhu Temple has aggressive monkeys. Do not carry visible food or wear glasses.",
        severity: "Warning"
      },
      {
        title: "Plastic Ban",
        description: "Shimla has a strict no-polythene policy.",
        severity: "Info"
      }
    ],

    weather_profile: [
      {
        month: "December",
        avg_temp: 5,
        conditions: ["Snow", "Chilly Winds"],
        required_gear: ["Heavy Woolens", "Snow Boots", "Thermal Wear", "Gloves"]
      },
      {
        month: "June",
        avg_temp: 25,
        conditions: ["Pleasant", "Sunny"],
        required_gear: ["Light Cottons", "Sunscreen", "Walking Shoes"]
      }
    ],

    attractions: [
      {
        name: "Jakhu Temple",
        type: "Religious", 
        altitude_meters: 2455,
        visit_duration_min: 90,
        description: "Highest point in Shimla. Steep trek required."
      },
      {
        name: "The Ridge",
        type: "Market",
        altitude_meters: 2205,
        visit_duration_min: 60,
        description: "Cultural hub, flat terrain, connects to Mall Road."
      },
      {
        name: "Viceregal Lodge",
        type: "Heritage",
        altitude_meters: 2100,
        visit_duration_min: 120,
        description: "Requires a short taxi ride from town center."
      }
    ]
  }
];

const seedDB = async () => {
  try {
    // Force Mongoose to use the new schema
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    
    console.log("🔌 Connected to MongoDB...");

    // Clear existing data
    await Destination.deleteMany({});
    console.log("🧹 Cleared existing destinations...");

    // Insert new data
    await Destination.insertMany(seedData);
    console.log("✅ Shimla data inserted successfully!");

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

seedDB();
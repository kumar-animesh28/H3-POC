const express = require("express");
const cors = require("cors");
const { updateLocation, findNearbyDrivers } = require("./helper");

const app = express();
app.use(express.json());
app.use(cors());

// Update driver location
app.post("/driver/location", async (req, res) => {
  try {
    const { driverId, lat, lng, isOnline = true } = req.body;
    if (!driverId || !lat || !lng) {
      return res.status(400).json({ error: "Missing driverId, lat, or lng" });
    }
    const result = await updateLocation(driverId, lat, lng, isOnline);
    console.log(`📍 ${driverId} location updated: ${lat}, ${lng}`);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find drivers near pickup location
app.post("/trip/search", async (req, res) => {
  try {
    const { pickupLat, pickupLng, radiusKm = 3 } = req.body;
    if (!pickupLat || !pickupLng) {
      return res.status(400).json({ error: "Missing pickupLat or pickupLng" });
    }
    const drivers = await findNearbyDrivers(pickupLat, pickupLng, radiusKm);
    console.log(`🔍 Found ${drivers.length} drivers within ${radiusKm}km`);
    res.json({
      success: true,
      pickup: { lat: pickupLat, lng: pickupLng },
      radius: radiusKm,
      drivers,
      count: drivers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

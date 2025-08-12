const h3 = require("h3-js");
const { getRedisClient } = require("./redisClient");

async function updateDriverLocation(client, driver) {
  // Simulate random small movement (about ±0.0005 degrees)
  driver.lat += (Math.random() - 0.5) * 0.001;
  driver.lng += (Math.random() - 0.5) * 0.001;

  const h3Index = h3.latLngToCell(driver.lat, driver.lng, 9);

  // Update driver info in Redis
  await client.hset(`driver:${driver.id}`, {
    driverId: driver.id,
    lat: driver.lat,
    lng: driver.lng,
    h3Index,
    isOnline: "true",
    updated: new Date().toISOString(),
  });

  // Remove driver from all old h3 sets and add to new h3 set
  // For simplicity: remove from all h3 sets by scanning keys starting with 'h3:' (optional optimization)
  // But here we just add to new cell; ideally remove from old cell set if changed

  await client.sadd(`h3:${h3Index}`, driver.id);
  console.log(
    `🚗 ${driver.id} moved to ${driver.lat.toFixed(5)}, ${driver.lng.toFixed(
      5
    )}`
  );
}

async function simulateMovement() {
  const client = getRedisClient();

  // Initial drivers, same as your seed data
  const drivers = [
    { id: "DRV001", lat: 12.9716, lng: 77.5946 },
    { id: "DRV002", lat: 12.9352, lng: 77.6245 },
    { id: "DRV003", lat: 12.9279, lng: 77.6271 },
    { id: "DRV004", lat: 12.9698, lng: 77.75 },
    { id: "DRV005", lat: 12.9667, lng: 77.5667 },
    { id: "DRV006", lat: 13.0067, lng: 77.5667 },
    { id: "DRV007", lat: 12.9237, lng: 77.4987 },
    { id: "DRV008", lat: 13.0358, lng: 77.597 },
  ];

  // Seed initially, set all drivers online
  for (const driver of drivers) {
    await updateDriverLocation(client, driver);
  }

  // Update locations every 5 seconds
  setInterval(async () => {
    for (const driver of drivers) {
      await updateDriverLocation(client, driver);
    }
  }, 5000);
}

simulateMovement();

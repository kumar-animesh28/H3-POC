const h3 = require("h3-js");
const { getRedisClient } = require("./redisClient");
const client = getRedisClient();

const updateLocation = async (driverId, lat, lng, isOnline = true) => {
  const h3Index = h3.latLngToCell(lat, lng, 9);

  // Store driver data
  const driverData = {
    driverId,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    h3Index,
    isOnline,
    updated: new Date().toISOString(),
  };

  await client.hset(`driver:${driverId}`, driverData);

  // Update H3 index
  if (isOnline) {
    await client.sadd(`h3:${h3Index}`, driverId);
  } else {
    await client.srem(`h3:${h3Index}`, driverId);
  }

  return driverData;
};

const findNearbyDrivers = async (pickupLat, pickupLng, radiusKm = 3) => {
  const pickupH3 = h3.latLngToCell(pickupLat, pickupLng, 9);
  const ringSize = Math.ceil(radiusKm / 0.5);
  const hexagons = h3.gridDisk(pickupH3, ringSize);

  const nearbyDrivers = [];
  const nearbyDriverIds = new Set();

  for (const hex of hexagons) {
    const driverIds = await client.smembers(`h3:${hex}`);

    for (const driverId of driverIds) {
      if (nearbyDriverIds.has(driverId)) continue;

      const driverData = await client.hgetall(`driver:${driverId}`);

      if (driverData.isOnline === "true") {
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          parseFloat(driverData.lat),
          parseFloat(driverData.lng)
        );

        if (distance <= radiusKm) {
          nearbyDrivers.push({
            driverId,
            lat: parseFloat(driverData.lat),
            lng: parseFloat(driverData.lng),
            distance: Math.round(distance * 100) / 100,
            eta: Math.ceil(distance * 2) + " mins",
          });
          nearbyDriverIds.add(driverId);
        }
      }
    }
  }

  return nearbyDrivers.sort((a, b) => a.distance - b.distance);
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

module.exports = {
  updateLocation,
  findNearbyDrivers,
};

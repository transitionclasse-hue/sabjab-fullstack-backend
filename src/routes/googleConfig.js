const decodePolyline = (t) => {
  let points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
          b = t.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
  }
  return points;
};

export const googleConfigRoutes = async (fastify) => {
  fastify.get("/googlemap-config", async () => {
    return {
      status: "success",
      key: process.env.GOOGLE_MAPS_API_KEY,
    };
  });

  fastify.get("/googlemap-config/directions", async (request, reply) => {
    const { origin, destination } = request.query;
    if (!origin || !destination) {
      return reply.code(400).send({ status: "error", message: "origin and destination are required" });
    }

    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.legs[0].distance.value / 1000; // in km
        const duration = route.legs[0].duration.value / 60; // in minutes
        
        // Decode polyline into array of {latitude, longitude}
        const encodedPolyline = route.overview_polyline.points;
        const coordinates = decodePolyline(encodedPolyline);

        return {
          status: "success",
          coordinates,
          distance,
          duration,
        };
      } else {
         return reply.code(400).send({ status: "error", message: data.error_message || "Directions not found" });
      }

    } catch (error) {
      console.error("Directions API Error:", error);
      return reply.code(500).send({ status: "error", message: "Internal server error fetching directions" });
    }
  });
};

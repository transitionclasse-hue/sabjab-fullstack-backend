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

  // =====================================================
  // REVERSE GEOCODING PROXY
  // Bypasses Android app restriction on API key
  // =====================================================
  fastify.get("/googlemap-config/geocode", async (request, reply) => {
    const { latlng } = request.query;
    if (!latlng) {
      return reply.code(400).send({ status: "error", message: "latlng query param is required (e.g. 26.26,78.21)" });
    }

    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const comp = result.address_components;

        // Parse address components
        const streetNumber = comp.find(c => c.types.includes("street_number"))?.long_name || "";
        const subpremise = comp.find(c => c.types.includes("subpremise"))?.long_name || "";
        const premise = comp.find(c => c.types.includes("premise"))?.long_name || "";
        const street = comp.find(c => c.types.includes("route"))?.long_name || "";
        const neighborhood = comp.find(c => c.types.includes("neighborhood"))?.long_name || "";
        const sublocality1 = comp.find(c => c.types.includes("sublocality_level_1"))?.long_name || "";
        const sublocality2 = comp.find(c => c.types.includes("sublocality_level_2"))?.long_name || "";
        const locality = comp.find(c => c.types.includes("locality"))?.long_name || "";
        const pincode = comp.find(c => c.types.includes("postal_code"))?.long_name || "";

        // Build houseNo
        let houseNo = [subpremise, streetNumber, premise].filter(Boolean).join(", ");
        if (!houseNo && result.formatted_address) {
          const firstPart = result.formatted_address.split(",")[0].trim();
          if (firstPart.length < 12) houseNo = firstPart;
        }

        // Build area
        const areaParts = [
          neighborhood || sublocality1,
          sublocality2,
          locality,
        ].filter((val, idx, self) => val && self.indexOf(val) === idx);

        const area = areaParts.length > 0 ? areaParts.join(", ") : result.formatted_address;

        // Landmark
        const establishment = data.results.find(r => r.types.includes("establishment") || r.types.includes("point_of_interest"));
        const landmark = establishment ? (establishment.name || establishment.formatted_address.split(",")[0]) : "";

        return {
          status: "success",
          full: result.formatted_address,
          area,
          houseNo,
          landmark,
          pincode,
          street,
          sublocality: sublocality1,
        };
      } else {
        return reply.code(400).send({ status: "error", message: data.error_message || data.status || "Geocoding failed" });
      }
    } catch (error) {
      console.error("Geocoding API Error:", error);
      return reply.code(500).send({ status: "error", message: "Internal server error fetching geocode" });
    }
  });
};

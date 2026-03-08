import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  address: { type: String },
  deliveryPartners: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
    },
  ],
  deliveryRadius: { type: Number, default: 2.5 }, // in kilometers (reduced from 10)
  servicedPincodes: [{ type: String }], // Optional: list of pin codes this branch services
  prepTime: { type: Number, default: 5 }, // in minutes
  vehicleSpeed: { type: Number, default: 20 }, // in km/hr
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;

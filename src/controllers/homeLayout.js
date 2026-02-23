import HomeComponent from "../models/homeComponent.js";

export const getHomeLayout = async (req, reply) => {
    try {
        const components = await HomeComponent.find({ isActive: true })
            .populate("bigDeal")
            .populate("miniDeals")
            .populate("products")
            .sort({ order: 1 })
            .exec();
        return reply.send(components);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching home layout", error });
    }
};

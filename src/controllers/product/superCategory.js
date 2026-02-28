import SuperCategory from "../../models/superCategory.js";

export const getAllSuperCategories = async (req, reply) => {
    try {
        const superCategories = await SuperCategory.find().sort({ order: 1 });
        return reply.send(superCategories);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching supercategories", error });
    }
};
export const createSuperCategory = async (req, reply) => {
    try {
        const { name, order } = req.body;
        const newSuperCategory = new SuperCategory({ name, order });
        await newSuperCategory.save();
        return reply.status(201).send(newSuperCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred creating supercategory", error });
    }
};

export const updateSuperCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const { name, order } = req.body;
        const updatedSuperCategory = await SuperCategory.findByIdAndUpdate(
            id,
            { name, order },
            { new: true, runValidators: true }
        );
        if (!updatedSuperCategory) {
            return reply.status(404).send({ message: "SuperCategory not found" });
        }
        return reply.send(updatedSuperCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred updating supercategory", error });
    }
};

export const deleteSuperCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const deletedSuperCategory = await SuperCategory.findByIdAndDelete(id);
        if (!deletedSuperCategory) {
            return reply.status(404).send({ message: "SuperCategory not found" });
        }
        return reply.send({ message: "SuperCategory deleted successfully" });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred deleting supercategory", error });
    }
};

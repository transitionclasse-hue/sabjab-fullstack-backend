import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    prepTime: {
        type: String, // e.g., "30 mins"
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium",
    },
    calories: {
        type: Number,
    },
    ingredients: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            name: String, // Optional fallback text
            quantity: String, // e.g. "200g", "1 cup"
        }
    ],
    steps: [
        {
            order: Number,
            instruction: String,
        }
    ],
    category: {
        type: String,
        enum: ["Breakfast", "Lunch", "Dinner", "Snacks", "Dessert"],
        default: "Lunch",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;

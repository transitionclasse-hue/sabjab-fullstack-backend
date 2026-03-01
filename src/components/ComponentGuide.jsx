import React from 'react';
import { Box, H2, Text, Table, TableHead, TableRow, TableCell, TableBody, Badge } from '@adminjs/design-system';

const GUIDES = [
    {
        type: "CATEGORY_STRIP",
        name: "Category Strip",
        desc: "A horizontal strip of categories/items.",
        used: ["Products (used as category endpoints)"],
        ignored: ["Title", "SubTitle", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
    },
    {
        type: "CATEGORY_CLUSTERS",
        name: "2x2 Dynamic Category Grid",
        desc: "Shows 4 items in a 2x2 grid.",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Products (Up to 4)", "Banner Image"],
        ignored: ["Carousel", "Big/Mini Deals", "Sections"]
    },
    {
        type: "FEATURED_DEALS",
        name: "Deals Section (Configurable)",
        desc: "Highlight one big product alongside multiple smaller ones.",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Big Deal (Left)", "Mini Deals (Right)"],
        ignored: ["Products", "Banner", "Carousel", "Sections"]
    },
    {
        type: "PRODUCT_SCROLLER",
        name: "Product Horizontal Scroller",
        desc: "Traditional swappable list of products.",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
        ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    },
    {
        type: "PRODUCT_GRID",
        name: "Modern Product Grid",
        desc: "Wrap-around vertical grid (usually 2 columns).",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
        ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    },
    {
        type: "BENTO_GRID",
        name: "Premium Bento Grid",
        desc: "1 Large item, 2 Small items layout.",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Big Deal (Large)", "Mini Deals (Small x2)"],
        ignored: ["Products", "Banner", "Carousel", "Sections"]
    },
    {
        type: "TRIPLE_SECTION_GRID",
        name: "Triple Section Pager",
        desc: "Three side-by-side sticky pages you can swipe between.",
        used: ["Title (Main)", "Theme Mode", "Sections (Needs 3: each has Title, Color, Products)"],
        ignored: ["SubTitle", "Button Text", "Theme Color", "Banner", "Carousel", "Big/Mini Deals", "Products (General)"]
    },
    {
        type: "IMAGE_CAROUSEL",
        name: "Image Carousel Slider",
        desc: "Auto-sliding image banners.",
        used: ["Title", "Carousel Images (Array of URLs)", "Theme (Optional)"],
        ignored: ["Products", "Banner", "Big/Mini Deals", "Sections"]
    },
    {
        type: "SPECIAL / HERO",
        name: "Gradient Hero, Promo, Ramzan, Holi...",
        desc: "Specialized high-impact visual layouts.",
        used: ["Title", "SubTitle", "Button Text", "Theme", "Products", "Banner Image"],
        ignored: ["Carousel", "Big/Mini Deals", "Sections"]
    }
];

const ComponentGuide = () => {
    return (
        <Box variant="white" flex flexDirection="column" mx="auto" p="xl" style={{ maxWidth: 1000, marginTop: 40, marginBottom: 40, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <H2>Home Component Builder Guide</H2>
            <Text mb="xl" color="grey60">
                This cheat sheet helps you understand which fields to fill for every Home Component type.
                Filling ignored fields won't break the app, but they will not be displayed on the frontend.
            </Text>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Component Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>✅ Fields Used</TableCell>
                        <TableCell>❌ Ignored</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {GUIDES.map((g, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Text fontWeight="bold">{g.name}</Text>
                                <Text variant="sm" color="grey40" mt="sm">{g.type}</Text>
                            </TableCell>
                            <TableCell>{g.desc}</TableCell>
                            <TableCell>
                                {g.used.map((u, ui) => (
                                    <Badge key={ui} size="sm" variant="success" mb="sm" mr="sm">{u}</Badge>
                                ))}
                            </TableCell>
                            <TableCell>
                                <Text variant="sm" color="grey60">{g.ignored.join(', ')}</Text>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default ComponentGuide;

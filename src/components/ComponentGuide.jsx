import React from 'react';
import { Box, H2, Text, Table, TableHead, TableRow, TableCell, TableBody, Badge } from '@adminjs/design-system';

const GUIDES = [
  // --- STANDARD COLLECTIONS ---
  {
    type: "PRODUCT_SCROLLER",
    name: "Product Horizontal Scroller",
    desc: "Traditional swappable list of products.",
    mapping: {
      "Products": "The items shown in the horizontal list",
      "Title": "Main header for the scroller",
      "Theme Color": "Background color for the scroller section"
    },
    used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "PRODUCT_GRID",
    name: "Modern Product Grid",
    desc: "Wrap-around vertical grid (usually 2 columns).",
    mapping: {
      "Products": "Products filling the grid",
      "Button Text": "Text for the 'View More' style button"
    },
    used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "PRODUCT_GRID_3X2",
    name: "Elegant 3x2 Product Grid",
    desc: "A compact 3-column, 2-row grid for variety.",
    mapping: {
      "Products": "Fills the 6 slots in the grid (3 columns x 2 rows)"
    },
    used: ["Title", "SubTitle", "Products"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "STORY_STRIP",
    name: "Instagram-Style Story Strip",
    desc: "Circular icons used for quick navigation or highlights.",
    mapping: {
      "Products": "Each product becomes a circular 'Story' circle showing the product image"
    },
    used: ["Products", "Title", "Theme"],
    ignored: ["SubTitle", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "CATEGORY_STRIP",
    name: "Category Strip",
    desc: "A horizontal strip of categories/items.",
    mapping: {
      "Categories": "The list of sub-categories to display"
    },
    used: ["Categories"],
    ignored: ["Title", "SubTitle", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },

  // --- SPECIALIZED GRIDS ---
  {
    type: "BENTO_GRID",
    name: "Premium Bento Grid",
    desc: "Modern layout with 1 Large item and 2 Small items.",
    mapping: {
      "Big Deal": "The main focus product (Large Card)",
      "Mini Deals": "Supporting products (2 Small Cards on the right)"
    },
    used: ["Title", "SubTitle", "Button Text", "Theme", "Big Deal (Large)", "Mini Deals (Small x2)"],
    ignored: ["Products", "Banner", "Carousel", "Sections"]
  },
  {
    type: "AISLE_2X2_GRID",
    name: "Aisle 2x2 Product Grid",
    desc: "Combination of a category strip and a product grid.",
    mapping: {
      "Categories": "Categories shown in the top horizontal list",
      "Products": "Products shown in the 2x2 grid below the categories"
    },
    used: ["Title", "SubTitle", "Categories", "Products", "Theme"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "CATEGORY_CLUSTERS",
    name: "2x2 Dynamic Category Grid",
    desc: "Shows 4 items in a 2x2 grid with an optional banner side.",
    mapping: {
      "Products": "The 4 products shown in the grid",
      "Banner Image": "Optional banner shown alongside the grid"
    },
    used: ["Title", "SubTitle", "Button Text", "Theme", "Products (Up to 4)", "Banner Image"],
    ignored: ["Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "CATEGORY_GRID_FOUR_IMAGES",
    name: "Category 2x2 Image Grid",
    desc: "A grid where each category shows 4 small product previews.",
    mapping: {
      "Categories": "The sub-categories used to build the image grids"
    },
    used: ["Title", "SubTitle", "Categories"],
    ignored: ["Products", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "GROCERY_LIST_2X3",
    name: "Grocery List 2x3 Grid",
    desc: "A 2x3 layout specifically for category collections.",
    mapping: {
      "Categories": "Fills the 6 slots (2 columns x 3 rows)"
    },
    used: ["Title", "SubTitle", "Categories"],
    ignored: ["Products", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },

  // --- MEDIA & PROMO ---
  {
    type: "MINI_VIDEO",
    name: "Floating Mini Video",
    desc: "An auto-playing video promotion.",
    mapping: {
      "Upload Video": "The MP4 file for the floating video",
      "Video Thumbnail": "Poster image shown before the video plays",
      "Banner Image": "Static background if video is not supported"
    },
    used: ["Title", "SubTitle", "Upload Video", "Video Thumbnail", "Banner Image"],
    ignored: ["Products", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "PROMOTION_PAGINATION",
    name: "Promo with 4-Dots Pagination",
    desc: "Large card design for featured events or deals.",
    mapping: {
      "Products": "The primary product being promoted"
    },
    used: ["Title", "SubTitle", "Products", "Theme"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "PROMO_BANNER",
    name: "Promotional Banner",
    desc: "Static high-quality banner for ads.",
    mapping: {
      "Upload Banner": "The main graphic image",
      "Button Text": "Label for the banner's call-to-action"
    },
    used: ["Upload Banner", "Button Text", "Theme"],
    ignored: ["Title", "SubTitle", "Products", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "IMAGE_CAROUSEL",
    name: "Image Carousel Slider",
    desc: "Auto-sliding collection of banner images.",
    mapping: {
      "Carousel Images": "Array of URLs to valid image files"
    },
    used: ["Title", "Carousel Images (Array)", "Theme (Optional)"],
    ignored: ["Products", "Banner", "Big/Mini Deals", "Sections"]
  },

  // --- INTERACTIVE ---
  {
    type: "TRIPLE_SECTION_GRID",
    name: "Triple Section Pager",
    desc: "Swipeable pages with distinct collections.",
    mapping: {
      "Sections": "Requires EXACTLY 3 sections. Each needs: Title, Color, and Products.",
      "Theme Mode": "Set to 'glass' for premium blurred effects"
    },
    used: ["Title (Main)", "Theme Mode", "Sections (Needs 3 entries)"],
    ignored: ["SubTitle", "Button Text", "Theme Color", "Banner", "Carousel", "Big/Mini Deals", "Products (General)"]
  },

  // --- FESTIVE / HERO ---
  {
    type: "GRADIENT_HERO",
    name: "High-Impact Gradient Hero",
    desc: "Primary entry section with large graphics.",
    mapping: {
      "Banner Image": "Large background graphic",
      "Products": "Featured items overlaying the hero"
    },
    used: ["Title", "SubTitle", "Button Text", "Theme", "Products", "Banner Image"],
    ignored: ["Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "RAMZAN_SPECIAL / SPECIAL2",
    name: "Festive Ramzan Layouts",
    desc: "Cultural/Themed layouts with specialized visual effects.",
    mapping: {
      "Products": "Products list shown within the festive theme",
      "Theme Mode": "Best used with 'glass' mode"
    },
    used: ["Title", "SubTitle", "Products", "Theme Mode"],
    ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
  },
  {
    type: "DIWALI_SPECIAL / HAPPY_HOLI / CHRISTMAS...",
    name: "Holiday Themed Grids",
    desc: "Seasonal layouts for special events.",
    mapping: {
      "Products": "Active products for the holiday",
      "Banner Image": "Optional seasonal background/hero"
    },
    used: ["Title", "SubTitle", "Products", "Banner Image", "Theme Mode"],
    ignored: ["Carousel", "Big/Mini Deals", "Sections"]
  }
];

const ComponentGuide = () => {
    return (
        <Box variant="white" flex flexDirection="column" mx="auto" p="xl" style={{ maxWidth: 1200, marginTop: 40, marginBottom: 40, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Box mb="xl">
              <H2>Home Component Builder Guide</H2>
              <Text color="grey60" mb="lg">
                  This cheat sheet explains how to configure all 22 component types. 
                  The Page Builder is "smart"—it hides fields that aren't needed for your selected type.
              </Text>
            </Box>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell width="25%">Component Type</TableCell>
                        <TableCell width="25%">Description</TableCell>
                        <TableCell width="30%">🎯 Field Mapping (Smart Helpers)</TableCell>
                        <TableCell width="20%">✅ Visible Fields</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {GUIDES.map((g, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Text fontWeight="bold" color="primary100">{g.name}</Text>
                                <Badge size="sm" variant="info" style={{ textTransform: 'none', marginTop: 4 }}>{g.type}</Badge>
                            </TableCell>
                            <TableCell>
                                <Text variant="sm">{g.desc}</Text>
                            </TableCell>
                            <TableCell>
                                {Object.entries(g.mapping).map(([field, help], mi) => (
                                  <Box key={mi} mb="sm" p="xs" style={{ background: '#f9fafb', borderRadius: 4, borderLeft: '3px solid #7033ff' }}>
                                    <Text variant="sm" fontWeight="bold">{field}:</Text>
                                    <Text variant="sm" color="grey60">{help}</Text>
                                  </Box>
                                ))}
                            </TableCell>
                            <TableCell>
                                {g.used.map((u, ui) => (
                                    <Badge key={ui} size="sm" variant="success" mb="xs" mr="xs">{u}</Badge>
                                ))}
                                <Box mt="sm">
                                  <Text variant="xs" color="grey40">Ignored: {g.ignored.slice(0, 3).join(', ')}...</Text>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            <Box mt="xl" p="lg" style={{ background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <Text fontWeight="bold" color="#1e40af">💡 Pro Tip:</Text>
              <Text variant="sm" color="#1e40af">
                If you provide a field that is marked as ❌ Ignored for a specific type, it won't break anything! 
                The field will simply be ignored by the app's rendering engine for that specific component.
              </Text>
            </Box>
        </Box>
    );
};

export default ComponentGuide;

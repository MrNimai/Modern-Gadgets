// Neon Gadgets product data source
// Add, update, or remove products from this one file.
//
// Quick add steps:
// 1. Copy one createNeonProduct({ ... }) block below.
// 2. Change the id, name, price, category, visual, visuals, image, and text fields.
// 3. Set featured: true if you want it on the home page.
// 4. Refresh the browser.
//
// Available product visuals (CSS classes):
// - phone
// - headphones
// - laptop
// - watch
//
// Or use image paths for actual images:
// - "path/to/image.png"
// - visuals: ["image1.png", "image2.png"] for multiple images

(function() {
    function cleanText(value, fallback) {
        var output = String(value || "").trim();
        return output || String(fallback || "").trim();
    }

    function cleanNumber(value, fallback) {
        var output = Number(value);
        return Number.isFinite(output) ? output : Number(fallback || 0);
    }

    function cleanArray(values) {
        var output = [];
        var i;

        if (!Array.isArray(values)) {
            return output;
        }

        for (i = 0; i < values.length; i++) {
            if (values[i]) {
                output.push(String(values[i]).trim());
            }
        }

        return output;
    }

    function createNeonCategory(config) {
        return {
            value: cleanText(config.value || config.label, "Accessories"),
            label: cleanText(config.label || config.value, "Accessories"),
            visual: cleanText(config.visual, "smart")
        };
    }

    function createNeonProduct(config) {
        var name = cleanText(config.name, "New Gadget");
        var note = cleanText(config.note, "Future-ready gadget with a clean neon design.");
        var visuals = Array.isArray(config.visuals) ? config.visuals : [cleanText(config.visual, "phone")];

        return {
            id: cleanText(config.id, "new-gadget-id"),
            name: name,
            price: cleanNumber(config.price, 0),
            category: cleanText(config.category, "Accessories"),
            visual: visuals[0], // Keep for backward compatibility
            visuals: visuals,
            image: cleanText(config.image, ""),
            badge: cleanText(config.badge, "Just Added"),
            rating: cleanText(config.rating, "4.8/5"),
            note: note,
            keywords: cleanText(config.keywords, name.toLowerCase()),
            specs: cleanArray(config.specs),
            story: cleanText(config.story, note),
            featured: config.featured === true
        };
    }

    window.NEON_CATEGORY_TEMPLATE = {
        value: "Gaming",
        label: "Gaming",
        visual: "smart"
    };

    window.NEON_PRODUCT_TEMPLATE = {
        id: "new-gadget-id",
        name: "Quantum Beam One",
        price: 499,
        category: "Accessories",
        visual: "headphones",
        visuals: ["headphones", "phone"], // Array of visual classes for multiple images
        image: "images/My Logo.png", // Main product image file
        badge: "Just Added",
        rating: "4.8/5",
        note: "Short product summary for the card.",
        keywords: "quantum beam accessory audio neon",
        specs: ["Spec 1", "Spec 2", "Spec 3"],
        story: "Longer story for the product detail page.",
        featured: false
    };

    window.NEON_PRODUCT_CATEGORIES = [
        createNeonCategory({
            value: "Laptops",
            label: "Laptops",
            visual: "laptops"
        }),
        createNeonCategory({
            value: "Phones",
            label: "Phones",
            visual: "phones"
        }),
        createNeonCategory({
            value: "Accessories",
            label: "Accessories",
            visual: "accessories"
        }),
        createNeonCategory({
            value: "Smart Devices",
            label: "Smart Devices",
            visual: "smart"
        })
    ];

    window.NEON_PRODUCTS = [
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            image: "images/headphones-background-illustration-ai-generative-free-photo.webp",
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Premium wireless headset with active noise cancellation and immersive sound quality.",
            keywords: "headset audio anc gaming rgb accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "iphone-18-pro",
            name: "iPhone 18 Pro Max",
            price: 1099,
            category: "Phones",
            visual: "phone",
            image: "images/iphone-18-pro-max-rumored-to-deliver-next-level-battery-life-v0-w46HFC6xEpY3tifTCLG0et4EdsKDPA3OWzxzC4jzhnw.webp",
            badge: "New Arrival",
            rating: "4.9/5",
            note: "Flagship smartphone with advanced AI camera and next-level battery life.",
            keywords: "iphone pro max phone smartphone camera ai",
            specs: ["A18 Chip", "Pro Camera", "120Hz Display"],
            story: "The ultimate flagship device designed for professionals and tech enthusiasts.",
            featured: true
        }),
        createNeonProduct({
            id: "vivo-y17s",
            name: "Vivo Y17s",
            price: 299,
            category: "Phones",
            visual: "phone",
            image: "images/Vivo-Y17s-Price-in-Nepal.webp",
            badge: "Value Pick",
            rating: "4.5/5",
            note: "Affordable smartphone with powerful performance and excellent display.",
            keywords: "vivo y17s phone budget smartphone",
            specs: ["Snapdragon 680", "50MP Camera", "5000mAh Battery"],
            story: "The perfect everyday phone that doesn't compromise on features.",
            featured: true
        }),
        createNeonProduct({
            id: "pc-build-elite",
            name: "PC Build Elite",
            price: 1899,
            category: "Laptops",
            visual: "laptop",
            image: "images/free-photo-of-open-white-computer-case-with-fans-inside.webp",
            badge: "Gaming Beast",
            rating: "4.9/5",
            note: "High-performance gaming PC with custom cooling and premium components.",
            keywords: "gaming pc processor cpu gpu computer case",
            specs: ["RTX 4090", "Intel i9-13900K", "32GB RAM"],
            story: "Built for extreme gaming and professional workloads with cutting-edge cooling.",
            featured: true
        }),
        createNeonProduct({
            id: "tech-gadget-pro",
            name: "Tech Gadget Pro",
            price: 599,
            category: "Smart Devices",
            visual: "smart",
            image: "images/s-l1600.webp",
            badge: "Tech Innovation",
            rating: "4.7/5",
            note: "Smart device combining AI and IoT for seamless home automation.",
            keywords: "smart device iot automation ai gadget",
            specs: ["AI Enabled", "WiFi 6", "Smart Sync"],
            story: "Transform your living space with intelligent automation and control.",
            featured: false
        }),
        createNeonProduct({
            id: "tech-accessory-one",
            name: "Tech Accessory One",
            price: 199,
            category: "Accessories",
            visual: "watch",
            image: "images/pexels-photo-424436.webp",
            badge: "Popular",
            rating: "4.6/5",
            note: "Versatile tech accessory designed for modern professionals.",
            keywords: "tech accessory portable gadget device",
            specs: ["Compact Design", "Quick Charge", "Premium Build"],
            story: "The ultimate companion for your tech-driven lifestyle.",
            featured: false
        }),
        createNeonProduct({
            id: "gadget-essential",
            name: "Gadget Essential",
            price: 349,
            category: "Smart Devices",
            visual: "smart",
            image: "images/pexels-photo-4581613.webp",
            badge: "Must-Have",
            rating: "4.8/5",
            note: "Essential gadget for everyday tech enthusiasts and professionals.",
            keywords: "gadget essential device tech multimedia",
            specs: ["Multi-Format", "Pro Features", "Durable Design"],
            story: "An indispensable tool for anyone serious about their tech setup.",
            featured: false
        })
    ];
})();

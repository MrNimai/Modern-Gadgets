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
        image: "My Logo.png", // Main product image file
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
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        createNeonProduct({
            id: "novasound-pro",
            name: "NovaSound Pro",
            price: 249,
            category: "Accessories",
            visual: "headphones",
            visuals: ["headphones", "phone", "laptop"],
            image: "My Logo.png", // Add your image file here
            badge: "Best Audio",
            rating: "4.8/5",
            note: "Immersive wireless headset built for gaming, streaming, and all-day comfort.",
            keywords: "headset audio anc gaming rgb 40h accessory novasound",
            specs: ["ANC", "RGB Edge", "40H Play"],
            story: "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.",
            featured: true
        }),
        
       
    ];
})();

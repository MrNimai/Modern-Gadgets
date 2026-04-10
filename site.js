var STORAGE_KEY = "neonGadgetsCart";
var ORDER_STORAGE_KEY = "neonGadgetsOrders";
var LAST_ORDER_KEY = "neonGadgetsLastOrderId";
var currentDetailQuantity = 1;
var toastTimer = null;
var PRODUCTS = Array.isArray(window.NEON_PRODUCTS) ? window.NEON_PRODUCTS : [];
var PRODUCT_CATEGORIES = Array.isArray(window.NEON_PRODUCT_CATEGORIES) ? window.NEON_PRODUCT_CATEGORIES : [];

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getProductById(productId) {
    for (var i = 0; i < PRODUCTS.length; i++) {
        if (PRODUCTS[i].id === productId) {
            return PRODUCTS[i];
        }
    }

    return null;
}

function getCart() {
    return loadFromStorage(STORAGE_KEY) || [];
}

function saveCart(cart) {
    saveToStorage(STORAGE_KEY, cart);
}

function getOrders() {
    return loadFromStorage(ORDER_STORAGE_KEY) || [];
}

function saveOrders(orders) {
    saveToStorage(ORDER_STORAGE_KEY, orders);
}

function formatPrice(value) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function normalizeCategoryValue(value) {
    return String(value || "").trim();
}

function getCategoryKey(value) {
    return normalizeCategoryValue(value).toLowerCase();
}

function guessCategoryVisual(value) {
    var normalized = getCategoryKey(value);

    if (normalized.indexOf("laptop") !== -1) {
        return "laptops";
    }

    if (normalized.indexOf("phone") !== -1) {
        return "phones";
    }

    if (normalized.indexOf("accessor") !== -1 || normalized.indexOf("audio") !== -1) {
        return "accessories";
    }

    if (
        normalized.indexOf("smart") !== -1 ||
        normalized.indexOf("wear") !== -1 ||
        normalized.indexOf("watch") !== -1
    ) {
        return "smart";
    }

    return "smart";
}

function getMergedCategories(includeAll) {
    var categories = [];
    var seen = {};

    function pushCategory(config) {
        var value = normalizeCategoryValue(config && (config.value || config.label));
        var label = normalizeCategoryValue(config && (config.label || config.value));
        var key = getCategoryKey(value);
        var visual;

        if (!value || seen[key]) {
            return;
        }

        visual = normalizeCategoryValue(config && config.visual) || guessCategoryVisual(value);
        seen[key] = true;
        categories.push({
            value: value,
            label: label || value,
            visual: visual
        });
    }

    if (includeAll) {
        pushCategory({
            value: "All",
            label: "All Products",
            visual: "smart"
        });
    }

    for (var i = 0; i < PRODUCT_CATEGORIES.length; i++) {
        pushCategory(PRODUCT_CATEGORIES[i]);
    }

    for (var j = 0; j < PRODUCTS.length; j++) {
        pushCategory({
            value: PRODUCTS[j].category,
            label: PRODUCTS[j].category
        });
    }

    return categories;
}

function getFeaturedProducts() {
    var featured = [];

    for (var i = 0; i < PRODUCTS.length; i++) {
        if (PRODUCTS[i].featured) {
            featured.push(PRODUCTS[i]);
        }
    }

    if (featured.length) {
        return featured;
    }

    return PRODUCTS.slice(0, 4);
}

function buildProductsUrl(query, category) {
    var params = new URLSearchParams();

    if (query) {
        params.set("q", query);
    }

    if (category && category !== "All") {
        params.set("category", category);
    }

    return "products.html" + (params.toString() ? "?" + params.toString() : "");
}

function buildProductDetailUrl(productId) {
    return "product-detail.html?id=" + encodeURIComponent(productId);
}

function getCartItemCount(items) {
    var count = 0;

    for (var i = 0; i < items.length; i++) {
        count += items[i].quantity;
    }

    return count;
}

function calculateCartSummary(cart) {
    var subtotal = 0;

    for (var i = 0; i < cart.length; i++) {
        subtotal += cart[i].price * cart[i].quantity;
    }

    var shipping = subtotal > 0 && subtotal < 700 ? 25 : 0;
    var tax = subtotal * 0.05;

    return {
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: subtotal + shipping + tax
    };
}

function closeMobileMenu() {
    var menuToggle = document.getElementById("menuToggle");
    var mobilePanel = document.getElementById("mobilePanel");

    if (!menuToggle || !mobilePanel) {
        return;
    }

    mobilePanel.classList.remove("show");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
}

function initializeMenu() {
    var menuToggle = document.getElementById("menuToggle");
    var mobilePanel = document.getElementById("mobilePanel");
    var mobileLinks;

    if (!menuToggle || !mobilePanel) {
        return;
    }

    menuToggle.addEventListener("click", function() {
        var isOpen = mobilePanel.classList.toggle("show");
        menuToggle.classList.toggle("open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mobileLinks = mobilePanel.querySelectorAll("a");
    for (var i = 0; i < mobileLinks.length; i++) {
        mobileLinks[i].addEventListener("click", closeMobileMenu);
    }
}

function initializeNavigationState() {
    var page = document.body.getAttribute("data-page") || "home";
    var activePage = page;
    var links = document.querySelectorAll("[data-nav-link]");
    var cartButtons = document.querySelectorAll("[data-cart-button]");

    if (page === "product-detail") {
        activePage = "products";
    } else if (page === "checkout" || page === "confirmation") {
        activePage = "cart";
    }

    for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle("active", links[i].dataset.navLink === activePage);
    }

    for (var j = 0; j < cartButtons.length; j++) {
        cartButtons[j].classList.toggle("active", activePage === "cart");
    }
}

function updateCartBadge() {
    var count = getCartItemCount(getCart());
    var badges = document.querySelectorAll("[data-cart-count]");

    for (var i = 0; i < badges.length; i++) {
        badges[i].textContent = count;
    }
}

function animateCartIcon() {
    var cartButtons = document.querySelectorAll("[data-cart-button]");

    for (var i = 0; i < cartButtons.length; i++) {
        cartButtons[i].classList.remove("bump");
        void cartButtons[i].offsetWidth;
        cartButtons[i].classList.add("bump");
    }
}

function showToast(message) {
    var toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function() {
        toast.classList.remove("show");
    }, 2200);
}

function createSpecHtml(specs) {
    var html = "";
    var safeSpecs = Array.isArray(specs) ? specs : [];

    for (var i = 0; i < safeSpecs.length; i++) {
        html += '<span class="spec-pill">' + safeSpecs[i] + "</span>";
    }

    return html;
}

function createProductCard(product) {
    return '\n        <article class="product-card" data-product-id="' + product.id + '">\n' +
        '            ' + (product.image && product.image.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? '<img src="' + product.image + '" alt="' + product.name + '" class="product-media">' : '<div class="product-media ' + product.visual + '"><span class="product-glow"></span></div>') + '\n' +
        '            <div class="product-info">\n' +
        '                <div class="product-top">\n' +
        '                    <span class="product-badge">' + product.badge + "</span>\n" +
        '                    <span class="product-rating">' + product.rating + "</span>\n" +
        "                </div>\n" +
        '                <h3 class="product-name">' + product.name + "</h3>\n" +
        '                <p class="product-note">' + product.note + "</p>\n" +
        '                <div class="product-specs">' + createSpecHtml(product.specs) + "</div>\n" +
        '                <div class="product-bottom">\n' +
        '                    <div class="product-price-wrap">\n' +
        '                        <span class="product-price-label">Starting at</span>\n' +
        '                        <p class="product-price">$' + formatPrice(product.price) + "</p>\n" +
        "                    </div>\n" +
        '                    <button type="button" class="product-btn" data-add-to-cart="' + product.id + '">Add to Cart</button>\n' +
        "                </div>\n" +
        "            </div>\n" +
        "        </article>\n    ";
}

function initializeProductGrids() {
    var grids = document.querySelectorAll(".product-grid");

    for (var i = 0; i < grids.length; i++) {
        grids[i].addEventListener("click", function(event) {
            var addButton = event.target.closest("[data-add-to-cart]");
            var card = event.target.closest(".product-card[data-product-id]");

            if (addButton) {
                event.preventDefault();
                event.stopPropagation();
                addToCart(addButton.dataset.addToCart, 1);
                return;
            }

            if (card) {
                window.location.href = buildProductDetailUrl(card.dataset.productId);
            }
        });
    }
}

function addToCart(productId, quantity) {
    var product = getProductById(productId);
    var cart = getCart();
    var safeQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    var existingItem = null;

    if (!product) {
        return;
    }

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === product.id) {
            existingItem = cart[i];
            break;
        }
    }

    if (existingItem) {
        existingItem.quantity += safeQuantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            visual: product.visual,
            image: product.image,
            note: product.note,
            quantity: safeQuantity
        });
    }

    saveCart(cart);
    updateCartBadge();
    animateCartIcon();
    showToast(product.name + " added to cart");
}

function renderFeaturedProducts() {
    var container = document.getElementById("featuredProductGrid");
    var featuredProducts = getFeaturedProducts();
    var html = "";

    if (!container) {
        return;
    }

    for (var i = 0; i < featuredProducts.length; i++) {
        html += createProductCard(featuredProducts[i]);
    }

    if (!html) {
        html =
            '<div class="empty-state-card">' +
                "<p>No featured products are available yet. Add a new featured item in products-data.js.</p>" +
                '<a href="products.html" class="product-btn">Browse Products</a>' +
            "</div>";
    }

    container.innerHTML = html;
}

function setSearchInputs(value) {
    var inputs = document.querySelectorAll("[data-search-input]");

    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = value;
    }
}

function matchesProduct(product, query, category) {
    var haystack;
    var specs = Array.isArray(product.specs) ? product.specs : [];

    if (category && category !== "All" && product.category !== category) {
        return false;
    }

    if (!query) {
        return true;
    }

    haystack = [
        product.name,
        product.category,
        product.note,
        product.badge,
        product.rating,
        product.keywords,
        specs.join(" "),
        product.story
    ].join(" ").toLowerCase();

    return haystack.indexOf(query.toLowerCase()) !== -1;
}

function createCategoryCard(category, query, activeCategory) {
    var isActive = getCategoryKey(category.value) === getCategoryKey(activeCategory || "");

    return '\n        <a href="' + buildProductsUrl(query, category.value) + '" class="category-card' + (isActive ? " active" : "") + '" data-category-link="' + category.value + '">\n' +
        '            <div class="category-visual ' + category.visual + '"></div>\n' +
        '            <h3 class="category-name">' + category.label + "</h3>\n" +
        "        </a>\n    ";
}

function renderCategoryGrid(containerId, categories, query, activeCategory) {
    var container = document.getElementById(containerId);
    var html = "";

    if (!container) {
        return;
    }

    for (var i = 0; i < categories.length; i++) {
        html += createCategoryCard(categories[i], query, activeCategory);
    }

    container.innerHTML = html;
}

function renderHomeCategories() {
    renderCategoryGrid("homeCategoryGrid", getMergedCategories(false), "", "");
}

function renderProductsCategories(query, activeCategory) {
    renderCategoryGrid("productsCategoryGrid", getMergedCategories(true), query, activeCategory || "All");
}

function renderProductsPage() {
    var grid = document.getElementById("productsGrid");
    var feedback = document.getElementById("searchFeedback");
    var feedbackText = document.getElementById("searchFeedbackText");
    var empty = document.getElementById("searchEmpty");
    var clearBtn = document.getElementById("clearSearchBtn");
    var params;
    var query;
    var category;
    var html = "";
    var count = 0;
    var parts = [];

    if (!grid) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    query = (params.get("q") || "").trim();
    category = params.get("category") || "All";
    setSearchInputs(query);
    renderProductsCategories(query, category);

    for (var i = 0; i < PRODUCTS.length; i++) {
        if (matchesProduct(PRODUCTS[i], query, category)) {
            html += createProductCard(PRODUCTS[i]);
            count += 1;
        }
    }

    grid.innerHTML = html;

    if (clearBtn) {
        clearBtn.href = "products.html";
    }

    if (!feedback || !feedbackText || !empty) {
        return;
    }

    if (!query && category === "All") {
        feedback.classList.add("is-hidden");
        empty.classList.add("is-hidden");
        return;
    }

    if (category !== "All") {
        parts.push(category);
    }

    if (query) {
        parts.push('"' + query + '"');
    }

    feedbackText.textContent = "Showing " + count + " result" + (count === 1 ? "" : "s") + " for " + parts.join(" + ");
    feedback.classList.remove("is-hidden");
    empty.classList.toggle("is-hidden", count !== 0);
}

function renderProductDetailPage() {
    var detailView = document.getElementById("detailView");
    var params;
    var productId;
    var product;
    var meta;
    var metaHtml = "";
    var productSpecs;
    var visuals;
    var mainImageHtml = "";
    var thumbnailsHtml = "";

    if (!detailView) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    productId = params.get("id") || "";
    product = getProductById(productId);
    currentDetailQuantity = 1;

    if (!product) {
        detailView.innerHTML =
            '<div class="empty-state-card">' +
                "<p>We could not find that product. Go back to the products page and open another card.</p>" +
                '<a href="products.html" class="product-btn">Browse Products</a>' +
            "</div>";
        return;
    }

    document.title = product.name + " | Neon Gadgets";
    productSpecs = Array.isArray(product.specs) ? product.specs : [];
    visuals = product.visuals || [product.visual];
    meta = [
        { label: "Category", value: product.category },
        { label: "Rating", value: product.rating },
        { label: "Edition", value: product.badge },
        { label: "Core Specs", value: productSpecs.join(", ") }
    ];

    for (var i = 0; i < meta.length; i++) {
        metaHtml += '<div class="detail-meta-item"><span>' + meta[i].label + '</span><strong>' + meta[i].value + "</strong></div>";
    }

    // Main image (first visual or image)
    var mainImageSrc = product.image || visuals[0];
    if (mainImageSrc.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        mainImageHtml = '<img src="' + mainImageSrc + '" alt="' + product.name + '" class="product-media detail-media">';
    } else {
        mainImageHtml = '<div class="product-media detail-media ' + mainImageSrc + '">' +
                            '<span class="product-glow"></span>' +
                        '</div>';
    }

    // Thumbnails for additional images
    if (visuals.length > 1) {
        thumbnailsHtml = '<div class="detail-thumbnails">';
        for (var j = 0; j < visuals.length; j++) {
            var activeClass = j === 0 ? ' active' : '';
            var thumbSrc = visuals[j];
            if (thumbSrc.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                thumbnailsHtml += '<button type="button" class="detail-thumbnail' + activeClass + '" data-visual="' + thumbSrc + '">' +
                                    '<img src="' + thumbSrc + '" alt="' + product.name + ' view ' + (j+1) + '" class="thumbnail-media">' +
                                  '</button>';
            } else {
                thumbnailsHtml += '<button type="button" class="detail-thumbnail' + activeClass + '" data-visual="' + thumbSrc + '">' +
                                    '<div class="product-media thumbnail-media ' + thumbSrc + '">' +
                                        '<span class="product-glow"></span>' +
                                    '</div>' +
                                  '</button>';
            }
        }
        thumbnailsHtml += '</div>';
    }

    detailView.innerHTML =
        '<div class="detail-card">' +
            '<div class="detail-media-shell">' +
                mainImageHtml +
                thumbnailsHtml +
            "</div>" +
            '<div class="detail-copy">' +
                '<button type="button" class="detail-back-btn" data-detail-close>Back to Products</button>' +
                '<span class="product-badge">' + product.badge + "</span>" +
                "<h2>" + product.name + "</h2>" +
                '<p class="detail-lead">' + product.note + "</p>" +
                '<p class="detail-lead">' + product.story + "</p>" +
                '<div class="product-specs">' + createSpecHtml(productSpecs) + "</div>" +
                '<div class="detail-meta">' + metaHtml + "</div>" +
                '<div class="product-price-wrap">' +
                    '<span class="product-price-label">Starting at</span>' +
                    '<p class="product-price">$' + formatPrice(product.price) + "</p>" +
                "</div>" +
                '<div class="detail-actions">' +
                    '<div class="qty-controls detail-qty-controls">' +
                        '<button type="button" data-detail-qty="-1" aria-label="Decrease quantity">-</button>' +
                        '<span class="qty-value" id="detailQtyValue">1</span>' +
                        '<button type="button" data-detail-qty="1" aria-label="Increase quantity">+</button>' +
                    "</div>" +
                    '<button type="button" class="detail-add-btn" data-detail-add="' + product.id + '">Add to Cart</button>' +
                    '<button type="button" class="detail-buy-btn" data-detail-buy="' + product.id + '">Buy Now</button>' +
                "</div>" +
            "</div>" +
        "</div>";

    detailView.addEventListener("click", function(event) {
        var closeButton = event.target.closest("[data-detail-close]");
        var qtyButton = event.target.closest("[data-detail-qty]");
        var addButton = event.target.closest("[data-detail-add]");
        var buyButton = event.target.closest("[data-detail-buy]");
        var qtyValue = document.getElementById("detailQtyValue");

        if (closeButton) {
            window.location.href = "products.html";
            return;
        }

        if (qtyButton) {
            currentDetailQuantity = Math.max(1, currentDetailQuantity + parseInt(qtyButton.dataset.detailQty, 10));
            if (qtyValue) {
                qtyValue.textContent = currentDetailQuantity;
            }
            return;
        }

        if (addButton) {
            addToCart(addButton.dataset.detailAdd, currentDetailQuantity);
            return;
        }

        if (buyButton) {
            addToCart(buyButton.dataset.detailBuy, currentDetailQuantity);
            window.location.href = "checkout.html";
            return;
        }

        var thumbnailButton = event.target.closest("[data-visual]");
        if (thumbnailButton) {
            var mainMedia = detailView.querySelector(".detail-media");
            var activeThumbnail = detailView.querySelector(".detail-thumbnail.active");
            var visual = thumbnailButton.dataset.visual;

            if (mainMedia && visual) {
                if (visual.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                    // If visual is an image path, update img src
                    if (mainMedia.tagName === 'IMG') {
                        mainMedia.src = visual;
                    } else {
                        // If main is CSS, replace with img
                        var img = document.createElement('img');
                        img.src = visual;
                        img.alt = product.name;
                        img.className = 'product-media detail-media';
                        mainMedia.parentNode.replaceChild(img, mainMedia);
                    }
                } else {
                    // If visual is CSS class, update class
                    if (mainMedia.tagName === 'IMG') {
                        // Replace img with div
                        var div = document.createElement('div');
                        div.className = 'product-media detail-media ' + visual;
                        div.innerHTML = '<span class="product-glow"></span>';
                        mainMedia.parentNode.replaceChild(div, mainMedia);
                    } else {
                        // Remove existing visual classes
                        mainMedia.className = mainMedia.className.replace(/\b(phone|headphones|laptop|watch)\b/g, "");
                        // Add new visual class
                        mainMedia.classList.add(visual);
                    }
                }

                // Update active thumbnail
                if (activeThumbnail) {
                    activeThumbnail.classList.remove("active");
                }
                thumbnailButton.classList.add("active");
            }
            return;
        }
    });
}

function renderCartPage() {
    var cartItemsContainer = document.getElementById("cartItems");
    var cartSummaryContainer = document.getElementById("cartSummary");
    var cart = getCart();
    var itemsHtml = "";
    var summary;

    if (!cartItemsContainer || !cartSummaryContainer) {
        return;
    }

    if (cart.length === 0) {
        cartItemsContainer.innerHTML =
            '<div class="empty-cart">' +
                "<p>Your cart is empty right now. Add a gadget from the products page to get started.</p>" +
                '<a href="products.html" class="product-btn">Continue Shopping</a>' +
            "</div>";

        cartSummaryContainer.innerHTML =
            "<h3>Order Summary</h3>" +
            '<div class="summary-row"><span>Subtotal</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Shipping</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Tax</span><span>$0.00</span></div>' +
            '<div class="summary-total"><span>Total</span><span>$0.00</span></div>' +
            '<button type="button" class="summary-btn" data-cart-checkout disabled>Checkout Soon</button>';
        return;
    }

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];

        itemsHtml +=
            '<article class="cart-item">' +
                (item.image ? '<div class="cart-thumb"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>' : '<div class="cart-thumb ' + item.visual + '"></div>') +
                '<div class="cart-item-copy">' +
                    "<h3>" + item.name + "</h3>" +
                    "<p>" + item.note + "</p>" +
                    '<div class="cart-item-meta">' +
                        '<span class="category-chip">' + item.category + "</span>" +
                        '<span class="qty-chip">Qty ' + item.quantity + "</span>" +
                    "</div>" +
                "</div>" +
                '<div class="cart-item-side">' +
                    '<div class="cart-item-total">$' + formatPrice(item.price * item.quantity) + "</div>" +
                    '<div class="qty-controls">' +
                        '<button type="button" data-cart-change="-1" data-cart-id="' + item.id + '" aria-label="Decrease quantity">-</button>' +
                        '<span class="qty-value">' + item.quantity + "</span>" +
                        '<button type="button" data-cart-change="1" data-cart-id="' + item.id + '" aria-label="Increase quantity">+</button>' +
                    "</div>" +
                    '<button type="button" class="remove-cart-btn" data-cart-remove="' + item.id + '">Remove</button>' +
                "</div>" +
            "</article>";
    }

    cartItemsContainer.innerHTML = itemsHtml;
    summary = calculateCartSummary(cart);

    cartSummaryContainer.innerHTML =
        "<h3>Order Summary</h3>" +
        '<div class="summary-row"><span>Subtotal</span><span>$' + formatPrice(summary.subtotal) + "</span></div>" +
        '<div class="summary-row"><span>Shipping</span><span>' + (summary.shipping === 0 ? "Free" : "$" + formatPrice(summary.shipping)) + "</span></div>" +
        '<div class="summary-row"><span>Tax</span><span>$' + formatPrice(summary.tax) + "</span></div>" +
        '<div class="summary-total"><span>Total</span><span>$' + formatPrice(summary.total) + "</span></div>" +
        '<button type="button" class="summary-btn" data-cart-checkout>Proceed to Checkout</button>';
}

function updateCartQuantity(productId, change) {
    var cart = getCart();

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === productId) {
            cart[i].quantity += change;
            if (cart[i].quantity <= 0) {
                cart.splice(i, 1);
            }
            break;
        }
    }

    saveCart(cart);
    updateCartBadge();
    renderCartPage();
}

function removeFromCart(productId) {
    var cart = getCart();
    var filtered = [];

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id !== productId) {
            filtered.push(cart[i]);
        }
    }

    saveCart(filtered);
    updateCartBadge();
    renderCartPage();
    showToast("Item removed from cart");
}

function initializeCartPage() {
    var cartSection = document.querySelector(".cart-section");

    if (!cartSection) {
        return;
    }

    renderCartPage();

    cartSection.addEventListener("click", function(event) {
        var changeButton = event.target.closest("[data-cart-change]");
        var removeButton = event.target.closest("[data-cart-remove]");
        var checkoutButton = event.target.closest("[data-cart-checkout]");

        if (changeButton) {
            updateCartQuantity(changeButton.dataset.cartId, parseInt(changeButton.dataset.cartChange, 10));
            return;
        }

        if (removeButton) {
            removeFromCart(removeButton.dataset.cartRemove);
            return;
        }

        if (checkoutButton && !checkoutButton.disabled) {
            window.location.href = "checkout.html";
        }
    });
}

function renderCheckoutPage() {
    var form = document.getElementById("checkoutForm");
    var emptyState = document.getElementById("checkoutEmptyState");
    var summaryContainer = document.getElementById("checkoutSummary");
    var cart = getCart();
    var itemsHtml = "";
    var summary;

    if (!form || !emptyState || !summaryContainer) {
        return;
    }

    if (cart.length === 0) {
        form.classList.add("is-hidden");
        emptyState.classList.remove("is-hidden");
        summaryContainer.innerHTML =
            '<div class="summary-row"><span>Subtotal</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Shipping</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Tax</span><span>$0.00</span></div>' +
            '<div class="summary-total"><span>Total</span><span>$0.00</span></div>';
        return;
    }

    form.classList.remove("is-hidden");
    emptyState.classList.add("is-hidden");

    for (var i = 0; i < cart.length; i++) {
        itemsHtml +=
            '<div class="checkout-summary-item">' +
                '<div class="checkout-summary-copy">' +
                    "<strong>" + cart[i].name + "</strong>" +
                    '<span>' + cart[i].category + " x " + cart[i].quantity + "</span>" +
                "</div>" +
                '<div class="checkout-summary-price">$' + formatPrice(cart[i].price * cart[i].quantity) + "</div>" +
            "</div>";
    }

    summary = calculateCartSummary(cart);
    summaryContainer.innerHTML =
        '<div class="checkout-summary-list">' + itemsHtml + "</div>" +
        '<div class="summary-row"><span>Subtotal</span><span>$' + formatPrice(summary.subtotal) + "</span></div>" +
        '<div class="summary-row"><span>Shipping</span><span>' + (summary.shipping === 0 ? "Free" : "$" + formatPrice(summary.shipping)) + "</span></div>" +
        '<div class="summary-row"><span>Tax</span><span>$' + formatPrice(summary.tax) + "</span></div>" +
        '<div class="summary-total"><span>Total</span><span>$' + formatPrice(summary.total) + "</span></div>";
}

function buildEstimatedDelivery() {
    return new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function initializeCheckoutPage() {
    var form = document.getElementById("checkoutForm");

    if (!form) {
        return;
    }

    renderCheckoutPage();

    form.addEventListener("submit", function(event) {
        var cart = getCart();
        var orders = getOrders();
        var formData;
        var summary;
        var cardNumber;
        var orderItems = [];
        var order;

        event.preventDefault();

        if (cart.length === 0) {
            window.location.href = "products.html";
            return;
        }

        if (form.checkValidity && !form.checkValidity()) {
            if (form.reportValidity) {
                form.reportValidity();
            }
            return;
        }

        formData = new FormData(form);
        summary = calculateCartSummary(cart);

        for (var i = 0; i < cart.length; i++) {
            orderItems.push({
                id: cart[i].id,
                name: cart[i].name,
                price: cart[i].price,
                category: cart[i].category,
                visual: cart[i].visual,
                note: cart[i].note,
                quantity: cart[i].quantity
            });
        }

        cardNumber = String(formData.get("cardNumber") || "").replace(/\s+/g, "");
        order = {
            id: "NG-" + Date.now(),
            items: orderItems,
            customer: {
                fullName: String(formData.get("fullName") || "").trim(),
                email: String(formData.get("email") || "").trim(),
                address: String(formData.get("address") || "").trim(),
                city: String(formData.get("city") || "").trim(),
                region: String(formData.get("region") || "").trim(),
                zipCode: String(formData.get("zipCode") || "").trim()
            },
            payment: {
                last4: cardNumber.slice(-4) || "0000"
            },
            subtotal: summary.subtotal,
            shipping: summary.shipping,
            tax: summary.tax,
            total: summary.total,
            status: "Pending",
            createdAt: new Date().toISOString(),
            estimatedDelivery: buildEstimatedDelivery()
        };

        orders.push(order);
        saveOrders(orders);
        localStorage.setItem(LAST_ORDER_KEY, order.id);
        saveCart([]);
        updateCartBadge();
        window.location.href = "confirmation.html?order=" + encodeURIComponent(order.id);
    });
}

function findOrderById(orderId) {
    var orders = getOrders();

    for (var i = 0; i < orders.length; i++) {
        if (orders[i].id === orderId) {
            return orders[i];
        }
    }

    return null;
}

function renderConfirmationPage() {
    var container = document.getElementById("confirmationDetails");
    var params;
    var orderId;
    var order;
    var shippingAddress;
    var orders;

    if (!container) {
        return;
    }

    params = new URLSearchParams(window.location.search);
    orderId = params.get("order") || localStorage.getItem(LAST_ORDER_KEY) || "";
    order = orderId ? findOrderById(orderId) : null;

    if (!order) {
        orders = getOrders();
        order = orders.length ? orders[orders.length - 1] : null;
    }

    if (!order) {
        container.innerHTML =
            '<div class="empty-state-card">' +
                "<p>No recent order was found. Start shopping and place an order to see the confirmation details here.</p>" +
                '<a href="products.html" class="product-btn">Browse Products</a>' +
            "</div>";
        return;
    }

    shippingAddress = [
        order.customer.address,
        order.customer.city,
        order.customer.region,
        order.customer.zipCode
    ].filter(Boolean).join(", ");

    container.innerHTML =
        '<div class="confirmation-grid">' +
            '<div class="confirmation-row"><span>Order ID</span><strong>' + order.id + "</strong></div>" +
            '<div class="confirmation-row"><span>Total Items</span><strong>' + getCartItemCount(order.items) + "</strong></div>" +
            '<div class="confirmation-row"><span>Total Amount</span><strong>$' + formatPrice(order.total) + "</strong></div>" +
            '<div class="confirmation-row"><span>Status</span><strong>' + order.status + "</strong></div>" +
            '<div class="confirmation-row"><span>Estimated Delivery</span><strong>' + order.estimatedDelivery + "</strong></div>" +
            '<div class="confirmation-row"><span>Customer</span><strong>' + order.customer.fullName + "</strong></div>" +
            '<div class="confirmation-row"><span>Ship To</span><strong>' + shippingAddress + "</strong></div>" +
            '<div class="confirmation-row"><span>Payment</span><strong>Card ending in ' + order.payment.last4 + "</strong></div>" +
        "</div>" +
        '<div class="confirmation-actions">' +
            '<a href="index.html" class="detail-back-btn">Back to Home</a>' +
            '<a href="products.html" class="summary-btn confirmation-primary">Continue Shopping</a>' +
        "</div>";
}

function initializeContactForms() {
    var forms = document.querySelectorAll(".contact-form");

    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener("submit", function(event) {
            if (this.action === "#" || !this.action) {
                event.preventDefault();
                this.reset();
                showToast("Your message has been received.");
            }
            // If action is Formspree, let it submit normally
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    initializeMenu();
    initializeNavigationState();
    updateCartBadge();
    renderFeaturedProducts();
    renderHomeCategories();
    renderProductsPage();
    renderProductDetailPage();
    initializeProductGrids();
    initializeCartPage();
    initializeCheckoutPage();
    renderConfirmationPage();
    initializeContactForms();
});

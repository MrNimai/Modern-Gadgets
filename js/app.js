// Legacy single-page script kept for reference. Live pages now load `site.js`.
var STORAGE_KEY = "neonGadgetsCart";
var ORDER_STORAGE_KEY = "neonGadgetsOrders";
var products = [];
var cart = [];
var orders = [];
var currentPage = "home";
var currentHomeSection = "home";
var currentCategory = "All";
var currentSearch = "";
var currentDetailProductId = null;
var currentDetailQuantity = 1;
var toastTimer = null;

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage(key) {
    var data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function initProductsFromDom() {
    var cards = document.querySelectorAll(".product-card[data-product-id]");
    var items = [];

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var specNodes = card.querySelectorAll(".spec-pill");
        var specs = [];

        for (var j = 0; j < specNodes.length; j++) {
            specs.push(specNodes[j].textContent.trim());
        }

        items.push({
            id: card.dataset.productId,
            name: card.dataset.name,
            price: parseFloat(card.dataset.price),
            category: card.dataset.category,
            visual: card.dataset.visual,
            note: card.dataset.note,
            keywords: card.dataset.keywords || "",
            badge: (card.querySelector(".product-badge") || {}).textContent || "",
            rating: (card.querySelector(".product-rating") || {}).textContent || "",
            specs: specs
        });
    }

    return items;
}

function getProductById(productId) {
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === productId) {
            return products[i];
        }
    }

    return null;
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

    if (!menuToggle || !mobilePanel) {
        return;
    }

    menuToggle.addEventListener("click", function() {
        var isOpen = mobilePanel.classList.toggle("show");
        menuToggle.classList.toggle("open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

function updateUrlHash(page, sectionId) {
    var hash = "#home";

    if (page === "cart") {
        hash = "#cart";
    } else if (page === "checkout") {
        hash = "#checkout";
    } else if (page === "confirmation") {
        hash = "#confirmation";
    } else if (page === "detail") {
        hash = "#detailSection";
    } else if (sectionId && sectionId !== "home") {
        hash = "#" + sectionId;
    }

    if (window.location.hash !== hash && window.history && window.history.replaceState) {
        try {
            history.replaceState(null, "", hash);
        } catch (error) {
            window.location.hash = hash;
        }
    }
}

function updateNavState(activeTarget) {
    var links = document.querySelectorAll("[data-nav-target]");

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var isActive = link.dataset.navTarget === activeTarget;
        link.classList.toggle("active", isActive);
    }
}

function scrollToSection(sectionId, behavior) {
    var target = document.getElementById(sectionId);
    if (!target) {
        return;
    }

    target.scrollIntoView({
        behavior: behavior || "smooth",
        block: "start"
    });
}

function scrollForPage(page, sectionId, behavior) {
    if (page === "cart") {
        scrollToSection("cart", behavior);
        return;
    }

    if (page === "checkout") {
        scrollToSection("checkout", behavior);
        return;
    }

    if (page === "confirmation") {
        scrollToSection("confirmation", behavior);
        return;
    }

    if (page === "detail") {
        scrollToSection("detailSection", behavior);
        return;
    }

    if (!sectionId || sectionId === "home") {
        window.scrollTo({
            top: 0,
            behavior: behavior || "smooth"
        });
        return;
    }

    scrollToSection(sectionId, behavior);
}

function setPage(page, sectionId, skipScroll) {
    var sections = document.querySelectorAll("[data-page-section]");
    var targetSection = sectionId || currentHomeSection || "home";
    var activeTarget = "home";

    currentPage = page;
    if (page === "home") {
        currentHomeSection = targetSection;
        activeTarget = targetSection;
    } else if (page === "detail") {
        activeTarget = "products";
    } else if (page === "cart") {
        activeTarget = "cart";
    } else if (page === "checkout") {
        activeTarget = "cart";
    }

    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.toggle("is-hidden", sections[i].dataset.pageSection !== page);
    }

    updateNavState(activeTarget);
    updateUrlHash(page, targetSection);
    closeMobileMenu();

    if (page === "cart") {
        renderCartPage();
    }

    if (page === "checkout") {
        renderCheckoutPage();
    }

    if (skipScroll) {
        return;
    }

    window.requestAnimationFrame(function() {
        scrollForPage(page, targetSection, "smooth");
    });
}

function initializeNavigation() {
    var links = document.querySelectorAll("[data-nav-target]");

    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function(event) {
            var target = this.dataset.navTarget;
            event.preventDefault();

            if (target === "cart") {
                setPage("cart");
                return;
            }

            if (target === "home") {
                setPage("home", "home");
                return;
            }

            setPage("home", target);
        });
    }
}

function syncSearchInputs(value) {
    var inputs = document.querySelectorAll("[data-search-input]");

    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = value;
    }
}

function handleSearch(event) {
    var form = event.currentTarget;
    var input = form.querySelector("[data-search-input]");
    var query = input ? input.value.trim() : "";

    event.preventDefault();

    currentSearch = query.toLowerCase();
    syncSearchInputs(query);
    renderProducts();
    setPage("home", "products");
}

function initializeSearch() {
    var forms = document.querySelectorAll("[data-search-form]");

    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener("submit", handleSearch);
    }

    var clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            currentSearch = "";
            currentCategory = "All";
            syncSearchInputs("");
            renderProducts();
            updateCategoryState();
            setPage("home", "products");
        });
    }
}

function matchesProduct(product) {
    var matchesCategory = currentCategory === "All" || product.category === currentCategory;
    var haystack;

    if (!matchesCategory) {
        return false;
    }

    if (!currentSearch) {
        return true;
    }

    haystack = [
        product.name,
        product.category,
        product.note,
        product.badge,
        product.rating,
        product.keywords,
        product.specs.join(" ")
    ].join(" ").toLowerCase();

    return haystack.indexOf(currentSearch) !== -1;
}

function updateSearchFeedback(matchCount) {
    var feedback = document.getElementById("searchFeedback");
    var feedbackText = document.getElementById("searchFeedbackText");
    var empty = document.getElementById("searchEmpty");
    var parts = [];

    if (!feedback || !feedbackText || !empty) {
        return;
    }

    if (!currentSearch && currentCategory === "All") {
        feedback.classList.add("is-hidden");
        empty.classList.add("is-hidden");
        return;
    }

    if (currentCategory !== "All") {
        parts.push(currentCategory);
    }

    if (currentSearch) {
        parts.push('"' + currentSearch + '"');
    }

    feedbackText.textContent = "Showing " + matchCount + " result" + (matchCount === 1 ? "" : "s") + " for " + parts.join(" + ");
    feedback.classList.remove("is-hidden");
    empty.classList.toggle("is-hidden", matchCount !== 0);
}

function renderProducts() {
    var cards = document.querySelectorAll(".product-card[data-product-id]");
    var matchCount = 0;

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var product = getProductById(card.dataset.productId);
        var isMatch = product ? matchesProduct(product) : false;

        card.classList.toggle("is-hidden", !isMatch);
        if (isMatch) {
            matchCount += 1;
        }
    }

    updateSearchFeedback(matchCount);

    if (currentDetailProductId) {
        var detailProduct = getProductById(currentDetailProductId);
        if (!detailProduct || !matchesProduct(detailProduct)) {
            var shouldReturnToProducts = currentPage === "detail";
            hideDetailView();

            if (shouldReturnToProducts) {
                setPage("home", "products");
            }
        }
    }
}

function updateCategoryState() {
    var categoryCards = document.querySelectorAll("[data-category-filter]");

    for (var i = 0; i < categoryCards.length; i++) {
        var card = categoryCards[i];
        card.classList.toggle("active", card.dataset.categoryFilter === currentCategory);
    }
}

function filterByCategory(category) {
    currentCategory = category;
    updateCategoryState();
    renderProducts();
    setPage("home", "products");
}

function initializeCategoryFilter() {
    var categoryCards = document.querySelectorAll("[data-category-filter]");

    for (var i = 0; i < categoryCards.length; i++) {
        categoryCards[i].addEventListener("click", function(event) {
            event.preventDefault();
            filterByCategory(this.dataset.categoryFilter);
        });
    }
}

function createSpecHtml(specs) {
    var html = "";

    for (var i = 0; i < specs.length; i++) {
        html += '<span class="spec-pill">' + specs[i] + "</span>";
    }

    return html;
}

function createDetailMeta(product) {
    return [
        { label: "Category", value: product.category },
        { label: "Rating", value: product.rating },
        { label: "Edition", value: product.badge },
        { label: "Core Specs", value: product.specs.join(", ") }
    ];
}

function createDetailStory(product) {
    if (product.category === "Laptops") {
        return "A lightweight performance machine made for creative work, fast multitasking, and premium everyday use.";
    }

    if (product.category === "Phones") {
        return "Built for users who want flagship speed, crisp visuals, and a camera system that keeps up day and night.";
    }

    if (product.category === "Accessories") {
        return "A premium add-on designed to elevate your setup with richer audio, stronger comfort, and a sharper neon edge.";
    }

    return "A smart daily companion that keeps essential insights, notifications, and quick actions right on your wrist.";
}

function renderDetailView(product) {
    var detailView = document.getElementById("detailView");
    var meta = createDetailMeta(product);
    var metaHtml = "";
    var visuals = product.visuals || [product.visual];
    var mainImageHtml = "";
    var thumbnailsHtml = "";

    if (!detailView || !product) {
        return;
    }

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
                '<p class="detail-lead">' + createDetailStory(product) + "</p>" +
                '<div class="product-specs">' + createSpecHtml(product.specs) + "</div>" +
                '<div class="detail-meta">' + metaHtml + "</div>" +
                '<div class="product-price-wrap">' +
                    '<span class="product-price-label">Starting at</span>' +
                    '<p class="product-price">$' + formatPrice(product.price) + "</p>" +
                "</div>" +
                '<div class="detail-actions">' +
                    '<div class="qty-controls detail-qty-controls">' +
                        '<button type="button" data-detail-qty="-1" aria-label="Decrease quantity">-</button>' +
                        '<span class="qty-value" id="detailQtyValue">' + currentDetailQuantity + "</span>" +
                        '<button type="button" data-detail-qty="1" aria-label="Increase quantity">+</button>' +
                    "</div>" +
                    '<button type="button" class="detail-add-btn" data-detail-add="' + product.id + '">Add to Cart</button>' +
                    '<button type="button" class="detail-buy-btn" data-detail-buy="' + product.id + '">Buy Now</button>' +
                "</div>" +
            "</div>" +
        "</div>";
}

function viewProductDetail(productId) {
    var product = getProductById(productId);

    if (!product) {
        return;
    }

    currentDetailProductId = productId;
    currentDetailQuantity = 1;
    renderDetailView(product);
    setPage("detail");
}

function hideDetailView() {
    var detailSection = document.getElementById("detailSection");
    var detailView = document.getElementById("detailView");

    currentDetailProductId = null;
    currentDetailQuantity = 1;

    if (detailSection) {
        detailSection.classList.add("is-hidden");
    }

    if (detailView) {
        detailView.innerHTML = "";
    }
}

function initializeProductCards() {
    var productGrid = document.querySelector(".product-grid");

    if (!productGrid) {
        return;
    }

    productGrid.addEventListener("click", function(event) {
        var addButton = event.target.closest("[data-add-to-cart]");
        var card;

        if (addButton) {
            addToCartFromCard(event, addButton.dataset.productId);
            return;
        }

        card = event.target.closest(".product-card[data-product-id]");
        if (!card) {
            return;
        }

        viewProductDetail(card.dataset.productId);
    });
}

function initializeDetailView() {
    var detailView = document.getElementById("detailView");

    if (!detailView) {
        return;
    }

    detailView.addEventListener("click", function(event) {
        var closeButton = event.target.closest("[data-detail-close]");
        var qtyButton = event.target.closest("[data-detail-qty]");
        var addButton = event.target.closest("[data-detail-add]");
        var buyButton = event.target.closest("[data-detail-buy]");
        var qtyValue;

        if (closeButton) {
            hideDetailView();
            setPage("home", "products");
            return;
        }

        if (qtyButton) {
            currentDetailQuantity = Math.max(1, currentDetailQuantity + parseInt(qtyButton.dataset.detailQty, 10));
            qtyValue = document.getElementById("detailQtyValue");
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
            setPage("checkout");
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

function addToCartFromCard(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    addToCart(productId, 1);
}

function addToCart(productId, quantity) {
    var product = getProductById(productId);
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

    saveToStorage(STORAGE_KEY, cart);
    updateCartBadge();
    renderCartPage();
    animateCartIcon();
    showToast(product.name + " added to cart");
}

function updateCartBadge() {
    var count = 0;
    var badges = document.querySelectorAll("[data-cart-count]");

    for (var i = 0; i < cart.length; i++) {
        count += cart[i].quantity;
    }

    for (var j = 0; j < badges.length; j++) {
        badges[j].textContent = count;
    }
}

function animateCartIcon() {
    var cartButtons = document.querySelectorAll("[data-cart-trigger]");

    for (var i = 0; i < cartButtons.length; i++) {
        cartButtons[i].classList.remove("bump");
        void cartButtons[i].offsetWidth;
        cartButtons[i].classList.add("bump");
    }
}

function calculateCartSummary() {
    var subtotal = 0;

    for (var i = 0; i < cart.length; i++) {
        subtotal += cart[i].price * cart[i].quantity;
    }

    var shipping = subtotal > 0 && subtotal < 700 ? 25 : 0;
    var tax = subtotal * 0.05;
    var total = subtotal + shipping + tax;

    return {
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total
    };
}

function getCartItemCount(items) {
    var count = 0;

    for (var i = 0; i < items.length; i++) {
        count += items[i].quantity;
    }

    return count;
}

function buildEstimatedDelivery() {
    return new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function buildOrderDateLabel(dateValue) {
    return new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function renderCheckoutPage() {
    var checkoutForm = document.getElementById("checkoutForm");
    var checkoutSummary = document.getElementById("checkoutSummary");
    var emptyState = document.getElementById("checkoutEmptyState");
    var summary;
    var itemsHtml = "";

    if (!checkoutForm || !checkoutSummary || !emptyState) {
        return;
    }

    if (cart.length === 0) {
        checkoutForm.classList.add("is-hidden");
        emptyState.classList.remove("is-hidden");
        checkoutSummary.innerHTML =
            '<div class="summary-row"><span>Subtotal</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Shipping</span><span>$0.00</span></div>' +
            '<div class="summary-row"><span>Tax</span><span>$0.00</span></div>' +
            '<div class="summary-total"><span>Total</span><span>$0.00</span></div>';
        return;
    }

    checkoutForm.classList.remove("is-hidden");
    emptyState.classList.add("is-hidden");

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];

        itemsHtml +=
            '<div class="checkout-summary-item">' +
                '<div class="checkout-summary-copy">' +
                    "<strong>" + item.name + "</strong>" +
                    '<span>' + item.category + " x " + item.quantity + "</span>" +
                "</div>" +
                '<div class="checkout-summary-price">$' + formatPrice(item.price * item.quantity) + "</div>" +
            "</div>";
    }

    summary = calculateCartSummary();
    checkoutSummary.innerHTML =
        '<div class="checkout-summary-list">' + itemsHtml + "</div>" +
        '<div class="summary-row"><span>Subtotal</span><span>$' + formatPrice(summary.subtotal) + "</span></div>" +
        '<div class="summary-row"><span>Shipping</span><span>' + (summary.shipping === 0 ? "Free" : "$" + formatPrice(summary.shipping)) + "</span></div>" +
        '<div class="summary-row"><span>Tax</span><span>$' + formatPrice(summary.tax) + "</span></div>" +
        '<div class="summary-total"><span>Total</span><span>$' + formatPrice(summary.total) + "</span></div>";
}

function handleCheckout(event) {
    var form = event.currentTarget;
    var formData;
    var summary;
    var orderItems = [];
    var order;
    var cardNumber;

    event.preventDefault();

    if (cart.length === 0) {
        showToast("Add a product before checkout.");
        setPage("home", "products");
        return;
    }

    if (form.checkValidity && !form.checkValidity()) {
        if (form.reportValidity) {
            form.reportValidity();
        }
        return;
    }

    formData = new FormData(form);
    summary = calculateCartSummary();

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
    saveToStorage(ORDER_STORAGE_KEY, orders);

    cart = [];
    saveToStorage(STORAGE_KEY, cart);
    updateCartBadge();
    renderCartPage();
    renderCheckoutPage();
    form.reset();

    showOrderConfirmation(order);
    showToast("Order placed successfully.");
}

function showOrderConfirmation(order, skipScroll) {
    var confirmationDetails = document.getElementById("confirmationDetails");
    var itemCount;
    var customer = order.customer || {};
    var payment = order.payment || {};
    var shippingAddress;

    if (!confirmationDetails || !order) {
        return;
    }

    itemCount = getCartItemCount(order.items || []);
    shippingAddress = [
        customer.address || "",
        customer.city || "",
        customer.region || "",
        customer.zipCode || ""
    ].filter(Boolean).join(", ");

    confirmationDetails.innerHTML =
        '<div class="confirmation-grid">' +
            '<div class="confirmation-row"><span>Order ID</span><strong>' + order.id + "</strong></div>" +
            '<div class="confirmation-row"><span>Total Items</span><strong>' + itemCount + "</strong></div>" +
            '<div class="confirmation-row"><span>Total Amount</span><strong>$' + formatPrice(order.total) + "</strong></div>" +
            '<div class="confirmation-row"><span>Status</span><strong>' + order.status + "</strong></div>" +
            '<div class="confirmation-row"><span>Order Date</span><strong>' + buildOrderDateLabel(order.createdAt) + "</strong></div>" +
            '<div class="confirmation-row"><span>Estimated Delivery</span><strong>' + order.estimatedDelivery + "</strong></div>" +
            '<div class="confirmation-row"><span>Customer</span><strong>' + (customer.fullName || "Guest Customer") + "</strong></div>" +
            '<div class="confirmation-row"><span>Ship To</span><strong>' + (shippingAddress || "Address provided at checkout") + "</strong></div>" +
            '<div class="confirmation-row"><span>Payment</span><strong>Card ending in ' + (payment.last4 || "0000") + "</strong></div>" +
        "</div>" +
        '<div class="confirmation-actions">' +
            '<button type="button" class="detail-back-btn" data-confirmation-home>Back to Home</button>' +
            '<button type="button" class="summary-btn confirmation-primary" data-confirmation-products>Continue Shopping</button>' +
        "</div>";

    setPage("confirmation", null, !!skipScroll);
}

function renderCartPage() {
    var cartItemsContainer = document.getElementById("cartItems");
    var cartSummaryContainer = document.getElementById("cartSummary");
    var itemsHtml = "";
    var summary;

    if (!cartItemsContainer || !cartSummaryContainer) {
        return;
    }

    if (cart.length === 0) {
        cartItemsContainer.innerHTML =
            '<div class="empty-cart">' +
                "<p>Your cart is empty right now. Add a gadget from the products section to get started.</p>" +
                '<button type="button" class="product-btn" data-cart-continue>Continue Shopping</button>' +
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

    summary = calculateCartSummary();
    cartSummaryContainer.innerHTML =
        "<h3>Order Summary</h3>" +
        '<div class="summary-row"><span>Subtotal</span><span>$' + formatPrice(summary.subtotal) + "</span></div>" +
        '<div class="summary-row"><span>Shipping</span><span>' + (summary.shipping === 0 ? "Free" : "$" + formatPrice(summary.shipping)) + "</span></div>" +
        '<div class="summary-row"><span>Tax</span><span>$' + formatPrice(summary.tax) + "</span></div>" +
        '<div class="summary-total"><span>Total</span><span>$' + formatPrice(summary.total) + "</span></div>" +
        '<button type="button" class="summary-btn" data-cart-checkout>Proceed to Checkout</button>';
}

function updateCartQuantity(productId, change) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === productId) {
            cart[i].quantity += change;

            if (cart[i].quantity <= 0) {
                removeFromCart(productId);
                return;
            }

            break;
        }
    }

    saveToStorage(STORAGE_KEY, cart);
    updateCartBadge();
    renderCartPage();
}

function removeFromCart(productId) {
    var newCart = [];

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id !== productId) {
            newCart.push(cart[i]);
        }
    }

    cart = newCart;
    saveToStorage(STORAGE_KEY, cart);
    updateCartBadge();
    renderCartPage();
    showToast("Item removed from cart");
}

function initializeCartSection() {
    var cartSection = document.getElementById("cart");

    if (!cartSection) {
        return;
    }

    cartSection.addEventListener("click", function(event) {
        var changeButton = event.target.closest("[data-cart-change]");
        var removeButton = event.target.closest("[data-cart-remove]");
        var checkoutButton = event.target.closest("[data-cart-checkout]");
        var continueButton = event.target.closest("[data-cart-continue]");

        if (changeButton) {
            updateCartQuantity(changeButton.dataset.cartId, parseInt(changeButton.dataset.cartChange, 10));
            return;
        }

        if (removeButton) {
            removeFromCart(removeButton.dataset.cartRemove);
            return;
        }

        if (continueButton) {
            setPage("home", "products");
            return;
        }

        if (checkoutButton) {
            if (cart.length === 0) {
                showToast("Add a product before checkout.");
                return;
            }

            setPage("checkout");
        }
    });
}

function initializeCheckoutSection() {
    var checkoutSection = document.getElementById("checkout");
    var checkoutForm = document.getElementById("checkoutForm");

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleCheckout);
    }

    if (!checkoutSection) {
        return;
    }

    checkoutSection.addEventListener("click", function(event) {
        var backButton = event.target.closest("[data-checkout-back]");
        var shopButton = event.target.closest("[data-checkout-shop]");

        if (backButton) {
            setPage("cart");
            return;
        }

        if (shopButton) {
            setPage("home", "products");
        }
    });
}

function initializeConfirmationSection() {
    var confirmationSection = document.getElementById("confirmation");

    if (!confirmationSection) {
        return;
    }

    confirmationSection.addEventListener("click", function(event) {
        var homeButton = event.target.closest("[data-confirmation-home]");
        var productsButton = event.target.closest("[data-confirmation-products]");

        if (homeButton) {
            setPage("home", "home");
            return;
        }

        if (productsButton) {
            setPage("home", "products");
        }
    });
}

function formatPrice(value) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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

function initializeContactForm() {
    var form = document.querySelector(".contact-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function(event) {
        if (this.action === "#" || !this.action) {
            event.preventDefault();
            form.reset();
            showToast("Your message has been received.");
        }
        // If action is Formspree, let it submit normally
    });
}

function initializeInitialPage() {
    var hash = window.location.hash.replace("#", "");

    if (hash === "cart") {
        setPage("cart", null, true);
        return;
    }

    if (hash === "checkout") {
        setPage("checkout", null, true);
        return;
    }

    if (hash === "confirmation") {
        if (orders.length > 0) {
            showOrderConfirmation(orders[orders.length - 1], true);
        } else {
            setPage("home", "home", true);
        }
        return;
    }

    if (hash === "products" || hash === "about" || hash === "contact") {
        setPage("home", hash, true);
        return;
    }

    setPage("home", "home", true);
}

document.addEventListener("DOMContentLoaded", function() {
    products = initProductsFromDom();
    cart = loadFromStorage(STORAGE_KEY) || [];
    orders = loadFromStorage(ORDER_STORAGE_KEY) || [];

    initializeMenu();
    initializeNavigation();
    initializeSearch();
    initializeCategoryFilter();
    initializeProductCards();
    initializeDetailView();
    initializeCartSection();
    initializeCheckoutSection();
    initializeConfirmationSection();
    initializeContactForm();

    updateCategoryState();
    updateCartBadge();
    renderProducts();
    renderCartPage();
    renderCheckoutPage();
    initializeInitialPage();
});

# Neon Gadgets E-commerce

A modern, neon-themed e-commerce website for tech gadgets with a futuristic design aesthetic.

## 🚀 Features

- **Neon-Themed Design**: Eye-catching UI with glowing effects and dark backgrounds
- **Product Catalog**: Browse and search through tech gadgets
- **Image Support**: Product images with fallback to CSS visuals
- **Shopping Cart**: Add/remove items with persistent storage
- **Contact Form**: Integrated with Formspree for email submissions
- **Responsive Design**: Works on all device sizes
- **Clean Architecture**: Modular JavaScript with separation of concerns

## 📁 Project Structure

```
├── index.html          # Home page with hero section
├── products.html       # Product catalog page
├── about.html          # About page with company story
├── contact.html        # Contact form page
├── cart.html           # Shopping cart page
├── checkout.html       # Checkout process
├── confirmation.html   # Order confirmation
├── product-detail.html # Individual product view
├── styles.css          # Main stylesheet with neon effects
├── site.js            # Main JavaScript functionality
├── app.js             # Alternative rendering logic
├── products-data.js   # Product data and configuration
└── My Logo.png        # Site logo
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and accessibility
- **CSS3**: Grid, Flexbox, animations, and custom properties
- **Vanilla JavaScript**: No frameworks, pure JS implementation
- **Formspree**: Contact form handling
- **Local Storage**: Cart persistence

## 🎨 Design Features

- Gradient backgrounds with radial overlays
- Glowing text effects with text-shadow
- Animated elements and hover states
- Consistent neon color scheme (cyan/violet)
- Card-based layouts with shadows
- Mobile-first responsive design

## 🚀 Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. No build process required - it's pure HTML/CSS/JS

## 📧 Contact Form Setup

The contact form uses Formspree. To set it up:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form and get your endpoint URL
3. Replace the action URL in `contact.html` and `index.html`

## 📱 Pages Overview

- **Home**: Hero section with call-to-action
- **Products**: Grid of product cards with filtering
- **About**: Company story and values
- **Contact**: Contact form and information
- **Cart**: Shopping cart with item management
- **Checkout**: Order processing flow

## 🎯 Key Components

- Product cards with hover effects
- Shopping cart with quantity controls
- Search and category filtering
- Responsive navigation with mobile menu
- Toast notifications for user feedback
- Form validation and submission

## Auth + Profile (Node.js)

This project includes a lightweight, dependency-free Node.js server that provides:

- `login.html`, `signup.html`, `profile.html`
- API endpoints under `/api/*`
- Local user storage at `.data/users.json`

### Run with auth enabled
1. Install Node.js (LTS)
2. From this folder run: `node server.js`
3. Open `http://localhost:5173`

Optional (recommended): set a cookie-signing secret before running:
`setx TECHVERSE_SESSION_SECRET "your-long-random-string"` (then restart terminal)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ for the future of e-commerce

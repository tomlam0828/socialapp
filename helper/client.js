// const keys = require('../config/keys');
// const stripe = require('stripe')(keys.StripeSecretKey);

// const checkoutButton = document.querySelector('#checkout-button');
// checkoutButton.addEventListener('click', () => {
//   stripe.redirectToCheckout({
//     items: [{
//       // Define the product and SKU in the Dashboard first, and use the SKU
//       // ID in your client-side code.
//       sku: 'sku_123',
//       quantity: 1
//     }],
//     successUrl: '/payment',
//     // cancelUrl: 'https://www.example.com/cancel'
//   });
// });
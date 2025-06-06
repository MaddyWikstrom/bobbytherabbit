// Make product mapping available globally
window.PRODUCT_MAPPING = {
  "bungi-x-bobby-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "Black",
        sku: "9004018_10779",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462",
      },
      {
        option1: "Black",
        sku: "9004018_10780",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-back-683f9d11a9742.png?v=1748999463",
      },
      {
        option1: "Black",
        sku: "9004018_10781",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "S",
        sku: "4356716_10774",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
      {
        option1: "M",
        sku: "4356716_10775",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-back-683f9ce10ab8f.png?v=1748999410",
      },
      {
        option1: "L",
        sku: "4356716_10776",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Men's t-shirt",
    variants: [
      {
        option1: "XS",
        sku: "7836547_8850",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335",
      },
      {
        option1: "S",
        sku: "7836547_8851",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png?v=1748999335",
      },
      {
        option1: "M",
        sku: "7836547_8852",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-right-683f9c9fdd489.png?v=1748999335",
      },
    ],
  },
};
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productHandle = urlParams.get('handle');

    if (productHandle) {
        const product = PRODUCT_MAPPING[productHandle];

        if (product) {
            document.getElementById('product-name').textContent = product.shopifyProductId;
            document.getElementById('product-image').src = product.variants[0].image;
            document.getElementById('product-image').alt = product.shopifyProductId;
            document.getElementById('product-price').textContent = '$' + product.variants[0].price;
        } else {
            document.getElementById('product-name').textContent = 'Product not found';
        }
    } else {
        document.getElementById('product-name').textContent = 'Product not found';
    }
});
// JavaScript for horizontal scrolling
const leftArrow = document.querySelector('.left-arrow');
const rightArrow = document.querySelector('.right-arrow');
const productGrid = document.querySelector('.product-grid');

leftArrow.addEventListener('click', () => {
    productGrid.scrollBy({
        top: 0,
        left: -300, // Adjust the scroll amount as needed
        behavior: 'smooth'
    });
});

rightArrow.addEventListener('click', () => {
    productGrid.scrollBy({
        top: 0,
        left: 300, // Adjust the scroll amount as needed
        behavior: 'smooth'
    });
});
const { connectDB, getDB, disconnectDB } = require('./config/db');

const products = [
  // T-Shirts
  {
    name: 'Acid Wash Tee',
    description: 'Heavy 280gsm acid-washed cotton. Oversized fit with raw hem.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    category: 'T-Shirts',
    size: 'M',
    stock: 20,
  },
  {
    name: 'Blacked Out Tee',
    description: 'All-black heavyweight tee. Minimal branding, maximum attitude.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
    category: 'T-Shirts',
    size: 'L',
    stock: 35,
  },
  {
    name: 'Vintage Stripe Tee',
    description: 'Retro-washed stripes. Relaxed crew neck. Faded finish.',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80',
    category: 'T-Shirts',
    size: 'S',
    stock: 18,
  },
  {
    name: 'Ghost Graphic Tee',
    description: 'Screen-printed oversized graphic. 100% ringspun cotton.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    category: 'T-Shirts',
    size: 'XL',
    stock: 12,
  },

  // Hoodies
  {
    name: 'Street Fleece Hoodie',
    description: 'Heavyweight 400gsm fleece. Double-lined hood. Street-ready.',
    price: 74.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    category: 'Hoodies',
    size: 'L',
    stock: 15,
  },
  {
    name: 'Washed Black Hoodie',
    description: 'Garment-washed for that worn-in feel. Kangaroo pocket.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&q=80',
    category: 'Hoodies',
    size: 'XL',
    stock: 10,
  },
  {
    name: 'Zip-Up Tech Hoodie',
    description: 'Water-resistant shell. Full zip. Slim athletic fit.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=600&q=80',
    category: 'Hoodies',
    size: 'M',
    stock: 8,
  },

  // Accessories
  {
    name: 'Tactical Snapback',
    description: 'Six-panel structured cap. Flat brim. Adjustable snap closure.',
    price: 28.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
    category: 'Accessories',
    size: 'One Size',
    stock: 30,
  },
  {
    name: 'Chain Crossbody Bag',
    description: 'Vegan leather mini crossbody. Chain strap. Magnetic closure.',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
    category: 'Accessories',
    size: 'One Size',
    stock: 14,
  },
  {
    name: 'Ribbed Beanie',
    description: 'Fine-knit ribbed beanie. Slouch fit. One size fits all.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80',
    category: 'Accessories',
    size: 'One Size',
    stock: 40,
  },

  // Pants
  {
    name: 'Cargo Utility Pants',
    description: 'Relaxed cargo cut. Six-pocket utility. Adjustable ankle cuff.',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    category: 'Pants',
    size: 'M',
    stock: 22,
  },
  {
    name: 'Track Pants',
    description: 'Lightweight poly-blend track pants. Side stripe. Tapered leg.',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
    category: 'Pants',
    size: 'L',
    stock: 16,
  },

  // Sold out example
  {
    name: 'Limited Drop Tee',
    description: 'Exclusive one-time drop. Hand-distressed. Already legendary.',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
    category: 'T-Shirts',
    size: 'L',
    stock: 0,
  },
];

async function seed() {
  await connectDB();
  const db = getDB();

  let inserted = 0;

  for (const p of products) {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO products (name, description, price, image, category, size, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.description, p.price, p.image, p.category, p.size, p.stock],
        function (err) {
          if (err) {
            console.error(`  ✗ ${p.name}: ${err.message}`);
            resolve();
          } else {
            console.log(`  ✓ ${p.name} (id: ${this.lastID})`);
            inserted++;
            resolve();
          }
        }
      );
    });
  }

  console.log(`\nSeeded ${inserted}/${products.length} products.`);
  disconnectDB();
}

seed().catch(console.error);

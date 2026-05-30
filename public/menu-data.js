/* KALA menu data — sourced from src/pages/menu.astro.
   Items render in the POS at /order-pickup and /order-delivery. */

const GYRO_MEAT_MODIFIER = {
  id: 'meat',
  name: 'Meat',
  required: true,
  type: 'single',
  options: [
    { id: 'pork',    label: 'Pork',    delta: 0 },
    { id: 'chicken', label: 'Chicken', delta: 0 },
    { id: 'lamb',    label: 'Lamb',    delta: 2 }
  ]
};

const SOUVLAKI_MEAT_MODIFIER = {
  id: 'meat',
  name: 'Meat',
  required: true,
  type: 'single',
  options: [
    { id: 'chicken', label: 'Chicken', delta: 0 },
    { id: 'pork',    label: 'Pork',    delta: 0 },
    { id: 'lamb',    label: 'Lamb',    delta: 2 }
  ]
};

const SALAD_PROTEIN_MODIFIER = {
  id: 'add-protein',
  name: 'Add protein',
  required: false,
  type: 'single',
  options: [
    { id: 'none',            label: 'No thanks',       delta: 0 },
    { id: 'grilled-chicken', label: 'Grilled chicken', delta: 5 },
    { id: 'gyro-meat',       label: 'Gyro meat',       delta: 5 }
  ]
};

window.KALA_MENU = {
  fulfillment: {
    pickup: {
      label: 'Order for Pickup',
      ready_minutes: 25
    },
    delivery: {
      label: 'Order for Delivery',
      ready_minutes: 45
    }
  },

  categories: [
    {
      id: 'dips',
      name: 'Dips & Spreads',
      blurb: 'Made by hand, served cold.',
      items: [
        {
          id: 'tzatziki',
          name: 'Tzatziki',
          price: 7,
          image: '/public/c243bbfd-cba9-4c8b-b273-3abc24c8f935.png',
          description: 'Creamy yogurt and cucumber with garlic, dill, and olive oil.',
          modifiers: []
        },
        {
          id: 'hummus',
          name: 'Hummus',
          price: 7,
          image: '/public/f60f61a9-fe03-4def-a469-10daef938655.png',
          description: 'Chickpea purée with tahini, lemon, and warm pita.',
          modifiers: []
        },
        {
          id: 'melitzanosalata',
          name: 'Melitzanosalata',
          price: 7,
          image: '/public/43cec23b-962d-4e58-87f7-85393dc37613.png',
          description: 'Smoky fire-roasted eggplant blended with garlic, olive oil, and lemon.',
          modifiers: []
        },
        {
          id: 'taramosalata',
          name: 'Taramosalata',
          price: 8,
          image: '/public/8f24fc61-225b-4c7f-b5a3-9a7329009e81.png',
          description: 'Silky fish roe spread whipped with olive oil, lemon, and bread.',
          modifiers: []
        },
        {
          id: 'tirokafteri',
          name: 'Tirokafteri',
          price: 8,
          image: '/public/tirokafteri.png',
          description: 'Spicy whipped feta with roasted peppers, olive oil, and a touch of heat.',
          modifiers: []
        },
        {
          id: 'skordalia',
          name: 'Skordalia',
          price: 7,
          image: '/public/skordalia.png',
          description: 'Thick garlic-and-potato dip drizzled with golden olive oil.',
          modifiers: []
        },
        {
          id: 'fava',
          name: 'Fava',
          price: 7,
          image: '/public/fava.png',
          description: 'Yellow split-pea purée topped with capers, red onion, and olive oil.',
          modifiers: []
        },
        {
          id: 'trio-sampler',
          name: 'Trio Sampler',
          price: 15,
          image: '/public/a32760a3-2ece-4947-92bc-303f6cfce5a4.png',
          description: 'Your choice of three dips served with warm pita and fresh vegetables.',
          modifiers: []
        }
      ]
    },

    {
      id: 'salads',
      name: 'Greek Salads',
      blurb: 'Tomato, cucumber, feta, sea-salt sun.',
      items: [
        {
          id: 'horiatiki',
          name: 'Horiatiki',
          price: 14,
          image: '/public/b428f5ae-26b3-47b3-944d-cc950b096d0f.png',
          description: 'Tomato, cucumber, red onion, feta, Kalamata olives, oregano.',
          modifiers: [SALAD_PROTEIN_MODIFIER]
        },
        {
          id: 'mixed-greens',
          name: 'Mixed Greens',
          price: 11,
          image: '/public/1edd312e-7622-4c96-80d2-7f9b72e4b99e.png',
          description: 'Seasonal greens with lemon-herb vinaigrette and toasted pine nuts.',
          modifiers: [SALAD_PROTEIN_MODIFIER]
        },
        {
          id: 'beet-walnut',
          name: 'Beet & Walnut',
          price: 13,
          image: '/public/8bc4ad07-a989-4b76-85da-af9eae80fa73.png',
          description: 'Roasted beets, toasted walnuts, arugula, and crumbled goat cheese.',
          modifiers: [SALAD_PROTEIN_MODIFIER]
        },
        {
          id: 'watermelon-feta',
          name: 'Watermelon & Feta',
          price: 14,
          image: '/public/6b99cc72-6194-477d-81ca-f8102c1d044d.png',
          description: 'Fresh watermelon with creamy feta, mint, and a drizzle of honey.',
          modifiers: [SALAD_PROTEIN_MODIFIER]
        }
      ]
    },

    {
      id: 'gyros',
      name: 'Gyros',
      blurb: 'Wrapped in pita with tzatziki and a stack of fries.',
      items: [
        {
          id: 'classic-pork',
          name: 'The Classic Pork',
          price: 13,
          image: '/public/e04b7c58-8d54-487c-9f41-5f660e52bc91.png',
          description: 'Pita, tzatziki, tomato, onion, fries.',
          modifiers: [GYRO_MEAT_MODIFIER]
        },
        {
          id: 'chicken-gyro',
          name: 'Chicken Gyro',
          price: 13,
          image: '/public/8e01e74a-1220-406b-a82a-796f1a525d84.png',
          description: 'Grilled chicken wrapped in pita with tzatziki, tomato, and onion.',
          modifiers: [GYRO_MEAT_MODIFIER]
        },
        {
          id: 'lamb-gyro',
          name: 'Lamb Gyro',
          price: 15,
          image: '/public/796a6d3d-2ec0-4831-ab7b-ab194896a7e7.png',
          description: 'Slow-roasted lamb sliced onto pita with tzatziki and crisp onion.',
          modifiers: [GYRO_MEAT_MODIFIER]
        },
        {
          id: 'garden-gyro',
          name: 'Garden Gyro',
          price: 14,
          image: '/public/1ea85671-d0fd-4362-a7a9-a7479a31635d.png',
          description: 'Grilled vegetables, hummus, feta, and fresh herbs in warm pita.',
          modifiers: [GYRO_MEAT_MODIFIER]
        }
      ]
    },

    {
      id: 'souvlaki',
      name: 'Souvlaki',
      blurb: 'Charcoal-grilled skewers.',
      items: [
        {
          id: 'chicken-skewers',
          name: 'Chicken Skewers',
          price: 16,
          image: '/public/e35b56c1-78a3-4f00-bc59-fef11d51ab97.png',
          description: 'Marinated chicken thighs charcoal-grilled on skewers with lemon.',
          modifiers: [SOUVLAKI_MEAT_MODIFIER]
        },
        {
          id: 'pork-skewers',
          name: 'Pork Skewers',
          price: 16,
          image: '/public/4a6a4add-18f2-429c-b120-36be86135d79.png',
          description: 'Seasoned pork cubes grilled over charcoal, served with pita and tzatziki.',
          modifiers: [SOUVLAKI_MEAT_MODIFIER]
        },
        {
          id: 'lamb-skewers',
          name: 'Lamb Skewers',
          price: 19,
          image: '/public/f654d18d-85e3-4c10-ae90-00769deaa21e.png',
          description: 'Tender lamb shoulder skewers grilled with oregano and sea salt.',
          modifiers: [SOUVLAKI_MEAT_MODIFIER]
        },
        {
          id: 'shrimp-skewers',
          name: 'Shrimp Skewers',
          price: 20,
          image: '/public/421c842a-e4b0-4b83-aae5-75b9c964570f.png',
          description: 'Jumbo shrimp marinated in garlic, lemon, and olive oil, charcoal-grilled.',
          modifiers: [SOUVLAKI_MEAT_MODIFIER]
        }
      ]
    },

    {
      id: 'seafood',
      name: 'Seafood',
      blurb: 'From the coast, grilled simply.',
      items: [
        {
          id: 'grilled-octopus',
          name: 'Grilled Octopus',
          price: 24,
          image: '/public/grilled-octopus.png',
          description: 'Slow-braised octopus finished on the grill with capers and vinegar.',
          modifiers: []
        },
        {
          id: 'whole-branzino',
          name: 'Whole Branzino',
          price: 32,
          image: '/public/branzino.png',
          description: 'Whole grilled sea bass with lemon and oregano, served with greens.',
          modifiers: []
        },
        {
          id: 'saganaki-shrimp',
          name: 'Saganaki Shrimp',
          price: 18,
          image: '/public/saganaki-shrimp.png',
          description: 'Shrimp sautéed in spicy tomato sauce with feta, baked in a clay skillet.',
          modifiers: []
        },
        {
          id: 'calamari',
          name: 'Calamari',
          price: 16,
          image: '/public/calamari.png',
          description: 'Lightly floured and fried rings served with lemon and garlic aioli.',
          modifiers: []
        }
      ]
    },

    {
      id: 'plates',
      name: 'Plates',
      blurb: 'Hearty Greek classics.',
      items: [
        {
          id: 'moussaka',
          name: 'Moussaka',
          price: 19,
          image: '/public/moussaka.png',
          description: 'Layered eggplant and spiced ground lamb topped with béchamel and baked golden.',
          modifiers: []
        },
        {
          id: 'pastitsio',
          name: 'Pastitsio',
          price: 18,
          image: '/public/pastitsio.png',
          description: 'Greek pasta bake with seasoned beef, tomato, and creamy béchamel.',
          modifiers: []
        },
        {
          id: 'lamb-kleftiko',
          name: 'Lamb Kleftiko',
          price: 26,
          image: '/public/lamb-kleftiko.png',
          description: 'Slow-braised lamb shoulder sealed in parchment with lemon, garlic, and herbs.',
          modifiers: []
        },
        {
          id: 'roast-chicken',
          name: 'Roast Chicken',
          price: 20,
          image: '/public/014a33bc-3a11-4396-82a5-8c7e7f5726cf.png',
          description: 'Half chicken roasted with lemon, oregano, and garlic, served with potatoes.',
          modifiers: []
        }
      ]
    },

    {
      id: 'sides',
      name: 'Sides',
      blurb: 'Small portions, big flavor.',
      items: [
        {
          id: 'lemon-potatoes',
          name: 'Lemon Potatoes',
          price: 6,
          image: '/public/1debfddb-5fce-44a5-bd4c-9957be88836c.png',
          description: 'Oven-roasted potatoes with lemon, olive oil, and dried oregano.',
          modifiers: []
        },
        {
          id: 'greek-rice',
          name: 'Greek Rice',
          price: 5,
          image: '/public/c09f71a2-079a-4e68-9360-362d961cb6ac.png',
          description: 'Pilaf-style rice simmered in tomato broth with herbs and olive oil.',
          modifiers: []
        },
        {
          id: 'spanakopita',
          name: 'Spanakopita',
          price: 8,
          image: '/public/94d38a32-02ea-4584-ba7e-9f4187fd90f1.png',
          description: 'Flaky phyllo triangles filled with spinach, feta, and fresh dill.',
          modifiers: []
        },
        {
          id: 'dolmades',
          name: 'Dolmades',
          price: 9,
          image: '/public/01c5098e-cec5-45ac-b622-86405690a6da.png',
          description: 'Vine leaves stuffed with herbed rice, served with a wedge of lemon.',
          modifiers: []
        }
      ]
    },

    {
      id: 'desserts',
      name: 'Desserts',
      blurb: 'Sweet endings, honey-soaked.',
      items: [
        {
          id: 'baklava',
          name: 'Baklava',
          price: 8,
          image: '/public/cc9862c0-9623-4361-8113-00f23b857df7.png',
          description: 'Layers of crisp phyllo, chopped walnuts, and fragrant honey syrup.',
          modifiers: []
        },
        {
          id: 'galaktoboureko',
          name: 'Galaktoboureko',
          price: 8,
          image: '/public/f7ff28eb-f2a7-4078-9852-d247d2505b8f.png',
          description: 'Semolina custard baked in phyllo and soaked with citrus syrup.',
          modifiers: []
        },
        {
          id: 'loukoumades',
          name: 'Loukoumades',
          price: 7,
          image: '/public/5f295419-264c-47da-b6b4-47921e4e288f.png',
          description: 'Greek honey doughnuts fried golden, drizzled with thyme honey and cinnamon.',
          modifiers: []
        },
        {
          id: 'yogurt-honey',
          name: 'Yogurt & Honey',
          price: 7,
          image: '/public/02dad55d-cdeb-4a3b-8a08-974bca6bd92d.png',
          description: 'Thick strained Greek yogurt topped with wild honey and crushed walnuts.',
          modifiers: []
        }
      ]
    },

    {
      id: 'wine',
      name: 'Wine & Drinks',
      blurb: 'Greek pours and bright drinks.',
      items: [
        {
          id: 'house-red',
          name: 'House Red',
          price: 9,
          image: '/public/f3dff88e-f5e1-40a7-b77a-d8dcef65f46d.png',
          description: 'Greek table red — smooth and food-friendly. Glass $9 / Bottle $36.',
          modifiers: []
        },
        {
          id: 'house-white',
          name: 'House White',
          price: 9,
          image: '/public/29749a29-2a06-47b7-a671-eaacf3db3cab.png',
          description: 'Crisp and dry Greek table white. Glass $9 / Bottle $36.',
          modifiers: []
        },
        {
          id: 'assyrtiko',
          name: 'Assyrtiko',
          price: 14,
          image: '/public/99fbf158-70ee-46cc-bbe1-0449c5976a5a.png',
          description: 'Mineral-driven Santorini white with bright citrus and saline finish. Glass $14 / Bottle $54.',
          modifiers: []
        },
        {
          id: 'agiorgitiko',
          name: 'Agiorgitiko',
          price: 14,
          image: '/public/c40549f9-037d-4fdf-8380-b7fd49956858.png',
          description: 'Velvety Nemean red with dark fruit, soft tannins, and a long finish. Glass $14 / Bottle $54.',
          modifiers: []
        },
        {
          id: 'ouzo',
          name: 'Ouzo',
          price: 8,
          image: '/public/ouzo.png',
          description: 'Traditional Greek anise spirit served over ice with a small water splash.',
          modifiers: []
        },
        {
          id: 'greek-coffee',
          name: 'Greek Coffee',
          price: 4,
          image: '/public/8b7afa69-13d8-484b-8974-e82c0fab6bf7.png',
          description: 'Finely ground coffee brewed slowly in a copper briki, served in a demitasse.',
          modifiers: []
        },
        {
          id: 'frappe',
          name: 'Frappé',
          price: 5,
          image: '/public/frappe.png',
          description: 'Iced instant coffee shaken into a thick foam — the classic Greek café drink.',
          modifiers: []
        },
        {
          id: 'sparkling-water',
          name: 'Sparkling Water',
          price: 4,
          image: '/public/2fec95ff-4488-44f5-89fb-9e42ed63a107.png',
          description: 'Chilled sparkling mineral water.',
          modifiers: []
        }
      ]
    }
  ]
};

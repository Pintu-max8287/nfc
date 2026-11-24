import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DineFlow database...");

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("SuperAdmin@123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@dineflow.com" },
    update: {},
    create: {
      email: "superadmin@dineflow.com",
      passwordHash: superAdminHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      restaurantId: null,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // ── 2. Demo Restaurant ──────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "spice-roast" },
    update: {},
    create: {
      name: "Spice & Roast",
      slug: "spice-roast",
      description:
        "An artisanal dining experience where bold Indian spices meet slow-roasted perfection. Every dish tells a story of tradition and flame.",
      currencySymbol: "₹",
      taxRate: 5.0,
      wifiName: "SpiceRoast_Guest",
      wifiPassword: "spice2024",
      googleReviewUrl: "https://g.page/r/spice-roast-demo/review",
      whatsappNumber: "+919876543210",
      isActive: true,
    },
  });
  console.log(`✅ Restaurant created: ${restaurant.name} (/${restaurant.slug})`);

  // ── 3. Restaurant Staff ─────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const kitchenHash = await bcrypt.hash("Kitchen@123", 10);

  const restaurantAdmin = await prisma.user.upsert({
    where: { email: "admin@spiceroast.com" },
    update: {},
    create: {
      email: "admin@spiceroast.com",
      passwordHash: adminHash,
      name: "Spice & Roast Admin",
      role: "RESTAURANT_ADMIN",
      restaurantId: restaurant.id,
    },
  });

  const kitchenStaff = await prisma.user.upsert({
    where: { email: "kitchen@spiceroast.com" },
    update: {},
    create: {
      email: "kitchen@spiceroast.com",
      passwordHash: kitchenHash,
      name: "Chef Ravi",
      role: "KITCHEN_STAFF",
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Staff seeded: ${restaurantAdmin.email}, ${kitchenStaff.email}`);

  // ── 4. Tables ───────────────────────────────────────────────────────────────
  const tableData = [
    { tableNumber: "01", capacity: 2 },
    { tableNumber: "02", capacity: 4 },
    { tableNumber: "03", capacity: 4 },
    { tableNumber: "04", capacity: 6 },
    { tableNumber: "05", capacity: 2 },
    { tableNumber: "06", capacity: 8 },
  ];

  const tables = await Promise.all(
    tableData.map((t) =>
      prisma.table.upsert({
        where: {
          restaurantId_tableNumber: {
            restaurantId: restaurant.id,
            tableNumber: t.tableNumber,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          isActive: true,
        },
      })
    )
  );
  console.log(`✅ ${tables.length} tables seeded`);

  // ── 5. Categories ───────────────────────────────────────────────────────────
  const categoryNames = ["Starters", "Mains", "Drinks", "Desserts"];
  const categories: Record<string, string> = {};

  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    const existing = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id, name },
    });
    const cat = existing
      ? existing
      : await prisma.category.create({
          data: {
            restaurantId: restaurant.id,
            name,
            sortOrder: i,
          },
        });
    categories[name] = cat.id;
  }
  console.log(`✅ ${categoryNames.length} categories seeded`);

  // ── 6. Menu Items ───────────────────────────────────────────────────────────
  const menuItemsData = [
    // Starters
    {
      categoryName: "Starters",
      name: "Tandoori Paneer Tikka",
      description:
        "Soft cottage cheese cubes marinated in yogurt, spices, and smoked paprika, grilled in a clay tandoor until perfectly charred.",
      price: 320,
      prepTime: "15-20 min",
      spiceTag: "Medium spicy",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=600",
      stockCount: 20,
    },
    {
      categoryName: "Starters",
      name: "Chicken Seekh Kebab",
      description:
        "Minced chicken mixed with fresh herbs, green chillies, and aromatic spices, skewered and slow-grilled over charcoal.",
      price: 380,
      prepTime: "20-25 min",
      spiceTag: "Spicy",
      dietaryTag: "Non-Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600",
      stockCount: 15,
    },
    {
      categoryName: "Starters",
      name: "Crispy Veg Spring Rolls",
      description:
        "Golden, flaky rolls stuffed with a savoury mix of julienned vegetables, glass noodles, and sesame-soy glaze.",
      price: 240,
      prepTime: "10-15 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600",
      stockCount: null,
    },
    // Mains
    {
      categoryName: "Mains",
      name: "Butter Chicken Masala",
      description:
        "Classic slow-cooked chicken in a rich, velvety tomato-cashew gravy with a finishing swirl of cream and hand-pounded spices.",
      price: 480,
      prepTime: "25-30 min",
      spiceTag: "Mild",
      dietaryTag: "Non-Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600",
      stockCount: 12,
    },
    {
      categoryName: "Mains",
      name: "Dal Makhani",
      description:
        "Whole black lentils slow-simmered overnight with tomatoes, cream, and a generous knob of butter — the ultimate comfort bowl.",
      price: 320,
      prepTime: "15-20 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
      stockCount: 25,
    },
    {
      categoryName: "Mains",
      name: "Lamb Rogan Josh",
      description:
        "Slow-braised lamb shanks in an intense Kashmiri spice broth with whole spices, Kashmiri chilli, and caramelised onions.",
      price: 620,
      prepTime: "30-35 min",
      spiceTag: "Medium spicy",
      dietaryTag: "Non-Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600",
      stockCount: 8,
      lowStockThreshold: 5,
    },
    {
      categoryName: "Mains",
      name: "Garlic Naan",
      description:
        "Pillowy, hand-stretched leavened bread brushed generously with garlic butter and chopped coriander, baked in a live tandoor.",
      price: 80,
      prepTime: "8-10 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600",
      stockCount: null,
    },
    // Drinks
    {
      categoryName: "Drinks",
      name: "Mango Lassi",
      description:
        "Chilled, thick yogurt blended with Alphonso mango pulp, a pinch of cardamom, and a garnish of crushed pistachios.",
      price: 180,
      prepTime: "5 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600",
      stockCount: null,
    },
    // Desserts
    {
      categoryName: "Desserts",
      name: "Gulab Jamun",
      description:
        "Soft milk-solid dumplings soaked in rose-saffron sugar syrup, served warm with a scoop of vanilla kulfi.",
      price: 160,
      prepTime: "5 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1611293388250-580b08c4a145?w=600",
      stockCount: 30,
    },
    {
      categoryName: "Desserts",
      name: "Chocolate Lava Cake",
      description:
        "Warm dark chocolate fondant with a molten centre, dusted with cocoa powder and paired with salted caramel ice cream.",
      price: 280,
      prepTime: "15-20 min",
      spiceTag: "Mild",
      dietaryTag: "Veg",
      imageUrl:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
      stockCount: 10,
    },
  ];

  let seededCount = 0;
  for (const item of menuItemsData) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: item.name,
      },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[item.categoryName],
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          prepTime: item.prepTime,
          spiceTag: item.spiceTag,
          dietaryTag: item.dietaryTag,
          isAvailable: true,
          stockCount: item.stockCount ?? null,
          lowStockThreshold: (item as { lowStockThreshold?: number }).lowStockThreshold ?? 5,
        },
      });
      seededCount++;
    }
  }
  console.log(`✅ ${seededCount} menu items seeded (${menuItemsData.length - seededCount} already existed)`);

  console.log("\n🎉 Seed complete!\n");
  console.log("─────────────────────────────────────────────");
  console.log("  Super Admin:    superadmin@dineflow.com / SuperAdmin@123");
  console.log("  Restaurant Admin: admin@spiceroast.com / Admin@123");
  console.log("  Kitchen Staff:  kitchen@spiceroast.com / Kitchen@123");
  console.log("  Customer URL:   /spice-roast/table/01");
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

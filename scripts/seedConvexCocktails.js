const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const IMAGES_DIR = path.join(ROOT, "images_2");

const COCKTAILS = [
  {
    slug: "negroni",
    name: "Negroni",
    description: "A bitter-sweet stirred classic.",
    method: "stir",
    glassware: "Rocks glass",
    garnish: "Orange twist",
    instructions: [
      "Add ingredients to a mixing glass with ice.",
      "Stir until chilled and diluted.",
      "Strain over fresh ice in a rocks glass.",
    ],
    tags: ["bitter", "classic", "aperitif"],
    recipe: [
      { ingredientSlug: "gin", amount: 1, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "campari", amount: 1, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "sweet_vermouth", amount: 1, unit: "oz", sortOrder: 3 },
    ],
  },
  {
    slug: "old_fashioned",
    name: "Old Fashioned",
    description: "Spirit-forward whiskey cocktail.",
    method: "stir",
    glassware: "Rocks glass",
    garnish: "Orange peel",
    instructions: [
      "Add bourbon, syrup, and bitters to a mixing glass with ice.",
      "Stir until chilled.",
      "Strain over a large cube in a rocks glass.",
    ],
    tags: ["whiskey", "classic", "spirit-forward"],
    recipe: [
      { ingredientSlug: "bourbon_whiskey", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "simple_syrup", amount: 0.25, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "angostura", amount: 2, unit: "dash", sortOrder: 3 },
      { ingredientSlug: "orange_bitters", amount: 1, unit: "dash", sortOrder: 4 },
    ],
  },
  {
    slug: "mojito",
    name: "Mojito",
    description: "Refreshing mint and lime highball.",
    method: "build",
    glassware: "Highball glass",
    garnish: "Mint sprig",
    instructions: [
      "Lightly muddle mint with lime juice and syrup.",
      "Add rum and ice.",
      "Top with soda water and stir gently.",
    ],
    tags: ["refreshing", "rum", "highball"],
    recipe: [
      { ingredientSlug: "mint", amount: 8, unit: "leaf", sortOrder: 1 },
      { ingredientSlug: "lime_juice", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "simple_syrup", amount: 0.5, unit: "oz", sortOrder: 3 },
      { ingredientSlug: "white_light_rum", amount: 2, unit: "oz", sortOrder: 4 },
    ],
  },
  {
    slug: "margarita",
    name: "Margarita",
    description: "Tequila sour with citrus and orange liqueur.",
    method: "shake",
    glassware: "Coupe",
    garnish: "Lime wheel",
    instructions: [
      "Add ingredients to a shaker with ice.",
      "Shake hard until chilled.",
      "Double strain into a chilled coupe.",
    ],
    tags: ["tequila", "sour", "classic"],
    recipe: [
      { ingredientSlug: "tequila_reposado", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "triple_sec", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "lime_juice", amount: 0.75, unit: "oz", sortOrder: 3 },
    ],
  },
  {
    slug: "whiskey_sour",
    name: "Whiskey Sour",
    description: "Balanced whiskey sour with foam.",
    method: "shake",
    glassware: "Rocks glass",
    garnish: "Lemon twist",
    instructions: [
      "Dry shake all ingredients.",
      "Add ice and shake again until cold.",
      "Strain over fresh ice.",
    ],
    tags: ["whiskey", "sour", "citrus"],
    recipe: [
      { ingredientSlug: "bourbon_whiskey", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "lemon_juice", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "simple_syrup", amount: 0.5, unit: "oz", sortOrder: 3 },
      { ingredientSlug: "egg_white", amount: 0.75, unit: "oz", sortOrder: 4 },
    ],
  },
  {
    slug: "espresso_martini",
    name: "Espresso Martini",
    description: "Coffee-forward modern classic.",
    method: "shake",
    glassware: "Coupe",
    garnish: "Coffee beans",
    instructions: [
      "Shake all ingredients with ice.",
      "Double strain into a chilled coupe.",
    ],
    tags: ["vodka", "coffee", "after-dinner"],
    recipe: [
      { ingredientSlug: "vodka", amount: 1.5, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "coffee_liqueur", amount: 1, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "espresso", amount: 1, unit: "oz", sortOrder: 3 },
      { ingredientSlug: "simple_syrup", amount: 0.25, unit: "oz", sortOrder: 4 },
    ],
  },
  {
    slug: "pina_colada",
    name: "Pina Colada",
    description: "Tropical blended rum cocktail.",
    method: "blend",
    glassware: "Hurricane glass",
    garnish: "Pineapple wedge",
    instructions: [
      "Blend all ingredients with crushed ice.",
      "Pour into a chilled hurricane glass.",
    ],
    tags: ["tropical", "frozen", "rum"],
    recipe: [
      { ingredientSlug: "white_light_rum", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "cream_of_coconut", amount: 1.5, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "pineapple_juice", amount: 1.5, unit: "oz", sortOrder: 3 },
    ],
  },
  {
    slug: "penicillin",
    name: "Penicillin",
    description: "Smoky and spicy modern whisky sour.",
    method: "shake",
    glassware: "Rocks glass",
    garnish: "Candied ginger",
    instructions: [
      "Shake blended scotch, lemon, honey syrup, and ginger beer with ice.",
      "Strain over fresh ice.",
    ],
    tags: ["whiskey", "modern-classic", "ginger"],
    recipe: [
      { ingredientSlug: "scotch_blended_whiskey", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "lemon_juice", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "honey_syrup", amount: 0.75, unit: "oz", sortOrder: 3 },
      { ingredientSlug: "ginger_beer", amount: 1, unit: "oz", sortOrder: 4 },
    ],
  },
  {
    slug: "daiquiri",
    name: "Daiquiri",
    description: "Clean rum sour template.",
    method: "shake",
    glassware: "Coupe",
    garnish: "Lime wheel",
    instructions: [
      "Shake ingredients with ice.",
      "Double strain into a chilled coupe.",
    ],
    tags: ["rum", "sour", "classic"],
    recipe: [
      { ingredientSlug: "white_light_rum", amount: 2, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "lime_juice", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "simple_syrup", amount: 0.75, unit: "oz", sortOrder: 3 },
    ],
  },
  {
    slug: "last_word",
    name: "Last Word",
    description: "Equal-parts gin classic with herbal depth.",
    method: "shake",
    glassware: "Coupe",
    garnish: "Brandied cherry",
    instructions: [
      "Shake ingredients with ice.",
      "Double strain into a chilled coupe.",
    ],
    tags: ["equal-parts", "classic", "herbal"],
    recipe: [
      { ingredientSlug: "gin", amount: 0.75, unit: "oz", sortOrder: 1 },
      { ingredientSlug: "lime_juice", amount: 0.75, unit: "oz", sortOrder: 2 },
      { ingredientSlug: "maraschino_liqueur", amount: 0.75, unit: "oz", sortOrder: 3 },
      { ingredientSlug: "chartreuse", amount: 0.75, unit: "oz", sortOrder: 4 },
    ],
  },
];

const INGREDIENTS = [
  { slug: "gin", name: "Gin", category: "spirit", abv: 40 },
  { slug: "campari", name: "Campari", category: "liqueur", abv: 24 },
  { slug: "sweet_vermouth", name: "Sweet Vermouth", category: "liqueur", abv: 16 },
  { slug: "orange_bitters", name: "Orange Bitters", category: "other", abv: 44 },
  { slug: "bourbon_whiskey", name: "Bourbon Whiskey", category: "spirit", abv: 45 },
  { slug: "simple_syrup", name: "Simple Syrup", category: "syrup" },
  { slug: "angostura", name: "Angostura Bitters", category: "other", abv: 44.7 },
  { slug: "white_light_rum", name: "White Rum", category: "spirit", abv: 40 },
  { slug: "lime_juice", name: "Lime Juice", category: "fruit" },
  { slug: "mint", name: "Mint", category: "herb" },
  { slug: "tequila_reposado", name: "Reposado Tequila", category: "spirit", abv: 40 },
  { slug: "triple_sec", name: "Triple Sec", category: "liqueur", abv: 30 },
  { slug: "lemon_juice", name: "Lemon Juice", category: "fruit" },
  { slug: "egg_white", name: "Egg White", category: "other" },
  { slug: "vodka", name: "Vodka", category: "spirit", abv: 40 },
  { slug: "coffee_liqueur", name: "Coffee Liqueur", category: "liqueur", abv: 20 },
  { slug: "espresso", name: "Espresso", category: "mixer" },
  { slug: "cream_of_coconut", name: "Cream of Coconut", category: "mixer" },
  { slug: "pineapple_juice", name: "Pineapple Juice", category: "fruit" },
  { slug: "scotch_blended_whiskey", name: "Blended Scotch Whisky", category: "spirit", abv: 40 },
  { slug: "honey_syrup", name: "Honey Syrup", category: "syrup" },
  { slug: "ginger_beer", name: "Ginger Beer", category: "mixer" },
  { slug: "maraschino_liqueur", name: "Maraschino Liqueur", category: "liqueur", abv: 32 },
  { slug: "chartreuse", name: "Chartreuse", category: "liqueur", abv: 55 },
];

function parseEnv(content) {
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).split("#")[0].trim();
    out[key] = value;
  }
  return out;
}

function prettifyLabel(slug) {
  return slug
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

async function main() {
  const envRaw = await fs.readFile(ENV_PATH, "utf8");
  const env = parseEnv(envRaw);
  const convexUrl = env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error(`Missing CONVEX_URL in ${ENV_PATH}`);
  }

  const { ConvexHttpClient } = await import("convex/browser");
  const client = new ConvexHttpClient(convexUrl);

  const files = (await fs.readdir(IMAGES_DIR))
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();

  const cocktailSlugs = new Set(COCKTAILS.map((c) => c.slug));
  const ingredientSlugs = new Set(INGREDIENTS.map((i) => i.slug));

  for (let i = 0; i < files.length; i += 1) {
    const filename = files[i];
    const slug = path.basename(filename, ".png");
    let kind = "other";
    if (cocktailSlugs.has(slug)) kind = "cocktail";
    if (ingredientSlugs.has(slug)) kind = "ingredient";

    const uploadUrl = await client.mutation("seed:getUploadUrlForSeed", {});
    const data = await fs.readFile(path.join(IMAGES_DIR, filename));
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: data,
    });
    if (!response.ok) {
      throw new Error(`Upload failed for ${filename}: ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    if (!body.storageId) {
      throw new Error(`Upload response missing storageId for ${filename}`);
    }

    await client.mutation("seed:upsertAssetFromUpload", {
      slug,
      filename,
      kind,
      storageId: body.storageId,
      mimeType: "image/png",
      bytes: data.length,
    });

    process.stdout.write(
      `\rUploaded ${i + 1}/${files.length}: ${filename.padEnd(35)} (${prettifyLabel(kind)})`,
    );
  }
  process.stdout.write("\n");

  await client.mutation("seed:seedMockCatalog", {
    ingredients: INGREDIENTS,
    cocktails: COCKTAILS,
  });

  const status = await client.query("seed:seedStatus", {});
  console.log("Seed complete:", status);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  assets: defineTable({
    slug: v.string(),
    filename: v.string(),
    kind: v.union(v.literal("cocktail"), v.literal("ingredient"), v.literal("other")),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    bytes: v.number(),
    status: v.union(v.literal("assigned"), v.literal("unassigned")),
    assignedEntityType: v.optional(
      v.union(v.literal("cocktail"), v.literal("ingredient")),
    ),
    assignedEntitySlug: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_kind", ["kind"])
    .index("by_status", ["status"]),

  ingredients: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("spirit"),
      v.literal("liqueur"),
      v.literal("mixer"),
      v.literal("syrup"),
      v.literal("herb"),
      v.literal("fruit"),
      v.literal("other"),
    ),
    abv: v.optional(v.number()),
    imageAssetId: v.optional(v.id("assets")),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  cocktails: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    method: v.union(
      v.literal("stir"),
      v.literal("shake"),
      v.literal("build"),
      v.literal("blend"),
    ),
    glassware: v.string(),
    garnish: v.optional(v.string()),
    instructions: v.array(v.string()),
    imageAssetId: v.optional(v.id("assets")),
    tags: v.array(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  cocktailIngredients: defineTable({
    cocktailId: v.id("cocktails"),
    ingredientId: v.id("ingredients"),
    amount: v.number(),
    unit: v.union(
      v.literal("oz"),
      v.literal("dash"),
      v.literal("barspoon"),
      v.literal("leaf"),
      v.literal("top"),
    ),
    preparation: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_cocktail", ["cocktailId"])
    .index("by_ingredient", ["ingredientId"])
    .index("by_cocktail_and_order", ["cocktailId", "sortOrder"]),
});

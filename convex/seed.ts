import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const ingredientCategoryValidator = v.union(
  v.literal("spirit"),
  v.literal("liqueur"),
  v.literal("mixer"),
  v.literal("syrup"),
  v.literal("herb"),
  v.literal("fruit"),
  v.literal("other"),
);

const cocktailMethodValidator = v.union(
  v.literal("stir"),
  v.literal("shake"),
  v.literal("build"),
  v.literal("blend"),
);

const recipeUnitValidator = v.union(
  v.literal("oz"),
  v.literal("dash"),
  v.literal("barspoon"),
  v.literal("leaf"),
  v.literal("top"),
);

export const getUploadUrlForSeed = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertAssetFromUpload = mutation({
  args: {
    slug: v.string(),
    filename: v.string(),
    kind: v.union(v.literal("cocktail"), v.literal("ingredient"), v.literal("other")),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    bytes: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const doc = {
      slug: args.slug,
      filename: args.filename,
      kind: args.kind,
      storageId: args.storageId,
      mimeType: args.mimeType,
      bytes: args.bytes,
      status: "unassigned" as const,
      assignedEntityType: undefined,
      assignedEntitySlug: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert("assets", doc);
  },
});

export const seedMockCatalog = mutation({
  args: {
    ingredients: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        category: ingredientCategoryValidator,
        abv: v.optional(v.number()),
      }),
    ),
    cocktails: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        description: v.string(),
        method: cocktailMethodValidator,
        glassware: v.string(),
        garnish: v.optional(v.string()),
        instructions: v.array(v.string()),
        tags: v.array(v.string()),
        recipe: v.array(
          v.object({
            ingredientSlug: v.string(),
            amount: v.number(),
            unit: recipeUnitValidator,
            preparation: v.optional(v.string()),
            sortOrder: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const allAssets = await ctx.db.query("assets").collect();
    for (const asset of allAssets) {
      await ctx.db.patch(asset._id, {
        status: "unassigned",
        assignedEntityType: undefined,
        assignedEntitySlug: undefined,
      });
    }

    const ingredientBySlug = new Map<string, Id<"ingredients">>();

    for (const ingredient of args.ingredients) {
      const ingredientAsset = await ctx.db
        .query("assets")
        .withIndex("by_slug", (q) => q.eq("slug", ingredient.slug))
        .first();

      const ingredientDoc = {
        slug: ingredient.slug,
        name: ingredient.name,
        category: ingredient.category,
        abv: ingredient.abv,
        imageAssetId: ingredientAsset?._id,
      };

      const existingIngredient = await ctx.db
        .query("ingredients")
        .withIndex("by_slug", (q) => q.eq("slug", ingredient.slug))
        .first();

      let ingredientId: Id<"ingredients">;
      if (existingIngredient) {
        await ctx.db.patch(existingIngredient._id, ingredientDoc);
        ingredientId = existingIngredient._id;
      } else {
        ingredientId = await ctx.db.insert("ingredients", ingredientDoc);
      }

      ingredientBySlug.set(ingredient.slug, ingredientId);

      if (ingredientAsset) {
        await ctx.db.patch(ingredientAsset._id, {
          status: "assigned",
          assignedEntityType: "ingredient",
          assignedEntitySlug: ingredient.slug,
        });
      }
    }

    for (const cocktail of args.cocktails) {
      const cocktailAsset = await ctx.db
        .query("assets")
        .withIndex("by_slug", (q) => q.eq("slug", cocktail.slug))
        .first();

      const cocktailDoc = {
        slug: cocktail.slug,
        name: cocktail.name,
        description: cocktail.description,
        method: cocktail.method,
        glassware: cocktail.glassware,
        garnish: cocktail.garnish,
        instructions: cocktail.instructions,
        imageAssetId: cocktailAsset?._id,
        tags: cocktail.tags,
      };

      const existingCocktail = await ctx.db
        .query("cocktails")
        .withIndex("by_slug", (q) => q.eq("slug", cocktail.slug))
        .first();

      let cocktailId: Id<"cocktails">;
      if (existingCocktail) {
        await ctx.db.patch(existingCocktail._id, cocktailDoc);
        cocktailId = existingCocktail._id;
      } else {
        cocktailId = await ctx.db.insert("cocktails", cocktailDoc);
      }

      const existingRecipeRows = await ctx.db
        .query("cocktailIngredients")
        .withIndex("by_cocktail", (q) => q.eq("cocktailId", cocktailId))
        .collect();

      for (const row of existingRecipeRows) {
        await ctx.db.delete(row._id);
      }

      for (const recipeRow of cocktail.recipe) {
        const ingredientId = ingredientBySlug.get(recipeRow.ingredientSlug);
        if (!ingredientId) {
          throw new Error(
            `Missing ingredient "${recipeRow.ingredientSlug}" for cocktail "${cocktail.slug}"`,
          );
        }

        await ctx.db.insert("cocktailIngredients", {
          cocktailId,
          ingredientId,
          amount: recipeRow.amount,
          unit: recipeRow.unit,
          preparation: recipeRow.preparation,
          sortOrder: recipeRow.sortOrder,
        });
      }

      if (cocktailAsset) {
        await ctx.db.patch(cocktailAsset._id, {
          status: "assigned",
          assignedEntityType: "cocktail",
          assignedEntitySlug: cocktail.slug,
        });
      }
    }

    return {
      seededCocktails: args.cocktails.length,
      seededIngredients: args.ingredients.length,
    };
  },
});

export const seedStatus = query({
  args: {},
  handler: async (ctx) => {
    const [assets, ingredients, cocktails, recipeRows] = await Promise.all([
      ctx.db.query("assets").collect(),
      ctx.db.query("ingredients").collect(),
      ctx.db.query("cocktails").collect(),
      ctx.db.query("cocktailIngredients").collect(),
    ]);

    const assignedAssets = assets.filter((asset) => asset.status === "assigned");

    return {
      totalAssets: assets.length,
      assignedAssets: assignedAssets.length,
      totalIngredients: ingredients.length,
      totalCocktails: cocktails.length,
      totalRecipeRows: recipeRows.length,
    };
  },
});

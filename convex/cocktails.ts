import { query } from "./_generated/server";
import { v } from "convex/values";

export const listCocktails = query({
  args: {},
  handler: async (ctx) => {
    const cocktails = await ctx.db.query("cocktails").collect();

    const list = await Promise.all(
      cocktails.map(async (cocktail) => {
        const asset = cocktail.imageAssetId
          ? await ctx.db.get(cocktail.imageAssetId)
          : null;
        const imageUrl = asset ? await ctx.storage.getUrl(asset.storageId) : null;

        return {
          _id: cocktail._id,
          slug: cocktail.slug,
          name: cocktail.name,
          description: cocktail.description,
          method: cocktail.method,
          glassware: cocktail.glassware,
          tags: cocktail.tags,
          imageUrl,
        };
      }),
    );

    return list.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getCocktailBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const cocktail = await ctx.db
      .query("cocktails")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!cocktail) {
      return null;
    }

    const cocktailAsset = cocktail.imageAssetId
      ? await ctx.db.get(cocktail.imageAssetId)
      : null;

    const cocktailImageUrl = cocktailAsset
      ? await ctx.storage.getUrl(cocktailAsset.storageId)
      : null;

    const recipeRows = await ctx.db
      .query("cocktailIngredients")
      .withIndex("by_cocktail_and_order", (q) => q.eq("cocktailId", cocktail._id))
      .collect();

    const recipe = await Promise.all(
      recipeRows.map(async (row) => {
        const ingredient = await ctx.db.get(row.ingredientId);
        if (!ingredient) {
          return null;
        }

        const ingredientAsset = ingredient.imageAssetId
          ? await ctx.db.get(ingredient.imageAssetId)
          : null;

        const ingredientImageUrl = ingredientAsset
          ? await ctx.storage.getUrl(ingredientAsset.storageId)
          : null;

        return {
          ingredient: {
            _id: ingredient._id,
            slug: ingredient.slug,
            name: ingredient.name,
            category: ingredient.category,
            abv: ingredient.abv,
            imageUrl: ingredientImageUrl,
          },
          amount: row.amount,
          unit: row.unit,
          preparation: row.preparation ?? null,
          sortOrder: row.sortOrder,
        };
      }),
    );

    return {
      _id: cocktail._id,
      slug: cocktail.slug,
      name: cocktail.name,
      description: cocktail.description,
      method: cocktail.method,
      glassware: cocktail.glassware,
      garnish: cocktail.garnish ?? null,
      instructions: cocktail.instructions,
      tags: cocktail.tags,
      imageUrl: cocktailImageUrl,
      recipe: recipe.filter((item) => item !== null),
    };
  },
});

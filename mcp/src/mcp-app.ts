import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type PostMessageTransport,
} from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import "./global.css";
import "./mcp-app.css";

type CocktailRecipe = {
  name: string;
  description: string;
  method: string;
  glassware: string;
  garnish: string | null;
  imageUrl: string | null;
  instructions: string[];
  recipe: Array<{
    ingredient: {
      name: string;
      imageUrl?: string | null;
    };
    amount: number;
    unit: string;
    preparation: string | null;
  }>;
};

type RecipePayload = {
  requested: string;
  cocktail: CocktailRecipe | null;
};

const mainEl = document.querySelector(".main") as HTMLElement;
const nameEl = document.getElementById("cocktail-name") as HTMLElement;
const descEl = document.getElementById("cocktail-description") as HTMLElement;
const notFoundEl = document.getElementById("not-found") as HTMLElement;
const notFoundTextEl = document.getElementById("not-found-text") as HTMLElement;
const recipeCardEl = document.getElementById("recipe-card") as HTMLElement;
const cocktailImageEl = document.getElementById("cocktail-image") as HTMLImageElement;
const methodEl = document.getElementById("cocktail-method") as HTMLElement;
const glasswareEl = document.getElementById("cocktail-glassware") as HTMLElement;
const garnishEl = document.getElementById("cocktail-garnish") as HTMLElement;
const ingredientsEl = document.getElementById("ingredients-list") as HTMLUListElement;
const instructionsEl = document.getElementById("instructions-list") as HTMLOListElement;

function handleHostContextChanged(ctx: PostMessageTransport) {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets) {
    mainEl.style.paddingTop = `${ctx.safeAreaInsets.top}px`;
    mainEl.style.paddingRight = `${ctx.safeAreaInsets.right}px`;
    mainEl.style.paddingBottom = `${ctx.safeAreaInsets.bottom}px`;
    mainEl.style.paddingLeft = `${ctx.safeAreaInsets.left}px`;
  }
}

function renderNotFound(requested: string) {
  nameEl.textContent = "Cocktail Recipe";
  descEl.textContent = "No matching recipe was found in the Convex database.";
  notFoundTextEl.textContent = `No cocktail found for "${requested}".`;
  notFoundEl.classList.remove("hidden");
  recipeCardEl.classList.add("hidden");
}

function renderCocktail(cocktail: CocktailRecipe) {
  nameEl.textContent = cocktail.name;
  descEl.textContent = cocktail.description;
  methodEl.textContent = cocktail.method;
  glasswareEl.textContent = cocktail.glassware;
  garnishEl.textContent = cocktail.garnish ?? "None";

  if (cocktail.imageUrl) {
    cocktailImageEl.src = cocktail.imageUrl;
    cocktailImageEl.classList.remove("hidden");
  } else {
    cocktailImageEl.classList.add("hidden");
    cocktailImageEl.removeAttribute("src");
  }

  ingredientsEl.innerHTML = "";
  for (const row of cocktail.recipe) {
    const li = document.createElement("li");
    li.className = "ingredient-item";

    const image = document.createElement("img");
    image.className = "ingredient-image";
    image.loading = "lazy";
    image.alt = row.ingredient.name;
    if (row.ingredient.imageUrl) {
      image.src = row.ingredient.imageUrl;
    } else {
      image.classList.add("ingredient-image-placeholder");
    }
    li.appendChild(image);

    const details = document.createElement("div");
    details.className = "ingredient-details";

    const name = document.createElement("span");
    name.className = "ingredient-name";
    name.textContent = row.ingredient.name;
    details.appendChild(name);

    const amount = document.createElement("span");
    amount.className = "ingredient-amount";
    const amountText = `${row.amount} ${row.unit}`;
    const prep = row.preparation ? ` (${row.preparation})` : "";
    amount.textContent = `${amountText}${prep}`;
    details.appendChild(amount);

    li.appendChild(details);
    ingredientsEl.appendChild(li);
  }

  instructionsEl.innerHTML = "";
  for (const step of cocktail.instructions) {
    const li = document.createElement("li");
    li.textContent = step;
    instructionsEl.appendChild(li);
  }

  notFoundEl.classList.add("hidden");
  recipeCardEl.classList.remove("hidden");
}

function parsePayload(result: CallToolResult): RecipePayload {
  const data = (result.structuredContent ?? {}) as Partial<RecipePayload>;
  return {
    requested: typeof data.requested === "string" ? data.requested : "negroni",
    cocktail: (data.cocktail as CocktailRecipe | null | undefined) ?? null,
  };
}

const app = new App({ name: "Cocktail Recipe App", version: "1.0.0" });

app.onteardown = async () => ({});
app.onerror = console.error;
app.onhostcontextchanged = handleHostContextChanged;
app.ontoolresult = (result) => {
  const payload = parsePayload(result);
  if (!payload.cocktail) {
    renderNotFound(payload.requested);
    return;
  }
  renderCocktail(payload.cocktail);
};

app.connect().then(() => {
  const ctx = app.getHostContext();
  if (ctx) {
    handleHostContextChanged(ctx);
  }
});

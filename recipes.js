// ===================================================================
// recipes.js - Recettes classiques avec quantités ajustables
// Quantités de base pour 4 personnes, recalculées dynamiquement.
// ===================================================================

const RECIPES = {
  crepe: {
    nameKey: "recipeCrepeName",
    baseServings: 4,
    ingredients: [
      { key: "ingredientFlour", amount: 250, unit: "unitG" },
      { key: "ingredientMilk", amount: 500, unit: "unitMl" },
      { key: "ingredientEggs", amount: 3, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 30, unit: "unitG" },
      { key: "ingredientButter", amount: 30, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ]
  },
  pancake: {
    nameKey: "recipePancakeName",
    baseServings: 4,
    ingredients: [
      { key: "ingredientFlour", amount: 300, unit: "unitG" },
      { key: "ingredientMilk", amount: 350, unit: "unitMl" },
      { key: "ingredientEggs", amount: 2, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 40, unit: "unitG" },
      { key: "ingredientButter", amount: 50, unit: "unitG" },
      { key: "ingredientBakingPowder", amount: 11, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ]
  },
  gaufre: {
    nameKey: "recipeGaufreName",
    baseServings: 4,
    ingredients: [
      { key: "ingredientFlour", amount: 250, unit: "unitG" },
      { key: "ingredientMilk", amount: 400, unit: "unitMl" },
      { key: "ingredientEggs", amount: 2, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 50, unit: "unitG" },
      { key: "ingredientButter", amount: 80, unit: "unitG" },
      { key: "ingredientBakingPowder", amount: 11, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ]
  }
};

function scaleAmount(amount, baseServings, targetServings) {
  const scaled = (amount / baseServings) * targetServings;
  return Math.round(scaled * 10) / 10;
}

function renderRecipe(modeKey, servings) {
  const recipe = RECIPES[modeKey];
  if (!recipe) return '';
  const title = t(recipe.nameKey);
  const rows = recipe.ingredients.map(ing => {
    const amount = scaleAmount(ing.amount, recipe.baseServings, servings);
    return `<li><span class="ingredient-name">${t(ing.key)}</span><span class="ingredient-amount">${amount} ${t(ing.unit)}</span></li>`;
  }).join('');
  return `
    <div class="recipe-card">
      <h3>${title}</h3>
      <ul class="ingredient-list">${rows}</ul>
    </div>
  `;
}

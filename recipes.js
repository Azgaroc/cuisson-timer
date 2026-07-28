// ===================================================================
// recipes.js - Recettes classiques avec quantités ajustables
// Quantités de base pour 4 personnes, recalculées dynamiquement.
// ===================================================================

const CREPE_ICON_SVG = '<svg viewBox="0 0 24 24" class="icon-crepe" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="9" width="16.5" height="7" rx="3.5" fill="#F6D9A0" stroke="#B97A3D" stroke-width="0.9"/><path d="M8 9.3 L8 15.7 M12 9.1 L12 15.9 M16 9.3 L16 15.7" stroke="#C9954F" stroke-width="0.7" opacity="0.55" stroke-linecap="round"/><path d="M4.5 7.8 Q8 3.8 11.5 6.8 T19 5.6" fill="none" stroke="#7A4A26" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.2" cy="13.5" r="2.1" fill="#D5495F"/><path d="M18.9 12.5 Q19.5 11.3 20.4 12.1" stroke="#5C8A4A" stroke-width="0.9" fill="none" stroke-linecap="round"/></svg>';

const RECIPES = {
  crepe: {
    nameKey: "recipeCrepeName",
    emoji: CREPE_ICON_SVG,
    baseServings: 4,
    baseYield: 12,
    prepMinutes: 10,
    cookMinutes: 20,
    difficultyKey: "difficultyEasy",
    ingredients: [
      { key: "ingredientFlour", amount: 250, unit: "unitG" },
      { key: "ingredientMilk", amount: 500, unit: "unitMl" },
      { key: "ingredientEggs", amount: 3, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 30, unit: "unitG" },
      { key: "ingredientButter", amount: 30, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ],
    stepsKey: "crepeSteps"
  },
  pancake: {
    nameKey: "recipePancakeName",
    emoji: "🥞",
    baseServings: 4,
    baseYield: 12,
    prepMinutes: 10,
    cookMinutes: 15,
    difficultyKey: "difficultyEasy",
    ingredients: [
      { key: "ingredientFlour", amount: 300, unit: "unitG" },
      { key: "ingredientMilk", amount: 350, unit: "unitMl" },
      { key: "ingredientEggs", amount: 2, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 40, unit: "unitG" },
      { key: "ingredientButter", amount: 50, unit: "unitG" },
      { key: "ingredientBakingPowder", amount: 11, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ],
    stepsKey: "pancakeSteps"
  },
  gaufre: {
    nameKey: "recipeGaufreName",
    emoji: "🧇",
    baseServings: 4,
    baseYield: 8,
    prepMinutes: 15,
    cookMinutes: 20,
    difficultyKey: "difficultyMedium",
    ingredients: [
      { key: "ingredientFlour", amount: 250, unit: "unitG" },
      { key: "ingredientMilk", amount: 400, unit: "unitMl" },
      { key: "ingredientEggs", amount: 2, unit: "unitPiece" },
      { key: "ingredientSugar", amount: 50, unit: "unitG" },
      { key: "ingredientButter", amount: 80, unit: "unitG" },
      { key: "ingredientBakingPowder", amount: 11, unit: "unitG" },
      { key: "ingredientSalt", amount: 1, unit: "unitPinch" }
    ],
    stepsKey: "gaufreSteps"
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
  const difficulty = t(recipe.difficultyKey);
  const yieldLabelKey = { crepe: 'modeCrepePlural', pancake: 'modePancakePlural', gaufre: 'modeGaufrePlural' }[modeKey];
  const estimatedYield = Math.round(scaleAmount(recipe.baseYield, recipe.baseServings, servings));

  const ingredientRows = recipe.ingredients.map(ing => {
    const amount = scaleAmount(ing.amount, recipe.baseServings, servings);
    return `<li><span class="ingredient-name">${t(ing.key)}</span><span class="ingredient-amount">${amount} ${t(ing.unit)}</span></li>`;
  }).join('');

  const steps = TRANSLATIONS[state.prefs.language] && TRANSLATIONS[state.prefs.language][recipe.stepsKey]
    ? TRANSLATIONS[state.prefs.language][recipe.stepsKey]
    : TRANSLATIONS.fr[recipe.stepsKey];

  const stepRows = (steps || []).map((step, i) => `
    <li>
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${step}</span>
    </li>
  `).join('');

  return `
    <article class="recipe-card recipe-card--${modeKey}">
      <div class="recipe-card-head">
        <span class="recipe-emoji">${recipe.emoji}</span>
        <div>
          <h3>${title}</h3>
          <div class="recipe-badges">
            <span class="badge">⏱️ ${t('badgePrep')} ${recipe.prepMinutes} ${t('unitMin')}</span>
            <span class="badge">🔥 ${t('badgeCook')} ${recipe.cookMinutes} ${t('unitMin')}</span>
            <span class="badge">👥 ${servings} ${t('badgeServings')}</span>
            <span class="badge badge-yield">${recipe.emoji} ≈ ${estimatedYield} ${t(yieldLabelKey)}</span>
            <span class="badge badge-difficulty">${difficulty}</span>
          </div>
        </div>
      </div>

      <div class="recipe-body">
        <div class="recipe-col">
          <h4>${t('ingredientsTitle')}</h4>
          <ul class="ingredient-list">${ingredientRows}</ul>
        </div>
        <div class="recipe-col">
          <h4>${t('stepsTitle')}</h4>
          <ol class="step-list">${stepRows}</ol>
        </div>
      </div>
    </article>
  `;
}

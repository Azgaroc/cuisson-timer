// ===================================================================
// recipes.js - Recettes classiques avec quantités ajustables
// Quantités de base pour 4 personnes, recalculées dynamiquement.
// ===================================================================

const CREPE_ICON_SVG = '<svg viewBox="0 0 24 24" class="icon-crepe" xmlns="http://www.w3.org/2000/svg"><path d="M12 21 L3.2 7.4 Q12 2.2 20.8 7.4 Z" fill="#F6D9A0" stroke="#B97A3D" stroke-width="1.1" stroke-linejoin="round"/><path d="M12 21 L7.3 6.6" fill="none" stroke="#C9954F" stroke-width="0.7" opacity="0.65" stroke-linecap="round"/><path d="M12 21 L12 3" fill="none" stroke="#C9954F" stroke-width="0.7" opacity="0.65" stroke-linecap="round"/><path d="M12 21 L16.7 6.6" fill="none" stroke="#C9954F" stroke-width="0.7" opacity="0.65" stroke-linecap="round"/><circle cx="9.3" cy="11" r="0.8" fill="#A8551C" opacity="0.75"/><circle cx="14.9" cy="11.4" r="0.65" fill="#A8551C" opacity="0.75"/><circle cx="12" cy="8.6" r="0.55" fill="#A8551C" opacity="0.7"/></svg>';

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
          <span class="recipe-difficulty recipe-difficulty--${modeKey}">${difficulty}</span>
          <div class="recipe-badges">
            <span class="badge">⏱️ ${t('badgePrep')} ${recipe.prepMinutes} ${t('unitMin')}</span>
            <span class="badge">🔥 ${t('badgeCook')} ${recipe.cookMinutes} ${t('unitMin')}</span>
            <span class="badge">👥 ${servings} ${t('badgeServings')}</span>
            <span class="badge badge-yield">${recipe.emoji} ≈ ${estimatedYield} ${t(yieldLabelKey)}</span>
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

      <button class="btn-launch-recipe" data-mode="${modeKey}">${t('recipeLaunchBtn')} →</button>
    </article>
  `;
}

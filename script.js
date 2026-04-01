const API_KEY = "rkFGlKEyzwlHQEfHkgQbl1q0BscSWIDf0vcymc7R";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loadingText = document.getElementById("loading");

searchBtn.addEventListener("click", fetchFood);

async function fetchFood() {
  const query = searchInput.value.trim();

  if (!query) return;

  // Clear previous results
  resultsDiv.innerHTML = "";
  loadingText.classList.remove("hidden");

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&pageSize=10&api_key=${API_KEY}`
    );

    const data = await response.json();

    displayResults(data.foods);

  } catch (error) {
    resultsDiv.innerHTML = "<p>Failed to fetch data</p>";
  } finally {
    loadingText.classList.add("hidden");
  }
}

function displayResults(foods) {
  if (!foods || foods.length === 0) {
    resultsDiv.innerHTML = "<p>No results found</p>";
    return;
  }

  foods.forEach(food => {
    const nutrients = food.foodNutrients;

    const calories = getNutrient(nutrients, "Energy");
    const protein = getNutrient(nutrients, "Protein");
    const carbs = getNutrient(nutrients, "Carbohydrate, by difference");
    const fats = getNutrient(nutrients, "Total lipid (fat)");

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${food.description}</h3>
      <p>Calories: ${calories}</p>
      <p>Protein: ${protein}g</p>
      <p>Carbs: ${carbs}g</p>
      <p>Fats: ${fats}g</p>
    `;

    resultsDiv.appendChild(card);
  });
}

function getNutrient(nutrients, name) {
  const nutrient = nutrients.find(n => n.nutrientName === name);
  return nutrient ? nutrient.value : "N/A";
}
const API_KEY = "rkFGlKEyzwlHQEfHkgQbl1q0BscSWIDf0vcymc7R";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loadingText = document.getElementById("loading");
const highProtein = document.getElementById("highProtein");
const lowCarb = document.getElementById("lowCarb");
const lowCal = document.getElementById("lowCal");
const sortBy = document.getElementById("sortBy");
const sortOrder = document.getElementById("sortOrder");
const themeToggle = document.getElementById("themeToggle");

let foods = [];
let filteredFoods = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

searchBtn.addEventListener("click", fetchFood);
searchInput.addEventListener("input", applyFiltersAndSort);
highProtein.addEventListener("change", applyFiltersAndSort);
lowCarb.addEventListener("change", applyFiltersAndSort);
lowCal.addEventListener("change", applyFiltersAndSort);
sortBy.addEventListener("change", applyFiltersAndSort);
sortOrder.addEventListener("change", applyFiltersAndSort);
themeToggle.addEventListener("click", toggleTheme);

async function fetchFood() {
  const query = searchInput.value.trim();

  if (!query) return;

  // Clear previous results
  resultsDiv.innerHTML = "";
  loadingText.classList.remove("hidden");

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&pageSize=50&api_key=${API_KEY}`
    );

    const data = await response.json();

    foods = data.foods || [];
    applyFiltersAndSort();

  } catch (error) {
    resultsDiv.innerHTML = "<p>Failed to fetch data</p>";
  } finally {
    loadingText.classList.add("hidden");
  }
}

function applyFiltersAndSort() {
  let tempFoods = [...foods];

  // Local search by description
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    tempFoods = tempFoods.filter(food => food.description.toLowerCase().includes(searchTerm));
  }

  // Filtering using higher-order functions
  if (highProtein.checked) {
    tempFoods = tempFoods.filter(food => {
      const protein = getNutrient(food.foodNutrients, "Protein");
      return !isNaN(protein) && protein > 20;
    });
  }

  if (lowCarb.checked) {
    tempFoods = tempFoods.filter(food => {
      const carbs = getNutrient(food.foodNutrients, "Carbohydrate, by difference");
      return !isNaN(carbs) && carbs < 20;
    });
  }

  if (lowCal.checked) {
    tempFoods = tempFoods.filter(food => {
      const calories = getNutrient(food.foodNutrients, "Energy");
      return !isNaN(calories) && calories < 300;
    });
  }

  // Sorting using higher-order functions
  const sortKey = sortBy.value;
  const order = sortOrder.value === "asc" ? 1 : -1;

  const nutrientMap = {
    calories: "Energy",
    protein: "Protein",
    carbs: "Carbohydrate, by difference",
    fats: "Total lipid (fat)"
  };

  tempFoods.sort((a, b) => {
    let aVal, bVal;
    if (sortKey === "description") {
      aVal = a.description.toLowerCase();
      bVal = b.description.toLowerCase();
    } else {
      const nutrientName = nutrientMap[sortKey];
      aVal = getNutrient(a.foodNutrients, nutrientName);
      bVal = getNutrient(b.foodNutrients, nutrientName);
      aVal = isNaN(aVal) ? 0 : aVal;
      bVal = isNaN(bVal) ? 0 : bVal;
    }
    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });

  filteredFoods = tempFoods;
  displayResults(filteredFoods);
}

function displayResults(foods) {
  resultsDiv.innerHTML = "";

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

    const isFavorited = favorites.includes(food.fdcId);

    card.innerHTML = `
      <h3>${food.description}</h3>
      <p>Calories: ${calories}</p>
      <p>Protein: ${protein}g</p>
      <p>Carbs: ${carbs}g</p>
      <p>Fats: ${fats}g</p>
      <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${food.fdcId}">
        ${isFavorited ? 'Unfavorite' : 'Favorite'}
      </button>
    `;

    card.querySelector('.favorite-btn').addEventListener('click', toggleFavorite);

    resultsDiv.appendChild(card);
  });
}

function toggleFavorite(event) {
  const id = parseInt(event.target.dataset.id);
  const index = favorites.indexOf(id);
  if (index > -1) {
    favorites.splice(index, 1);
    event.target.textContent = 'Favorite';
    event.target.classList.remove('favorited');
  } else {
    favorites.push(id);
    event.target.textContent = 'Unfavorite';
    event.target.classList.add('favorited');
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

function getNutrient(nutrients, name) {
  const nutrient = nutrients.find(n => n.nutrientName === name);
  return nutrient ? nutrient.value : "N/A";
}
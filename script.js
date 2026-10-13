const CATEGORIES = [
  "Spicy snacks", "Ice cream & frozen desserts", "Sweets & desserts",
  "Dairy products", "Fruits", "Vegetables", "Bakery products",
  "Grains & pulses", "Packaged food", "Beverages", "Frozen food",
  "Eggs, meat & fish", "Other"
];
const UNIT_OPTIONS = {
  "Spicy snacks": ["grams", "kg", "packet", "pieces", "box"],
  "Ice cream & frozen desserts": ["ml", "litres", "grams", "kg", "tub", "pieces"],
  "Sweets & desserts": ["pieces", "grams", "kg", "box", "packet"],
  "Dairy products": ["ml", "litres", "grams", "kg", "packet", "pieces"],
  "Fruits": ["pieces", "grams", "kg"],
  "Vegetables": ["pieces", "grams", "kg"],
  "Bakery products": ["pieces", "grams", "kg", "loaf", "packet", "box"],
  "Grains & pulses": ["grams", "kg", "packet"],
  "Packaged food": ["packet", "pieces", "grams", "kg", "ml", "litres", "can", "bottle", "box"],
  "Beverages": ["ml", "litres", "bottle", "can", "carton"],
  "Frozen food": ["grams", "kg", "packet", "pieces", "box"],
  "Eggs, meat & fish": ["pieces", "grams", "kg", "dozen", "packet"],
  "Other": ["pieces", "grams", "kg", "ml", "litres", "packet", "box"]
};
const KEY = "freshtrack_ai_hackathon_items_v1";
const $ = id => document.getElementById(id);
let foods = loadFoods();
let toastTimer;

// Convert older saved quantities such as "500 ml" or "2 kg" safely.
function normalizeQuantity(food) {
  if (typeof food.quantity === "number" && food.unit) return food;
  const raw = String(food.quantity ?? "").trim();
  const match = raw.match(/^([0-9]+(?:[.,][0-9]+)?)\\s*(litres?|l|ml|kilograms?|kg|grams?|g|packets?|pieces?|pcs|loaves?|tubs?|boxes?|cans?|bottles?|dozens?)?$/i);
  if (match) {
    food.quantity = Number(match[1].replace(",", "."));
    const u = (match[2] || "").toLowerCase();
    const units = {
      "litre":"litres","liter":"litres","litres":"litres","liters":"litres","l":"litres",
      "millilitre":"ml","millilitres":"ml","milliliter":"ml","milliliters":"ml","ml":"ml",
      "kilogram":"kg","kilograms":"kg","kg":"kg","gram":"grams","grams":"grams","g":"grams",
      "packet":"packet","packets":"packet","piece":"pieces","pieces":"pieces","pc":"pieces","pcs":"pieces",
      "loaf":"loaf","loaves":"loaf","tub":"tub","tubs":"tub","box":"box","boxes":"box",
      "can":"can","cans":"can","bottle":"bottle","bottles":"bottle","dozen":"dozen","dozens":"dozen"
    };
    food.unit = units[u] || defaultUnit(food.category);
  } else {
    food.quantity = Number(raw) || 1;
    food.unit = food.unit || defaultUnit(food.category);
  }
  return food;
}
function defaultUnit(category) {
  if (category === "Dairy products" || category === "Beverages") return "ml";
  if (category === "Ice cream & frozen desserts") return "ml";
  if (["Fruits","Vegetables","Eggs, meat & fish"].includes(category)) return "pieces";
  if (["Spicy snacks","Packaged food","Frozen food","Grains & pulses"].includes(category)) return "packet";
  if (category === "Bakery products") return "pieces";
  if (category === "Sweets & desserts") return "pieces";
  return "pieces";
}
foods = foods.map(normalizeQuantity);

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function loadFoods() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    return Array.isArray(data) ? data : demoFoods();
  } catch { return demoFoods(); }
}
function demoFoods() {
  const today = localToday();
  const addDays = n => { const d = new Date(today + "T00:00:00"); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  return [
    {id:"demo1",name:"Milk",category:"Dairy products",quantity:1,unit:"litres",purchaseDate:addDays(-1),expiryDate:addDays(1),location:"Refrigerator",state:"",demo:true},
    {id:"demo2",name:"Chocolate ice cream",category:"Ice cream & frozen desserts",quantity:500,unit:"ml",purchaseDate:addDays(-3),expiryDate:addDays(6),location:"Freezer",state:"",demo:true},
    {id:"demo3",name:"Spicy chips",category:"Spicy snacks",quantity:1,unit:"packet",purchaseDate:addDays(-2),expiryDate:addDays(20),location:"Pantry / shelf",state:"",demo:true},
    {id:"demo4",name:"Bread",category:"Bakery products",quantity:1,unit:"loaf",purchaseDate:addDays(-3),expiryDate:addDays(0),location:"Pantry / shelf",state:"",demo:true},
    {id:"demo5",name:"Mango sweets",category:"Sweets & desserts",quantity:6,unit:"pieces",purchaseDate:addDays(-6),expiryDate:addDays(-1),location:"Refrigerator",state:"",demo:true}
  ];
}
function save() { localStorage.setItem(KEY, JSON.stringify(foods)); }
function daysLeft(dateString) {
  if (!dateString) return null;
  const expiry = new Date(dateString + "T00:00:00");
  if (Number.isNaN(expiry.getTime())) return null;
  const today = new Date(localToday() + "T00:00:00");
  return Math.round((expiry - today) / 86400000);
}
function statusOf(food) {
  if (food.state) return food.state;
  const days = daysLeft(food.expiryDate);
  if (days === null) return "Unknown";
  if (days < 0) return "Past date";
  if (days === 0) return "Today";
  if (days <= 3) return "Soon";
  return "Fresh";
}
function statusText(food) {
  const status = statusOf(food);
  if (["Consumed","Donated","Wasted"].includes(status)) return status;
  const days = daysLeft(food.expiryDate);
  if (days < 0) return `Past recorded date by ${Math.abs(days)} day(s)`;
  if (days === 0) return "Recorded date is today";
  if (days <= 3) return `Date in ${days} day(s)`;
  return `${days} days remaining`;
}
function iconFor(category) {
  if (/Spicy/.test(category)) return "🌶️";
  if (/Ice cream|Frozen/.test(category)) return "🍦";
  if (/Sweets/.test(category)) return "🍬";
  if (/Dairy/.test(category)) return "🥛";
  if (/Fruits/.test(category)) return "🍎";
  if (/Vegetables/.test(category)) return "🥦";
  if (/Bakery/.test(category)) return "🍞";
  if (/Grains/.test(category)) return "🌾";
  if (/Beverages/.test(category)) return "🧃";
  if (/Eggs, meat/.test(category)) return "🥚";
  if (/Packaged/.test(category)) return "🥫";
  return "🍱";
}
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
}
function fillCategories() {
  $("category").innerHTML = CATEGORIES.map(c => `<option>${escapeHTML(c)}</option>`).join("");
  $("categoryFilter").innerHTML = `<option value="All">All categories</option>` + CATEGORIES.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  updateUnits();
}
function updateUnits(preferredUnit) {
  const category = $("category").value || "Other";
  const units = UNIT_OPTIONS[category] || UNIT_OPTIONS.Other;
  $("unit").innerHTML = units.map(u => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join("");
  if (preferredUnit && units.includes(preferredUnit)) $("unit").value = preferredUnit;
}
function render() {
  const search = $("search").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const status = $("statusFilter").value;
  const active = foods.filter(f => !["Consumed","Donated","Wasted"].includes(f.state));
  $("totalStat").textContent = active.length;
  $("soonStat").textContent = active.filter(f => ["Soon","Today"].includes(statusOf(f))).length;
  $("expiredStat").textContent = active.filter(f => statusOf(f) === "Past date").length;
  $("wasteStat").textContent = foods.filter(f => f.state === "Wasted").length;

  const filtered = foods.filter(f =>
    `${f.name} ${f.category} ${f.quantity} ${f.location}`.toLowerCase().includes(search) &&
    (category === "All" || f.category === category) &&
    (status === "All" || statusOf(f) === status)
  );
  $("foodList").innerHTML = filtered.map(f => {
    const st = statusOf(f);
    const pill = st === "Soon" ? "soon" : st === "Today" ? "today" : st === "Past date" ? "past" : st;
    const buttons = ["Consumed","Donated","Wasted"].includes(f.state)
      ? `<button class="mini-btn" data-action="restore" data-id="${escapeHTML(f.id)}">Restore</button>`
      : `<button class="mini-btn" data-action="Consumed" data-id="${escapeHTML(f.id)}">Consumed</button>
         <button class="mini-btn" data-action="Donated" data-id="${escapeHTML(f.id)}">Donate</button>
         <button class="mini-btn" data-action="Wasted" data-id="${escapeHTML(f.id)}">Mark waste</button>`;
    return `<article class="food-item"><div class="food-info"><div class="food-icon">${iconFor(f.category)}</div><div class="food-copy"><h3>${escapeHTML(f.name)}</h3><p>${escapeHTML(f.quantity)} ${escapeHTML(f.unit || defaultUnit(f.category))} · ${escapeHTML(f.category)}<br>📍 ${escapeHTML(f.location)} · Date: ${escapeHTML(f.expiryDate)}</p><span class="pill ${escapeHTML(pill)}">${escapeHTML(statusText(f))}</span></div></div><div class="item-buttons">${buttons}<button class="mini-btn delete" data-action="delete" data-id="${escapeHTML(f.id)}">Delete</button></div></article>`;
  }).join("");
  $("emptyState").hidden = filtered.length > 0;

  const priority = active.filter(f => ["Soon","Today","Past date"].includes(statusOf(f)))
    .sort((a,b) => daysLeft(a.expiryDate) - daysLeft(b.expiryDate)).slice(0,4);
  $("priorityList").innerHTML = priority.length ? priority.map(f => `<div class="priority-row"><div><strong>${iconFor(f.category)} ${escapeHTML(f.name)}</strong><small>${escapeHTML(f.quantity)}</small></div><span class="days">${escapeHTML(statusText(f))}</span></div>`).join("") : `<p class="muted small">Nothing needs attention right now.</p>`;
  const waste = foods.filter(f => f.state === "Wasted").length;
  const resolved = foods.filter(f => ["Wasted","Consumed","Donated"].includes(f.state)).length;
  const pct = resolved ? Math.round(waste / resolved * 100) : 0;
  $("wastePercent").textContent = pct + "%";
  $("donut").style.background = `conic-gradient(#24764f ${pct*3.6}deg, #e7eee6 0deg)`;
  $("wasteCaption").textContent = resolved ? `${waste} of ${resolved} resolved items marked wasted` : "No waste recorded yet";
}
function openDialog() { $("foodDialog").showModal(); }
$("addTop").addEventListener("click", openDialog);
$("addInline").addEventListener("click", openDialog);
$("closeDialog").addEventListener("click", () => $("foodDialog").close());
$("category").addEventListener("change", () => updateUnits());
$("foodForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("foodName").value.trim(), quantity = Number($("quantity").value);
  const unit = $("unit").value;
  const purchaseDate = $("purchaseDate").value, expiryDate = $("expiryDate").value;
  if (!name || !Number.isFinite(quantity) || quantity <= 0 || !unit || !purchaseDate || !expiryDate) return showToast("Please enter a valid quantity and complete all required fields.");
  if (expiryDate < purchaseDate) return showToast("Expiry date should not be earlier than purchase date.");
  foods.unshift({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, quantity, unit, category: $("category").value, purchaseDate, expiryDate, location: $("location").value, state:""});
  save(); render(); $("foodForm").reset(); $("purchaseDate").value = localToday(); $("foodDialog").close();
  showToast("Food item saved.");
});
$("foodList").addEventListener("click", event => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const food = foods.find(f => f.id === btn.dataset.id);
  if (!food) return;
  const action = btn.dataset.action;
  if (action === "delete") {
    if (!confirm(`Delete ${food.name}?`)) return;
    foods = foods.filter(f => f.id !== food.id);
  } else if (action === "restore") {
    food.state = "";
  } else {
    food.state = action;
  }
  save(); render(); showToast("Inventory updated.");
});
["search","categoryFilter","statusFilter"].forEach(id => $(id).addEventListener(id === "search" ? "input" : "change", render));

// Local rule-based recipe demo. This is not a real AI model integration.
$("recipeBtn").addEventListener("click", () => {
  const ingredients = $("ingredients").value.toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const diet = $("diet").value;
  if (!ingredients.length) { $("recipeResult").textContent = "Enter a few ingredients separated by commas first."; return; }
  const ideas = [];
  if (ingredients.some(x => /milk|oats|banana/.test(x))) ideas.push("Breakfast bowl or smoothie: combine suitable milk, oats and fruit.");
  if (ingredients.some(x => /bread/.test(x))) ideas.push("Toast or a sandwich: use bread with available vegetables or other fillings.");
  if (ingredients.some(x => /rice|vegetable|peas|carrot/.test(x))) ideas.push("Vegetable rice: combine cooked rice with suitable vegetables and spices.");
  if (ingredients.some(x => /potato|tomato|onion/.test(x))) ideas.push("Simple vegetable curry: use the listed vegetables with appropriate seasoning.");
  if (!ideas.length) ideas.push(`Try a simple recipe using ${ingredients.join(", ")}. Search a trusted recipe source for exact proportions and cooking steps.`);
  const prefix = diet === "Vegan" ? "Vegan preference selected. Check every ingredient for animal-derived products.\n\n" :
    diet === "Vegetarian" ? "Vegetarian preference selected. Check ingredients and sauces.\n\n" :
    diet === "Egg-friendly" ? "Egg-friendly preference selected.\n\n" : "";
  $("recipeResult").textContent = prefix + ideas.slice(0,3).join("\n\n") + "\n\nReminder: use correct storage guidance and never rely on this tool alone to judge food safety.";
});

$("exportBtn").addEventListener("click", () => {
  if (!foods.length) return showToast("No food items to export.");
  const cols = ["name","category","quantity","unit","purchaseDate","expiryDate","location","state"];
  const quote = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const csv = [cols.join(","), ...foods.map(f => cols.map(c => quote(f[c])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
  const a = document.createElement("a"); a.href=url; a.download="freshtrack-inventory.csv"; a.click(); URL.revokeObjectURL(url);
  showToast("CSV downloaded.");
});
fillCategories();
$("purchaseDate").value = localToday();
save();
render();

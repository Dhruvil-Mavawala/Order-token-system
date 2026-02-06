const db = firebase.database();

const ITEMS = [
  { id: "vadapav", name: "Vadapav", price: 20, img: "https://images.pexels.com/photos/17433337/pexels-photo-17433337.jpeg?cs=srgb&dl=pexels-aditya-mara-425995080-17433337.jpg&fm=jpg" },
  { id: "butter_vadapav", name: "Butter Vadapav", price: 25, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-tvrKhJ3hh_G73GRSHenNhMekNYGvA3zMdg&s" },
  { id: "Cheese_vadapav", name: "Cheese Vadapav", price: 30, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpvlWYkzHzOpxzDypQt1PDT1ZodfjaulzHYw&s" },
  { id: "Bread_Pakoda", name: "Bread Pakoda", price: 20, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRHv8eczDqXOZ7Ta0cKlUHlirxN8Wdo8OOsA&s" },
  { id: "chinese_roll", name: "Chinese Roll", price: 20, img: "https://www.thespruceeats.com/thmb/Yepl0s9b4UVhGu-7RPmVSVfuZ7c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/SES-chicken-egg-roll-recipe-694514-4f9643906aa44fa0b8a8f3ed3b85e860.jpg" },
  { id: "limbu_gotta_vada", name: "Limbu Gotta vada", price: 30, img: "https://img.gujaratijagran.com/2024/01/Gujarati-bataka-vada.jpg" },
  { id: "3choco_bowl", name: "3 Chocolate Bowl", price: 80, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVkJ7svLyK73wGc2iWkeKpkS1z6JK3lIy-kg&s" },
  { id: "Strawberry_choco", name: "Strawberry chocolate bowl", price: 90, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_F6_EYmkzYmGHXQr_JGrpYWLDCZZiH4dd-g&s" },
  { id: "oreo_bowl", name: "Oreo Chocolate Bowl", price: 100, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTP17H_CcsDu5CKeWn7NjrZPrTSwFMBmjSJA&s" },
  { id: "kitkat_choco_bowl", name: "Kitkat Chocolate Bowl", price: 110, img: "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=400&auto=format&fit=crop" },
  { id: "biscoff_bowl", name: "Biscoff Chocolate Bowl", price: 125, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMbjfKSjTAWBLftRwg_-1b4xD2L2B0_U95nw&s" },
  { id: "kunafa_bowl", name: "Kunafa Chocolate Bowl", price: 130, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrWN_DcXT5AMKo8rpBucMNknnk7dWgLUVn5Q&s" }
];

let cart = {};
let total = 0;
let stockMap = {};

const menuDiv = document.getElementById("menu");

/* STOCK REALTIME */
db.ref("itemsStock").on("value", snap => {
  stockMap = snap.val() || {};
  renderMenu();
});

function renderMenu() {
  menuDiv.innerHTML = "";
  ITEMS.forEach(it => {
    const disabled = stockMap[it.id] === false;
    const qty = cart[it.id] ? cart[it.id].qty : 0;
    
    menuDiv.innerHTML += `
      <div class="menu-item ${disabled ? 'disabled' : ''}">
        ${disabled ? '<div class="out-of-stock-label">SOLD OUT</div>' : ''}
        <img src="${it.img}">
        <div class="item-details">
            <span class="item-name">${it.name}</span>
            <span class="price">₹${it.price}</span>
            <div class="controls">
                <button class="add-btn" onclick="removeItem('${it.id}')">−</button>
                <span class="qty-label" id="qty-${it.id}">${qty}</span>
                <button class="add-btn" onclick="addItem('${it.id}')">+</button>
            </div>
        </div>
      </div>
    `;
  });
}

function addItem(id) {
  const item = ITEMS.find(i => i.id === id);
  if (!cart[id]) cart[id] = { ...item, qty: 0 };
  cart[id].qty++;
  updateCalculations();
}

function removeItem(id) {
  if (!cart[id]) return;
  cart[id].qty--;
  if (cart[id].qty <= 0) delete cart[id];
  updateCalculations();
}

function updateCalculations() {
  total = 0;
  let count = 0;
  
  // Update internal total and quantity
  Object.values(cart).forEach(item => {
    total += item.price * item.qty;
    count += item.qty;
  });

  // UI Updates
  document.getElementById("total").innerText = total;
  document.getElementById("cartCount").innerText = `${count} ITEMS`;
  
  // Update numbers on cards without full re-render for speed
  ITEMS.forEach(it => {
      const el = document.getElementById(`qty-${it.id}`);
      if(el) el.innerText = cart[it.id] ? cart[it.id].qty : 0;
  });
}

function openNamePopup() {
  if (total === 0) return alert("Please add items to your cart");
  document.getElementById("nameModal").style.display = "flex";
}

function closeNamePopup() {
  document.getElementById("nameModal").style.display = "none";
}

function confirmOrder() {
  const name = document.getElementById("customerName").value.trim();
  if (!name) return alert("Please enter your name");

  db.ref("token").transaction((currentValue) => {
      return (currentValue || 0) + 1;
  }, (error, committed, snapshot) => {
      if (committed) {
          const token = snapshot.val();
          
          db.ref("orders").push({
            customerName: name,
            token,
            items: cart,
            total,
            paymentStatus: "UNPAID",
            orderStatus: "Pending",
            time: new Date().toISOString()
          }).then(() => {
              showSuccessScreen(token, name);
          });
      }
  });
}

function showSuccessScreen(token, name) {
    document.body.innerHTML = `
      <div style="min-height:100vh; background:#0f172a; color:#f8fafc; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:30px;">
        <div style="background:rgba(251,191,36,0.1); padding:20px; border-radius:50%; margin-bottom:20px;">
            <span style="font-size:40px;">✅</span>
        </div>
        <h2 style="color:#94a3b8; font-weight:400; margin:0;">YOUR TOKEN NUMBER</h2>
        <div style="font-size:120px; font-weight:900; color:#fbbf24; line-height:1;">${token}</div>
        <p style="font-size:1.2rem; margin-top:10px;">Thank you, <strong>${name}</strong>!</p>
        
        <div style="background:#1e293b; border:1px solid #334155; padding:25px; border-radius:20px; margin:30px 0; width:100%; max-width:350px;">
          <p style="color:#fbbf24; font-weight:bold; margin-top:0;">💳 PAY AT COUNTER FIRST</p>
          <p style="color:#94a3b8; font-size:0.9rem; margin:0;">Please tell this tokenn number at the counter and pay to start your order preparation.</p>
        </div>

        <button onclick="location.reload()" style="background:#fbbf24; color:#000; border:none; padding:16px 40px; font-weight:bold; border-radius:15px; font-size:1rem; cursor:pointer;">
          Order Something Else
        </button>
      </div>
    `;
}
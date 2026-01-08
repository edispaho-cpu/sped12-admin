import { supabase } from "./supabase.js";

/* ===============================
   ELEMENTET DOM
================================ */
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const txList = document.getElementById("txList");

/* ===============================
   SESSION CHECK
================================ */
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    loadTransactions();
  } else {
    loginBox.style.display = "block";
    adminPanel.style.display = "none";
  }
}
checkSession();

/* ===============================
   AUTH
================================ */
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById("loginMsg").innerText = error.message;
  } else {
    location.reload();
  }
};

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

/* ===============================
   TRANSAKSION REAL (LOGJIKA)
================================ */
async function addRealTransaction({
  type,        // HYRJE | DALJE
  source,      // CASH | BANKË
  currency,    // ALL | EUR | USD
  amount,
  rate,
  description
}) {
  const amount_all = amount * rate;

  const table =
    source === "CASH" ? "balances_cash" : "balances_bank";

  // 1️⃣ Lexo balancën aktuale
  const { data: bal, error: balErr } = await supabase
    .from(table)
    .select("amount")
    .eq("currency", currency)
    .single();

  if (balErr) {
    alert("Gabim në lexim balance");
    return;
  }

  const current = bal.amount;

  // 2️⃣ Kontroll DALJE
  if (type === "DALJE" && current < amount) {
    alert("Balancë e pamjaftueshme");
    return;
  }

  // 3️⃣ Ruaj transaksionin
  const { error: txErr } = await supabase
    .from("transactions")
    .insert({
      type,
      source,
      currency,
      amount,
      rate,
      amount_all,
      description
    });

  if (txErr) {
    alert("Gabim në regjistrim transaksioni");
    return;
  }

  // 4️⃣ Përditëso balancën
  const newAmount =
    type === "HYRJE"
      ? current + amount
      : current - amount;

  const { error: updErr } = await supabase
    .from(table)
    .update({ amount: newAmount })
    .eq("currency", currency);

  if (updErr) {
    alert("Gabim në përditësim balance");
    return;
  }

  alert("Transaksioni u regjistrua me sukses");
  loadTransactions();
}

/* ===============================
   THIRRJE NGA UI
================================ */
window.saveTransaction = async () => {
  await addRealTransaction({
    type: document.getElementById("txType").value,
    source: document.getElementById("txSource").value,
    currency: document.getElementById("currency").value.trim(),
    amount: parseFloat(document.getElementById("amount").value),
    rate: parseFloat(document.getElementById("rate").value),
    description: document.getElementById("desc").value
  });
};

/* ===============================
   LISTIM TRANSAKSIONESH
================================ */
async function loadTransactions() {
  txList.innerHTML = "";

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("id", { ascending: false });

  if (error) return;

  data.forEach(t => {
    const li = document.createElement("li");
    li.innerText = `${t.date} | ${t.type} | ${t.source} | ${t.amount} ${t.currency}`;
    txList.appendChild(li);
  });
}

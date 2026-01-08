import { supabase } from "./supabase.js";

/* ===============================
   TRANSAKSIONE
================================ */

// Shton transaksion (HYRJE / DALJE)
async function addTransaction(tx) {
  const { error } = await supabase
    .from("transactions")
    .insert(tx);

  if (error) {
    console.error("Gabim në addTransaction:", error);
    alert("Gabim në ruajtjen e transaksionit");
  }
}

// Merr të gjitha transaksionet
async function getAllTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Gabim në getAllTransactions:", error);
    return [];
  }

  return data || [];
}

/* ===============================
   BALANCA
================================ */

// Merr balancën e një monedhe
async function getBalance(currency, source = "CASH") {
  const table =
    source === "BANKË" ? "balances_bank" : "balances_cash";

  const { data, error } = await supabase
    .from(table)
    .select("amount")
    .eq("currency", currency)
    .single();

  if (error) return 0;
  return data.amount || 0;
}

// Vendos balancë
async function setBalance(currency, amount, source = "CASH") {
  const table =
    source === "BANKË" ? "balances_bank" : "balances_cash";

  await supabase
    .from(table)
    .upsert({ currency, amount });
}

/* ===============================
   KATEGORI (AUTOCOMPLETE)
================================ */

async function addCategory(name) {
  if (!name) return;

  await supabase
    .from("categories")
    .upsert({ name });
}

async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("name");

  if (error) return [];
  return data.map(c => c.name);
}
window.saveTransaction = async function () {
  const type = document.getElementById("txType").value;
  const source = document.getElementById("txSource").value;
  const currency = document.getElementById("currency").value;
  const amount = Number(document.getElementById("amount").value);
  const rate = Number(document.getElementById("rate").value || 1);
  const description = document.getElementById("desc").value;

  if (!currency || !amount) {
    alert("Plotëso monedhën dhe shumën");
    return;
  }

  const tx = {
    type,
    source,
    currency,
    amount,
    rate,
    amount_all: amount * rate,
    description,
    date: new Date().toISOString().slice(0, 10)
  };

  await addTransaction(tx);

  alert("Transaksioni u ruajt");
};
/* ===============================
   INIT
================================ */

async function init() {
  console.log("Aplikacioni u lidh me Supabase");
}

init();

/* ===============================
   EKSPORT GLOBAL (SI MË PARË)
================================ */

window.addTransaction = addTransaction;
window.getAllTransactions = getAllTransactions;
window.getBalance = getBalance;
window.setBalance = setBalance;
window.addCategory = addCategory;
window.getCategories = getCategories;
window.saveTransaction = saveTransaction;


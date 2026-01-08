import { supabase } from "./supabase.js";

/* ===============================
   SHFAQJE TRANSAKSIONESH
================================ */

async function loadTransactions() {
  const list = document.getElementById("txList");
  if (!list) return;

  list.innerHTML = "";

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Gabim në loadTransactions", error);
    return;
  }

  data.forEach(t => {
    const li = document.createElement("li");
    li.innerText =
      `${t.type} | ${t.source} | ${t.amount} ${t.currency} | ${t.description || ""}`;
    list.appendChild(li);
  });
}

/* ===============================
   RUAJ TRANSAKSION
================================ */

async function saveTransaction() {
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
    description
  };

  const { error } = await supabase
    .from("transactions")
    .insert(tx);

  if (error) {
    console.error(error);
    alert("Gabim në ruajtje");
    return;
  }

  alert("Transaksioni u ruajt");

  // 🔴 RINGARKO LISTËN
  loadTransactions();
}

/* ===============================
   INIT
================================ */

window.saveTransaction = saveTransaction;

window.onload = () => {
  loadTransactions();
};

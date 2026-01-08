import { supabase } from "./supabase.js";

window.saveTransaction = async () => {
  const kind = kindEl.value;           // BLERJE | SHITJE | HYRJE
  const source = sourceEl.value;       // CASH | BANKË
  const currency = currencyEl.value;   // EUR, USD, ALL...
  const amount = Number(amountEl.value);
  const rate = Number(rateEl.value || 1);
  const description = descEl.value || "";

  if (!amount || amount <= 0) {
    alert("Shuma e pavlefshme");
    return;
  }

  const table = source === "CASH" ? "balances_cash" : "balances_bank";

  // Merr balancat aktuale
  const { data: balCurrency } = await supabase
    .from(table)
    .select("amount")
    .eq("currency", currency)
    .single();

  const { data: balALL } = await supabase
    .from(table)
    .select("amount")
    .eq("currency", "ALL")
    .single();

  let currAmount = balCurrency.amount;
  let allAmount = balALL.amount;

  // 🔹 HYRJE CASH (ADMIN)
  if (kind === "HYRJE") {
    currAmount += amount;
  }

  // 🔹 BLERJE (klient)
  if (kind === "BLERJE") {
    const costALL = amount * rate;

    if (allAmount < costALL) {
      alert("Nuk ka mjaft ALL në arkë");
      return;
    }

    currAmount += amount;      // merr EUR
    allAmount -= costALL;      // jep ALL
  }

  // 🔹 SHITJE (klient)
  if (kind === "SHITJE") {
    const gainALL = amount * rate;

    if (currAmount < amount) {
      alert("Nuk ka mjaft " + currency + " në arkë");
      return;
    }

    currAmount -= amount;      // jep EUR
    allAmount += gainALL;      // merr ALL
  }

  // Ruaj transaksionin
  await supabase.from("transactions").insert({
    kind,
    source,
    currency,
    amount,
    rate,
    description
  });

  // Përditëso balancat
  await supabase.from(table)
    .update({ amount: currAmount })
    .eq("currency", currency);

  await supabase.from(table)
    .update({ amount: allAmount })
    .eq("currency", "ALL");

  loadAll();
};

async function loadBalances(table, ul) {
  ul.innerHTML = "";
  const { data } = await supabase.from(table).select("*");
  data.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.currency}: ${r.amount}`;
    ul.appendChild(li);
  });
}

async function loadTransactions() {
  txList.innerHTML = "";
  const { data } = await supabase.from("transactions")
    .select("*")
    .order("id", { ascending: false });
  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.kind} | ${t.source} | ${t.amount} ${t.currency}`;
    txList.appendChild(li);
  });
}

function loadAll() {
  loadBalances("balances_cash", cashBalances);
  loadBalances("balances_bank", bankBalances);
  loadTransactions();
}

const kindEl = document.getElementById("kind");
const sourceEl = document.getElementById("source");
const currencyEl = document.getElementById("currency");
const amountEl = document.getElementById("amount");
const rateEl = document.getElementById("rate");
const descEl = document.getElementById("desc");

const cashBalances = document.getElementById("cashBalances");
const bankBalances = document.getElementById("bankBalances");
const txList = document.getElementById("txList");

loadAll();

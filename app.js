import { supabase } from "./supabase.js";

window.saveTransaction = async () => {
  const kind = kindEl.value;
  const source = sourceEl.value;
  const currency = currencyEl.value;
  const amount = Number(amountEl.value);
  const rate = Number(rateEl.value || 1);
  const description = descEl.value || "";

  if (!amount || amount <= 0) {
    alert("Shuma e pavlefshme");
    return;
  }

  const table = source === "CASH" ? "balances_cash" : "balances_bank";

  const { data: bal } = await supabase
    .from(table)
    .select("amount")
    .eq("currency", currency)
    .single();

  let newAmount = bal.amount;

  if (kind === "HYRJE") newAmount += amount;
  if (kind === "BLERJE") newAmount += amount;      // merr valutë
  if (kind === "SHITJE") newAmount -= amount;      // jep valutë

  if (newAmount < 0) {
    alert("Balancë e pamjaftueshme");
    return;
  }

  await supabase.from("transactions").insert({
    kind, source, currency, amount, rate, description
  });

  await supabase.from(table)
    .update({ amount: newAmount })
    .eq("currency", currency);

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

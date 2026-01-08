import { supabase } from "./supabase.js";

/* =========================
   BALANCA
========================= */

async function getBalance(currency, source) {
  const { data } = await supabase
    .from("balances")
    .select("amount")
    .eq("currency", currency)
    .eq("source", source)
    .single();

  return data ? Number(data.amount) : 0;
}

async function setBalance(currency, source, amount) {
  await supabase
    .from("balances")
    .upsert({ currency, source, amount });
}

async function loadBalances() {
  const box = document.getElementById("balancesBox");
  if (!box) return;

  box.innerHTML = "<h3>Bilanci</h3>";

  const { data } = await supabase
    .from("balances")
    .select("*")
    .order("source")
    .order("currency");

  data.forEach(b => {
    const div = document.createElement("div");
    div.innerText = `${b.source} | ${b.currency}: ${b.amount}`;
    box.appendChild(div);
  });
}

/* =========================
   TRANSAKSIONE KLIENTI
========================= */

async function saveClientTransaction() {
  const kind = document.getElementById("kind").value; // BLERJE / SHITJE
  const source = document.getElementById("source").value; // CASH / BANKË
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;
  const amountFrom = Number(document.getElementById("amountFrom").value);
  const rate = Number(document.getElementById("rate").value);
  const description = document.getElementById("desc").value;

  if (!fromCurrency || !toCurrency || !amountFrom || !rate) {
    alert("Plotëso të gjitha fushat");
    return;
  }

  const amountTo = amountFrom * rate;

  // Bilancet aktuale
  const balFrom = await getBalance(fromCurrency, source);
  const balTo = await getBalance(toCurrency, source);

  if (kind === "SHITJE" && balFrom < amountFrom) {
    alert("Bilanc i pamjaftueshëm");
    return;
  }

  // Ruaj transaksionin
  const { error } = await supabase.from("transactions").insert({
    kind,
    source,
    from_currency: fromCurrency,
    to_currency: toCurrency,
    amount_from: amountFrom,
    amount_to: amountTo,
    rate,
    description
  });

  if (error) {
    alert("Gabim në ruajtje");
    return;
  }

  // Përditëso bilancet
  if (kind === "BLERJE") {
    await setBalance(fromCurrency, source, balFrom + amountFrom);
    await setBalance(toCurrency, source, balTo - amountTo);
  } else {
    await setBalance(fromCurrency, source, balFrom - amountFrom);
    await setBalance(toCurrency, source, balTo + amountTo);
  }

  alert("Transaksioni u regjistrua");

  document.getElementById("amountFrom").value = "";
  document.getElementById("desc").value = "";

  loadBalances();
  loadTransactions();
}

/* =========================
   SHFAQ TRANSAKSIONE
========================= */

async function loadTransactions() {
  const list = document.getElementById("txList");
  list.innerHTML = "";

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("id", { ascending: false });

  data.forEach(t => {
    const li = document.createElement("li");
    li.innerText =
      `${t.kind} | ${t.source} | ${t.amount_from} ${t.from_currency} → ${t.amount_to} ${t.to_currency} @ ${t.rate}`;
    list.appendChild(li);
  });
}

/* =========================
   INIT
========================= */

window.saveClientTransaction = saveClientTransaction;

window.onload = () => {
  loadBalances();
  loadTransactions();
};

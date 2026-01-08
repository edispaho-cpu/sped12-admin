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
  const kind = document.getElementById("kind").value;           // BLERJE | SHITJE
  const source = document.getElementById("source").value;       // CASH | BANKË
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;
  const amount = Number(document.getElementById("amount").value);
  const rate = Number(document.getElementById("rate").value || 1);
  const description = document.getElementById("description").value || "";

  if (!amount || amount <= 0) {
    alert("Shuma nuk është e vlefshme");
    return;
  }

  const amountFrom = amount;
  const amountTo = amount * rate;

  const balanceTable = source === "CASH" ? "balances_cash" : "balances_bank";

  // 🔹 Merr balancat aktuale
  const { data: fromBal } = await supabase
    .from(balanceTable)
    .select("amount")
    .eq("currency", fromCurrency)
    .single();

  const { data: toBal } = await supabase
    .from(balanceTable)
    .select("amount")
    .eq("currency", toCurrency)
    .single();

  const fromAmount = fromBal?.amount ?? 0;
  const toAmount = toBal?.amount ?? 0;

  // 🔴 KONTROLL PROFESIONAL BILANCI
  if (kind === "BLERJE" && toAmount < amountTo) {
    alert("Nuk ka mjaft " + toCurrency + " në arkë");
    return;
  }

  if (kind === "SHITJE" && fromAmount < amountFrom) {
    alert("Nuk ka mjaft " + fromCurrency + " në arkë");
    return;
  }

  // 🔹 Ruaj transaksionin
  const { error: txErr } = await supabase.from("transactions").insert({
    kind,
    source,
    from_currency: fromCurrency,
    to_currency: toCurrency,
    amount_from: amountFrom,
    amount_to: amountTo,
    rate,
    description
  });

  if (txErr) {
    alert("Gabim në ruajtjen e transaksionit");
    console.error(txErr);
    return;
  }

  // 🔹 Përditëso balancat
  if (kind === "BLERJE") {
    // + valuta, - ALL
    await supabase.from(balanceTable)
      .update({ amount: fromAmount + amountFrom })
      .eq("currency", fromCurrency);

    await supabase.from(balanceTable)
      .update({ amount: toAmount - amountTo })
      .eq("currency", toCurrency);
  }

  if (kind === "SHITJE") {
    // - valuta, + ALL
    await supabase.from(balanceTable)
      .update({ amount: fromAmount - amountFrom })
      .eq("currency", fromCurrency);

    await supabase.from(balanceTable)
      .update({ amount: toAmount + amountTo })
      .eq("currency", toCurrency);
  }

  alert("Transaksioni u regjistrua me sukses");

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

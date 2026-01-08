import { supabase } from "./supabase.js";

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const txList = document.getElementById("txList");

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginBox.style.display = "none";
    adminPanel.style.display = "block";
    loadTransactions();
  }
}
checkSession();

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) document.getElementById("loginMsg").innerText = error.message;
  else location.reload();
};

window.logout = async () => {
  await supabase.auth.signOut();
  location.reload();
};

window.addTransaction = async () => {
  const amount = document.getElementById("amount").value;
  const currency = document.getElementById("currency").value;

  await supabase.from("transactions").insert({ amount, currency });
  loadTransactions();
};

async function loadTransactions() {
  txList.innerHTML = "";
  const { data } = await supabase.from("transactions").select("*").order("id", { ascending: false });
  data?.forEach(t => {
    const li = document.createElement("li");
    li.innerText = `${t.amount} ${t.currency}`;
    txList.appendChild(li);
  });
}
async function addRealTransaction({
  type,        // 'HYRJE' | 'DALJE'
  source,      // 'CASH' | 'BANKË'
  currency,    // 'ALL', 'EUR', 'USD'
  amount,
  rate,
  description
}) {
  const amount_all = amount * rate;

  const table = source === 'CASH'
    ? 'balances_cash'
    : 'balances_bank';

  // Merr balancën aktuale
  const { data: bal, error: balErr } = await supabase
    .from(table)
    .select('amount')
    .eq('currency', currency)
    .single();

  if (balErr) {
    alert('Gabim në lexim balance');
    return;
  }

  const current = bal.amount;

  // Kontroll DALJE
  if (type === 'DALJE' && current < amount) {
    alert('Balancë e pamjaftueshme');
    return;
  }

  // Ruaj transaksionin
  const { error: txErr } = await supabase.from('transactions').insert({
    type,
    source,
    currency,
    amount,
    rate,
    amount_all,
    description
  });

  if (txErr) {
    alert('Gabim në regjistrim transaksioni');
    return;
  }

  // Përditëso balancën
  const newAmount =
    type === 'HYRJE'
      ? current + amount
      : current - amount;

  const { error: updErr } = await supabase
    .from(table)
    .update({ amount: newAmount })
    .eq('currency', currency);

  if (updErr) {
    alert('Gabim në përditësim balance');
    return;
  }

  alert('Transaksioni u regjistrua me sukses');
}
window.addRealTransaction = addRealTransaction;

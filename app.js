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
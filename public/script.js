// === CONFIG ===
const DISCORD_LOGIN_URL = "https://discord.com/oauth2/authorize?client_id=1014461610087174164&redirect_uri=https%3A%2F%2Fbotlist-yspk.vercel.app%2Fcallback.html&response_type=token&scope=identify";
const BOT_TOKEN = "MTAxNDQ2MTYxMDA4NzE3NDE2NA.GEbMkF._DlmBWYaDHKLYn5VoZzSOxPHOoeLl2Odv7hLck";
const WEBHOOK_URL = "COLOQUE_AQUI_SUA_WEBHOOK_DO_DISCORD"; // webhook para notificações

const loginBtn = document.getElementById("loginBtn");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userMenu = document.getElementById("userMenu");

loginBtn.href = DISCORD_LOGIN_URL;
let token = localStorage.getItem("discord_token");
let discordUser = null; // usuário logado global

// === LOGIN DISCORD ===
function setUserLogged(user) {
  loginBtn.style.display = "none";
  userName.textContent = user.username;
  userAvatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  userAvatar.style.display = "block";
  discordUser = user;
  renderBots(); // renderiza bots após login
}

if (token) {
  fetch("https://discord.com/api/users/@me", {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(user => setUserLogged(user))
    .catch(() => {
      localStorage.removeItem("discord_token");
      loginBtn.style.display = "inline-block";
      token = null;
    });
}

[userName, userAvatar].forEach(el => {
  el.addEventListener("click", () => {
    if (!token) return;
    userMenu.style.display = userMenu.style.display === "block" ? "none" : "block";
  });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("discord_token");
  window.location.reload();
});

// === MODAL ===
const modal = document.getElementById("botModal");
const openModal = document.getElementById("addBotBtn");
const closeModal = document.getElementById("closeModal");

openModal.addEventListener("click", () => {
  if (!token) {
    alert("⚠️ Você precisa estar logado para adicionar um bot!");
    return;
  }
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// === FETCH BOT DATA DISCORD ===
async function fetchBotData(botId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${botId}`, {
      headers: { "Authorization": `Bot ${BOT_TOKEN}` }
    });
    if (!res.ok) throw new Error("Bot não encontrado");
    const data = await res.json();
    return {
      name: data.username,
      avatar: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png"
    };
  } catch {
    return { name: `Bot ${botId}`, avatar: "https://cdn.discordapp.com/embed/avatars/0.png" };
  }
}

// === SUBMIT BOT ===
document.getElementById("botForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!token) return alert("⚠️ Faça login primeiro!");

  const botId = document.getElementById("botId").value;
  const botPrefix = document.getElementById("botPrefix").value;
  const botDesc = document.getElementById("botDesc").value;

  const botData = await fetchBotData(botId);
  const inviteLink = `https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot&permissions=0`;

  const bot = {
    id: botId,
    prefix: botPrefix,
    desc: botDesc,
    avatar: botData.avatar,
    name: botData.name,
    status: "Pendente",
    date: new Date().toLocaleDateString("pt-BR"),
    invite: inviteLink
  };

  // envia para API associando ao usuário
  await fetch("/api/add-bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bot, userId: discordUser.id })
  });

  // envia webhook para Discord
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "📩 Novo Bot Enviado",
        description: `**${bot.name}** foi enviado para análise por ${discordUser.username}.`,
        fields: [
          { name: "ID", value: bot.id },
          { name: "Prefixo", value: bot.prefix },
          { name: "Descrição", value: bot.desc },
          { name: "Link de Adição", value: bot.invite }
        ],
        color: 0xffcc00
      }]
    })
  });

  renderBots();
  modal.style.display = "none";
  document.getElementById("botForm").reset();
});

// === RENDER BOTS DO USUÁRIO ===
async function renderBots() {
  if (!token || !discordUser) return;

  const res = await fetch(`/api/get-bots?userId=${discordUser.id}`);
  const bots = await res.json();

  const container = document.getElementById("botlist");
  container.innerHTML = "";

  bots.forEach(bot => {
    const card = document.createElement("div");
    card.className = "bot-card";
    card.innerHTML = `
      <img src="${bot.avatar}" class="bot-avatar">
      <div class="bot-info">
        <h3>${bot.name}</h3>
        <p>Status: ${bot.status}</p>
        <p>Enviado em: ${bot.date}</p>
        <div class="dropdown-bot" style="display:none; margin-top:10px;">
          <p><b>Prefixo:</b> ${bot.prefix}</p>
          <p><b>Descrição:</b> ${bot.desc}</p>
          <a href="${bot.invite}" target="_blank">[Adicionar Bot]</a>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      const dd = card.querySelector(".dropdown-bot");
      dd.style.display = dd.style.display === "block" ? "none" : "block";
    });
    container.appendChild(card);
  });
}

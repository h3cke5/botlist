// === CONFIGURAÇÕES ===
const DISCORD_LOGIN_URL = "https://discord.com/oauth2/authorize?client_id=1012093376604143637&redirect_uri=https%3A%2F%2Fhecka-botlist.vercel.app%2Fcallback.html&response_type=token&scope=identify";
const loginBtn = document.getElementById("loginBtn");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");
const userMenu = document.getElementById("userMenu");
const logoutBtn = document.getElementById("logoutBtn");
const botForm = document.getElementById("botForm");
const submitBtn = botForm.querySelector("button[type=submit]");
const botListContainer = document.getElementById("botlist");
const modal = document.getElementById("botModal");
const openModal = document.getElementById("addBotBtn");
const closeModal = document.getElementById("closeModal");

loginBtn.href = DISCORD_LOGIN_URL;

let token = localStorage.getItem("discord_token");
let discordUser = null;

// === LOGIN DISCORD ===
function setUserLogged(user) {
  loginBtn.style.display = "none";
  userName.textContent = user.username;
  userAvatar.src = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : "https://cdn.discordapp.com/embed/avatars/0.png";
  userAvatar.style.display = "block";
  discordUser = user;
  renderBots();
}

async function fetchDiscordUser() {
  if (!token) return;
  try {
    const res = await fetch("https://discord.com/api/users/@me", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Falha ao buscar usuário");
    const user = await res.json();
    setUserLogged(user);
  } catch {
    localStorage.removeItem("discord_token");
    token = null;
    loginBtn.style.display = "inline-block";
  }
}

fetchDiscordUser();

// === MENU DO USUÁRIO ===
[userName, userAvatar].forEach(el => {
  el.addEventListener("click", () => {
    if (!discordUser) return;
    userMenu.style.display = userMenu.style.display === "block" ? "none" : "block";
  });
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("discord_token");
  window.location.reload();
});

// === MODAL ===
openModal.addEventListener("click", () => {
  if (!discordUser) return alert("⚠️ Você precisa estar logado para adicionar um bot!");
  modal.style.display = "flex";
});
closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// === FETCH BOT DATA BACKEND ===
async function fetchBotData(botId) {
  try {
    const res = await fetch(`/api/fetch-bot?id=${botId}`);
    if (!res.ok) throw new Error("Bot não encontrado");
    return await res.json();
  } catch {
    return { name: `Bot ${botId}`, avatar: "https://cdn.discordapp.com/embed/avatars/0.png" };
  }
}

// === SUBMIT BOT ===
botForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (!discordUser) return alert("⚠️ Faça login primeiro!");

  const botId = document.getElementById("botId").value.trim();
  const botPrefix = document.getElementById("botPrefix").value.trim();
  const botDesc = document.getElementById("botDesc").value.trim();

  if (!botId || !botPrefix || !botDesc) return alert("⚠️ Preencha todos os campos!");

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

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
    invite: inviteLink,
    userId: discordUser.id
  };

  try {
    // Salva bot no backend
    const addRes = await fetch("/api/add-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bot)
    });
    if (!addRes.ok) {
      const text = await addRes.text();
      throw new Error(`Erro ao salvar bot: ${text}`);
    }

    // Envia webhook
    const webhookRes = await fetch("/api/send-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embed: {
          title: "📩 Novo Bot Enviado",
          description: `**${bot.name}** foi enviado para análise por ${discordUser.username} (${discordUser.id})`,
          thumbnail: { url: userAvatar.src },
          fields: [
            { name: "ID", value: bot.id },
            { name: "Prefixo", value: bot.prefix },
            { name: "Descrição", value: bot.desc },
            { name: "Link de Adição", value: bot.invite }
          ],
          color: 0xffcc00
        }
      })
    });
    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      throw new Error(`Erro ao enviar webhook: ${text}`);
    }

    renderBots();
    modal.style.display = "none";
    botForm.reset();
    alert("✅ Bot enviado com sucesso!");
  } catch (err) {
    console.error("Erro ao enviar bot:", err);
    alert(`⚠️ Ocorreu um erro: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Salvar";
  }
});

// === RENDER BOTS DO USUÁRIO ===
async function renderBots() {
  if (!discordUser) return;
  botListContainer.innerHTML = "<p>Carregando bots...</p>";

  try {
    const res = await fetch(`/api/get-bots?userId=${discordUser.id}`);
    if (!res.ok) throw new Error("Falha ao buscar bots");

    const bots = await res.json();
    botListContainer.innerHTML = "";

    if (!bots || bots.length === 0) {
      botListContainer.innerHTML = "<p>Nenhum bot enviado ainda.</p>";
      return;
    }

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
      botListContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao renderizar bots:", err);
    botListContainer.innerHTML = "<p>Erro ao carregar bots.</p>";
  }
}

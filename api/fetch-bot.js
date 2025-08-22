export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  const botId = req.query.id;
  if (!botId) return res.status(400).json({ error: "ID do bot não fornecido" });

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${botId}`);
    if (!response.ok) throw new Error("Bot não encontrado");

    const data = await response.json();

    return res.status(200).json({
      id: data.id,
      name: data.username,
      avatar: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : "https://cdn.discordapp.com/embed/avatars/0.png"
    });
  } catch {
    return res.status(404).json({
      id: botId,
      name: `Bot ${botId}`,
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
    });
  }
}

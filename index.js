const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
const fs = require("fs");

const BOT_TOKEN = "8316604425:AAEAIZ6ttE9Yiw62jz3sVW2gZe5El_SuioI";
const OPENAI_API_KEY = "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";
const ADMIN_ID = "8023254099";
const ADMIN_USERNAME = "@luxXmod";
const MEMORY_FILE = "userMemory.json";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Load persistent memory
let userMemory = {};
if (fs.existsSync(MEMORY_FILE)) {
  userMemory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

// Save memory function
function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(userMemory, null, 2));
}

// Determine greeting based on time
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  // Initialize user memory if not exists
  if (!userMemory[chatId]) userMemory[chatId] = { context: [] };
  saveMemory();

  bot.sendMessage(
    chatId,
    `👋 ${getTimeGreeting()} ${username}!\nI'm Lux AI, your smart assistant created by Frannzi Lux.\n\nType anything and I'll reply 😎`
  );

  setTimeout(() => {
    bot.sendMessage(chatId, "💡 Tip: You can ask me anything, or talk to the admin using /admin.");
  }, 2000);
});

// Handle /admin command
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `📞 You can reach the admin here: ${ADMIN_USERNAME}\n🆔 Admin ID: ${ADMIN_ID}`);
});

// Handle normal messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.toLowerCase() : "";

  // Ignore /start or /admin
  if (text.startsWith("/start") || text.startsWith("/admin")) return;

  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  // Initialize memory if not exists
  if (!userMemory[chatId]) userMemory[chatId] = { context: [] };

  // Custom replies
  if (text.includes("who created you") || text.includes("who made you")) {
    return bot.sendMessage(chatId, "I was created by Frannzi Lux, a tech genius.");
  }

  if (text.includes("hello") || text.includes("hi")) {
    return bot.sendMessage(chatId, `${getTimeGreeting()} ${username}! 👋 How are you today?`);
  }

  // Add user message to memory
  userMemory[chatId].context.push({ role: "user", content: msg.text });

  try {
    // Show typing indicator
    bot.sendChatAction(chatId, "typing");

    // Optional: simulate typing delay based on message length
    const typingDelay = Math.min(msg.text.length * 50, 2000);

    setTimeout(async () => {
      // AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: userMemory[chatId].context,
      });

      const reply = completion.choices[0].message.content;

      bot.sendMessage(chatId, reply);

      // Add AI reply to memory
      userMemory[chatId].context.push({ role: "assistant", content: reply });

      // Keep only last 10 messages
      if (userMemory[chatId].context.length > 10) {
        userMemory[chatId].context = userMemory[chatId].context.slice(-10);
      }

      saveMemory();
    }, typingDelay);

  } catch (error) {
    console.error("OpenAI error:", error);
    bot.sendMessage(chatId, "⚠️ Sorry, something went wrong. Try again later.");
  }
});

console.log("🤖 Lux AI Telegram Bot is running...");

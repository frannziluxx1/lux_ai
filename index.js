const BOT_TOKEN = "8316604425:AAEAIZ6ttE9Yiw62jz3sVW2gZe5El_SuioI";
const OPENAI_API_KEY = "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";
const ADMIN_ID = "8023254099";
const ADMIN_USERNAME = "@luxXmod";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Track last bot response per chat for follow-up questions
const lastBotReplies = {};
const knownUsers = new Set();

// Helper function for time-based greetings
function getTimeGreeting() {
const hour = new Date().getHours();
if (hour >= 5 && hour < 12) return "Good morning";
if (hour >= 12 && hour < 17) return "Good afternoon";
return "Good evening";
}

// Handle /start command
bot.onText(//start/, (msg) => {
const chatId = msg.chat.id;
const username = msg.from.username ? @${msg.from.username} : msg.from.first_name;

const greeting = getTimeGreeting();

if (knownUsers.has(chatId)) {
bot.sendMessage(chatId, 👋 Welcome back ${username}!);
} else {
bot.sendMessage(
chatId,
👋 ${greeting} ${username}!\nI'm Lux AI, your smart assistant created by Frannzi Lux.\n\nType anything and I'll reply 😎
);
knownUsers.add(chatId);
}
});

// Handle normal messages
bot.on("message", async (msg) => {
const chatId = msg.chat.id;
const text = msg.text.toLowerCase();
const username = msg.from.username ? @${msg.from.username} : msg.from.first_name;

// Ignore /start (already handled)
if (text.startsWith("/start")) return;

// Show typing action
bot.sendChatAction(chatId, "typing");

// Reply to specific messages
if (text.includes("who created you") || text.includes("who made you")) {
const reply = "I was created by Frannzi Lux, a tech genius.";
lastBotReplies[chatId] = reply;
return bot.sendMessage(chatId, reply);
}

if (text.includes("talk with admin") || text.includes("admin")) {
const reply = 📞 If you want to contact my creator, this is his Telegram username: ${ADMIN_USERNAME};
lastBotReplies[chatId] = reply;
return bot.sendMessage(chatId, reply);
}

if (text.includes("what is my name") || text.includes("your name")) {
const reply = Your name is ${username};
lastBotReplies[chatId] = reply;
return bot.sendMessage(chatId, reply);
}

if (text.includes("hello") || text.includes("hi")) {
const greeting = getTimeGreeting();
const reply = ${greeting} ${username}! How may I help you today?;
lastBotReplies[chatId] = reply;
return bot.sendMessage(chatId, reply);
}

// Detect follow-up "why" questions
if (text.includes("why") && lastBotReplies[chatId]) {
return bot.sendMessage(chatId, You asked why? Here’s more info: ${lastBotReplies[chatId]});
}

try {
// Detect if user is asking for code
if (text.includes("code") || text.includes("write code") || text.includes("show me code")) {
const codePrompt = Write a simple example code for: ${msg.text};
const completion = await openai.chat.completions.create({
model: "gpt-4o-mini",
messages: [{ role: "user", content: codePrompt }],
});
const reply = completion.choices[0].message.content;
lastBotReplies[chatId] = reply;
return bot.sendMessage(chatId, reply);
}

// Default AI response  
const completion = await openai.chat.completions.create({  
  model: "gpt-4o-mini",  
  messages: [{ role: "user", content: msg.text }],  
});  

const reply = completion.choices[0].message.content;  
lastBotReplies[chatId] = reply;  
bot.sendMessage(chatId, reply);

} catch (error) {
console.error("OpenAI error:", error);
if (error.code === "rate_limit_exceeded") {
const waitTime = error.headers && error.headers["retry-after"] ? error.headers["retry-after"] : 20;
bot.sendMessage(chatId, ⚠️ You have sent too many requests. Please wait ${waitTime} seconds.);
} else {
bot.sendMessage(chatId, "⚠️ Sorry, something went wrong. Try again later.");
}
}
});

console.log("🤖 Lux AI Telegram Bot is running...");

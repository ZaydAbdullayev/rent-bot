const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const mysql = require("mysql");
const { chunkArray, convertToTimeFormat, fetchAllUsers, fetchUserById, handleAdminResponse, generateId, handleUserResponse } = require("./utils");

const token = "6874634713:AAEMZ_dAfQzeMibFqH08A7bks3FXOY7zo80";

const bot = new TelegramBot(token, { polling: true });

const ownersChatId = ["1831538012", "5632648116"];
const adminChatIds = ["1831538012",];

const dbConfig = {
  host: "162.55.134.175",
  database: "spschool_yandex_eats",
  user: "spschool",
  password: "Myfirstwebsite-1",
};

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connected to database");
    connection.release();
  }
});

const generalCommands = [{ command: "start", description: "Start" }];

// Yetkili kullanıcı komutları
const adminCommands = [
  { command: "start", description: "Start" },
  {
    command: "create_form",
    description: "Shablon tayyorlash",
  },
  {
    command: "get_all_user",
    description: "Barcha foydalanuvchilar ro'yxatini olish",
  },
  {
    command: "get_user_by_id",
    description: "ID bo'yicha foydalanuvchini topish",
  },
  {
    command: "on_discount",
    description: "Chegirma qo'shish",
  },
  {
    command: "off_discount",
    description: "Chegirma olib tashlash",
  },
];

const accData = ["#1", "#2", "#3", "#4", "#5", "#6", "#7", "#8", "#9", "#10", "#11", "#12", "#13", "#14", "#15"];

bot.setMyCommands(generalCommands);

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.from.id;
  const userID = msg.from.id;
  if (ownersChatId.includes(userID.toString())) {
    bot.setMyCommands(adminCommands, {
      scope: { type: "chat", chat_id: chatId },
    });
  } else {
    bot.setMyCommands(generalCommands, {
      scope: { type: "chat", chat_id: chatId },
    });
  }
  const message = `
  \n*📌 DIQQAT📌*\n
  *❗️FAQAT IOS/ANDROID ✅*\n
  *❌EMULYATOR TAQIQLANADI❌*\n
  *❗️AKKAUNTDAN CHIQIB KETISH MUMKIN EMAS 📌*\n
  _Qaytib kirish niyatiz yoq bolsa yoki vaqtiz tugagandagina chiqing boshqa holatda chiqib ketib qolsangiz qayta pullik. Internetiz stabilniy bolsa oling faqat! internet ishlamay qolib chiqib ketsangiz bizda emas ayb!_\n
  *❗️PINdagi DRUZYA LARNI CHOPISH MUMKIN EMAS,* *boshqa druzyalarni bemalol uchirishiz yo qoshishiz mumkin⚠️*\n
  *✅ NICK OZGARTIRISH MUMKIN ADMINDAN SORAB ✅*\n
  *❗️CHIT BILAN OYNASH TAQIQLANADI📌*\n
  *✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
  *⚠️AKKAUNT SIZ OYNAGAN VAQT ICHIDA BANGA KIRSA SIZ MAMURIY/JINOIY JAVOBGARLIKGA TORTILASIZ ⚠️⚠️⚠️*\n
  👆 YUQORIDAGILARGA RIOYA QILGAN HOLDA MAZZA QIB OYNASHINGIZ MUMKIN 😊
  `;
  const options = {
    reply_markup: {
      inline_keyboard: [[{ text: "Roziman", callback_data: "accept_rules" }]],
    },
    parse_mode: "Markdown",
  };
  if (!ownersChatId.includes(userID.toString())) {
    bot.sendMessage(chatId, message, options);
  } else {
    bot.sendMessage(chatId, "Assalomu alaykum, Admin!");
  }
});

let form = {};

bot.on("callback_query", (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username;
  const name = callbackQuery.from.first_name;
  const callbackData = callbackQuery.data;
  console.log("callbackData:", callbackData);

  if (callbackData === "accept_rules") {
    bot.sendMessage(
      userId,
      `
*SIZDAN TALAB QILINADI👇*\n
*1. 📱 TELEFON RAQAM ✅*\n
*2. 🛂 PASSPORT ✅*\n
*3. 📍LAKATSIYA ✅*\n
*4. 🎥 AKK JAVOBGARLIGINI OLAMAN DEGAN VIDEO✅*\n
_Videoda gapirasiz men (ISM FAMILYA), (Tugilgan Sana)da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman_\n
_Yuqoridagini gapirib bolib passport korsatasiz videoda korinsin_👆\n
*📱60 FPS+ BOLISHI SHART ⚠️*\n
*✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
`,
      { parse_mode: "Markdown" }
    );

    const options = {
      reply_markup: {
        keyboard: [
          [{ text: "Telefon raqamimni ulashish", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
      parse_mode: "Markdown",
    };
    bot.sendMessage(
      userId,
      "*Iltimos telefon raqamingizni ulashing:*",
      options
    );
  } else if (callbackData?.startsWith("admin_")) {
    const userId = callbackData?.split("_")[2];
    const action = callbackData?.split("_")[1];
    handleAdminResponse(userId, action, userInfo, adminChatIds);
  }

  if (callbackData.startsWith("acc_number")) {
    const acc_number = callbackData.split("_")[2];
    form[userId] = { ...form[userId], acc_number, order: "time" };
    bot.sendMessage(
      userId,
      "*Vaqtini raqam* _(1/1.5/2)_ *ko'rishinda kiriting:*",
      {
        parse_mode: "Markdown",
      }
    );
  }

  if (callbackData.startsWith("form_")) {
    const us_id = callbackData.split("_")[2];
    const action = callbackData.split("_")[1];
    if (action === "accept") {
      const user = templateDatas[us_id];
      const value = {
        acc_number: user?.acc_number,
        time: user?.time,
        price: user?.price,
        userId,
        username,
        name,
      }
      handleUserResponse(value, adminChatIds, pool, bot);
    } else if (action === "reject") {
      adminChatIds.forEach((adminChatId) => {
        bot.sendMessage(
          adminChatId,
          `[${name}](tg://user?id=${userId}) buyurtma shablonini qabul qilmadi!`,
          { parse_mode: "Markdown" }
        );
      });
    }
  }
});

bot.on("message", (msg) => {
  const chatId = msg.from.id;
  const userId = msg.from.id;
  const command = msg.text;
  if (ownersChatId?.includes(userId.toString())) {
    if (command === "/get_all_user") {
      fetchAllUsers(chatId);
    } else if (command === "/get_user_by_id") {
      bot.sendMessage(
        chatId,
        "*Iltimos ID raqamini (id:0000000) sifatida yuboring:*",
        { parse_mode: "Markdown" }
      );
    }

    if (command?.startsWith("id:")) {
      const id = command?.split(":")[1];
      fetchUserById(chatId, id);
    }

    if (command === "/create_form") {
      form[chatId] = {};
      const chunkedAccData = chunkArray(accData, 5);
      bot.sendMessage(chatId, "*Akkaunt tanlang:*", {
        reply_markup: {
          inline_keyboard: chunkedAccData.map((chunk) =>
            chunk.map((acc) => ({
              text: acc,
              callback_data: `acc_number_${acc}`,
            }))
          ),
        },
        parse_mode: "Markdown",
      });
    }
  }
});

bot.on("text", (msg) => {
  const chatId = msg.from.id;
  const userId = msg.from.id;
  const us = form?.[chatId] || {};
  const messageText = msg.text;
  const isNumeric = /^\d+$/.test(messageText);
  const value = messageText.replace(/[^\d.]/g, "");
  if (ownersChatId?.includes(userId.toString()) && isNumeric) {
    if (us?.order === "time") {
      form[chatId] = { ...form[chatId], time: value, order: "price" };
      bot.sendMessage(
        chatId,
        `*Vaqt: ${convertToTimeFormat(
          value
        )} etib qabul qilindi. Endi narxini*  _bo'shliq va harflarsiz (1000)_  *ko'rinishida kiriting:*`,
        {
          parse_mode: "Markdown",
        }
      );
    } else if (us?.order === "price") {
      const id = generateId();
      bot.sendMessage(
        chatId,
        `Harid shabloni tayyor va  \`${id}\` kaliti bilan saqlandi!`,
        { parse_mode: "Markdown" }
      );
      form[chatId] = { ...form[chatId], price: value, order: "confirm" };
      templateDatas[id] = form[chatId];
      const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const forma = `Sizning buyurtmangiz:\n\nACC — ${us?.acc_number
        }\nVAQTI — ${convertToTimeFormat(
          us?.time
        )} ga\n NARXI — ${formattedValue} so'm\n\nBuni qabul qilasiz mi?`;
      callballResult.push({
        type: "article",
        id: "1",
        title: id,
        input_message_content: {
          message_text: forma,
        },
        description: "Buyurtma shabloni",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Yo'q", callback_data: `form_reject_${id}` },
              { text: "Ha", callback_data: `form_accept_${id}` },
            ],
          ],
        },
        parse_mode: "Markdown",
      });
      console.log("callballResult:", callballResult);
    }
  }
});

let templateDatas = {}

let callballResult = [];

bot.on("inline_query", (query) => {
  const queryId = query.id;
  const queryText = query.query;
  const userId = query.from.id;

  if (adminChatIds.includes(userId.toString())) {
    if (queryText === "") {
      bot.answerInlineQuery(queryId, [], {
        cache_time: 0,
      });
    } else {
      bot.answerInlineQuery(queryId, callballResult, {
        cache_time: 0,
      });
    }
  }

});

let userInfo = {};

bot.on("contact", (msg) => {
  const chatId = msg?.chat?.id;
  userInfo[chatId] = { ...userInfo[chatId], phone: msg.contact.phone_number };
  bot.sendMessage(chatId, "*Passportingizning rasmni yuboring.*", {
    parse_mode: "Markdown",
  });
});

bot.on("photo", (msg) => {
  const chatId = msg?.chat?.id;
  userInfo[chatId] = {
    ...userInfo[chatId],
    photo: msg.photo[msg.photo.length - 1].file_id,
    name: msg?.chat?.first_name,
  };

  const options = {
    reply_markup: {
      keyboard: [[{ text: "Locatsiyamni ulashish", request_location: true, }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
    parse_mode: "Markdown",
  };
  return bot.sendMessage(
    chatId,
    "*Iltimos shaxsiy Locatsiyangizni ulang:*",
    options
  );
});

bot.on("location", (msg) => {
  const chatId = msg?.chat?.id;
  userInfo[chatId] = { ...userInfo[chatId], location: msg.location };
  bot.sendMessage(
    chatId,
    `Iltimos endi AKK JAVOBGARLIGINI OLAMAN degan video jo'nating, videoda gapirasiz:\n\n> Men, Ism Familiya, Tugilgan Sana, da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman\n
    `,
    {
      parse_mode: "MarkdownV2",
    }
  );
});

bot.on("video_note", (msg) => {
  const chatId = msg?.chat?.id;
  userInfo[chatId] = {
    ...userInfo[chatId],
    video_note: msg.video_note.file_id,
    username: msg.from.username,
    userId: msg.from.id,
  };
  const link = msg.from.username
    ? `@${msg.from.username}`
    : `[${msg.from.first_name}](tg://user?id=${msg.from.id})`;

  const user = userInfo[chatId];
  const adminMessage = `
Yangi Registiratsiya:
- ism: ${user.name}
- tel: ${user.phone}
- user name: ${link}
- user ID: ${user.userId}
  `;
  adminChatIds.forEach((adminChatId) => {
    bot.sendVideoNote(adminChatId, user.video_note);
    bot.sendLocation(
      adminChatId,
      user.location.latitude,
      user.location.longitude
    );
    bot.sendPhoto(adminChatId, user.photo, {
      caption: adminMessage,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Accept", callback_data: `admin_accept_${chatId}` },
            { text: "Reject", callback_data: `admin_reject_${chatId}` },
          ],
        ],
      },
      parse_mode: "Markdown",
    });
  });

  bot.sendMessage(
    chatId,
    "Barcha malumotlaringiz ko'rib chiqilmoqda. Iltimos admin tasdiqlashini kuting!"
  );
});

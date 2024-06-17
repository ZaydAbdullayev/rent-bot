const express = require("express");
const app = express();
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const mysql = require("mysql");
const PORT = process.env.PORT || 8081;

const token = "7439197149:AAGQTWGNPV9VI3CATmX9Q8Dxa5kHrj_Rw00";

app.use(cors());
app.use(express.json());

const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (error) => {
  console.error(`Polling error: ${error}`);
});

const ownersChatId = ["1831538012", "5632648116"];
const adminChatId = "1831538012";
const adminChatId2 = "5632648116";

const config = {
  host: "162.55.134.175",
  database: "spschool_yandex_eats",
  user: "spschool",
  password: "Myfirstwebsite-1",
};

const pool = mysql.createPool(config);

pool.getConnection((err, connection) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to database");
    connection.release();
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userID = msg.from.id;
  const message = `
\n*📌 DIQQAT📌*\n
*❗️FAQAT IOS/ANDROID ✅*\n
❌EMULYATOR TAQIQLANADI❌\n
*❗️AKKAUNTDAN CHIQIB KETISH MUMKIN EMAS 📌*\n
_Qaytib kirish niyatiz yoq bolsa yoki vaqtiz tugagandagina chiqing boshqa holatda chiqib ketib qolsangiz qayta pullik. Internetiz stabilniy bolsa oling faqat! internet ishlamay qolib chiqib ketsangiz bizda emas ayb!_\n
*❗️PINdagi DRUZYA LARNI CHOPISH MUMKIN EMAS,* _boshqa druzyalarni bemalol uchirishiz yo qoshishiz mumkin_⚠️\n
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

bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data === "accept_rules") {
    bot.sendMessage(
      chatId,
      `
*SIZDAN TALAB QILINADI👇*\n
*1. 🛂 PASSPORT ✅*\n
*2. 📍LAKATSIYA ✅*\n
*3. 🎥 AKK JAVOBGARLIKNI OLAMAN DEGAN VIDEO✅*\n
_Video gapirasiz men (ISM FAMILYA), (Tugilgan Sana)da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman_\n
_Yuqoridagini gapirib bolib passport korsatasiz videoda korinsin_👆\n
*📱60 FPS+ BOLISHI SHART ⚠️*\n
*✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
`,
      { parse_mode: "Markdown" }
    );

    const options = {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Telefon raqamimni ulashish",
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    bot.sendMessage(chatId, `Iltimos telefon raqamingizni ulashing:`, options);
  } else if (callbackQuery?.data?.startsWith("admin_accept")) {
    const userId = callbackQuery?.data?.split("_")[2];
    const user = userInfo[userId];
    const groupChatId = "-1002043732390";
    const adminMessage = `
Yangi Registiratsiya:
- ism: ${user?.name}
- tel: ${user?.phone}
- user name: ${link}
- user ID: ${user?.userId}
  `;

    if (user) {
      bot.sendVideoNote(groupChatId, user?.video_note);
      bot.sendLocation(
        groupChatId,
        user?.location.latitude,
        user?.location.longitude
      );
      bot.sendPhoto(groupChatId, user?.photo, {
        caption: adminMessage,
        parse_mode: "Markdown",
      });
      const query = `INSERT INTO arenda (id, name, phone, photo, longitude, latitude) VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [
        userId,
        user?.name,
        user?.phone || "",
        user?.photo,
        user?.location.longitude,
        user?.location.latitude,
      ];
      pool.query(query, values, (err, results) => {
        if (err) {
          bot.sendMessage(
            userId,
            "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
          );
          throw err;
        }
        bot.sendMessage(
          userId,
          "Tabriklaymiz! Sizning ma'lumotlaringiz qabul qilindi."
        );
      });
    }
  } else if (callbackQuery?.data?.startsWith("admin_reject")) {
    const userId = callbackQuery?.data?.split("_")[2];
    bot.sendMessage(
      userId,
      "Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring."
    );
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const command = msg.text;
  console.log(msg);

  if (
    (!ownersChatId.includes(userId.toString()) &&
      command === "/get_all_user") ||
    command === "/get_user_by_id"
  ) {
    bot.sendMessage(chatId, "Iltimos faqat so'ralgan malumotlarni yuboring!.");
    bot.deleteMessage(chatId, msg.message_id);
  }

  if (command === "/get_all_user" && ownersChatId.includes(userId.toString())) {
    bot.sendMessage(chatId, "Barcha foydalanuvchilar ro'yxati:");
    const query = `SELECT * FROM arenda`;
    pool.query(query, (err, results) => {
      if (err) {
        bot.sendMessage(
          chatId,
          "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
        );
        throw err;
      }
      const users = results;
      users.forEach((user, ind) => {
        const link = user?.username
          ? `@${user?.username}`
          : `[${user?.name}](tg://user?id=${user?.id})`;

        bot.sendMessage(
          chatId,
          `${ind + 1}.  ID: ${user?.id}\nusername: ${link}\nphone: ${
            user?.phone
          }`,
          { parse_mode: "Markdown" }
        );
      });
    });
  } else if (
    command === "/get_all_user" &&
    !ownersChatId.includes(userId.toString())
  ) {
    bot.sendMessage(chatId, "Sizda userlarni ko'rish ruxsati yo'q!");
  }

  if (
    command === "/get_user_by_id" &&
    ownersChatId.includes(userId.toString())
  ) {
    bot.sendMessage(
      chatId,
      `Iltimos ID raqamini (id:0000000) sifatida yuboring:`
    );
  } else if (
    command === "/get_user_by_id" &&
    !ownersChatId.includes(userId.toString())
  ) {
    bot.sendMessage(chatId, "Sizda userlarni ko'rish ruxsati yo'q!");
  }

  if (
    command?.startsWith("id:") &&
    ownersChatId?.includes(userId?.toString())
  ) {
    const id = command.split(":")[1];
    const query = `SELECT * FROM arenda WHERE id = ?`;
    const values = [id];
    pool.query(query, values, (err, results) => {
      if (err) {
        bot.sendMessage(
          chatId,
          "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
        );
        throw err;
      }
      const user = results[0];
      if (user) {
        const link = user?.username
          ? `@${user?.username}`
          : `[${user?.name}](tg://user?id=${user?.id})`;

        bot.sendMessage(
          chatId,
          `ID: ${user?.id}\nusername: ${link}\nphone: ${user?.phone}`,
          { parse_mode: "Markdown" }
        );
        bot.sendPhoto(chatId, user?.photo);
        bot.sendLocation(chatId, user?.latitude, user?.longitude);
      } else {
        bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
      }
    });
  }
});

let userInfo = {};

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = userInfo[chatId] || {};
  userInfo[chatId].phone = msg.contact.phone_number;
  bot.sendMessage(
    chatId,
    "Telefon raqamingiz qabul qilindi. Iltimos passportingizning rasmni yuboring."
  );
});

bot.on("photo", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = userInfo[chatId] || {};
  userInfo[chatId].photo = msg.photo[msg.photo.length - 1].file_id;
  userInfo[chatId].name = msg.chat.first_name;
  bot
    .sendMessage(chatId, "Rasm qabul qilindi")
    .then(() => {
      const options = {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Locatsiyamni ulashish",
                request_location: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      return bot.sendMessage(
        chatId,
        "Iltimos shaxsiy Locatsiyangizni ulang:",
        options
      );
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
});

bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = userInfo[chatId] || {};
  userInfo[chatId].location = msg.location;
  bot.sendMessage(
    chatId,
    "Locatsiya qabul qilindi. Iltimos endi video habaringizni yuboring."
  );
});

bot.on("video_note", (msg) => {
  const chatId = msg.chat.id;
  userInfo[chatId] = userInfo[chatId] || {};
  userInfo[chatId].video_note = msg.video_note.file_id;
  userInfo[chatId].username = msg.from.username;
  userInfo[chatId].userId = msg.from.id;
  const link = msg.from.username
    ? `@${msg.from.username}`
    : `[${msg.from.first_name}](tg://user?id=${msg.from.id})`;

  const user = userInfo[chatId];
  const adminMessage = `
Yangi Registiratsiya:
- ism: ${user?.name}
- tel: ${user?.phone}
- user name: ${link}
- user ID: ${user?.userId}
  `;
  bot.sendVideoNote(adminChatId, user?.video_note);
  bot.sendVideoNote(adminChatId2, user?.video_note);
  bot.sendLocation(
    adminChatId,
    user?.location.latitude,
    user?.location.longitude
  );
  bot.sendLocation(
    adminChatId2,
    user?.location.latitude,
    user?.location.longitude
  );
  bot.sendPhoto(adminChatId, user?.photo, {
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
  bot.sendPhoto(adminChatId2, user?.photo, {
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

  bot.sendMessage(
    chatId,
    "Barcha malumot adminga yetkazildi. Tez orada siz bilan bog'lanamiz."
  );
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

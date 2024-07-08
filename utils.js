const fetchAllUsers = (chatId) => {
    bot.sendMessage(chatId, "Barcha foydalanuvchilar ro'yxati:");
    const query = "SELECT * FROM arenda";
    pool.query(query, (err, results) => {
        if (err) {
            bot.sendMessage(
                chatId,
                "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
            );
            console.error(err);
            return;
        }
        results.forEach((user, ind) => {
            const link = user.username
                ? `@${user.username}`
                : `[${user.name}](tg://user?id=${user.id})`;
            bot.sendMessage(
                chatId,
                `${ind + 1}.  ID: ${user.id}\nusername: ${link}\nphone: ${user.phone}`,
                { parse_mode: "Markdown" }
            );
        });
    });
};

const fetchUserById = (chatId, id) => {
    const query = "SELECT * FROM arenda WHERE id = ?";
    pool.query(query, [id], (err, results) => {
        if (err) {
            bot.sendMessage(
                chatId,
                "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
            );
            console.error(err);
            return;
        }
        const user = results[0];
        if (user) {
            const link = user.username
                ? `@${user.username}`
                : `[${user.name}](tg://user?id=${user.id})`;
            bot.sendMessage(
                chatId,
                `ID: ${user.id}\nusername: ${link}\nphone: ${user.phone}`,
                { parse_mode: "Markdown" }
            );
            bot.sendPhoto(chatId, user.photo);
            bot.sendLocation(chatId, user.latitude, user.longitude);
        } else {
            bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
        }
    });
};

const handleAdminResponse = (userId, action, userInfo, adminChatIds) => {
    if (action === "accept") {
        const user = userInfo[userId];
        const groupChatId = "-1002043732390";
        const link = user?.username
            ? `@${user?.username}`
            : `[${user?.name}](tg://user?id=${user?.userId})`;
        const adminMessage = `
Yangi Registiratsiya:
- ism: ${user?.name}
- tel: ${user?.phone}
- user name: ${link}
- user ID: ${user?.userId}
    `;

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
        console.log(values);
        pool.query(query, values, (err) => {
            if (err) {
                bot.sendMessage(
                    userId,
                    "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
                );
                console.error(err);
            } else {
                bot.sendMessage(
                    userId,
                    "Tabriklaymiz! Sizning ma'lumotlaringiz qabul qilindi."
                );
                adminChatIds.forEach((adminChatId) => {
                    bot.sendMessage(
                        adminChatId,
                        `Yangi ${link} foydalanuvchi qo'shildi.`,
                        { parse_mode: "Markdown" }
                    );
                });
            }
        });
    } else if (action === "reject") {
        bot.sendMessage(
            userId,
            `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* @/start.`,
            {
                parse_mode: "Markdown",
            }
        );
        adminChatIds.forEach((adminChatId) => {
            bot.sendMessage(adminChatId, `${userId}-ning malumotlari bekor qilindi.`);
        });
    }
};

const handleUserResponse = (user, adminChatIds, pool, bot) => {
    try {
        const query = `INSERT INTO acc_orders (name, user_name, id, acc_number, price, time) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [
            user?.name,
            user?.username || `[${user?.name}](tg://user?id=${user?.userId})`,
            user?.userId,
            user?.acc_number,
            user?.price,
            user?.time,
        ];
        pool.query(query, values, (err) => {
            if (err) {
                console.error(err);
            } else {
                const groupChatId = "-1002140035192";
                const formattedValue = user?.price?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                const link = user?.username
                    ? `@${user?.username}`
                    : `[${user?.name}](tg://user?id=${user?.userId})`;
                const adminMessage = `
New Order:
- ism: ${user?.name}
- user name: ${link}
- user ID: ${user?.userId}
- ACC: ${user?.acc_number}
- VAQTI: ${convertToTimeFormat(user?.time)}
- NARXI: ${formattedValue}
      `;
                bot.sendMessage(groupChatId, adminMessage, { parse_mode: "Markdown" });
                adminChatIds.forEach((adminChatId) => {
                    bot.sendMessage(
                        adminChatId,
                        `${link} foydalanuvchi harid shablonini qabul qildi.`,
                        { parse_mode: "Markdown" }
                    );
                });
            }
        });
    } catch (error) {
        throw new Error(error);
    }
}

const convertToTimeFormat = (value) => {
    const num = parseFloat(value);
    if (num >= 24) {
        const days = Math.floor(num / 24);
        const remainingHours = num % 24;
        if (remainingHours > 0) {
            return `${days} kun ${remainingHours.toFixed(1).replace(".0", "")} soat`;
        } else {
            return `${days} kun`;
        }
    }
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    if (minutes === 0) {
        return `${hours} soat`;
    } else if (minutes === 60) {
        return `${hours + 1} soat`;
    } else {
        return `${hours} soat ${minutes} minut`;
    }
};

const chunkArray = (array, size) => {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArray.push(array.slice(i, i + size));
    }
    return chunkedArray;
};

const generateId = () => {
    const min = 100000;
    const max = 999999;
    const uniqueNumber = Math.floor(min + Math.random() * (max - min + 1));
    return uniqueNumber.toString();
};

module.exports = {
    fetchAllUsers,
    fetchUserById,
    handleAdminResponse,
    convertToTimeFormat,
    chunkArray,
    generateId,
    handleUserResponse
};

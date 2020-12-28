const Discord = require("discord.js");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const { isRegExp } = require("util");
const client = new Discord.Client();

const database = new MongoClient(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addJoinSound(document) {
  try {
    await database.connect();
    const db = database.db("discord-bot-database");
    // Use the collection "people"
    const col = db.collection("join-sounds");
    if ((await col.findOne({ user: document.user })) == null) {
      await col.insertOne(document);
      return "added";
    } else {
      await col.updateOne(
        { user: document.user },
        { $set: { url: document.url } }
      );
      return "updated";
    }

    // await console.log("Connected correctly to server");
  } catch (err) {
    console.log(err.stack);
  }
}

async function findJoinSound(id) {
  try {
    await database.connect();
    const db = database.db("discord-bot-database");
    // Use the collection "people"
    const col = db.collection("join-sounds");
    const p = await col.findOne({ user: id });
    return p;
    // await console.log("Connected correctly to server");
  } catch (err) {
    console.log(err.stack);
  }
}
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.channel.name == "bot-cmd") {
    let joinSoundDocument = {
      user: msg.author.id,
      url: msg.attachments.array()[0].url,
    };
    const message = await addJoinSound(joinSoundDocument);
    // console.log(msg.author.id);
    // console.log(msg.attachments.array()[0].url);
    msg.reply(`Succussful ${message} join sound`);
  }

  //   if (msg.content === "ping") {
  //     msg.reply("pong");
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channel == null && newState.channel != null) {
    const sound = await findJoinSound(newState.id);
    const temp = sound.url.slice(sound.url.length - 3, sound.url.length);
    console.log(temp);
    if (temp == "mp3") {
      const connection = await newState.channel.join();
      const dispatcher = connection.play(sound.url);
      dispatcher.on("finish", () => {
        newState.channel.leave();
      });
    }
  }
});

client.login(process.env.TOKEN);

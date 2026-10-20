const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
}

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    // 送られてきたイベント（メッセージなど）をひとつずつ処理
    Promise//Promise.allで全てのイベントが処理されたら結果を返す
        .all(req.body.events.map(handleEvent))//reqが送られてきたイベントでその中のbodyのeventsをmapで一つずつhandleEventに渡す
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});


async function handleEvent(event) {
    console.log(`${event.message.text}`);
    return Promise.resolve(null);
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
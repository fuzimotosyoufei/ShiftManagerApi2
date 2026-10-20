const express = require('express');
const line = require('@line/bot-sdk');
const cron = require('node-cron');
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

async function handleEvent(event) {//イベントの種類がメッセージかどうかを判定
    if (event.type !== 'message' || event.message.type !== 'text') {
        // メッセージ以外のイベントは無視
        return Promise.resolve(null);
    }
    console.log(`${event.message.text}`);//イベントの中のmessageの中のtextをログに出力
    const usertText = event.message.text;
    let replyText = '';
    if (usertText === 'こんにちは') {
        replyText = 'こんにちは！';
    } else if (usertText === '元気ですか？') {
        replyText = '元気です！';
    } else {
        replyText = 'すみません、よくわかりません。';
    }
    return client.replyMessage(event.replyToken, {//replyMessageで返信する最大5個まで同時に送ることができる
        type: 'text',
        text: replyText
    });
}

cron.schedule('*/10 * * * *', () => {
    client.pushMessage('送信先の名前', {
        type: 'text',
        text: '定期メッセージ'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
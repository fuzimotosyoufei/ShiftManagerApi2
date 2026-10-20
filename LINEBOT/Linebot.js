const express = require('express');
const line = require('@line/bot-sdk');
const cron = require('node-cron');
require('dotenv').config();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
}
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN });
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
    const userText = event.message.text;
    let replyText = '';
    if (userText === 'こんにちは') {
        replyText = 'こんにちは！';
    } else if (userText === '元気ですか？') {
        replyText = '元気です！';
    } else {
        replyText = 'すみません、よくわかりません。';
    }
    return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{
            type: 'text',
            text: replyText
        }]
    });
}

cron.schedule('*/10 * * * *', () => {
    const targetUserId = process.env.MY_USER_ID; // 例: .env や 変数から指定
    if (targetUserId) {
        client.pushMessage({
            to: targetUserId,//toで送信先のユーザー名
            messages: [{
                type: 'text',
                text: '10分経過の定期メッセージです！'
            }]
        }).catch(err => console.error('Pushエラー:', err));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
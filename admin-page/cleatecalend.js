document.addEventListener('DOMContentLoaded', function () {
    StartCalendar();

});

const calendarEl = document.getElementById('calendar')

function StartCalendar() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/calendar', { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok) {
                throw new Error('データの取得に失敗したよ');
            }
            return response.json();
        })
        .then(data => {
            console.log("C#から届いた生データはこれだ！:", data);
            const year = data.year;
            const month = data.month;
            periods_id = data.id;
            const startMonthStr = String(month).padStart(2, '0');
            startDateStr = `${year}-${startMonthStr}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            endDateStr = `${year}-${startMonthStr}-${lastDay}`;
            console.log("C#から届いた生データはこれだ！:", startDateStr);
            InitCalendar(startDateStr, endDateStr);
        })
}
function InitCalendar(start, end) {

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',//何週間か月のカレンダーにするかを決めれる
        locale: 'ja',//言語
        initialDate: start,
        // カレンダー上部のヘッダー設定
        customButtons: {//この下に書いたやつは全部ボタンになる
            myCustomButton: {
                text: 'カレンダー作成',
                click: function () {
                    const button = document.querySelector('.fc-myCustomButton-button');//いま画面にあるボタンの要素を取得する
                    if (button) {//そもそもbuttonが画面上にない可能性があるからifをしている
                        if (button.innerText === 'カレンダー作成') {
                            const carendDate = calendar.getDate();
                            const carendYear = carendDate.getFullYear();
                            const carendMonth = carendDate.getMonth() + 1;
                            CreatePeriods(carendYear, carendMonth)
                            alert('まだ作ってないよ');
                        } else if (button.innerText === 'カレンダー編集') {//今は配信中に変えるだけだけどその他の機能を思いついたらここに追加
                            if (currentPeriodId) {
                                UpdateStatus(currentPeriodId);
                            }
                        } else if (button.innerText === 'カレンダー配信中') {
                            alert('今配信中');
                        }
                    }

                }
            }
        },
        headerToolbar: {
            left: 'prev,next today', // 左側に「前月」「翌月」「今日」ボタン
            center: 'title',         // 中央に「2026年7月」などのタイトル
            right: 'myCustomButton'
        },
        datesSet: function (info) {
            const carendDate = calendar.getDate();
            const carendYear = carendDate.getFullYear();
            const carendMonth = carendDate.getMonth() + 1;
            console.log(carendYear, carendMonth);
            GetCalendar(carendYear, carendMonth);
        },
        contentHeight: 'auto',
        selectable: true,//カレンダーのマス目をたプできるようにする
    });
    calendar.render();//これ最後に表示する
}

function GetCalendar(Year, Month) {
    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/bullidcalender?Getyear=${Year}&Getmonth=${Month}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok) {
                throw new Error('データの取得に失敗したよ');
            }
            return response.json();
        })
        .then(data => {
            const button = document.querySelector('.fc-myCustomButton-button');
            console.log(data);
            if (data.id === null) {
                console.log("カレンダーIDがnull（未作成）なので、イベントの取得はしません！");
                if (button) {
                    button.innerText = 'カレンダー作成';
                }
                const nullevent = [
                    { name: '未作成' }
                ];
                CreateEvent(nullevent);
            } else {
                currentPeriodId = date.id;//どのカレンダーかを区別するための番号
                if (button) {

                    if (data.start === '配信中') {
                        button.innerText = '配信中';
                    }
                    button.innerText = 'カレンダー編集';
                }
                GetEvent(data.id)
            }
        })
}
function GetEvent(Id) {//カレンダーのidからイベントを探す
    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/event?GetId=${Id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok) {
                // console.log(response);
                throw new Error(`エラー:${response.status}`);
            }
            return response.json(); // 正常なときだけここにたどり着く
        })
        .then(date => {
            CreateEvent(date)
        })
}

function CreateEvent(Event) {//イベントの枠を作成
    const eventList = document.getElementById('event-list')
    eventList.innerHTML = '';//一度中を空にする
    Event.forEach(item => {
        const html = `
        <div id="event-list-mein">
            <h3>${item.name}</h3>
        </div>
        `;
        eventList.insertAdjacentHTML('beforeend', html);
    });
}

function CreatePeriods(Year, Month) {//カレンダーのidからイベントを探す
    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/CreatePeriods?GetYear=${Year}&GetMonth=${Month}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok) {
                throw new Error(`エラー:${response.status}`);
            }
            return response.json(); // 正常なときだけここにたどり着く
        })
        .then(data => {
            alert(data.message); // 「新しいシフト期間が作成されました。」を表示


            // これにより GetCalendar 内で button.innerText が 'カレンダー編集' に変わり、二重作成を防げます！
            GetCalendar(Year, Month);
        })
        .catch(error => {
            console.error("作成失敗:", error);
            alert("作成に失敗しました");
        })
        .then(date => {
            CreateEvent(date)
        })
}

function UpdateStatus(id) {
    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/UpdateStatus?GetId=${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok) {
                throw new Error(`エラー:${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const Year = data.year;
            const Month = data.month;
            GetCalendar(Year, Month);
        })
}
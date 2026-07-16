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
        headerToolbar: {
            left: 'prev,next today', // 左側に「前月」「翌月」「今日」ボタン
            center: 'title',         // 中央に「2026年7月」などのタイトル
            right: 'dayGridMonth,timeGridWeek' // 右側に「月」「週」の切り替えボタン
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
            console.log(data);
            if (data.id === null) {
                console.log("カレンダーIDがnull（未作成）なので、イベントの取得はしません！");
                const nullevent = [
                    { name: '未作成' }
                ];
                CreateEvent(nullevent); // 画面を空にして終了
            } else {
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
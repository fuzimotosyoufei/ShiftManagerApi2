document.addEventListener('DOMContentLoaded', function () {
    startCalendar();

});

const calendarEl = document.getElementById('calendar')

function startCalendar() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/Build/calendar', { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(response => {
            if (!response.ok)
                throw new Error('データの取得に失敗したよ');
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
            initCalendar(startDateStr, endDateStr);
        })
}
function initCalendar(start, end) {

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
            console.log(carendYear, carendMonth)
        },
        contentHeight: 'auto',
        selectable: true,//カレンダーのマス目をたプできるようにする
    });
    calendar.render();//これ最後に表示する
}
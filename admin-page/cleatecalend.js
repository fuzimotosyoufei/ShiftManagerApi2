document.addEventListener('DOMContentLoaded', function () {
    initCalendar('2026-07-01', '2026-07-30');
});

const calendarEl = document.getElementById('calendar')


function initCalendar(start, end) {

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',//何週間か月のカレンダーにするかを決めれる
        locale: 'ja',//言語
        validRange: {
            start: start,
            end: end
        },
        contentHeight: 'auto',
        selectable: true,//カレンダーのマス目をたプできるようにする
    }
    )
    calendar.render();//これ最後に表示する
};
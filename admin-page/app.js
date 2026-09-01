const staffShifts = [
    {
        id: 1,
        name: "藤本",
        isSubmitted: true,
        isApproved: true,
        currentMonthShifts: [
            { date: "2026-06-01", mode: "日勤" },
            { date: "2026-06-06", mode: "遅番" },
            { date: "2026-06-09", mode: "休み" }
        ]
    },
    {
        id: 2,
        name: "佐藤",
        isSubmitted: true,
        isApproved: false,
        currentMonthShifts: [
            { date: "2026-06-04", mode: "休み" },
            { date: "2026-06-16", mode: "休み" },
            { date: "2026-06-20", mode: "遅番" }
        ]
    },
    {
        id: 3,
        name: "田中kkkkkkkkkkkkk",
        isSubmitted: false,
        isApproved: false,
        currentMonthShifts: [
            { date: "2026-06-09", mode: "日勤" },
            { date: "2026-06-29", mode: "休み" },
            { date: "2026-06-30", mode: "遅番" }
        ]
    }
];

function CalendarYearAndMonth() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/YearMonth', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => {
            if (response.ok) {
                console.log("曜日OK");
                return response.json();
            }
            throw new Error('通信エラー');
        })
        .then(ymdata => {
            console.log("年月データID:", ymdata.id);
            CalendarData(ymdata);
        })
        .catch(err => console.error(err));
}

function CalendarData(ymdata) {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/calendarnau', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => {
            if (response.ok) {
                console.log("できたよ3"); // return の前に移動
                return response.json();
            }
            throw new Error('通信エラー');
        })
        .then(date => {
            console.log('これデータ', date);
            CreateCalend(date, ymdata);
        })
        .catch(err => console.error(err));
}

function CreateCalend(date, ymdata) {
    const tbody = document.getElementById('shift_name');   // thead想定
    const tbody2 = document.getElementById('shift_create'); // tbody想定

    tbody.innerHTML = '';
    tbody2.innerHTML = '';

    console.log("カレンダー作成開始");

    // イベントヘッダー設定の構築
    const eventSetting = [];
    if (date.length > 0 && Array.isArray(date[0].event)) {
        date[0].event.forEach(event => {
            const setting = {
                key: event.name,
                TrueText: 'OK',
                FalseText: 'NO',
                NullText: '未入力'
            };
            eventSetting.push(setting);
        });
    }

    // ヘッダー行 (tr) の作成
    const headerTr = document.createElement('tr');

    const days = new Date(ymdata.year, ymdata.month, 0).getDate();
    const thn = document.createElement('th');
    thn.classList.add('name');
    thn.textContent = "名前";
    headerTr.appendChild(thn);

    // 日付ヘッダーの追加
    for (let i = 1; i <= days; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        headerTr.appendChild(th);
    }

    // イベント列ヘッダーの追加
    eventSetting.forEach(setting => {
        const the = document.createElement('th');
        the.classList.add('yasumi');
        the.textContent = setting.key;
        headerTr.appendChild(the);
    });

    tbody.appendChild(headerTr);

    // スタッフごとの行構築
    date.forEach(staff => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = staff.name;
        tr.appendChild(td);

        // シフトデータのルックアップ辞書作成
        const shiftLookup = {};
        if (staff.day != null) {
            staff.day.forEach(shift => {
                shiftLookup[shift.date] = shift.mode;
            });
        }

        // 日毎のシフトセル埋め込み
        for (let i = 1; i <= days; i++) {
            const shiftTd = document.createElement('td');
            const dateStr = `${ymdata.year}-${String(ymdata.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const mode = shiftLookup[dateStr] || "";
            shiftTd.textContent = mode;
            tr.appendChild(shiftTd);
        }

        // イベント状態のセル埋め込み
        eventSetting.forEach(setting => {
            const eventTd = document.createElement('td');
            const currentEventData = staff.event ? staff.event.find(e => e.name === setting.key) : null;

            // APIのレスポンス構造（valueやstatusなどのプロパティ名）に合わせて判定してください
            const isFlag = currentEventData ? (currentEventData.value ?? currentEventData[setting.key]) : null;

            if (isFlag === true) {
                eventTd.textContent = setting.TrueText;
            } else if (isFlag === false) {
                eventTd.textContent = setting.FalseText;
            } else {
                eventTd.textContent = setting.NullText;
            }
            tr.appendChild(eventTd);
        });

        tbody2.appendChild(tr);
    });
}

function switchPage(pageName) {
    const checkPage = document.getElementById('page-check');
    const buildPage = document.getElementById('page-build');
    if (pageName == 'check') {
        checkPage.style.display = 'block';
        buildPage.style.display = 'none';
    } else if (pageName == 'build') {
        checkPage.style.display = 'none';
        buildPage.style.display = 'block';
    }
}

function refreshCalendar() {
    loadShifts();
    CalendarYearAndMonth();
}

document.addEventListener('DOMContentLoaded', function () {
    refreshCalendar();
});

const channel = new BroadcastChannel('calendar_channel');
channel.onmessage = (calendar) => {
    if (calendar.data === 'refresh') {
        console.log("更新の合図を受け取りました。画面をリフレッシュします。");
        refreshCalendar();
    }
};

function loadShifts() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/shift', {
        method: 'GET',
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('データの取得に失敗しました。');
        })
        .then(allShifts => {
            const container = document.getElementById('admin-history-container');
            container.innerHTML = '';

            if (allShifts.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#999;">提出されたシフトはまだありません。</p>';
                return;
            }

            allShifts.forEach(shift => {
                const card = document.createElement('div');
                card.className = 'shift-card';

                const formattedDates = shift.dates.map(item => {
                    if (typeof item === 'object') {
                        const cleanDate = item.date.split('T')[0];
                        return `${cleanDate} (${item.mode})`;
                    }
                    return item;
                }).join('<br>');

                card.innerHTML = `
                    <div class="staff-name">👤 ${shift.name} (${shift.year}年${shift.month}月分)</div>
                    <div class="date-list">
                        <strong>希望内容：</strong><br>
                        ${formattedDates}
                    </div>
                    <div class="text-name">📝 備考欄</div>
                    <div class="text-message">${shift.memo || '（なし）'}</div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error('エラー:', error);
            alert('シフトデータの読み込みに失敗しました。');
        });
}
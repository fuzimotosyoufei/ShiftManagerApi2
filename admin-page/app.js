const staffShifts = [
    {
        id: 1,
        name: "藤本",
        isSubmitted: true,  // 💡 YES：シフト提出済み！
        isApproved: true,   // 💡 YES：管理者も承認・確定済み！
        currentMonthShifts: [
            { date: "2026-06-01", mode: "日勤" },
            { date: "2026-06-06", mode: "遅番" },
            { date: "2026-06-09", mode: "休み" }
        ]
    },
    {
        id: 2,
        name: "佐藤",
        isSubmitted: true,  // 💡 YES：シフトは提出してくれた！
        isApproved: false,  // 💡 NO ：管理者がまだ調整中で未承認。
        currentMonthShifts: [
            { date: "2026-06-04", mode: "休み" },
            { date: "2026-06-16", mode: "休み" },
            { date: "2026-06-20", mode: "遅番" }
        ]
    },
    {
        id: 3,
        name: "田中kkkkkkkkkkkkk",
        isSubmitted: false, // 💡 NO ：そもそもまだ今月のシフトを出してない！
        isApproved: false,  // 💡 NO ：出してないので、もちろん未承認。
        currentMonthShifts: [
            { date: "2026-06-09", mode: "日勤" },
            { date: "2026-06-29", mode: "休み" },
            { date: "2026-06-30", mode: "遅番" } // ※6月は30日までなので、30日に修正しておきました！
        ]
    }
];

function CalendarYearAndMonth() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/YearMonth', {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(response => {
            if (response.ok) {
                console.log("曜日OK");
                return response.json();
            }
            throw new Error('通信エラー');
        })
        .then(ymdata => {
            console.log(ymdata);
            CalendarData(ymdata);
        })
}
function CalendarData(ymdata) {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/calendarnau', {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
                console.log("できたよ3");
            }
            throw new Error('通信エラー');
            console.log("できたよ4");
        })
        .then(date => {

            console.log('これデータ', date);
            CreateCalend(date, ymdata)



        })

}

// function CalendarEvetn(){
//     fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/Event',{
//         headers: {
//             'ngrok-skip-browser-warning' : 'true'
//         }
//     })
//         .then(response => {
//             if (response.ok){
//                 return response.json();
//             }
//             throw new Error('通信エラー');
//         })
//         .then(event => {
//             console.log(event);

//         })
// }
//月の判定ができてないよ

function CreateCalend(date, ymdata) {
    const tbody = document.getElementById('shift_name');
    const tbody2 = document.getElementById('shift_create');
    tbody.innerHTML = ''; // 一度中身をクリア
    console.log("できたよ１1");
    console.log('できたよ２2');
    console.log(ymdata);


    // const eventSetting = [
    //     { key: 'isSubmitted', TrueText: 'OK', FalseText: 'NO' },
    //     { key: 'isApproved', TrueText: 'OK', FalseText: 'NO' }
    // ];


    const days = new Date(ymdata.year, ymdata.month, 0).getDate();
    const thn = document.createElement('th')
    thn.classList.add('name');
    thn.textContent = "名前";
    tbody.appendChild(thn);

    for (let i = 1; i <= days; i++) {//日を入れている
        const th = document.createElement('th')
        th.textContent = i;
        tbody.appendChild(th);
    }

    // eventSetting.forEach(setting => {//イベントの処理
    //     const the = document.createElement('th')
    //     the.classList.add('yasumi');
    //     the.textContent = "sssssss";
    //     tbody.appendChild(the);
    // });


    date.forEach(staff => {//初期値がいる名前追加
        console.log(staff);
        const td = document.createElement('td')
        const tr = document.createElement('tr')
        td.textContent = staff.name;

        const shiftLookup = {};
        if (staff.day != null) {
            console.log("辞書処理");
            staff.day.forEach(shift => {//currentMonthShiftsの中にdateとmodeがあるからshiftにその階層をさすようにforEachを書かなくてはいけない
                shiftLookup[shift.date] = shift.mode;
            });
        }

        tbody2.appendChild(tr);
        tr.appendChild(td);


        const count = tbody.childElementCount;




        for (let i = 1; i <= days; i++) {//曜日に出勤日と希望休を入れるところ
            // const shiftTd = document.createElement('td');
            // shiftTd.textContent = "希望";
            // tr.appendChild(shiftTd);
            // console.log(i);
            // console.log(i);
            const shiftTd = document.createElement('td');
            const dateStr = `${ymdata.year}-${String(ymdata.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;//わかんない
            const yer = shiftLookup[dateStr] || "";
            shiftTd.textContent = yer;
            tr.appendChild(shiftTd);

        }

        // eventSetting.forEach(setting => {//イベントの参加か参加しないかの処理
        //     const eventTd = document.createElement('td');

        //     if (staff[setting.key] === true) {
        //         eventTd.textContent = setting.TrueText;
        //     } else {
        //         eventTd.textContent = setting.FalseText;
        //     }
        //     tr.appendChild(eventTd);
        // })

    });



    // tbody.appendChild(tr)
}




// 💡 画面を切り替えるためのJavaScriptスイッチ
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

// 画面が開いたら自動でデータを読み込む（元のロジックそのまま）
document.addEventListener('DOMContentLoaded', function () {
    loadShifts();
    CalendarYearAndMonth();
});











function loadShifts() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/shift', {
        method: 'GET',
        headers: {

            'ngrok-skip-browser-warning': 'true'
        }
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
                        // C#のDateTime型は「2026-06-15T00:00:00」のように時間がくっついてくることがあるので、
                        // .split('T')[0] を挟んで日付だけに整えてあげるとさらに見やすくなります！
                        const cleanDate = item.date.split('T')[0];
                        return `${cleanDate} (${item.mode})`; // 例：「2026-06-15 (休み)」
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

//開始日と終了日をshift_periodsからとってくる処理
// const dateStr = `${2026}-${String(6).padStart(2, '0')}-${String(i).padStart(2, '0')}`;//わかんない
// const days = new Date(2026, 7, 0).getDate();
// const thn = document.createElement('th')
// thn.classList.add('name');
// thn.textContent = "名前";
// tbody.appendChild(thn);

// for (let i = 1; i <= days; i++) {//日を入れている
//     const th = document.createElement('th')
//     th.textContent = i;
//     tbody.appendChild(th);
// }ここら辺
//イベント追加処理
















// function CalendarData() {
//     fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/admin/calendarnau', {
//         headers: {
//             'ngrok-skip-browser-warning': 'true'
//         }
//     })
//         .then(response => {
//             if (response.ok) {
//                 return response.json();
//                 console.log("できたよ3");
//             }
//             throw new Error('通信エラー');
//             console.log("できたよ4");
//         })
//         .then(date => {
//             console.log('これデータ', date);
//             // InCalendarNauList = [];
//             date.forEach(datename => {
//                 // SingreDate =[];

//                 datename.day.forEach(dates => {
//                     console.log('日付', dates.date),
//                         console.log('種類', dates.mode)
//                     //     var InSingreDate = new
//                     //     {
//                     //         date = dates.date,
//                     //         mode = dates.mode
//                     //     }
//                     // SingreDate.Add(InSingreDate) ;
//                 });
//                 // var SingreData = new{
//                 //     name = datename.name,
//                 //     date = InSingreDate
//                 // }
//                 // InCalendarNauList.Add(SingreData)

//             });

//         })

// }

// //月の判定ができてないよ

// document.addEventListener('DOMContentLoaded', function () {
//     // CalendarNauList = [];
//     //CalendarNaulist = CalendarData();
//     CalendarData();
//     const tbody = document.getElementById('shift_name');
//     const tbody2 = document.getElementById('shift_create');
//     tbody.innerHTML = ''; // 一度中身をクリア
//     console.log("できたよ１1");
//     console.log('できたよ２2');

//     // const eventSetting = [
//     //     { key: 'isSubmitted', TrueText: 'OK', FalseText: 'NO' },
//     //     { key: 'isApproved', TrueText: 'OK', FalseText: 'NO' }
//     // ];


//     const days = new Date(2026, 6, 0).getDate();
//     const thn = document.createElement('th')
//     thn.classList.add('name');
//     thn.textContent = "名前";
//     tbody.appendChild(thn);

//     for (let i = 1; i <= days; i++) {//日を入れている
//         const th = document.createElement('th')
//         th.textContent = i;
//         tbody.appendChild(th);
//     }

//     // eventSetting.forEach(setting => {//イベントの処理
//     //     const the = document.createElement('th')
//     //     the.classList.add('yasumi');
//     //     the.textContent = "sssssss";
//     //     tbody.appendChild(the);
//     // });


//     staffShifts.forEach(staff => {//初期値がいる名前追加

//         const td = document.createElement('td')
//         const tr = document.createElement('tr')
//         td.textContent = staff.name;

//         const shiftLookup = {};
//         staff.currentMonthShifts.forEach(shift => {//currentMonthShiftsの中にdateとmodeがあるからshiftにその階層をさすようにforEachを書かなくてはいけない
//             shiftLookup[shift.date] = shift.mode;
//         });

//         tbody2.appendChild(tr);
//         tr.appendChild(td);


//         const count = tbody.childElementCount;




//         for (let i = 1; i <= days; i++) {//曜日に出勤日と希望休を入れるところ
//             // const shiftTd = document.createElement('td');
//             // shiftTd.textContent = "希望";
//             // tr.appendChild(shiftTd);

//             const shiftTd = document.createElement('td');
//             const dateStr = `${2026}-${String(6).padStart(2, '0')}-${String(i).padStart(2, '0')}`;//わかんない
//             const yer = shiftLookup[dateStr] || "";
//             shiftTd.textContent = yer;
//             tr.appendChild(shiftTd);

//         }

//         // eventSetting.forEach(setting => {//イベントの参加か参加しないかの処理
//         //     const eventTd = document.createElement('td');

//         //     if (staff[setting.key] === true) {
//         //         eventTd.textContent = setting.TrueText;
//         //     } else {
//         //         eventTd.textContent = setting.FalseText;
//         //     }
//         //     tr.appendChild(eventTd);
//         // })

//     });



//     // tbody.appendChild(tr)
// });
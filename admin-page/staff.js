

let JOB_MASTER = [];
const ROLE_MASTER = ['正社員', '準社員', 'パート'];
async function fetchJobMaster() {
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/joblist',{
        method: 'GET',
            headers: {

            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(response =>{
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 💡 レスポンス本文をJSONオブジェクトとして解析
        return response.json();
    })
    .then(data=>{
        // alert(data);
       JOB_MASTER =  data;
    })
}
// 現在「編集モード」かどうかを管理するフラグ
let isEditMode = false;

// 画面表示関数（引数でモードを判定）
function showStaffList() {
    const listEl = document.getElementById('staff-list');
    listEl.innerHTML = '';
    fetch('https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/stafflist', {
        method: 'GET',
        headers: {

            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // 💡 レスポンス本文をJSONオブジェクトとして解析
            return response.json();
        })
        .then(data => {
            const groupedStaffs = data.reduce((acc, current) => {
                const existingStaff = acc.find(item => item.id === current.id);
                if (existingStaff) {
                    if (!existingStaff.jobs.includes(current.job_name)) {
                        existingStaff.jobs.push(current.job_name);
                    }
                } else {
                    acc.push({
                        id: current.id,
                        name: current.staff_name,
                        role: current.role,
                        jobs: [current.job_name]
                    });
                }
                return acc;
            }, []);

        // ② 描画処理
        groupedStaffs.forEach(staff => {
            const li = document.createElement('li');
            li.className = 'staff-card';

            if (!isEditMode) {
                // --------------------------------------------------
                // A. 通常の閲覧モード（テキスト表示）
                // --------------------------------------------------
                const jobBadges = staff.jobs
                    .map(job => `<span class="job-badge">${job}</span>`)
                    .join(' ');

                li.innerHTML = `
                <div class="staff-header">
                    <span class="staff-id">ID: ${staff.id}</span>
                    <strong class="staff-name">${staff.name}</strong>
                    <span class="role-badge">${staff.role}</span>
                </div>
                <div class="staff-jobs">
                    <span class="job-label">担当職種：</span>${jobBadges}
                </div>
            `;
            } else {
                // --------------------------------------------------
                // B. 編集モード（フォーム・プルダウン表示）
                // --------------------------------------------------
                const roleOptions = ROLE_MASTER.map(role =>
                    `<option value="${role}" ${role === staff.role ? 'selected' : ''}>${role}</option>`
                ).join('');

                const addJobOptions = JOB_MASTER//回して職種を追加している
                    .map(job => `<option value="${job}">${job}</option>`)
                    .join('') + `<option value="__NEW__">＋ 新しい職種を追加...</option>`;//joinを消すことでカンマが消えて綺麗になる

                // 登録中の職種（×ボタン付きバッジ）
                const jobBadges = staff.jobs.map(job => `
                    <span class="edit-job-badge">
                        ${job}
                        <button type="button" class="btn-delete-job" onclick="deleteJobFromStaff(${staff.id}, '${job}', this)">×</button>
                    </span>
                `).join('');

                li.innerHTML = `
                    <div class="edit-staff-form" data-id="${staff.id}">
                        <div class="edit-row">
                            <span class="staff-id">ID: ${staff.id}</span>
                            
                            <!-- 名前変更インプット -->
                            <input type="text" class="edit-input-name" value="${staff.name}" placeholder="名前">
                            
                            <!-- 区分プルダウン -->
                            <select class="edit-select-role" onchange="updateRole(${staff.id},this.value)">
                                ${roleOptions}
                            </select>
                        </div>

                        <div class="edit-row-jobs">
                            <span class="job-label">担当職種：</span>
                            <div class="edit-job-list" id="job-container-${staff.id}">
                                ${jobBadges}
                            </div>
                        </div>

                        <!-- 職種追加プルダウン -->
                        <div class="add-job-area">
                            <select class="add-job-select" id="add-job-select-${staff.id}" " onchange="InJob('${staff.id}')">
                                <option value="" disabled selected>＋ 職種を追加...</option>
                                ${addJobOptions}
                            </select>
                            <button type="button" class="btn-add-job" onclick="addJobToStaff('${staff.id}')">追加</button>
                        </div>
                    </div>
                `;
            }

            listEl.appendChild(li);
        });
        })
        .catch(error => {
            console.error('データ取得エラー:', error);
        });
}
// --------------------------------------------------
// 職種を動的に追加する関数
// --------------------------------------------------
async function addJobToStaff(staffId) {
        // const selectEl = document.getElementById(`add-job-select-${staffId}`);
        // const selectedJob = selectEl.value;
        // if (!selectedJob) return;

      
        // // 💡 「＋ 新しい職種を追加...」が選択された場合の処理
        // if (selectedJob === '__NEW__') {
        //     const newJobName = prompt('新しい職種名を入力してください：');

        //     // キャンセルされたか、未入力の場合は元に戻す
        //     if (!newJobName || !newJobName.trim()) {
        //         selectEl.selectedIndex = 0;
        //         return;
        //     }

        //     const trimmedJobName = newJobName.trim();

        //     try {
        //         const response = await fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/injobmaster?jobname=${encodeURIComponent(trimmedJobName)}`, {
        //             method: 'GET',
        //             headers: { 'ngrok-skip-browser-warning': 'true' }
        //         });

        //         if (!response.ok) throw new Error('マスター追加に失敗しました');

        //         // 2. メモリ上のマスター配列にも追加
        //         if (!JOB_MASTER.includes(trimmedJobName)) {
        //             JOB_MASTER.push(trimmedJobName);
        //         }

        //         selectedJob = trimmedJobName;
        //     } catch (e) {
        //         alert('職種マスターの登録に失敗しました。');
        //         selectEl.selectedIndex = 0;
        //         return;
        //     }

            
        // }

        const container = document.getElementById(`job-container-${staffId}`);

        // 1. 重複チェック（既存のバッジテキスト内に選択された職種名があるか）
        const existingBadges = Array.from(container.querySelectorAll('.edit-job-badge'));
        const exists = existingBadges.some(el => el.textContent.includes(selectedJob));
        if (exists) {
            alert('すでに存在する職種です。');
            return;
        }


        // 2. API（POST）通信
        fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/injob?staffId=${staffId}&jobname=${encodeURIComponent(selectedJob)}`, {
            method: 'POST',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('追加に失敗しました');
                return response.json();
            })
            .then(data => {
                // 3. DB追加成功後に、×ボタン付きバッジ要素を作成してDOMに追加
                const newBadge = document.createElement('span');
                newBadge.className = 'edit-job-badge';
                newBadge.innerHTML = `
                ${selectedJob}
                <button type="button" class="btn-delete-job" onclick="deleteJobFromStaff(${staffId}, '${selectedJob}', this)">×</button>
            `;

                container.appendChild(newBadge);
                
                // 選択肢（プルダウン）を初期状態に戻す
                selectEl.selectedIndex = 0;
            })
            .catch(error => {
                console.error('職種追加エラー:', error);
                alert('職種の追加に失敗しました。');
            });
    }
async function InJob(staffId) {//新しい職種を追加する処理
    const selectEl = document.getElementById(`add-job-select-${staffId}`);
    const selectedJob = selectEl.value;
    if (!selectedJob) return;


    // 💡 「＋ 新しい職種を追加...」が選択された場合の処理
    if (selectedJob === '__NEW__') {
        const newJobName = prompt('新しい職種名を入力してください：');

        // キャンセルされたか、未入力の場合は元に戻す
        if (!newJobName || !newJobName.trim()) {
            selectEl.selectedIndex = 0;
            return;
        }

        const trimmedJobName = newJobName.trim();

        try {
            const response = await fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/injobmaster?jobname=${encodeURIComponent(trimmedJobName)}`, {
                method: 'GET',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });

            if (!response.ok) throw new Error('マスター追加に失敗しました');

            // 2. メモリ上のマスター配列にも追加
            if (!JOB_MASTER.includes(trimmedJobName)) {
                JOB_MASTER.push(trimmedJobName);
            }

            selectedJob = trimmedJobName;
        } catch (e) {
            alert('職種マスターの登録に失敗しました。');
            selectEl.selectedIndex = 0;
            return;
        }


    }
}

function updateRole(staffId,rolName){
    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/updaterole?staffId=${staffId}&rolename=${rolName}`, {
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('ロールの更新に失敗しました');
            return response.json();
        })
        .then(data => {
            alert(data.message);
            // DB削除成功後に画面からバッジを取り除く
        })
        .catch(error => {
            console.error('職種削除エラー:', error);
            alert('職種の削除に失敗しました。');
        });
}
function deleteJobFromStaff(staffId, jobName, buttonEl) {//buttonELの認識は押されたバツから一番近い枠削除するために使う職種の削除処理
    if (!confirm(`「${jobName}」を削除しますか？`)) return;

    fetch(`https://overplay-patriarch-daffodil.ngrok-free.dev/api/staff/deljob?staffId=${staffId}&jobname=${jobName}`, {
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('削除に失敗しました');
            return response.json();
        })
        .then(data => {
            alert(data.message);
            // DB削除成功後に画面からバッジを取り除く
            const badgeEl = buttonEl.closest('.edit-job-badge');
            if (badgeEl) badgeEl.remove();
        })
        .catch(error => {
            console.error('職種削除エラー:', error);
            alert('職種の削除に失敗しました。');
        });
}
// --------------------------------------------------
// イベント設定：編集ボタン押下でモード切替
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    fetchJobMaster()
    const editBtn = document.getElementById('staff-Edit-button');

    editBtn.addEventListener('click', () => {
        // モードを反転
        isEditMode = !isEditMode;

        if (isEditMode) {
            editBtn.textContent = 'スタッフ編集終了';
            editBtn.classList.add('editing');
        } else {
            editBtn.textContent = 'スタッフ編集';
            editBtn.classList.remove('editing');
            // ※ここでC# APIへUPDATE処理を呼び出す処理を接続できます
        }

        // 再描画
        showStaffList();
    });

    // 初回描画
    showStaffList();
});



// 2. 画面にリストを表示する関数
// function showStaffList(data) {
//     const listEl = document.getElementById('staff-list');
//     listEl.innerHTML = '';

//     // ① IDごとにデータをグループ化（職種を配列にまとめる）
//     const groupedStaffs = data.reduce((acc, current) => {//reduceが複数の中から集約したやつと今からのやつを比較しaccにはまとめたデータcurrentには今から追加するデータが入る
//         const existingStaff = acc.find(item => item.id === current.id);//今までのやつと今から取得する関数のidを比較
//         if (existingStaff) {
//             existingStaff.jobs.push(current.job_name);//あるならここで同じ配列に追加詳しく調べてもいいよ
//         } else {
//             acc.push({
//                 id: current.id,
//                 name: current.staff_name,
//                 role: current.role,
//                 jobs: [current.job_name] // 配列として保持
//             });
//         }
//         return acc;
//     }, []);

//     // ② DOMの生成
//     groupedStaffs.forEach(staff => {
//         const li = document.createElement('li');
//         li.className = 'staff-card';

//         // 複数の職種をカンマ区切り、またはバッジ形式でまとめる
//         const jobBadges = staff.jobs
//             .map(job => `<span class="job-badge">${job}</span>`)
//             .join(' ');

//         li.innerHTML = `
//             <div class="staff-header">
//                 <span class="staff-id">ID: ${staff.id}</span>
//                 <strong class="staff-name">${staff.name}</strong>
//                 <span class="role-badge">${staff.role}</span>
//             </div>
//             <div class="staff-jobs">
//                 <span class="job-label">担当職種：</span>${jobBadges}
//             </div>
//             <div>
                
//             </div>
//         `;
//         listEl.appendChild(li);
//     });
// }
// document.addEventListener('DOMContentLoaded', () => {
//     showStaffList(rawDataFromDb);
// });
// 実行


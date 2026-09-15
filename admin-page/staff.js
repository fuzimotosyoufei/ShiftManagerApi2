const rawDataFromDb = [
    { id: '1', staff_name: '山田 太郎', role: 'アルバイト', job_name: 'ホール' },
    { id: '1', staff_name: '山田 太郎', role: 'アルバイト', job_name: 'キッチン' }, // ID 1 は複数職種
    { id: '2', staff_name: '佐藤 花子', role: '正社員', job_name: 'キッチン' },
    { id: '3', staff_name: '鈴木 一郎', role: 'パート', job_name: 'レジ' }
];
const JOB_MASTER = ['ホール', 'キッチン', 'レジ', '仕込み', '清掃'];
const ROLE_MASTER = ['正社員', 'パート', 'アルバイト'];

// 現在「編集モード」かどうかを管理するフラグ
let isEditMode = false;

// 画面表示関数（引数でモードを判定）
function showStaffList(data) {
    const listEl = document.getElementById('staff-list');
    listEl.innerHTML = '';

    // ① IDごとにグループ化
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
            // 区分のプルダウン選択肢
            const roleOptions = ROLE_MASTER.map(role =>
                `<option value="${role}" ${role === staff.role ? 'selected' : ''}>${role}</option>`
            ).join('');

            // 追加用職種プルダウンの選択肢
            const addJobOptions = JOB_MASTER
                .map(job => `<option value="${job}">${job}</option>`)
                .join('');

            // 登録中の職種（チェックボックス ＋ 削除用ボタン）
            const jobCheckboxes = staff.jobs.map(job => `
                <label class="edit-job-item">
                    <input type="checkbox" name="job_${staff.id}" value="${job}" checked>
                    ${job}
                </label>
            `).join('');

            li.innerHTML = `
                <div class="edit-staff-form" data-id="${staff.id}">
                    <div class="edit-row">
                        <span class="staff-id">ID: ${staff.id}</span>
                        
                        <!-- 名前変更インプット -->
                        <input type="text" class="edit-input-name" value="${staff.name}" placeholder="名前">
                        
                        <!-- 区分プルダウン -->
                        <select class="edit-select-role">
                            ${roleOptions}
                        </select>
                    </div>

                    <div class="edit-row-jobs">
                        <span class="job-label">担当職種：</span>
                        <div class="edit-job-list" id="job-container-${staff.id}">
                            ${jobCheckboxes}
                        </div>
                    </div>

                    <!-- 職種追加プルダウン -->
                    <div class="add-job-area">
                        <select class="add-job-select" id="add-job-select-${staff.id}">
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
}

// --------------------------------------------------
// 職種を動的に追加する関数
// --------------------------------------------------
function addJobToStaff(staffId) {
    const selectEl = document.getElementById(`add-job-select-${staffId}`);
    const selectedJob = selectEl.value;
    if (!selectedJob) return;

    const container = document.getElementById(`job-container-${staffId}`);

    // すでに存在するチェックボックスか確認
    const existing = container.querySelector(`input[value="${selectedJob}"]`);
    if (existing) {
        existing.checked = true; // チェックを入れる
        alert('すでに存在する職種です。');
        return;
    }

    // 新しいチェックボックス項目を動的に追加
    const newLabel = document.createElement('label');
    newLabel.className = 'edit-job-item';
    newLabel.innerHTML = `
        <input type="checkbox" name="job_${staffId}" value="${selectedJob}" checked>
        ${selectedJob}
    `;
    container.appendChild(newLabel);

    // 選択肢をリセット
    selectEl.selectedIndex = 0;
}

// --------------------------------------------------
// イベント設定：編集ボタン押下でモード切替
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('staff-Edit-button');

    editBtn.addEventListener('click', () => {
        // モードを反転
        isEditMode = !isEditMode;

        if (isEditMode) {
            editBtn.textContent = '編集を保存/終了';
            editBtn.classList.add('editing');
        } else {
            editBtn.textContent = 'スタッフ編集';
            editBtn.classList.remove('editing');
            // ※ここでC# APIへUPDATE処理を呼び出す処理を接続できます
        }

        // 再描画
        showStaffList(rawDataFromDb);
    });

    // 初回描画
    showStaffList(rawDataFromDb);
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


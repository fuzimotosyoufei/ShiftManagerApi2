const rawDataFromDb = [
    { id: '1', staff_name: '山田 太郎', role: 'アルバイト', job_name: 'ホール' },
    { id: '1', staff_name: '山田 太郎', role: 'アルバイト', job_name: 'キッチン' }, // ID 1 は複数職種
    { id: '2', staff_name: '佐藤 花子', role: '正社員', job_name: 'キッチン' },
    { id: '3', staff_name: '鈴木 一郎', role: 'パート', job_name: 'レジ' }
];

// 2. 画面にリストを表示する関数
function showStaffList(data) {
    const listEl = document.getElementById('staff-list');
    listEl.innerHTML = '';

    // ① IDごとにデータをグループ化（職種を配列にまとめる）
    const groupedStaffs = data.reduce((acc, current) => {//reduceが複数の中から集約したやつと今からのやつを比較しaccにはまとめたデータcurrentには今から追加するデータが入る
        const existingStaff = acc.find(item => item.id === current.id);//今までのやつと今から取得する関数のidを比較
        if (existingStaff) {
            existingStaff.jobs.push(current.job_name);//あるならここで同じ配列に追加詳しく調べてもいいよ
        } else {
            acc.push({
                id: current.id,
                name: current.staff_name,
                role: current.role,
                jobs: [current.job_name] // 配列として保持
            });
        }
        return acc;
    }, []);

    // ② DOMの生成
    groupedStaffs.forEach(staff => {
        const li = document.createElement('li');
        li.className = 'staff-card';

        // 複数の職種をカンマ区切り、またはバッジ形式でまとめる
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
        listEl.appendChild(li);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    showStaffList(rawDataFromDb);
});
// 実行


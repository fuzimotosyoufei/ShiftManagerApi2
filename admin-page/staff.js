// 1. デモ用データ（データベースの代わり）
const demoStaffs = [
    { name: '山田 太郎', job: 'ホール', role: 'アルバイト', status: '承認待ち' },
    { name: '佐藤 花子', job: 'キッチン', role: '正社員', status: '承認済み' },
    { name: '鈴木 一郎', job: 'レジ', role: 'パート', status: '却下' }
];

// 2. 画面にリストを表示する関数
function showStaffList() {
    const listEl = document.getElementById('staff-list');
    listEl.innerHTML = ''; // 一度中身を空にする
    demoStaffs.forEach(staff => {
        const li = document.createElement('li');
        li.textContent = `${staff.name} | 職種: ${staff.job} | 区分: ${staff.role} | 状態: ${staff.status}`;
        listEl.appendChild(li);
    })
    document.addEventListener('DOMContentLoaded', () => {
        showStaffList();
    });
}
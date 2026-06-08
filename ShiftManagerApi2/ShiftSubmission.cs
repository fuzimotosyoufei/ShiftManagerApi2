using System.Collections.Generic;

namespace ShiftManagerApi2
{
    public class ShiftDateItem
    {
        public string Date { get; set; } = string.Empty;
        public string Stamp { set; get; } = string.Empty;
    }
    public class ShiftSubmission
    {
        // 👤 スタッフ名 (userName) を受け取る
        public string Name { get; set; } = string.Empty;

        public string Memo { get; set; } = string.Empty;

        // 📅 選択された日付のリスト (sortedDates) を受け取る
        public List<ShiftDateItem> Dates { get; set; } = new List<ShiftDateItem>();
    }
}

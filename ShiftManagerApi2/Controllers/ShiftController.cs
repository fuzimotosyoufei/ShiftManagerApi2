using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace ShiftManagerApi2.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/shift というURLになります
    public class ShiftController:ControllerBase

    {

        // 📥 届いたシフトデータを一時的に溜めておくためのリスト（メモリ上の簡易DB）
        private static readonly List<ShiftSubmission> _shiftList = new List<ShiftSubmission>();

        // ① シフト希望を「登録」する窓口（カレンダー画面用）
        [HttpPost]
        public IActionResult SubmitShift([FromBody] ShiftSubmission data)
        {
            if (data == null || string.IsNullOrEmpty(data.Name) || data.Dates.Count == 0)
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。" });
            }

            // リストにデータを追加
            _shiftList.Add(data);

            // HTML側の alert(data.message) に表示される文字をお返しする
            return Ok(new { message = $"🎉 {data.Name} さんのシフト希望を登録しました！" });
        }

        // ② 登録されたシフトを「全件取得」する窓口（管理画面用）
        [HttpGet]
        public IActionResult GetAllShifts()
        {
            // 管理画面の allShifts.forEach(...) に配列データをそのまま渡す
            return Ok(_shiftList);
        }
    }
}

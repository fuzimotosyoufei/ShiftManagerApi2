using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Npgsql;
using System.Security.Cryptography;
namespace ShiftManagerApi2.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/shift というURLになります
    public class ShiftController : ControllerBase

    {

        // 📥 届いたシフトデータを一時的に溜めておくためのリスト（メモリ上の簡易DB）
        private static readonly List<ShiftSubmission> _shiftList = new List<ShiftSubmission>();

        private readonly DatabaseConnection _db = new DatabaseConnection();
       

        // ① シフト希望を「登録」する窓口（カレンダー画面用）
        [HttpPost]
        public IActionResult SubmitShift([FromBody] ShiftSubmission data)//IActionResultは判定結果を返す、FromBodyは送られてきたデータを自動的にShiftSbmissonがたにしてdataに入れる役割になっている。
        {
            string a = null;
            if (data == null || string.IsNullOrEmpty(data.Name))
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。" });
            }

            try
            {
                using (var conn = _db.CreateConnection())
                {
                    string sql = "SELECT line_id FROM staff";
                    using (var cmd = new NpgsqlCommand(sql, conn))
                    using (var reader = cmd.ExecuteReader())
                    {
                        

                        while (reader.Read())//Readはデータを勝手に一つ進めてくれる
                        {
                            string DB_Lineid = reader.GetString(0);
                            if (DB_Lineid == data.Lineid)
                            {
                                // リストにデータを追加
                                a = DB_Lineid;
                                // HTML側の alert(data.message) に表示される文字をお返しする
                             
                                break;
                            }
                            else
                            {
                                a = data.Lineid;
                            }
                        }
                        
                       
                    }
                }
            }
            catch(NpgsqlException ex)
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。" });
            }

            _shiftList.Add(data);

            // HTML側の alert(data.message) に表示される文字をお返しする
            return Ok(new { message = $"🎉 {data.Name} {a} さんのシフト希望を登録しました！555555555555" });


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


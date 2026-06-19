using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Collections.Generic;
using System.Security.Cryptography;
using static System.Runtime.InteropServices.JavaScript.JSType;
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
            string a = "d";//確かめるよう
            int? staff_id = 0;//スタッフIDの使いまわしのため
            int reqs_id = 0;

            if (data == null || string.IsNullOrEmpty(data.Name))
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。" });
            }
            //1ラインのIDがあるかを足し舞えている
            try//データベースの処理
            {
                using (var conn = _db.CreateConnection())
                {
                    staff_id = GetID(data.id);
                    reqs_id = GetReqID(staff_id ?? 0, data.Year, data.Month) ?? 0; //??idがnullのときは0を入れるようにしている、最後の??は結果がnullなら0を入れる処理。
                                                                                  //if (staff_id !=0)
                    if (reqs_id != 0)
                    {
                        a = Update_Req_dates(reqs_id, data.Memo, data.Dates);//ここに更新処理を書く、提出日と備考欄の更新処理とshift_datesの削除とshift_datesへの新規登録の処理を書く
                    }
                    else
                    {
                        a = "たぶんないよ";//新規に入れる処理を書く
                    }
                 

                }
            }

            

            catch (NpgsqlException ex)
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。{a}" });
            }

            _shiftList.Add(data);

            // HTML側の alert(data.message) に表示される文字をお返しする
            return Ok(new { message = $"🎉 {data.Year}{data.Month} {a} さんのシフト希望を登録しました！555555555555" });

          }




        //コントローラーにメゾットをpublicにしたら外部に公開するメゾットだとプログラムが勘違いするからprivateにしてこのプログラムでしか使わないprivateにしなくてはいけない  [NonAction]とかしたらいいかも
        private int? GetID(string line_id)
        {
            using (var conn = _db.CreateConnection())
            {
                string staff_sql = "SELECT id FROM staff WHERE line_id = @lineid";
                using (var staff_cmd = new NpgsqlCommand(staff_sql, conn))
                {
                    staff_cmd.Parameters.AddWithValue("@lineid", line_id);

                    var result = staff_cmd.ExecuteScalar();
                    if(result == null || result == DBNull.Value)
                    {
                        return InsertLineId(line_id);
                    }
                    return Convert.ToInt32(result);
                }

            }
        }
        private int? GetReqID(int staff_id ,int year, int month)
        {
            using(var conn = _db.CreateConnection())
            {
                string reqs_sql = "SELECT id FROM shift_reqs WHERE staff_id=@staff_id AND year=@year AND month=@month";
                using (var reqs_cmd = new NpgsqlCommand(reqs_sql,conn))
                {
                   reqs_cmd.Parameters.AddWithValue("@staff_id", staff_id);
                   reqs_cmd.Parameters.AddWithValue("@year", year);   
                   reqs_cmd.Parameters.AddWithValue("@month", month);
    
                      var result = reqs_cmd.ExecuteScalar();
                      if(result == null || result == DBNull.Value)
                      {
                         return null;//reqs_idの登録処理に行く
                    　}
                      return Convert.ToInt32(result);
                }
            }
        }
        private string Update_Req_dates(int reqs_id, string Memo,List<ShiftDateItem> Dates)
        {
            using (var conn = _db.CreateConnection())
            {
                string update_sql = "UPDATE shift_reqs SET memo = @memo, created_at = NOW() WHERE id = @id";
                using (var update_cmd = new NpgsqlCommand(update_sql, conn))
                {
                    update_cmd.Parameters.AddWithValue("@memo",Memo);
                    update_cmd.Parameters.AddWithValue("@id", reqs_id);

                    update_cmd.ExecuteNonQuery();
                   

                }
                string dlete_sql = "DELETE FROM shift_req_dates WHERE req_id = @id";

                using (var dlete_cmd = new NpgsqlCommand(dlete_sql, conn))
                {
                    dlete_cmd.Parameters.AddWithValue("@id", reqs_id);
                    dlete_cmd.ExecuteNonQuery();

                }
                string insert_sql = "INSERT INTO shift_req_dates (req_id, date,mode) VALUES (@req_id, @date,@mode)";
                using (var insert_cmd = new NpgsqlCommand(insert_sql, conn))
                {
                    foreach (var date in Dates)
                    {
                        insert_cmd.Parameters.Clear(); // Parametersは@に対してどんどん追加していくので、ループの中で毎回クリアする必要がある
                        insert_cmd.Parameters.AddWithValue("@req_id", reqs_id);
                        //DateTime parsedDate = DateTime.Parse(date);
                        insert_cmd.Parameters.AddWithValue("@date", date.Date);
                        insert_cmd.Parameters.AddWithValue("@mode", date.Mode);
                        insert_cmd.ExecuteNonQuery();
                    }
                    return  "多分変更で来たよ";
                }
            }
        }

        private int? InsertLineId(string line_id)
        {
            using (var conn = _db.CreateConnection())
            {
                string insert_sql = "INSERT INTO staff (staff_name, line_id, role, position) VALUES ('なすび', @line_id, '介護スタッフ', 'パート')　RETURNING id";//選ばせる画面に遷移するようにする　決まった連番のIDを返してくれる
                using (var insert_cmd = new NpgsqlCommand(insert_sql,conn))
                {
                    insert_cmd.Parameters.AddWithValue("@line_id", line_id);
                    var newId = insert_cmd.ExecuteScalar();

                    return Convert.ToInt32(newId); // 💡 GetIDに戻らず、その場で新しいIDを返してあげるので100%安全！
                }
            }
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


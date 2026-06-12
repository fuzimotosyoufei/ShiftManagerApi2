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
            string a = "d";//確かめるよう
            int staff_id = 0;//スタッフIDの使いまわしのため
            int submiision_id = 0;

            if (data == null || string.IsNullOrEmpty(data.Name))
            {
                return BadRequest(new { message = "データが正しく送信されませんでした。" });
            }
            //1ラインのIDがあるかを足し舞えている
            try//データベースの処理
            {
                using (var conn = _db.CreateConnection())
                {
                     string staff_sql = "SELECT id FROM staff WHERE line_id = @lineID";
                     using (var staff_cmd = new NpgsqlCommand(staff_sql, conn))
                     {
                           staff_cmd.Parameters.AddWithValue("@lineID", data.id);

                           var c = staff_cmd.ExecuteScalar();

                        if (c != null && c != DBNull.Value)
                        {
                            staff_id = Convert.ToInt32(c);
                        }
                     }

                    if (staff_id !=0)
                    {
                        a = "あるよ";
                        string submiision_sql = "SELECT id FROM shift_submissions WHERE staff_id = @staff_id AND year = @year AND month = @month";
                        using (var submiision_cmd = new NpgsqlCommand(submiision_sql, conn))
                        {

                            submiision_cmd.Parameters.AddWithValue("@staff_id",staff_id);
                            submiision_cmd.Parameters.AddWithValue("@year",data.Year);
                            submiision_cmd.Parameters.AddWithValue("@month",data.Month);
                            var submiision_DB = submiision_cmd.ExecuteScalar();

                            if(submiision_DB != null)//submiisionの提出日と備考欄の更新処理
                            {
                                submiision_id = Convert.ToInt32(submiision_DB);
                                a = "登録してたよ";



                            }
                            //submiisionIDの作成
                            else
                            {
                                a = "まだ登録してないよ";
                            }



                        }
                        if(submiision_id != 0)//提出日と備考欄の更新処理
                        {
                            string update_sql = "UPDATE shift_submissions SET memo = @memo, created_at= NOW() WHERE id = @id";
                            using (var update_cmd = new NpgsqlCommand(update_sql, conn))
                            {
                                update_cmd.Parameters.AddWithValue("@memo", data.Memo);
                                update_cmd.Parameters.AddWithValue("@id",submiision_id);

                                update_cmd.ExecuteNonQuery();
                                a = "変更したよ";

                            }
                            string update_sq = "SELECT memo FROM shift_submissions WHERE id = @id  ";
                            using (var update_cmd = new NpgsqlCommand(update_sq, conn))
                            {
                                update_cmd.Parameters.AddWithValue("@id", submiision_id);
                                var submiision_DB = update_cmd.ExecuteScalar();

                                string submission_text = Convert.ToString(submiision_DB);
                                a = "変更したよ"+ submission_text;

                            }
                            string dlete_sql = "DELETE FROM shift_dates WHERE submission_id = @id";

                            using(var dlete_cmd = new NpgsqlCommand(dlete_sql,conn))
                            {
                                dlete_cmd.Parameters.AddWithValue("@id", submiision_id);
                                dlete_cmd.ExecuteNonQuery();

                            }
                            string insert_sql = "INSERT INTO shift_dates (submission_id, date) VALUES (@submission_id, @date)";

                            using (var insert_cmd = new NpgsqlCommand(insert_sql, conn))
                            {
                                foreach (var date in data.Dates)
                                {
                                    insert_cmd.Parameters.Clear(); // Parametersは@に対してどんどん追加していくので、ループの中で毎回クリアする必要がある
                                    insert_cmd.Parameters.AddWithValue("@submission_id", submiision_id);
                                    DateTime parsedDate = DateTime.Parse(date);
                                    insert_cmd.Parameters.AddWithValue("@date", parsedDate);
                                    insert_cmd.ExecuteNonQuery();
                                }
                                a = "多分変更で来たよ";
                            }
                            

                             

                        }
                        else
                        {
                            ///ここに登録処理を入れる
                               a = "追加する予定だよ";
                                //登録したら削除せずにshift_datesに入れる処理を入れるよ
                        }

                       
                        


                    }
                    
                    ///3ラインのIDがないので登録処理に促す
                    else
                    {
                        a = "ないよ登録処理をしてね";
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

     

            // ② 登録されたシフトを「全件取得」する窓口（管理画面用）
            [HttpGet]
            public IActionResult GetAllShifts()
            {
                // 管理画面の allShifts.forEach(...) に配列データをそのまま渡す
                return Ok(_shiftList);
            }
    }
}


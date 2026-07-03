using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using Npgsql;
using System.Collections.Generic;
using System.Runtime.InteropServices.ObjectiveC;
using System.Security.Cryptography;
using System.Xml.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;
namespace ShiftManagerApi2.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/shift というURLこれでどこに送るかを指定している名前は自由だけどちゃんとしたやつが好ましい
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
                    staff_id = GetID(data.id, data.Name);
                    reqs_id = GetReqID(staff_id ?? 0, data.Year, data.Month) ?? 0; //??idがnullのときは0を入れるようにしている、最後の??は結果がnullなら0を入れる処理。
                                                                                   //if (staff_id !=0)
                    if (reqs_id != 0)
                    {
                        a = Update_Req_dates(reqs_id, data.Memo, data.Dates,data.Answer);//ここに更新処理を書く、提出日と備考欄の更新処理とshift_datesの削除とshift_datesへの新規登録の処理を書く
                    }
                    else
                    {
                        int newReqsId = InsertReqsId(staff_id ?? 0, data.Memo, data.Year, data.Month, data.Dates) ?? 0;//reqs_idの登録処理に行く
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
        private int? GetID(string line_id, string name)//ラインIDがあるかどうかを確認する処理、なければ新規登録する処理に行く、あればそのIDを返す処理に行く
        {
            using (var conn = _db.CreateConnection())
            {
                string staff_sql = "SELECT id FROM staff WHERE line_id = @lineid";
                using (var staff_cmd = new NpgsqlCommand(staff_sql, conn))
                {
                    staff_cmd.Parameters.AddWithValue("@lineid", line_id);

                    var result = staff_cmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return InsertLineId(line_id, name);//ラインIDの新規登録処理に行く
                    }
                    return Convert.ToInt32(result);//ラインIDがあった場合はそのIDを返す処理に行く
                }

            }
        }
        private int? InsertLineId(string line_id, string name)//ラインIDの新規追加
        {
            using (var conn = _db.CreateConnection())
            {
                string insert_sql = "INSERT INTO staff (staff_name, line_id, role, position) VALUES (@name, @line_id, '介護スタッフ', 'パート')RETURNING id";//選ばせる画面に遷移するようにする　RETURNINGは決まった連番のIDを返してくれる隙間を開けるとエラーが起きる
                using (var insert_cmd = new NpgsqlCommand(insert_sql, conn))
                {
                    insert_cmd.Parameters.AddWithValue("@line_id", line_id);
                    insert_cmd.Parameters.AddWithValue("name", name);
                    var newId = insert_cmd.ExecuteScalar();

                    return Convert.ToInt32(newId); // 💡 GetIDに戻らず、その場で新しいIDを返してあげるので100%安全！
                }
            }
        }
        private int? GetReqID(int staff_id, int year, int month)//その月にすでに登録されているかどうかを確認する処理、なければ新規登録する処理に行く、あればそのIDを返す処理に行く
        {
            using (var conn = _db.CreateConnection())
            {
                string reqs_sql = "  SELECT shift_reqs.id FROM shift_reqs WHERE staff_id = @staff_id AND shift_reqs.periods_id = (SELECT shift_periods.id FROM shift_periods WHERE shift_periods.year = @year AND shift_periods.month = @month) ";
              
                using (var reqs_cmd = new NpgsqlCommand(reqs_sql, conn))
                {
                    reqs_cmd.Parameters.AddWithValue("@staff_id", staff_id);
                    reqs_cmd.Parameters.AddWithValue("@year", year);
                    reqs_cmd.Parameters.AddWithValue("@month", month);

                    var result = reqs_cmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return null;
                    }
                    return Convert.ToInt32(result);//reqs_idがあった場合はそのIDを返す
                }
            }
        }
        private int? InsertReqsId(int staff_id, string memo, int year, int month, List<ShiftDateItem> dates)//新しいshift_reqsを追加する処理と新しいshift_req_data追加する処理

        {
            using (var conn = _db.CreateConnection())
            {
                string insert_sql = "INSERT INTO shift_reqs (staff_id,periods_id,memo) SELECT @staff_id, id, @memo FROM shift_periods WHERE year =@year AND month = @month RETURNING id";
                using (var insert_cmd = new NpgsqlCommand(insert_sql, conn))
                {
                    insert_cmd.Parameters.AddWithValue("@staff_id", staff_id);
                    insert_cmd.Parameters.AddWithValue("@memo", memo);
                    insert_cmd.Parameters.AddWithValue("@year", year);
                    insert_cmd.Parameters.AddWithValue("@month", month);

                    var req_id = insert_cmd.ExecuteScalar();

                    return Convert.ToInt32(req_id);
                    //次に登録する処理を書く
                                                   //var dates_insert_sql = "INSERT INTO shift_req_dates (req_id, date, mode) VALUES (@req_id, @dates, @mode)";
                                                   //using (var insert_dates__cmd = new NpgsqlCommand(dates_insert_sql, conn))
                                                   //{
                                                   //    foreach(var date in dates)
                                                   //    {
                                                   //        insert_cmd.Parameters.Clear();
                                                   //        insert_cmd.Parameters.AddWithValue("@req_id", req_id);
                                                   //        insert_cmd.Parameters.AddWithValue("@date", date.Date);
                                                   //        insert_cmd.Parameters.AddWithValue("@mode", date.Mode);
                                                   //    }

                    //}新規処理のエラーが治るまで封印
                }//新しいshift_req_data追加する処理

            }
        }


        private string Update_Req_dates(int reqs_id, string Memo, List<ShiftDateItem> Dates,List<EventAnswerItem> Answer)//既存のshift_idを更新する処理と既存のshift_req_dataを削除して新しく作成する処理
        {
            using (var conn = _db.CreateConnection())
            {
                string update_sql = "UPDATE shift_reqs SET memo = @memo, created_at = NOW() WHERE id = @id";
                using (var update_cmd = new NpgsqlCommand(update_sql, conn))
                {
                    update_cmd.Parameters.AddWithValue("@memo", Memo);
                    update_cmd.Parameters.AddWithValue("@id", reqs_id);

                    update_cmd.ExecuteNonQuery();


                }
                string dlete_sql = "DELETE FROM shift_req_dates WHERE req_id = @id";

                using (var dlete_cmd = new NpgsqlCommand(dlete_sql, conn))
                {
                    dlete_cmd.Parameters.AddWithValue("@id", reqs_id);
                    dlete_cmd.ExecuteNonQuery();
                    foreach(var InAnswer in Answer)
                    {
                        InsertEvent_Answer(InAnswer.Id, reqs_id, InAnswer.Answer);//変更がまだ
                    }
                   

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
                    return "多分変更で来たよyoyoyo";
                }
            }
        }
        private void InsertEvent_Answer(int event_id,int reqs_id, bool answer)//イベントの回答データベースに回答を入れる処理
        {
            bool isAlreadyExists = true;
            using (var answer_conn = _db.CreateConnection())
            { 
                string answer_Existence_sql = "SELECT  a.answer FROM event e INNER JOIN(SELECT id FROM shift_periods WHERE status = '配信中')p ON p.id = e.periods_id LEFT JOIN(SELECT event_id, answer, reqs_id FROM event_answer WHERE reqs_id = @reqs_id)a ON a.event_id = e.id WHERE e.id =@event_id";
                using (var Existence_cmd = new NpgsqlCommand(answer_Existence_sql,answer_conn))
                {
                    Existence_cmd.Parameters.AddWithValue("@reqs_id", reqs_id);
                    Existence_cmd.Parameters.AddWithValue("@event_id", event_id);
                    var result = Existence_cmd.ExecuteScalar();
                    // 💡 C#の null または データベースの NULL（DBNull.Value）だったらデータなし！
                    if (result == null || result == DBNull.Value)
                    {
                        Console.WriteLine("実行されたよ1（データがないことを確認した！）");
                        isAlreadyExists = false;
                    }
                }
                if (!isAlreadyExists)
                {//データがまだない時
                    string answer_sql = "INSERT INTO event_answer (event_id, reqs_id, answer) VALUES (@event_id,@reqs_id,@answer)";
                    using (var answer_cmd = new NpgsqlCommand(answer_sql, answer_conn))
                    {
                        answer_cmd.Parameters.AddWithValue("@event_id", event_id);
                        answer_cmd.Parameters.AddWithValue("@reqs_id", reqs_id);
                        answer_cmd.Parameters.AddWithValue("@answer", answer);
                        Console.WriteLine("実行されたよ2（INSERTに入った！）");
                        answer_cmd.ExecuteNonQuery();
                    }
                }
                else
                {
                    string answer_sql = "UPDATE event_answer SET answer = @answer WHERE event_id = @event_id AND reqs_id = @reqs_id";
                    using(var answer_cmd = new NpgsqlCommand(answer_sql, answer_conn))
                    {
                        answer_cmd.Parameters.AddWithValue("@event_id", event_id);
                        answer_cmd.Parameters.AddWithValue("@reqs_id", reqs_id);
                        answer_cmd.Parameters.AddWithValue("@answer", answer);
                        Console.WriteLine("実行されたよ3（INSERTに入った！）");
                        answer_cmd.ExecuteNonQuery();
                    }
                }
            }
              
        }

//SELECT e.id, e.name, e.content , a.answer FROM event e
//INNER JOIN(SELECT id FROM shift_periods WHERE status = '配信中')p ON p.id = e.periods_id
//LEFT JOIN(SELECT event_id, answer, reqs_id FROM event_answer WHERE reqs_id = 1)a ON a.event_id = e.id





        // ② 登録されたシフトを「全件取得」する窓口（管理画面用）
        [HttpGet]
        public IActionResult GetAllShifts()
        {
            // 管理画面の allShifts.forEach(...) に配列データをそのまま渡す
            return Ok(_shiftList);
        }
        [HttpGet("calendar")]//いつのカレンダーを表示数かをindex.htmlに返す
        public IActionResult GetCalendar()
        {
         
            using (var conn = _db.CreateConnection())
            {
               
                string calendar_sql = "SELECT id,year,month FROM shift_periods WHERE status = '配信中'";
                using (var calendar_cmd = new NpgsqlCommand(calendar_sql, conn))
                {
                   using(var result = calendar_cmd.ExecuteReader())
                    {
                        if (result.Read())
                        {
                            var singleCalendar = new
                            {
                                id = Convert.ToInt32(result["id"]),
                                year = Convert.ToInt32(result["year"]),
                                month = Convert.ToInt32(result["month"])
                            };
                           return Ok(singleCalendar);
                        }
                    }
                }
            }
            return NotFound(); // 見つからなかった場合の処理404を返す
        }
        [HttpGet("staffid")]
        public IActionResult GetStaff_id([FromQuery(Name = "line_id")] string line_id)//FromQueryで何の名前で送られてくる その次にC#内で使う名前を指定している
        {
            using (var conn = _db.CreateConnection())
            {
                string staffid_sql = "SELECT id FROM staff WHERE line_id = @line_id";
                using (var staffid_cmd = new NpgsqlCommand(staffid_sql,conn))
                {
                    staffid_cmd.Parameters.AddWithValue("@line_id", line_id);
                    var result = staffid_cmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return Ok(null);
                    }
                    int staffId = Convert.ToInt32(result);//reqs_idがあった場合はそのIDを返す
                    return Ok(staffId);
                }
            }
        }
        [HttpGet("event")]//その月に配信されているイベントを返す処理
        public IActionResult GetEvent([FromQuery (Name = "shit_reqs_id")]  int? reqs_id)//ログインした瞬間にshit_reqs_idを作るようにするかもそしたら変わる
        {
            var eventList = new List<object>();
            using (var conn = _db.CreateConnection())
            {
                string event_sql = " SELECT e.id, e.name, e.content , a.answer FROM event e INNER JOIN(SELECT id FROM shift_periods WHERE status = '配信中')p ON p.id = e.periods_id LEFT JOIN(SELECT event_id, answer, reqs_id FROM event_answer WHERE reqs_id = @reqs_id)a ON a.event_id = e.id ";
                using (var event_cmd = new NpgsqlCommand(event_sql, conn))
                {
                    using (var result = event_cmd.ExecuteReader())
                    {
                        event_cmd.Parameters.AddWithValue("@reqs_id", reqs_id);
                        while (result.Read())
                        {
                            var singleEvent = new {
                                eventId = Convert.ToInt32(result["id"]),
                                eventName = result["name"].ToString(),
                                eventContent = result["content"].ToString(),
                                answer = result["answer"] == DBNull.Value ? (bool?)null : Convert.ToBoolean(result["answer"])

                        }
                        ;
                            eventList.Add(singleEvent);
                        }
                       
                    } 
                }
            }
            return Ok(eventList); 
        
        }
        [HttpGet("shift_reqs")]
        public IActionResult Getshift_reqs([FromQuery(Name ="staff_id")] int staff_id,[FromQuery(Name = "periods_id")] int periods_id)
        {
            using (var conn = _db.CreateConnection())
            {
                string shift_reqs_sql = "SELECT id FROM shift_reqs WHERE staff_id = @staff_id AND periods_id = @periods_id";
                using (var shift_reqs_cmd = new NpgsqlCommand(shift_reqs_sql, conn))
                {
                    shift_reqs_cmd.Parameters.AddWithValue("@staff_id", staff_id);
                    shift_reqs_cmd.Parameters.AddWithValue("@periods_id", periods_id);
                    var result = shift_reqs_cmd.ExecuteScalar();
                    if (result == null || result == DBNull.Value)
                    {
                        return Ok(null);
                    }
                    int shift_reqsId = Convert.ToInt32(result);
                    return Ok(shift_reqsId);
                }
            }
        }
        [HttpGet("shift_dates")]
        public IActionResult Getdates([FromQuery(Name = "shift_reqs_id")] int req_id)
        {
            var dates_List = new List<object> ();
            using (var conn = _db.CreateConnection())
            {
                string shift_dates_sql = "SELECT date,mode FROM shift_req_dates WHERE req_id = @req_id";
                using (var shift_dates_cmd = new NpgsqlCommand(shift_dates_sql,conn))
                {
                    shift_dates_cmd.Parameters.AddWithValue("@req_id", req_id);
                    using (var result = shift_dates_cmd.ExecuteReader())
                    {
                        while (result.Read())
                        {
                            var SingreDates = new
                            {
                               
                                date = (DateOnly)result["date"],
                                mode = result["mode"].ToString()
                            };
                            dates_List.Add(SingreDates);
                        }
                    }
                    
                }
            }
            return Ok(dates_List);
        }
        //[HttpGet("event/answer")]//その月に配信されているイベントをすでに回答している場合、その回答を返す処理
        //public IActionResult GetEventAnswer()
        //{
        //    var answerList = new List<object>();
        //    using (var conn = _db.CreateConnection())
        //    {
        //        string answer_sql = ""
        //    }
        //}

    }
}



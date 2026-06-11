
using Npgsql;
namespace ShiftManagerApi2
{
    public class DatabaseConnection
    {
        private readonly string _connectionString;
        
        public DatabaseConnection()
        {
            _connectionString = "Host=localhost; Port=5432; Database=shift_db; Username=postgres; Password=P@ssw0rd";
        }

        public NpgsqlConnection CreateConnection()
        {
            var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            return conn;
        }
    }
}

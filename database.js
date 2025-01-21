const mysql = require("mysql2");

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "Art55!!@",
    database: "artclinic",
  });

  module.exports = db;

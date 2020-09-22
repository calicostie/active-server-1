const fs = require("fs"); //获取数据库

/*读数据库*/
const usersString = fs.readFileSync("./db/users.json").toString();
const usersArray = JSON.parse(usersString); //反序列化，反字符串化
/*写数据库*/
const users5 = { id: 5, name: "5", password: "555" };
usersArray.push(users5);
const string = JSON.stringify(usersArray); //序列化
fs.writeFileSync("./db/users.json", string); //写入write（注意看错误提示！！）

var http = require("http");
var fs = require("fs");
var url = require("url");
const { createHash } = require("crypto");
const { resolve } = require("path");
const { report } = require("process");
const { Session } = require("inspector");
var port = process.argv[2];

if (!port) {
	console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
	process.exit(1);
}

var server = http.createServer(function (request, response) {
	var parsedUrl = url.parse(request.url, true);
	var pathWithQuery = request.url;
	var queryString = "";
	if (pathWithQuery.indexOf("?") >= 0) {
		queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
	}
	var path = parsedUrl.pathname;
	var query = parsedUrl.query;
	var method = request.method;

	/******** 从这里开始看，上面不要看 ************/

	console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);

	const session = JSON.parse(fs.readFileSync("./session.json").toString());
	if (path === "/sign_in" && method === "POST") {
		const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
		const array = [];
		request.on("data", (chunk) => {
			array.push(chunk);
		}); //上传数据
		request.on("end", () => {
			const string = Buffer.concat(array).toString();
			const obj = JSON.parse(string); //转换数据
			const user = userArray.find(
				(user) => user.name === obj.name && user.password === obj.password
			);
			if (user === undefined) {
				//尚未注册
				response.statusCode = 400;
				response.setHeader("Content-Type", "text/html; charset=UTF-8");
			} else {
				response.statusCode = 200;
				const random = Math.random();
				session[random] = { user_id: user.id };
				fs.writeFileSync("./session.json", JSON.stringify(session));
				response.setHeader("Set-Cookie", `user_id=${random}; HttpOnly`); //保存已登录状态,HttpOnly不允许前端修改cookie
			}
			response.end();
		});
		// } else if (path === "/home.html") {
		// 	const cookie = request.headers["cookie"];
		// 	let sessionId;
		// 	try {
		// 		sessionId = cookie
		// 			.split(";")
		// 			.filter((s) => s.indexOf("user.id=") >= 0)[0]
		// 			.split("=")[1];
		// 	} catch (error) {}
		// 	if (sessionId && session[sessionId]) {
		// 		const userId = session[sessionId].user_id;
		// 		const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
		// 		const user = userArray.find((user) => user.id === userId);
		// 		const homeHtml = fs.readFileSync("./public/home.html").toString();
		// 		let string = "";
		// 		if (user) {
		// 			string = homeHtml
		// 				.replace("{{loginStatus}}", "已登录")
		// 				.replace("{{user.name}}", user.name);
		// 		}
		// 		response.write(string);
		// 	} else {
		// 		const homeHtml = fs.readFileSync("./public/home.html").toString();
		// 		const string = homeHtml
		// 			.replace("{{loginStatus}}", "未登录")
		// 			.replace("{{user.name}}", "");
		// 		response.write(string); //不要忘了写
		// 	}
		// 	response.end();
	} else if (path === "/home.html") {
		// 写不出来
		const cookie = request.headers["cookie"];
		let sessionId;
		try {
			sessionId = cookie
				.split(";")
				.filter((s) => s.indexOf("session_id=") >= 0)[0]
				.split("=")[1];
		} catch (error) {}
		if (sessionId && session[sessionId]) {
			const userId = session[sessionId].user_id;
			const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
			const user = userArray.find((user) => user.id === userId);
			const homeHtml = fs.readFileSync("./public/home.html").toString();
			let string = "";
			if (user) {
				string = homeHtml
					.replace("{{loginStatus}}", "已登录")
					.replace("{{user.name}}", user.name);
			}
			response.write(string);
		} else {
			const homeHtml = fs.readFileSync("./public/home.html").toString();
			const string = homeHtml
				.replace("{{loginStatus}}", "未登录")
				.replace("{{user.name}}", "");
			response.write(string);
		}
		response.end();
	} else if (path === "/register" && method === "POST") {
		response.setHeader("Content-Type", "text/html; charset=UTF-8");
		const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
		const array = [];
		request.on("data", (chunk) => {
			array.push(chunk);
			console.log(array);
		}); //data是分段传输的
		request.on("end", () => {
			const string = Buffer.concat(array).toString(); //buffer用于将不同数据合成一个字符串
			const obj = JSON.parse(string);
			const lastUser = userArray[userArray.length - 1];
			const newUser = {
				//最后一个用户的id+1
				id: lastUser ? lastUser.id + 1 : 1,
				name: obj.name,
				password: obj.password,
			};
			userArray.push(newUser);
			fs.writeFileSync("./db/users.json", JSON.stringify(userArray)); //error出现在写入json时，先查看这句
			response.end();
		});
	} else {
		response.statusCode = 200;
		const filePath = path === "/" ? "/index.html" : path; //默认首页
		const index = filePath.lastIndexOf(".");
		const suffix = filePath.substring(index);
		const fileTypes = {
			".html": "text/html",
			".css": "text/css",
			".js": "text/javascript",
			".png": "image/png",
		};
		console.log(suffix); //suffix 后缀
		response.setHeader("Content-Type", `${fileTypes[suffix]};charset=utf-8`);
		let content;
		try {
			content = fs.readFileSync(`./public${filePath}`);
		} catch (error) {
			content = "error";
			response.statusCode = 404;
		}
		response.write(content);
		response.end();
	}

	/******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
	"监听 " +
		port +
		" 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
		port
);

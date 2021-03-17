const Express = require(`express`);
const Chalk = require(`chalk`);
const Path = require(`path`);

const app = Express();
app.use(Express.json());
app.db = require(`quick.db`);

app.get(`/get`, (req, res) => {
	const code = app.db.get(`codes.${req.query.id}`);

	if (!code) return res.send({ error: `Invalid ID.` });
	if (code.accessToken != req.query.access_token) return res.send({ error: `Invalid token.` });

	res.send(code);
});

app.get(`/create`, (req, res) => {
	if (!req.query.name) return res.send({ error: `Invalid name.` });

	const date = Date.now();
	const random = makeid(19);
	const id = shuffle(Buffer.from(`${date}${random}`).toString("ascii"));
	const accessToken = shuffle(Buffer.from(`${date}${makeid(51)}`).toString("ascii"));

	app.db.set(`codes.${id}`, { id, accessToken, name: req.query.name, premium: false, createdAt: date, expiresAt: date + 5 * 24 * 60 * 60 * 1000, opens: [] });
	res.send({ message: `Successful.`, code: app.db.get(`codes.${id}`) });
});

app.get(`/delete`, (req, res) => {
	const code = app.db.get(`codes.${req.query.id}`);

	if (!code) return res.send({ error: `Invalid ID.` });
	if (code.accessToken != req.query.access_token) return res.send({ error: `Invalid token.` });

	res.send(app.db.delete(`codes.${req.query.id}`) ? { message: `Code deleted.` } : { error: `Unknown error.` });
});

app.get(`/:code`, (req, res) => {
	const code = app.db.get(`codes.${req.params.code}`);
	if (!code) return;

	res.sendFile(Path.join(__dirname, `/cdn/${code.premium ? `premium` : `free`}.png`));
	app.db.push(`codes.${req.params.code}.opens`, { at: Date.now(), userAgent: req.get("user-agent") });
});

app.listen(3000, () => {
	console.log(Chalk.yellow(`----------------------`));
	console.log(Chalk.green(`[SERVER] API Online.`));
	console.log(Chalk.yellow(`----------------------`));
});

setInterval(() => {
	const oldCodes = app.db.get(`codes`);
	var newCodes = {};
	Object.entries(oldCodes).forEach(([key, value]) => {
		if (value.expiresAt > Date.now()) newCodes[key] = value;
	});
	app.db.set(`codes`, newCodes);
}, 5000);

function makeid(length) {
	var result = "";
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function shuffle(str) {
	return str
		.split("")
		.sort(() => {
			return 0.5 - Math.random();
		})
		.join("");
}

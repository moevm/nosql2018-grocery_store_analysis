const template = {
	key: "JKsdqHJ213",
	admin: {
		login: "admin",
		pass: "admin"
	},
	url: "https://patyorka.ru",
	name: "Пятёрочка",
	text: "Лучшие продукты в мире",
	offers: [{
		id: 1,
		name: "Молоко",
		cat: "Молочные продукты",
		price: "68",
		text: "ООО Лен. молоко"
	},{
		id: 2,
		name: "Хлеб",
		cat: "Выпечка",
		price: "34",
		text: "Хлеб-завод №2"
	},{
		id: 3,
		name: "Бананы",
		cat: "Фрукты",
		price: "55",
		text: "Кайфовые бананы"
	},{
		id: 4,
		name: "Картофель",
		cat: "Овощи",
		price: "81",
		text: "Немытый картофель"
	},{
		id: 5,
		name: "Морковь",
		cat: "Овощи",
		price: "35",
		text: "Свежий урожай"
	},{
		id: 6,
		name: "Яблоки",
		cat: "Фрукты",
		price: "95",
		text: "Семеренко"
	},{
		id: 7,
		name: "Яйца",
		cat: "Бакалея",
		price: "55",
		text: "Категория C2"
	},{
		id: 8,
		name: "Шоколад 'Алёнка'",
		cat: "Кондитерские изделия",
		price: "75",
		text: "Молочный шоколад"
	},{
		id: 9,
		name: "Чёрный чай",
		cat: "Кофе, чай",
		price: "150",
		text: "Чёрный чай 'Ассам'"
	},{
		id: 10,
		name: "Кофе",
		cat: "Кофе, чай",
		price: "250",
		text: "250г. коффе Nescafe"
	}],
	pages: [{
		id: 1,
		url: "/",
		name: "Главная"
	},{
		id: 2,
		url: "/catalog",
		name: "Каталог"
	},{
		id: 3,
		url: "/about",
		name: "Доставка и оплата"
	}],
	sessions: []
}

const targetsName = ["Визит", "Изменение корзины", "Покупка", "Отзыв"];
const reviews = ["Хорошо", "Отлично", "Супер!"];
const emails = ["@mail.ru", "@yandex.ru", "@gmail.com"];
const visitsCount = 500;
const usersCount = 228;

function randomValue(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function strGenerate(c) {
	c = c || 16;

	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < c; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const users = [];
for(let u = 0; u < usersCount; u++){
	users.push("u" + strGenerate(8));
}

for(let s = 0; s < visitsCount; s++){
	let d1 = randomDate(new Date(2018, 8, 0), new Date(2018, 8, 30));
	let d2 = new Date(d1.toISOString()); d2.setMinutes(d2.getMinutes() + randomValue(1, 100));

	const session = {
		session_id: strGenerate(13),
		uid: users[Math.floor(Math.random() * users.length)],
		session_start: d1.toISOString(),
		session_end: d2.toISOString(),
		targets: []
	}

	for(let t = 0; t < randomValue(1, targetsName.length); t++){
		const target = {
			date: randomDate(d1, d2).toISOString()
		}

		const type = targetsName[Math.floor(Math.random() * targetsName.length)];

		if((type === "Изменение корзины" || type === "Покупка" || type === "Отзыв" ) && !session.targets.filter(t => {return t.type === "Визит"}).length){
			session.targets.push({
				type: "Визит",
				date: randomDate(d1, new Date(target.date)).toISOString(),
				page: template.pages[Math.floor(Math.random() * template.pages.length)].id,
			});
			
			if(type === "Визит") continue;
		}

		target.type = type;

		if (type === "Изменение корзины") {
			target.offers = template.offers.sort(t => { return Math.random() - 0.5 }).slice(0, Math.floor(template.offers.length / 2)).map(o => {return o.id});
		} else if(type === "Покупка") {
			target.offers = template.offers.sort(t => { return Math.random() - 0.5 }).slice(0, Math.floor(template.offers.length / 2)).map(o => {return o.id});
			target.delivery = {
				email: strGenerate(8) + emails[Math.floor(Math.random() * emails.length)],
				address: "?"
			}
		} else if (type === "Отзыв") {
			target.review = {
				email: strGenerate(8) + emails[Math.floor(Math.random() * emails.length)],
				text: reviews[Math.floor(Math.random() * reviews.length)],
				offer: template.offers[Math.floor(Math.random() * template.offers.length)].id
			}
		}

		session.targets.push(target);
	}

	session.targets = session.targets.sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime();
	});

	template.sessions.push(session);
}

template.sessions = template.sessions.sort((a, b) => {
	return new Date(a.session_start).getTime() - new Date(b.session_start).getTime();
});

document.getElementById("code").innerHTML = JSON.stringify(template);
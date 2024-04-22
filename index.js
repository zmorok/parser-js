// загрузка модулей для работы с файловой системой, путями и api браузера
const fs = require('fs')
const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
	const browser = await puppeteer.launch({ headless: false })
	const page = await browser.newPage()
	await page.goto('https://ru.whoscored.com/Statistics')

	// ожидание кнопки '.css-gweyaj' и клик по ней
	await page.waitForSelector('.css-gweyaj')
	await page.click('.css-gweyaj')

	let localeDate =
		'Запись данных на ' +
		new Date().toLocaleDateString() +
		'  |  ' +
		new Date().toLocaleTimeString() +
		'\n\n'

	// путь к папке "files" и создание его, если он не существует
	const folderPath = path.join(__dirname, 'files')
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath)
	}
	const filename = path.join(
		folderPath,
		new Date().toLocaleDateString() + '.txt'
	)
	fs.writeFile(filename, localeDate, err => {
		if (err) throw err
	})

	// массив для хранения данных и цикл, 'проходящий' по частям таблицы
	let data = []
	for (let i = 0; i < 5; i++) {
		let text = await page.evaluate(() => {
			let table = document.querySelector(
				'#statistics-team-table-summary > .semi-attached-table > table'
			)
			let trs = Array.from(
				table.querySelectorAll('tbody > tr'),
				el => el.innerText
			)
			trs = trs.map(el => el.replace(/\n\t/g, ','))
			trs = trs.map(el => el.replace(/\n|\t|\r/g, ','))
			trs = trs.map(el => {
				let columns = el.split(',')
				return columns.map(column => column.padEnd(28)).join(' | ')
			})
			return trs.join('\n')
		})
		data.push(text)

		// ожидание кнопки '#next' и клик по ней
		await page.waitForSelector('#next')
		await page.click('#next')

		// ожидание 200мс для прогрузки контента
		await new Promise(resolve => setTimeout(resolve, 200))
	}

	// перепределение data как строка из предыдущего массива
	data = data.join('\n')
	fs.appendFile(filename, data, err => {
		if (err) throw err
		console.log('Данные успешно записаны в файл ' + filename)
	})

	// закрытие браузера
	await browser.close()
})()

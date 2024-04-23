const fs = require('fs')
const puppeteer = require('puppeteer')
const path = require('path')
const readline = require('readline')

;(async () => {
	const browser = await puppeteer.launch({ headless: false, product: 'chrome' })
	const page = await browser.newPage()
	await page.goto('https://ru.whoscored.com/Statistics')

	// ожидание кнопки '.css-gweyaj' и клик по ней
	await page.waitForSelector('.css-gweyaj')
	await page.click('.css-gweyaj')

	const time = new Date()
	const currentDate = 'date ' + time.toLocaleDateString().replace(/\./g, '-')
	const currentTime = 'time ' + time.toLocaleTimeString().replace(/:/g, '.')

	let localeDate =
		'  Запись на ' +
		currentDate +
		'  |  ' +
		currentTime +
		'\tparsed from https://ru.whoscored.com/Statistics' +
		'\n\n'

	// путь к папке "files" и создание его, если он не существует
	const folderPath = path.join(__dirname, 'files')
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath)
	}
	const filename = path.join(
		folderPath,
		currentDate + '; ' + currentTime + '.txt'
	)
	fs.writeFile(filename, localeDate, err => {
		if (err) throw err
	})

	// "шапка" для файла
	let header = await page.evaluate(() => {
		let table = document.querySelector(
			'#statistics-team-table-summary > .semi-attached-table > table'
		)
		let headerOfTable = Array.from(
			table.querySelectorAll('thead > tr'),
			el => el.innerText
		)
		headerOfTable = headerOfTable.map(el => el.replace(/\n|\t|\r/g, ','))
		headerOfTable = headerOfTable.map(el => {
			let columns = el.split(',')
			return columns.map(column => column.padEnd(28)).join(' | ')
		})
		return headerOfTable.join('\n')
	})
	header += '\n'

	fs.appendFile(filename, header, err => {
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

		// ожидание 650мс для прогрузки контента
		await new Promise(resolve => setTimeout(resolve, 650))
	}

	// перепределение data как строка из предыдущего массива
	data = data.join('\n')
	fs.appendFile(filename, data, err => {
		if (err) throw err
		console.log('Данные успешно записаны в файл ' + filename)
	})

	// закрытие браузера
	await browser.close()

	// создание интерфейса для ввода с консоли и ожидание нажатия клавиши
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	rl.question('Нажмите клавишу Enter для выхода...', () => {
		rl.close()
	})
})()

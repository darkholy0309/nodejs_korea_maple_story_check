const express = require('express');
const request = require('request');
const app = express();
const port = 80;

app.set('view engine', 'ejs');
app.use(express.static(__dirname));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.get('/', async (req, res, next) => {
    try {
        //res.send('Hello World!');
        result = await index();
        if (result == null) {
            return res.render('index2');
        } else {
            res.render('index', { news: result.news, event: result.event });
        }
    } catch (error) {
        next(error);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

app.use((req, res, next) => {
    const time = new Date().toLocaleString();
    const ip = req.ip || req.remoteAddress;
    if (ip == null) {
        console.log(time + '     ' + '\x1b[31m' + '아이피 로딩실패' + '\x1b[0m');
    } else {
        const user = ip.substring(7);
        if (user == '') {
            console.log(time + '     ' + '로컬호스트로 접속됨');
        } else {
            console.log(time + '     ' + user);
        }
    }
    // Continue to the next middleware
    next();
});

function news_notice() {
    const options = {
        uri: 'http://maplestory.nexon.com/news/notice',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        }
    }
    //const url = 'http://maplestory.nexon.com/news/notice';
    let result = [];
    return new Promise(resolve => {
        request(options, function (err, response, body) {
            if (body.split('<!-- notice ul str -->').length - 1 == 0) {
                return resolve(null);
            }
            let news = body.split('<!-- notice ul str -->')[1].split('<!-- notice ul end -->')[0];
            for (let i = 1; i < 6; i++) {
                let title = news.split('<span>')[i].split('</span>')[0];
                let href = news.split('href=\"')[i].split('\"')[0];
                result.push({
                    title: title,
                    url: 'http://maplestory.nexon.com' + href,
                });
            }
            resolve(result);
        });
    });
}

function news_event() {
    const options = {
        uri: 'http://maplestory.nexon.com/news/event',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        }
    }
    //const url = 'http://maplestory.nexon.com/news/event';
    let result = [];
    return new Promise(resolve => {
        request(options, function (err, response, body) {
            if (body.split('<ul class=\"event_all_banner\">').length - 1 == 0) {
                return resolve(null);
            }
            let news = body.split('<ul class=\"event_all_banner\">')[1].split('</ul>')[0];
            let count = (news.split('Event').length - 1) / 3;
            for (let i = 1; i <= count; i++) {
                let li = news.split('<li>')[i].split('</li>')[0];
                let href = li.split('<dt><a href=\"')[1].split('\"')[0];
                let img = li.split('<img src=\"')[1].split('\"')[0];
                let title = li.split('<dt><a href=\"' + href + '\">')[1].split('</a></dt>')[0];
                let date = body.split('<dd class=\"date\">')[i].split('</dd>')[0];
                result.push({
                    title: title,
                    url: 'http://maplestory.nexon.com' + href,
                    img: img,
                    date: date,
                });
            }
            resolve(result);
        });
    });
}

async function index() {
    let news = await news_notice();
    let event = await news_event();
    if (news == null || event == null) {
        return null;
    }
    event.forEach(item => {
        item.text = item.date.replace(/<[^>]*>/g, '');
    });
    return { news, event };
}
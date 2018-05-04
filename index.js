const schedule = require('node-schedule');
const config = require('./config');
const exec = require('child_process').exec;
const ping = require('ping');
//const mysql = require('promise-mysql')
const logger = require('./lib/logger')
//创建数据库链接
//let db = null;

// async function createDb() {
// //     return mysql.createConnection({
// //         host: config.mysql.host,
// //         user: config.mysql.user,
// //         port: config.mysql.port,
// //         password: config.mysql.password,
// //         database: config.mysql.database
// //     })
// // }
// //
// // createDb().then((conn) => {
// //     db = conn;
// // }).catch((err) => {
// //     logger.error(err.message);
// //     process.exit(0);
// // });

async function pingGetIp(domain) {
    try {
        let res = await ping.promise.probe(domain)
        res.ip = res.output.match(/\d+\.\d+\.\d+\.\d+/)[0];
        return res;
    } catch (e) {
        return false;
    }
}

async function updateNode(nodeid, ip, domain) {
    let sql = `UPDATE nodes SET ip='${ip}' WHERE nodeid='${nodeid}'`;
    let shell = `mysql -u${config.mysql.user} -p${config.mysql.password} -D${config.mysql.database} -e "${sql}"`;
    exec(shell, (err, stdout, stderr) => {
        logger.info(`NodeId:${nodeid}\t域名:${domain}\tIP:${ip}\t更新结果:${stdout}\n`);
    })
}

//5秒执行
logger.debug("程序已启动\n");
const job = schedule.scheduleJob('*/5 * * * * *', function () {
    const domains = config.domains;
    domains.forEach(async (item) => {
        let res = await pingGetIp(item.domain);
        let upRet = await updateNode(item.nodeid, res.ip, item.domain);
    })
});

process.on('SIGINT', function () {
    //db.end();
    process.exit(0);
});
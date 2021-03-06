
// 文件操作
const fs = require('fs')
const https = require('https')
const exec = require('child_process').exec
const os = require('os')

let url = 'https://gitee.com/ineo6/hosts/raw/master/hosts'
let path = '/etc/hosts'
if(os.platform() === 'darwin') {
  path = '/etc/hosts'
} else {
  path = 'C:/Windows/System32/drivers/etc/hosts'
}
https.get(url, res => {
  let data = []
  console.log('开始请求网络数据 => ' + url);
  res.on('data', chunk => {
    data.push(chunk)
  });
  res.on('end', () => {
    let newVal = data.join('').toString()
    console.log('网络请求数据完成');
    try {
      console.log('正在读取文件');
      let text = fs.readFileSync(path)
      console.log('文件读取完成');
      console.log('开始替换数据');
      let newText = changeTarget(text.toString(), newVal)
      console.log('数据替换完成');
      console.log('开始写入数据');
      fs.writeFileSync(path, newText, {flag: 'w'})
      console.log('文件写入完成');
      flushDns();
    } catch(e) {
      console.error(e)
    }
  })
})

/**
 * 获取目标数据并替换 
 */
function changeTarget(data, newVal) {
  let lines = data.split('\r\n')
  let start = lines.findIndex(line => line === '# start')
  let end = lines.findIndex(line => line === '# end')
  if(start === -1 || end === -1) {
    lines.push('# start')
    lines.push(newVal)
    lines.push('# end')
  } else {
    lines.splice(start + 1, end - start - 1, newVal)
  }
  return lines.join('\r\n')
}

/**
 * dns刷新
 */
function flushDns() {
  if(os.platform() === 'darwin') {
    flushDns_mac()
  } else {
    flushDns_win();
  }
}


function flushDns_mac() {
  console.log('开始执行DNS刷新');
  exec('sudo killall -HUP mDNSResponder',  (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
  console.log('DNS刷新成功');
  });
}

/**
 * dns刷新
 */
 function flushDns_win() {
  console.log('开始执行DNS刷新');
  exec('chcp 65001')
  exec('ipconfig /flushdns',  (error) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log('DNS刷新成功');
    console.log('hosts文件更新完成');
  })
}

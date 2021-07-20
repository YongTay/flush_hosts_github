
const axios = require('axios')
const fs = require('fs')
const {resolve} = require('path')
const {doFlushHost} = require('./flushHosts')
// 增加阀值
const MIN = 100

function queryWebSite(site) {
  let url = 'https://www.wepcc.com/'
  let data = 'node=1,2,3,4,5,6&host=' + site
  let options = {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "origin": "https//www.wepcc.com",
      "referer": "https//www.wepcc.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  }

  return axios.post(url, data, options).then(res => {
    let html = res.data
    let reg = /data-id[ ]*=[ ]*\"([\w]+)\"/g
    let ms = html.match(reg).slice(1)
    let ids = getIds(ms);
    return getPings(ids)
  }).catch(e => {
    console.log(e);
  })
}

function getIds(arr) {
  let reg = /data-id[ ]*=[ ]*\"([\w]+)\"/
  let ret = []
  arr.forEach(item => {
    let m = item.match(reg)
    ret.push(m[1])
  })
  return ret
}

function getPing(id) {
  let url = 'https://www.wepcc.com/check-ping.html'
  let data = 'host=github.com&node='+id
  let options = {
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "origin": "https//www.wepcc.com",
      "referer": "https//www.wepcc.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  }
  return axios.post(url, data, options).then(res => {
    return res.data
  })
}

async function getPings(ids) {
  let arr = []
  for(let i=0; i<ids.length; i++) {
    let info = await getPing(ids[i])
    arr.push(info)
    if(MIN > 0) {
      let t = info && info.data && info.data.Time || 9999
      t = parseFloat(t)
      if(t < MIN) {
        break
      }
    }
  }
  return sort(arr)
}

function sort(arr) {
  arr.sort((a, b) => {
    let t1 = a && a.data && a.data.Time || 0
    let t2 = b && b.data && b.data.Time || 0
    let n1 = parseFloat(t1)
    let n2 = parseFloat(t2)
    return n1 - n2
  })
  return arr[0]
}


async function queryConfigWebSite() {
  let configFilePath = resolve(__dirname, 'config.txt')
  let text = fs.readFileSync(configFilePath, {flag: 'r'})
  let sites = text.toString().split('\r\n').filter(o => o.trim().length > 0)
  let hosts = []
  let len = sites.length
  for(let i=0; i<len; i++) {
    let site = sites[i]
    if(site.trim().length === 0) continue
    await queryWebSite(site).then(res => {
      let ip = res.data.Ip
      let t = res.data.Time
      hosts.push(`${ip}  ${site} #${t}`)
      console.log(`${i+1}/${len}  ${ip}  ${site} #time=${t}`)
    })
  }
  let tempFilePath = resolve(__dirname, 'temp.txt')
  fs.writeFileSync(tempFilePath, hosts.join('\r\n'))
  doFlushHost(hosts.join('\r\n'))
}


queryConfigWebSite()


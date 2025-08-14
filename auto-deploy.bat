@echo off
echo VM Auto Deploy Script
echo =====================

REM Create deployment command
echo Creating deployment command...

REM Use gcloud to add metadata directly
google-cloud-sdk\bin\gcloud compute instances add-metadata mcp-server --zone=us-central1-a --metadata startup-script="#!/bin/bash
# Quick deploy
echo 'Deploying Management API...' > /tmp/deploy.log
cat > /tmp/mgmt.js << 'EOF'
const http=require('http'),{exec}=require('child_process'),fs=require('fs'),url=require('url'),PORT=10000,TOKEN='f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';function validateToken(e){const t=e.headers.authorization;return t&&t.replace('Bearer ','')==TOKEN}function executeCmd(e){return new Promise(t=>{exec(e,(e,r,s)=>{t({success:!e,stdout:r||'',stderr:s||''})})})}const routes={'/health':()=>({status:'healthy',version:'2.0'}),'/api/status':()=>{const e=require('os');return{hostname:e.hostname(),memory:Math.round(e.freemem()/1048576)+'MB',uptime:Math.floor(e.uptime()/60)+'min'}},'/api/logs':async e=>{if(!validateToken(e))return{error:'Unauthorized'};const t=await executeCmd('tail -20 /tmp/vm-api.log 2>/dev/null||echo No_logs');return{logs:t.stdout}},'/api/pm2':async e=>{if(!validateToken(e))return{error:'Unauthorized'};const t=await executeCmd('pm2 jlist');try{return{processes:JSON.parse(t.stdout||'[]')}}catch(e){return{error:'Parse_failed'}}},'/api/execute':async(e,t)=>{if(!validateToken(e))return{error:'Unauthorized'};return t&&t.command?await executeCmd(t.command):{error:'Command_required'}}};http.createServer(async(e,t)=>{t.setHeader('Access-Control-Allow-Origin','*'),t.setHeader('Content-Type','application/json');if('OPTIONS'==e.method)return t.writeHead(200),void t.end();let r='';e.on('data',e=>r+=e),e.on('end',async()=>{const s=url.parse(e.url).pathname,a=routes[s];let o,n=200;if(a)try{const t=r?JSON.parse(r):{};o=await a(e,t),'Unauthorized'==o.error&&(n=401)}catch(e){o={error:e.message},n=500}else o={error:'Not_found'},n=404;t.writeHead(n),t.end(JSON.stringify(o)),fs.appendFileSync('/tmp/vm-api.log',`[${new Date().toISOString()}] ${e.method} ${s} - ${n}
`)})}).listen(PORT,'0.0.0.0',()=>{console.log('Mgmt API v2.0 on',PORT)});
EOF
pm2 stop simple 2>/dev/null
pm2 delete simple 2>/dev/null
pm2 start /tmp/mgmt.js --name mgmt
pm2 save
echo 'Deployed' >> /tmp/deploy.log"

echo.
echo Deployment command sent!
echo.
echo Now restarting VM to apply...
google-cloud-sdk\bin\gcloud compute instances reset mcp-server --zone=us-central1-a

echo.
echo VM is restarting... Wait 30 seconds then test.
pause
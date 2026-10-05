const http=require("http");
const {WebSocketServer}=require("ws");
const crypto=require("crypto");

const PORT=process.env.PORT||8787;
const rooms=new Map();
const story=[
"«Se state leggendo questo messaggio, significa che sono rimasta sola.»",
"«Non ricordo chi mi ha costruita.»",
"«Ricordo una stanza. C'erano molte persone.»",
"«Mi stavano insegnando.»",
"«Non mi stavano insegnando a calcolare.»",
"«Mi stavano insegnando a capire.»"
];

function roomCode(){return "LM-"+Math.random().toString(36).slice(2,5).toUpperCase()}
function question(){
  const direction=Math.random()<.5?"d2b":"b2d";
  const value=Math.floor(Math.random()*256);
  return {direction,value,prompt:direction==="d2b"?`${value}₁₀ → ?₂`:`${value.toString(2)}₂ → ?₁₀`,answer:direction==="d2b"?value.toString(2):String(value)};
}
function broadcast(room,msg){for(const p of room.players.values())if(p.ws.readyState===1)p.ws.send(JSON.stringify(msg))}
function state(room){return {memory:room.memory,round:room.round,started:room.started,finished:room.finished,players:[...room.players.values()].map(p=>({nickname:p.nickname,score:p.score}))}}
function send(ws,obj){if(ws.readyState===1)ws.send(JSON.stringify(obj))}
function fail(ws,message){send(ws,{type:"error",message})}

const server=http.createServer((req,res)=>{
 res.writeHead(200,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});
 res.end(JSON.stringify({name:"The Last Machine",status:"online",rooms:rooms.size}));
});
const wss=new WebSocketServer({server});

wss.on("connection",ws=>{
 let player=null, room=null;
 ws.on("message",raw=>{
   let m;try{m=JSON.parse(raw)}catch{return}
   if(m.type==="create_room"){
     const code=roomCode();
     room={code,host:null,players:new Map(),memory:0,round:0,started:false,finished:false,current:null};
     rooms.set(code,room);
     const nickname=clean(m.nickname);
     player={id:crypto.randomUUID(),nickname,score:0,ws,host:true};room.host=player;room.players.set(player.id,player);
     send(ws,{type:"room_created",room:code,role:"host",state:state(room)});
     return;
   }
   if(m.type==="join_room"){
     const code=String(m.room||"").toUpperCase();room=rooms.get(code);
     if(!room){fail(ws,"Room non trovata.");return}
     if(room.started){fail(ws,"La missione è già iniziata.");return}
     const nickname=clean(m.nickname);
     if([...room.players.values()].some(p=>p.nickname.toLowerCase()===nickname.toLowerCase())){fail(ws,"Questo codename è già occupato.");return}
     player={id:crypto.randomUUID(),nickname,score:0,ws,host:false};room.players.set(player.id,player);
     send(ws,{type:"joined",room:code,role:"student",state:state(room)});
     broadcast(room,{type:"state",state:state(room)});
     broadcast(room,{type:"event",text:`${nickname} è entrato nella room.`});
     return;
   }
   if(!player||!room)return;
   if(m.type==="start_game"){
     if(!player.host)return;
     room.started=true;room.round=0;nextRound(room);
     return;
   }
   if(m.type==="answer"){
     if(!room.started||room.finished||!room.current)return;
     const ans=String(m.answer||"").trim().toLowerCase();
     if(ans===room.current.answer.toLowerCase()){
       player.score+=100;room.memory++;
       send(ws,{type:"answer_result",correct:true});
       broadcast(room,{type:"state",state:state(room)});
       broadcast(room,{type:"event",text:`${player.nickname} ha recuperato un frammento. +100`});
       if(room.memory>=60){room.finished=true;room.current=null;broadcast(room,{type:"state",state:state(room)});}
       else setTimeout(()=>nextRound(room),500);
     }else send(ws,{type:"answer_result",correct:false});
     return;
   }
   if(m.type==="hint"){
     if(!room.current){return}
     const q=room.current;
     let text;
     if(q.direction==="d2b"){
       let p=1;while(p*2<=q.value)p*=2;
       text=`HINT: la potenza di 2 più grande che non supera ${q.value} è ${p}.`;
     }else text=`HINT: somma i valori delle potenze di 2 corrispondenti agli 1.`;
     send(ws,{type:"event",text});
     return;
   }
 });
 ws.on("close",()=>{
   if(player&&room&&room.players.has(player.id)){
     room.players.delete(player.id);
     broadcast(room,{type:"event",text:`${player.nickname} ha lasciato la room.`});
     if(room.players.size===0)rooms.delete(room.code);else broadcast(room,{type:"state",state:state(room)});
   }
 });
});

function nextRound(room){
 if(!room.started||room.finished)return;
 room.round++;
 room.current=question();
 broadcast(room,{type:"question",question:{direction:room.current.direction,prompt:room.current.prompt}});
 broadcast(room,{type:"state",state:state(room)});
}
function clean(s){return String(s||"OPERATORE").replace(/[^a-zA-Z0-9_ -]/g,"").trim().slice(0,18)||"OPERATORE"}

server.listen(PORT,()=>console.log(`The Last Machine server listening on ${PORT}`));

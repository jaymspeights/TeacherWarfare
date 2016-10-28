'use strict';
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var player = [];
var battle = [];
var lobby = [];
var random_lobby = [];
var game_count = 0;
var PORT = 80;
var random = [];

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/Teacher_Warfare.html")
});

app.get('/*', function (req, res) {
   res.sendFile(__dirname +"/pictures" +req.url);
});

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/controller', function (req, res) {
  var command = req.body.command;
  var name = req.body.name + "_" + req.body.host + req.body.id;
  var plyr = getPlayerByName(name);
  if (plyr!=null && plyr.start != null && plyr.key == req.body.key){
    switch(command){
      case '0':
          if (plyr.base.gold>=(plyr.base.level*100)){
            plyr.base.gold -= plyr.base.level*100;
            plyr.base.level += 1;
            res.sendStatus(200);
          }
          break;
      case '1':
          if (plyr.base.gold>=30){
            plyr.base.gold-=30;
            plyr.entity[plyr.entity.length] = {'class': 'bynosaur', 'damage': 25, 'hp': 75, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 30};
            res.sendStatus(200);
          }
          break;
      case '2':
          if (plyr.base.gold>=75){
            plyr.base.gold-=75;
            plyr.entity[plyr.entity.length] = {'class': 'wevodoge', 'damage': 50, 'hp': 15, 'x':0, 'speed': 10, 'range': 10, 'hits':1, 'cost': 75};
            res.sendStatus(200);
          }
          break;
      case '3':
          if (plyr.base.gold>=150){
            plyr.base.gold-=150;
            plyr.entity[plyr.entity.length] = {'class': 'moustache', 'damage': 15, 'hp': 300, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 150};
            res.sendStatus(200);
          }
          break;
      case '4':
          if (plyr.base.gold>=300){
            plyr.base.gold-=300;
            plyr.entity[plyr.entity.length] = {'class': 'dale', 'damage': 75, 'hp': 200, 'x':0, 'speed': 10, 'range': 0, 'hits':3, 'cost': 300};
            res.sendStatus(200);
          }
          break;
      default:
          res.sendStatus(400);
    }
  }
  else {res.sendStatus(400)}
});

app.post('/create', function (req, res) {
  var game_id = Math.floor(Math.random()*99000 + 1);
  var set_id = false;
  while(!set_id){
    set_id = true;
    for (var id of lobby){
      if (game_id == id.id){
      game_id += 1;
      set_id = false;
      break;
      }
    }
  }
  var today = new Date();
  var key = Math.floor(Math.random()*99999);
  var plyr = {"name": req.body.name, "key": key, "id": game_id, "date": today.getTime()};
  var data = {"id": game_id, "key": key};
  lobby[lobby.length] = plyr;
  res.status(200).send(data);
});

app.post('/join', function (req, res) {
  var p = getLobbyById(req.body.id);
  if (p!=null){
    var key = Math.floor(Math.random()*99999);
    var today = new Date();
    var b = {"player0":p.name + "_1" + req.body.id, "player1": req.body.name + "_0" + req.body.id, "id": req.body.id, "date":today.getTime()};
    var p0 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":b.player0, "key": p.key};
    var p1 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":b.player1, "key": key};
    player[player.length] = p0;
    player[player.length] = p1;
    battle[battle.length] = b;
    p.name = null;
    var data = {"id": req.body.id, "key": key};
    res.status(200).send(data);
  }
  else {res.sendStatus(400);}
});

app.post('/join_random', function (req, res) {
  if (req.body!=null){
    let p = getFirstLobby();
    if (p==null)  {
      var game_id = Math.floor(Math.random()*99000 + 100000);
      var set_id = false;
      while(!set_id){
        set_id = true;
        for (var id of lobby){
          if (game_id == id.id){
          game_id += 1;
          set_id = false;
          break;
          }
        }
      }
      var today = new Date();
      var key = Math.floor(Math.random()*99999+100000);
      var plyr = {"name": req.body.name, "key": key, "id": game_id, "date": today.getTime(), "random": true, "host": 1};
      random[random.length] = plyr;
      res.status(200).send(plyr);
    }
    else if (req.body.name!=null){
      var key = Math.floor(Math.random()*99999+100000);
      var today = new Date();
      var b = {"player0":p.name + "_1" + p.id, "player1": req.body.name + "_0" + p.id, "id": p.id, "date":parseInt(today.getTime())};
      var p0 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":b.player0, "key": p.key};
      var p1 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":b.player1, "key": key};
      p.name = null;
      player[player.length] = p0;
      player[player.length] = p1;
      battle[battle.length] = b;
      lobby[lobby.length] = p;
      var data = {"id": p.id, "key": key, "name":req.body.name, "host": 0};
      res.status(200).send(data);
    }
  }
  else {res.sendStatus(400);}
});

app.post('/game', function(req, res) {
  var b = getBattleById(req.body.id);
  if (b!=null){
    if (b.winner==null) {
      let p0 = copyPlayerByName(b.player0);
      p0.key = null;
      p0.name = p0.name.split("_")[0];
      let p1 = copyPlayerByName(b.player1);
      p1.key = null;
      p1.name = p1.name.split("_")[0];
      var data = {"you": p1, "them": p0}
      if (req.body.host == '1')
        data = {"you": p0, "them": p1};
      res.status(200).send(data);
    }
    else {
      removeBattleHistory(req.body.id);
      res.status(200).send({"winner":b.winner})
    }
  }
  else {res.sendStatus(400);}
});

app.post('/status', function(req, res){
  if(req.body!=null){
    let p = getLobbyById(req.body.id);
    if (p!=null)
      res.send(p);
    else res.sendStatus(400);
  }
  else{res.sendStatus(400);}
});

app.post('/Rstatus', function(req, res){
  if(req.body!=null){
    let p = getRandomLobbyById(req.body.id);
    if (p!=null&&p.name == null){
      res.send(p);
    }
    else if (p!=null&&req.body.name != null){
      p.date = p.date + 800;
      res.send(p);
    }
  }
  else{res.sendStatus(400);}
});


function getPlayerByName(name){
   for (var i in player){
    if (player[i].name == name)
      return player[i];
  }
}

function copyPlayerByName(name){
  for (var i in player){
    if (player[i].name == name){
    var p = {}
    for (var k in player[i])
      p[k] = player[i][k];
    return p;
    }
  }
}

function getLobbyById(ID){
  for (var l of lobby){
    if(l.id == ID){
      return l;
    }
  }
}

function copy(p){
  let pp = [];
  for (var k in p)
    pp[k] = p[k];
  return pp;
}

function getFirstLobby(){
  for (let l of random){
    if (l.name!=null){
      return l;
    }
  }
}
function getRandomLobbyById(ID){
  for (var l of random){
    if(l.id == ID){
      return l;
    }
  }
}
function removeplyrById(ID){
  for (var lob of lobby){
    if (lob.id == ID) {
      lob.flag = true;
      return lob;
    }
  }
}

function getBattleById(ID){
  for (var bat of battle){
    if(bat.id==ID){
      return bat;
    }
  }
}


function upkeep(){
  for (let b of battle){
    if(b.player0!=null)
      tick(b);
  }
}

function tick(b){
  var plyr0 = getPlayerByName(b.player0);
  var plyr1 = getPlayerByName(b.player1);
  if (plyr0.start == null && plyr0.base.gold>=100){
    plyr0.start = true;
    plyr1.start = true;
  }
  var plyr = [plyr0, plyr1];
  plyr[0].base.gold += 5 + plyr[0].base.level*5;
  plyr[1].base.gold += 5 + plyr[1].base.level*5;


  //SORT AND ESTABLISH FRONT
  var front = [0,0];
  if (plyr0.entity[0]!=null){
    plyr0.entity.sort(function(a,b){return b.x - a.x});
    front[0] = plyr0.entity[0].x;
  }
  if (plyr1.entity[0]!=null){
    plyr1.entity.sort(function(a,b){return b.x - a.x});
    front[1] = plyr1.entity[0].x;
  }

  //DEAL DAMAGE AND MOVE
  var c = front[0]<front[1] ? 0:1;
  for (let i = 0; i < plyr[c].entity.length; i += 1) {
    //at base
    if (plyr[c].entity[i].x + plyr[c].entity[i].range >= 200){
      plyr[c^1].base.hp -= plyr[c].entity[i].damage;
      for(let j = 0; j < plyr[c].entity[i].hits-1; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another plyr
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + front[c^1] >= 200){
      for(let j = 0; j < plyr[c].entity[i].hits; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + front[c^1] < 200){
      plyr[c].entity[i].x = ((plyr[c].entity[i].x + plyr[c].entity[i].speed) < (200 - front[c^1])) ?  (plyr[c].entity[i].x + plyr[c].entity[i].speed):(200 - front[c^1]);
    }
  }

  var newFront= plyr[c].entity[0]==null ? 0:plyr[c].entity[0].x;
  c = c^1;

  for (let i = 0; i < plyr[c].entity.length; i += 1) {
    //at base
    if (plyr[c].entity[i].x + plyr[c].entity[i].range >= 200){
      plyr[c^1].base.hp -= plyr[c].entity[i].damage;
      for(let j = 0; j < plyr[c].entity[i].hits-1; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another plyr
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + front[c^1] >= 200){
      for(let j = 0; j < plyr[c].entity[i].hits; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + newFront < 200){
      plyr[c].entity[i].x = ((plyr[c].entity[i].x + plyr[c].entity[i].speed) < (200 - newFront)) ?  (plyr[c].entity[i].x + plyr[c].entity[i].speed):(200 - newFront);
    }
  }

  //REMOVE DEAD ENTITIES
  for (var i = plyr0.entity.length-1;i>=0;i-=1){
    if (plyr0.entity[i].hp <=0){
      plyr0.entity.splice(i,1);
    }
  }
  for (var i = plyr1.entity.length-1;i>=0;i-=1){
    if (plyr1.entity[i].hp <=0){
      plyr1.entity.splice(i,1);
    }
  }


  if (plyr1.base.hp <= 0){
    var name = (b.player0).split("_")[0];
    endBattle(b.id,name);
    removeByName(plyr0.name);
    removeByName(plyr1.name);
    return;
  }
  else if (plyr0.base.hp <= 0){
    var name = (b.player1).split("_")[0];
    endBattle(b.id,name);
    removeByName(plyr0.name);
    removeByName(plyr1.name);
    return;
  }
}

function removeByName(name){
  for (var i in player){
    if (player[i].name == name)
      player.splice(i,1);
  }
}

function endBattle(ID, winner) {
  for(var b of battle){
    if (b.id == ID){
      b.player0 = null;
      b.player1 = null;
      b.winner = winner;
      game_count += 1;
      return;
    }
  }
}

function removeBattleHistory(ID){
  for(var b of battle){
    if (b.id == ID){
      b.flag = true;
      break;
    }
  }
  for(var p of lobby){
    if (p.id == ID){
      p.flag = true;
      break;
    }
  }
  for(var l of random_lobby){
    if (l.id == ID){
      l.flag = true;
      break;
    }
  }
}

function clearLobby(){
  var today = new Date();
  var now = today.getTime();
  for (let i = (lobby.length - 1); i >= 0; i -= 1){
    if (lobby[i].date + 1000000 < now || lobby[i].flag == true){
      lobby.splice(i, 1);
    }
  }
  for (let i = (random.length - 1); i >= 0; i -= 1){
    if (random[i].date + 669 <= now){
      random.splice(i, 1);
    }
  }
}

function clearBattles(){
  var today = new Date()
  for(var i = battle.length-1;i>=0;i-=1){
    if (battle[i].flag == true || parseInt(battle[i].date,10) + 10000000<today.getTime() || (parseInt(battle[i].date,10) + 60000<today.getTime() && battle[i].player0==null)){
      battle.splice(i,1);
    }
  }
}

function getData(){
  return {"players":players.length,"lobby":lobby.length, "random_lobby":random_lobby.length};
}

function logData(){
  console.log("\nListening on port "+PORT+"\nPlayers: "+player.length+"\nLobby size: "+lobby.length+"\nRandom Lobby size: "+random.length+"\nBattles: "+battle.length + "\nGames played: "+game_count);
}


var loopCleanup1 = setInterval(clearLobby, 1000);
var loopGame = setInterval(upkeep, 666);
var loopCleanup2 = setInterval(clearBattles, 60000);
var loopLog = setInterval(logData, 3000);

app.listen(PORT);
console.log("listening on port "+PORT);

'use strict';
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var app = express();
var player = [];

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/files/Teacher_Warfare.html")
});

app.get('/*', function (req, res) {
  console.log(req.url)
   res.sendFile(__dirname +"/pictures" +req.url);
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/controller', function (req, res) {
  var command = req.body.command;
  var name = req.body.name + "_" + req.body.host + req.body.id;
  console.log(name)
  console.log(player)
  var plyr = getPlayerByName(name);
  console.log("command sent")
  console.log(req.body)
  console.log(plyr)
  if (plyr.start != null && plyr.key == req.body.key){
    switch(command){
      case '0':
          if (plyr.base.gold>(plyr.base.level*100)){
            plyr.base.gold -= plyr.base.level*100;
            plyr.base.level += 1;
            res.sendStatus(200);
          }
          break;
      case '1':
          if (plyr.base.gold>30){
            plyr.base.gold-=30;
            plyr.entity[plyr.entity.length] = {'class': 'bynosaur', 'damage': 15, 'hp': 75, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 30};
            res.sendStatus(200);
          }
          break;
      case '2':
          if (plyr.base.gold>75){
            plyr.base.gold-=75;
            plyr.entity[plyr.entity.length] = {'class': 'wevodoge', 'damage': 50, 'hp': 15, 'x':0, 'speed': 10, 'range': 10, 'hits':1, 'cost': 75};
            res.sendStatus(200);
          }
          break;
      case '3':
          if (plyr.base.gold>150){
            plyr.base.gold-=150;
            plyr.entity[plyr.entity.length] = {'class': 'moustache', 'damage': 15, 'hp': 300, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 150};
            res.sendStatus(200);
          }
          break;
      case '4':
          if (plyr.base.gold>300){
            plyr.base.gold-=300;
            plyr.entity[plyr.entity.length] = {'class': 'dale', 'damage': 75, 'hp': 200, 'x':0, 'speed': 10, 'range': 0, 'hits':3, 'cost': 300};
            res.sendStatus(200);
          }
          break;
      default:
          res.sendStatus(500);
    }
  }
  else {res.sendStatus(500)}
});

app.post('/create', function (req, res) {
  console.log("got a create request");
  var game_id = Math.floor(Math.random()*99000 + 1);
  var set_id = false;
  while(!set_id){
    var id = fs.readFileSync("files/lobby.txt","utf8").split("\n");
    set_id = true;
    for (var i in id){
      if (id[i]!="null"){
        if (game_id == JSON.parse(id[i]).id){
        game_id += 1;
        set_id = false;
        break;
        }
      }
    }
  }
  var today = new Date();
  var key = Math.floor(Math.random()*99999);
  var plyr = {"name": req.body.name, "key": key, "id": game_id, "date": today.getTime()};
  var data = {"id": game_id, "key": key};
  fs.appendFile("files/lobby.txt","\n"+JSON.stringify(plyr));
  res.status(200).send(data);
});

app.post('/join', function (req, res) {
  console.log("post join request");
  var plyr = removeplyrById(req.body.id);
  if (plyr!=null){
    var p = JSON.parse(plyr);
    var key = Math.floor(Math.random()*99999);
    var battle = {"plyr0":p.name + "_1" + req.body.id, "plyr1": req.body.name + "_0" + req.body.id, "id": req.body.id};
    var p0 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":battle.plyr0, "key": p.key};
    var p1 = {"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":battle.plyr1, "key": key};
    player[player.length] = p0;
    player[player.length] = p1;
    console.log(player)
    fs.appendFile("files/battle.txt","\n"+JSON.stringify(battle));
    p.name = null;
    fs.appendFile("files/lobby.txt", "\n"+JSON.stringify(p));
    var data = {"id": req.body.id, "key": key};
    res.status(200).send(data);
  }
  else {res.sendStatus(500);}
});

app.post('/game', function(req, res) {
  console.log("game")
  var battle = getBattleById(req.body.id)
  if (battle!=null){
    if (battle.winner==null) {
      let p0 = copyPlayerByName(battle.plyr0);
      p0.key = null;
      p0.name = p0.name.split("_")[0];
      let p1 = copyPlayerByName(battle.plyr1);
      console.log("\n\n")
      console.log(player)
      p1.key = null;
      p1.name = p1.name.split("_")[0];
      console.log(player)
      var data = {"you": p1, "them": p0}
      if (req.body.host == '1')
        data = {"you": p0, "them": p1};
      res.status(200).send(data);
    }
    else {
      removeBattleHistory(req.body.id);
      res.status(200).send({"winner":battle.winner})
    }
  }
  else {res.sendStatus(500);}
});

app.post('/status', function(req, res){
  if(req.body!=null){
    var plyr = getplyrById(req.body.id);
    res.send(JSON.parse(plyr));
  }
  else{res.sendStatus(500);}
});

function getPlayerByName(name){
  console.log(player)
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
    console.log(p)
    return p;
  }
  }
}

function getplyrById(ID){
  var plyr = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for (var i in plyr){
    if(plyr[i]!="null"){
      if (JSON.parse(plyr[i]).id == ID){
        return plyr[i];
      }
    }
  }
}

function removeplyrById(ID){
  var plyr = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  var data = "null";
  for (var i in plyr){
    if(plyr[i]!="null"){
      if (JSON.parse(plyr[i]).id == ID){
        var p = plyr[i];
        plyr.splice(i,1);
        if(plyr.length>1){
          data = plyr.join("\n");
        }
        else {
          data = plyr[0];
        }
        fs.writeFile("files/lobby.txt",data);
        return p;
      }
    }
  }
}

function getBattleById(ID){
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  for (var i in battle){
    if(battle[i]!="null"){
      if (JSON.parse(battle[i]).id == ID) return JSON.parse(battle[i]);
    }
  }
}

function clearLobby(){
  console.log("clear called");
  var today = new Date();
  var now = today.getTime();
  var n = '{"name": '+null+', "id": 0, "date": '+now+'}';
  fs.appendFile("files/lobby.txt","\n"+ n);
  var plyr = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for (var i = (plyr.length - 2); i > 0; i -= 1){
    if (JSON.parse(plyr[i]).date + 10000000 < now){
      plyr.splice(i, 1);
    }
  }
  fs.writeFileSync("files/lobby.txt",plyr.join("\n"));
}

function upkeep(){
  console.log("upkeep")
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  if (battle!="null"){
    for (var i in battle){
      if(battle[i]!="null"){
        var b = JSON.parse(battle[i]);
        if (b.plyr0 != null){
          tick(b);
        }
      }
    }
  }
}

function tick(battle){
  console.log("tick")
  console.log(battle.plyr0)
  console.log(battle.plyr1)
  var plyr0 = getPlayerByName(battle.plyr0);
  var plyr1 = getPlayerByName(battle.plyr1);
  console.log(plyr0)
  console.log(plyr1)
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
  for (var i in plyr[c].entity) {
    //at base
    if (plyr[c].entity[i].x + plyr[c].entity[i].range >= 200){
      plyr[c^1].base.hp -= plyr[c].entity[i].damage;
      for(var j = 0; j < plyr[c].entity[i].hits-1; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another plyr
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + front[c^1] >= 200){
      for(var j = 0; j < plyr[c].entity[i].hits; j += 1){
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

  front[c]= plyr[c].entity[0]==null ? 0:plyr[c].entity[0].x;
  c = c^1;
  for (var i in plyr[c].entity) {
    //at base
    if (plyr[c].entity[i].x + plyr[c].entity[i].range >= 200){
      plyr[c^1].base.hp -= plyr[c].entity[i].damage;
      for(var j = 0; j < plyr[c].entity[i].hits-1; j += 1){
        if (plyr[c^1].entity[j] != null && (200 - plyr[c^1].entity[j].x - plyr[c].entity[i].x - plyr[c].entity[i].range)<=0){
          plyr[c^1].entity[j].hp -= plyr[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another plyr
    else if (plyr[c].entity[i].x + plyr[c].entity[i].range + front[c^1] >= 200){
      for(var j = 0; j < plyr[c].entity[i].hits; j += 1){
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

  //REMOVE DEAD ENTITIES
  for (var i = plyr0.entity.length-1;i>=0;i-=1){
    if (plyr0.entity[i].hp <=0){
      plyr0.entity.splice(i);
    }
  }
  for (var i = plyr1.entity.length-1;i>=0;i-=1){
    if (plyr1.entity[i].hp <=0){
      plyr1.entity.splice(i);
    }
  }


  if (plyr1.base.hp <= 0){
    var name = (battle.plyr0).split("_")[0];
    endBattle(battle.id,name);
    removeByName(plyr0.name);
    removeByName(plyr1.name);
    return;
  }
  else if (plyr0.base.hp <= 0){
    var name = (battle.plyr1).split("_")[0];
    endBattle(battle.id,name);
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
  console.log("ending battle")
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  for(var i in battle){
    var b = JSON.parse(battle[i]);
    if (b!= null){
      if (b.id == ID){
        b.plyr0 = null;
        b.plyr1 = null;
        b.winner = winner;
        battle[i] = JSON.stringify(b);
        fs.writeFile("files/battle.txt",battle.join("\n"));
        break;
      }
    }
  }
}

function removeBattleHistory(ID){
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  for(var i in battle){
    if (battle[i]!="null"&&JSON.parse(battle[i]).id == ID){
      var b = JSON.parse(battle[i]);
      b.mark = true;
      battle[i]=JSON.stringify(b);
      fs.writeFile("files/battle.txt",battle.join("\n"));
      break;
    }
  }
  var plyr = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for(var i in plyr){
    if (plyr[i]!="null"&&JSON.parse(plyr[i]).id == ID){
      plyr.splice(i,1);
      fs.writeFile("files/lobby.txt",plyr.join("\n"));
      break;
    }
  }
  return b;
}

function clearBattles(){
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  for(var i = battle.length-1;i>=0;i-=1){
    if (battle[i]!="null"&&JSON.parse(battle[i]).mark == true){
      battle.splice(i,1);
    }
  }
  fs.writeFile("files/battle.txt",battle.join("\n"));
}

fs.writeFileSync("files/lobby.txt",null);
fs.writeFileSync("files/battle.txt",null);
clearLobby();
clearBattles();
var loopCleanup1 = setInterval(clearLobby, 86400000);
var loopGame = setInterval(upkeep, 1000);
var loopCleanup2 = setInterval(clearBattles, 86400000);

app.listen(80);
console.log("listening");

//'use strict';
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var app = express();

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
  var filename = "files/" + req.body.key + "_" + req.body.name + "_" + req.body.host + req.body.id;
  var p = fs.readFileSync(filename + ".json","utf8");
  p = p.replace("}}","}");

  if (p!=null){
    var player = JSON.parse(p);
  }
  if (player.start != null){
    switch(command){
      case '0':
          if (player.base.gold>(player.base.level*100)){
            fs.appendFileSync(filename + ".txt","\nLEVEL");
            res.sendStatus(200);
          }
          break;
      case '1':
          if (player.base.gold>30){
            fs.appendFileSync(filename + ".txt", "\n"+JSON.stringify({'class': 'bynosaur', 'damage': 15, 'hp': 75, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 30}));
            res.sendStatus(200);
          }
          break;
      case '2':
          if (player.base.gold>75){
            fs.appendFileSync(filename+ ".txt", "\n"+JSON.stringify({'class': 'wevodoge', 'damage': 50, 'hp': 15, 'x':0, 'speed': 10, 'range': 10, 'hits':1, 'cost': 75}));
            res.sendStatus(200);
          }
          break;
      case '3':
          if (player.base.gold>150){
            fs.appendFileSync(filename+ ".txt", "\n"+JSON.stringify({'class': 'moustache', 'damage': 15, 'hp': 300, 'x':0, 'speed': 10, 'range': 0, 'hits':1, 'cost': 150}));
            res.sendStatus(200);
          }
          break;
      case '4':
          if (player.base.gold>300){
            fs.appendFileSync(filename+ ".txt", "\n"+JSON.stringify({'class': 'dale', 'damage': 75, 'hp': 200, 'x':0, 'speed': 10, 'range': 0, 'hits':3, 'cost': 300}));
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
  var player = {"name": key +"_" + req.body.name, "id": game_id, "date": today.getTime()};
  var data = {"id": game_id, "key": key};
  fs.appendFile("files/lobby.txt","\n"+JSON.stringify(player));
  res.status(200).send(data);
});

app.post('/join', function (req, res) {
  console.log("post join request");
  var player = removePlayerById(req.body.id);
  if (player!=null){
    var p = JSON.parse(player);
    var key = Math.floor(Math.random()*99999);
    var battle = {"player0":p.name + "_1" + req.body.id, "player1": key+"_"+req.body.name + "_0" + req.body.id, "id": req.body.id};
    var name0 = "files/"+battle.player0;
    var name1 = "files/"+battle.player1;
    var start0 = JSON.stringify({"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":p.name.split("_")[1]});
    var start1 = JSON.stringify({"entity": [], "base": {"hp": 1000, "gold": 0, "level": 1},"name":req.body.name});
    fs.writeFile(name0 + ".json", start0);
    fs.writeFile(name1 + ".json", start1);
    fs.writeFile(name0 + ".txt", "null");
    fs.writeFile(name1 + ".txt", "null");
    fs.appendFile("files/battle.txt","\n"+JSON.stringify(battle));
    p.name = null;
    fs.appendFile("files/lobby.txt", "\n"+JSON.stringify(p));
    var data = {"id": req.body.id, "key": key};
    res.status(200).send(data);
  }
  else {res.sendStatus(500);}
});

app.post('/game', function(req, res) {
  var battle = getBattleById(req.body.id)
  if (battle!=null){
    if (battle.winner==null) {
      var file_player0 = "files/"+battle.player0+".json";
      var file_player1 = "files/"+battle.player1+".json";
      var p0 = fs.readFileSync(file_player0,"utf8");
      var p1 = fs.readFileSync(file_player1,"utf8");
      var player0 = JSON.parse(p0);
      var player1 = JSON.parse(p1);
      var data = {"you": player1, "them": player0}
      if (req.body.host == '1')
        data = {"you": player0, "them": player1};
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
    var player = getPlayerById(req.body.id);
    res.send(JSON.parse(player));
  }
  else{res.sendStatus(500);}
});


function getPlayerById(ID){
  var player = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for (var i in player){
    if(player[i]!="null"){
      if (JSON.parse(player[i]).id == ID){
        return player[i];
      }
    }
  }
}

function removePlayerById(ID){
  var player = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  var data = "null";
  for (var i in player){
    if(player[i]!="null"){
      if (JSON.parse(player[i]).id == ID){
        var p = player[i];
        player.splice(i,1);
        if(player.length>1){
          data = player.join("\n");
        }
        else {
          data = player[0];
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
  var player = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for (var i = (player.length - 2); i > 0; i -= 1){
    if (JSON.parse(player[i]).date + 10000000 < now){
      player.splice(i, 1);
    }
  }
  fs.writeFileSync("files/lobby.txt",player.join("\n"));
}

function upkeep(){
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  if (battle!="null"){
    for (var i in battle){
      if(battle[i]!="null"){
        var b = JSON.parse(battle[i]);
        if (b.player0 != null){
          tick(b);
        }
      }
    }
  }
}

function update(filename){
  var p = fs.readFileSync(filename +".json","utf8",function(){});
  p = p.replace("}}","}");
  var player = JSON.parse(p);
  var newEntity =fs.readFileSync(filename+".txt","utf8").split("\n");
  for (var i =0;i<4;i++){
    if (newEntity[i]!=null&&newEntity[i]!="null" && newEntity[i]!="LEVEL"){
      var e = JSON.parse(newEntity[i]);
      if (player.base.gold >= e.cost){
        player.base.gold -= e.cost;
        player.entity[player.entity.length] = e;
      }
    }
    else if (newEntity[i]!=null&&newEntity[i]=="LEVEL" && player.base.gold >= player.base.level*100){
      player.base.gold -= player.base.level*100
      player.base.level += 1;
    }
  }
  fs.writeFile(filename+".txt","null");
  return player;
}

function tick(battle){
  var file_player0 = "files/"+battle.player0;
  var file_player1 = "files/"+battle.player1;
  var player0 = update(file_player0);
  var player1 = update(file_player1);
  if (player0.start == null && player0.base.gold>=100){
    player0.start = true;
    player1.start = true;
  }
  var player = [player0, player1];
  player[0].base.gold += 5 + player[0].base.level*5;
  player[1].base.gold += 5 + player[1].base.level*5;


  //SORT AND ESTABLISH FRONT
  var front = [0,0];
  if (player0.entity[0]!=null){
    player0.entity.sort(function(a,b){return b.x - a.x});
    front[0] = player0.entity[0].x;
  }
  if (player1.entity[0]!=null){
    player1.entity.sort(function(a,b){return b.x - a.x});
    front[1] = player1.entity[0].x;
  }

  //DEAL DAMAGE AND MOVE
  var c = front[0]<front[1] ? 0:1;
  for (var i in player[c].entity) {
    //at base
    if (player[c].entity[i].x + player[c].entity[i].range >= 200){
      player[c^1].base.hp -= player[c].entity[i].damage;
      for(var j = 0; j < player[c].entity[i].hits-1; j += 1){
        if (player[c^1].entity[j] != null && (200 - player[c^1].entity[j].x - player[c].entity[i].x - player[c].entity[i].range)<=0){
          player[c^1].entity[j].hp -= player[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another player
    else if (player[c].entity[i].x + player[c].entity[i].range + front[c^1] >= 200){
      for(var j = 0; j < player[c].entity[i].hits; j += 1){
        if (player[c^1].entity[j] != null && (200 - player[c^1].entity[j].x - player[c].entity[i].x - player[c].entity[i].range)<=0){
          player[c^1].entity[j].hp -= player[c].entity[i].damage;
        }
        else break;
      }
    }
    else if (player[c].entity[i].x + player[c].entity[i].range + front[c^1] < 200){
      player[c].entity[i].x = ((player[c].entity[i].x + player[c].entity[i].speed) < (200 - front[c^1])) ?  (player[c].entity[i].x + player[c].entity[i].speed):(200 - front[c^1]);
    }
  }

  front[c]= player[c].entity[0]==null ? 0:player[c].entity[0].x;
  c = c^1;
  for (var i in player[c].entity) {
    //at base
    if (player[c].entity[i].x + player[c].entity[i].range >= 200){
      player[c^1].base.hp -= player[c].entity[i].damage;
      for(var j = 0; j < player[c].entity[i].hits-1; j += 1){
        if (player[c^1].entity[j] != null && (200 - player[c^1].entity[j].x - player[c].entity[i].x - player[c].entity[i].range)<=0){
          player[c^1].entity[j].hp -= player[c].entity[i].damage;
        }
        else break;
      }
    }
    //at another player
    else if (player[c].entity[i].x + player[c].entity[i].range + front[c^1] >= 200){
      for(var j = 0; j < player[c].entity[i].hits; j += 1){
        if (player[c^1].entity[j] != null && (200 - player[c^1].entity[j].x - player[c].entity[i].x - player[c].entity[i].range)<=0){
          player[c^1].entity[j].hp -= player[c].entity[i].damage;
        }
        else break;
      }
    }
    else if (player[c].entity[i].x + player[c].entity[i].range + front[c^1] < 200){
      player[c].entity[i].x = ((player[c].entity[i].x + player[c].entity[i].speed) < (200 - front[c^1])) ?  (player[c].entity[i].x + player[c].entity[i].speed):(200 - front[c^1]);
    }
  }

  //REMOVE DEAD ENTITIES
  for (var i = player0.entity.length-1;i>=0;i-=1){
    if (player0.entity[i].hp <=0){
      player0.entity.splice(i);
    }
  }
  for (var i = player1.entity.length-1;i>=0;i-=1){
    if (player1.entity[i].hp <=0){
      player1.entity.splice(i);
    }
  }


  if (player1.base.hp <= 0){
    var name = (battle.player0).split("_")[1];
    fs.unlink((file_player0 + ".json"));
    fs.unlink((file_player1 + ".json"));
    fs.unlink((file_player0 + ".txt"));
    fs.unlink((file_player1 + ".txt"));
    endBattle(battle.id,name);
    return;
  }
  else if (player0.base.hp <= 0){
    var name = (battle.player1).split("_")[1];
    fs.unlink((file_player0 + ".json"));
    fs.unlink((file_player1 + ".json"));
    fs.unlink((file_player0 + ".txt"));
    fs.unlink((file_player1 + ".txt"));
    endBattle(battle.id,name);
    return;
  }
  var p0 = JSON.stringify(player0);
  var p1 = JSON.stringify(player1);
  fs.writeFile((file_player0 + ".json"),p0);
  fs.writeFile((file_player1 + ".json"),p1);
}



function endBattle(ID, winner) {
  console.log("ending battle")
  var battle = fs.readFileSync("files/battle.txt","utf8").split("\n");
  for(var i in battle){
    var b = JSON.parse(battle[i]);
    if (b!= null){
      if (b.id == ID){
        b.player0 = null;
        b.player1 = null;
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
  var player = fs.readFileSync("files/lobby.txt","utf8").split("\n");
  for(var i in player){
    if (player[i]!="null"&&JSON.parse(player[i]).id == ID){
      player.splice(i,1);
      fs.writeFile("files/lobby.txt",player.join("\n"));
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

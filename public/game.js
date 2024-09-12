import Bullet from "./bullet.js";
import Wall from "./wall.js";
import Tank from "./tank.js";

const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export const ctx = canvas.getContext("2d");
export const width = 2800;
export const height =1260;

const scaleX =  window.innerWidth/width ;
const scaleY = window.innerHeight/height ;
const scale = Math.min(scaleX, scaleY); // 确保地图能够完整显示


export const walls=[];
export let myTank = null;

const otherTanks = {};

export const bullets = [];
const bulletMaxRebound = 1;


export const socket = new WebSocket('ws://8.138.94.211:8000');

socket.onopen = () => {
    console.log('Connected to WebSocket server');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'new_player') {
        console.log(`New player joined: ${message.id}`);
    } else if (message.type === 'update') {
        const playerId = message.id;
        const state = message.state;
        const bullet=state.bullet;

        if (!otherTanks[playerId]) {
            otherTanks[playerId] = new Tank(state.x, state.y, 'red', 30); // 添加新玩家的坦克
        }
        if(bullet){
            bullets.push(new Bullet(bullet.x, bullet.y, bullet.angle));
        }
        
        otherTanks[playerId].x = state.x;
        otherTanks[playerId].y = state.y;
        otherTanks[playerId].angle = state.angle;
    } else if (message.type === 'player_left') {
        console.log(`Player ${message.id} left`);
        delete otherTanks[message.id]; // 移除离开的玩家坦克
    } else if (message.type === 'map_data') {
        for(const wall of message.map){
            walls.push(new Wall(wall.x,wall.y,wall.width,wall.height));
        }
        console.log('Map data received:', walls);
        aftermap();
    }
};


function isTankInWall(tank, walls) {
    for (let wall of walls) {
        if (
            tank.x + tank.size / 2 > wall.x && 
            tank.x - tank.size / 2 < wall.x + wall.width &&
            tank.y + tank.size / 2 > wall.y && 
            tank.y - tank.size / 2 < wall.y + wall.height
        ) {
            return true; // 坦克与墙壁重叠
        }
    }
    return false; // 坦克位置合法
}

// 随机生成坦克位置，确保不与墙壁重叠
function generateRandomTankPosition(walls, tankSize) {
    let x, y;
    let validPosition = false;

    while (!validPosition) {
        x = Math.random() * (width - tankSize) + tankSize / 2;
        y = Math.random() * (height - tankSize) + tankSize / 2;
        
        const tempTank = { x: x, y: y, size: tankSize };

        if (!isTankInWall(tempTank, walls)) {
            validPosition = true;
        }
    }

    return { x, y };
}

const keyMap = {};

function handleTankMovement() {
    let change = false;

    let r = 1.0;
    if (keyMap['KeyW']) {
        myTank.move(r);
        change = true;
    }
    if (keyMap['KeyS']) {
        myTank.move(-r);
        change = true;
    }
    if (keyMap['KeyA']) {
        r *= 3;
        myTank.rotate(-r);
        change = true;
    }
    if (keyMap['KeyQ']) {
        myTank.rotate(-r);
        change = true;
    }
    if (keyMap['KeyD']) {
        r *= 3;
        myTank.rotate(r);
        change = true;
    }
    if (keyMap['KeyE']) {
        myTank.rotate(r);
        change = true;
    }
    if (keyMap['Space']) {
        myTank.shot();
        change = true;
    }

    if (change) myTank.sendState();
}

function loop(){
    // ctx.save();
    // ctx.scale(scale,scale);
    ctx.fillStyle='rgba(255,255,255,1)';
    ctx.fillRect(0,0,width+5,height+5);    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2; // 边界线宽度
    ctx.strokeRect(0, 0, width+1, height+1); // 画出地图的边界线
    handleTankMovement();
    myTank.draw();    
    for(const key in otherTanks){
        otherTanks[key].draw();
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.update();
        if(bullet.timer > 500 || bullet.reboundTime > bulletMaxRebound){
            bullets.splice(i, 1);
            continue;
        }
        bullet.draw();
    }
    for(const wall of walls){
        wall.draw();
    }
    // ctx.restore();
    requestAnimationFrame(loop);
}

function aftermap(){
    // console.log(window.innerWidth);
    // console.log(window.innerHeight);
    
    const tankPosition = generateRandomTankPosition(walls, 30);
    myTank = new Tank(tankPosition.x, tankPosition.y, 'blue', 30);

    window.onkeydown = (event) => {
        keyMap[event.code] = true;
    };
    
    // 键盘松开事件，更新按键状态
    window.onkeyup = (event) => {
        keyMap[event.code] = false;
    };
    ctx.scale(scale,scale);
    myTank.sendState();
    loop();
}

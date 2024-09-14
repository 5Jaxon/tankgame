import {BulletType, Bullet} from "./bullet.js";
import Wall from "./wall.js";
import Tank from "./tank.js";

const canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

export const ctx = canvas.getContext("2d");
export const width = 2660;
export const height = 1260;

const scaleX =  window.innerWidth/width ;
const scaleY = window.innerHeight/height ;
const scale = Math.min(scaleX, scaleY);

export let lastTime = 0;

export const walls=[];
export let myTank = null;
const otherTanks = {};

export const bullets = [];

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
        const bullet = state.bullet;

        if (!otherTanks[playerId]) {
            otherTanks[playerId] = new Tank(state.x, state.y, 'red', 30);
        }
        if(bullet){
            bullets.push(new Bullet(bullet.x, bullet.y, bullet.angle, bullet.type));
        }
        
        otherTanks[playerId].x = state.x;
        otherTanks[playerId].y = state.y;
        otherTanks[playerId].angle = state.angle;
        otherTanks[playerId].life = state.life;
    } else if (message.type === 'player_left') {
        console.log(`Player ${message.id} left`);
        delete otherTanks[message.id];
    } else if (message.type === 'map_data') {
        for(const wall of message.map){
            walls.push(new Wall(wall.x,wall.y,wall.width,wall.height));
        }
        console.log('Map data received:', walls);
        afterMap();
    }
};

export function tankCollidedWithWalls(x, y, size) {
    for (let wall of walls) {
        if (
            x + size / 2 > wall.x && 
            x - size / 2 < wall.x + wall.width &&
            y + size / 2 > wall.y &&
            y - size / 2 < wall.y + wall.height
        ) {
            return true;
        }
    }

    return (
        x + size / 2 > width ||
        x - size / 2 < 0 ||
        y - size / 2 < 0 ||
        y + size / 2 > height
    );
}

function generateRandomTankPosition(tankSize) {
    let x, y;
    do {
        x = Math.random() * (width - tankSize) + tankSize / 2;
        y = Math.random() * (height - tankSize) + tankSize / 2;
    } while (tankCollidedWithWalls(x, y, tankSize));

    return { x, y };
}

const keyMap = {};

function handleTankMovement(delay) {
    let change = false;

    let r = 1.0;
    if (keyMap['KeyW']) {
        myTank.move(r * delay);
        change = true;
    }
    if (keyMap['KeyS']) {
        myTank.move(-r * delay);
        change = true;
    }
    if (keyMap['KeyA']) {
        r *= 3;
        myTank.rotate(-r * delay);
        change = true;
    }
    if (keyMap['KeyQ']) {
        myTank.rotate(-r * delay);
        change = true;
    }
    if (keyMap['KeyD']) {
        r *= 3;
        myTank.rotate(r * delay);
        change = true;
    }
    if (keyMap['KeyE']) {
        myTank.rotate(r * delay);
        change = true;
    }
    if (keyMap['KeyJ']) {
        myTank.shoot(BulletType.Normal);
        change = true;
    } else if (keyMap['KeyK']) {
        myTank.shoot(BulletType.Spring);
        change = true;
    }

    if (change) myTank.sendState();
}

function loop(timestamp){
    const delay = (timestamp - lastTime) / 15;
    lastTime = timestamp;
    ctx.fillStyle ='rgba(255,255,255,1)';
    ctx.fillRect(0, 0, width + 30, height + 30);    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width + 2, height + 2);
    handleTankMovement(delay);
    myTank.draw();    
    for (const key in otherTanks) {
        otherTanks[key].draw();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        let hitTank = bullet.update();
        if (hitTank || bullet.timer > bullet.endTime || bullet.reboundTime > bullet.maxRebound) {
            bullets.splice(i, 1);
            continue;
        }
        bullet.draw();
    }

    for (const wall of walls) {
        wall.draw();
    }

    requestAnimationFrame(loop);
}

function afterMap(){
    const tankPosition = generateRandomTankPosition(30);
    myTank = new Tank(tankPosition.x, tankPosition.y, 'blue', 30, 3);

    window.onkeydown = (event) => {
        keyMap[event.code] = true;
    };

    window.onkeyup = (event) => {
        keyMap[event.code] = false;
    };
    ctx.scale(scale,scale);
    myTank.sendState();
    loop();
}

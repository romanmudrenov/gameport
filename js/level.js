import { textures } from './textures.js';
import {
    createCommandoMesh,
    createTurretMesh,
    createPowerupMesh,
    createBossMesh
} from './models.js';

export const LEVEL_LENGTH = 145;

export const world = {
    platforms: [],
    enemies: [],
    bullets: [],
    particles: [],
    powerups: [],
    decor: [],
    boss: null
};

export function clearLevel(scene) {
    const lists = [
        world.platforms,
        world.enemies,
        world.bullets,
        world.particles,
        world.powerups,
        world.decor
    ];

    for (const list of lists) {
        for (const item of list) {
            scene.remove(item.mesh || item);
        }
        list.length = 0;
    }

    if (world.boss && world.boss.mesh) {
        scene.remove(world.boss.mesh);
    }
    world.boss = null;

    const bossUI = document.getElementById('boss-bar-container');
    if (bossUI) bossUI.style.display = 'none';
}

function addPlatform(scene, x, y, width, height, isMetal = false) {
    const geo = new THREE.BoxGeometry(width, height, 3.2);
    const mat = new THREE.MeshLambertMaterial({
        map: isMetal ? textures.metal : textures.ground
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + width / 2, y - height / 2, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    world.platforms.push({ mesh, x, y, width, height });
}

function spawnTurret(scene, x, y) {
    const { group, barrelPivot } = createTurretMesh();
    group.position.set(x, y + 0.7, 0);
    scene.add(group);
    world.enemies.push({
        type: 'turret',
        mesh: group,
        barrelPivot,
        x,
        y: y + 0.7,
        hp: 5,
        cooldown: 1.5
    });
}

function spawnSoldier(scene, x, y, patrolMin, patrolMax) {
    const mesh = createCommandoMesh(true);
    mesh.position.set(x, y, 0);
    scene.add(mesh);
    world.enemies.push({
        type: 'soldier',
        mesh,
        x,
        y,
        vx: -3.2,
        patrolMin,
        patrolMax,
        hp: 2,
        cooldown: 1.2 + Math.random(),
        animTime: Math.random() * 10
    });
}

function spawnPowerup(scene, x, y) {
    const mesh = createPowerupMesh();
    mesh.position.set(x, y, 0);
    scene.add(mesh);
    world.powerups.push({ mesh, baseY: y, x, time: 0 });
}

export function buildLevel(scene) {
    clearLevel(scene);

    // Кибер-фон
    const bgWall = new THREE.Mesh(
        new THREE.PlaneGeometry(220, 40),
        new THREE.MeshBasicMaterial({ map: textures.cyberWall })
    );
    bgWall.position.set(90, 10, -8);
    scene.add(bgWall);
    world.decor.push(bgWall);

    // Земля и мосты с пропастями
    addPlatform(scene, -8, 0, 32, 4, false);
    addPlatform(scene, 27, 0, 26, 4, false);
    addPlatform(scene, 56, 0, 34, 4, true);
    addPlatform(scene, 94, 0, 58, 4, true);

    // Многоуровневые платформы
    addPlatform(scene, 10, 3.0, 9, 0.7, true);
    addPlatform(scene, 21, 5.2, 8, 0.7, true);
    addPlatform(scene, 34, 3.2, 10, 0.7, false);
    addPlatform(scene, 47, 5.5, 11, 0.7, true);
    addPlatform(scene, 64, 3.3, 10, 0.7, true);
    addPlatform(scene, 77, 5.5, 10, 0.7, true);
    addPlatform(scene, 104, 3.2, 8, 0.7, true);
    addPlatform(scene, 116, 5.4, 8, 0.7, true);

    // Оружие Spread Gun
    spawnPowerup(scene, 16, 5.2);
    spawnPowerup(scene, 69, 5.5);
    spawnPowerup(scene, 108, 5.4);

    // Солдаты и турели
    spawnSoldier(scene, 16, 0, 8, 22);
    spawnSoldier(scene, 14, 3.0, 10.5, 18.5);
    spawnTurret(scene, 39, 3.2);
    spawnSoldier(scene, 42, 0, 30, 50);
    spawnTurret(scene, 52, 5.5);
    spawnSoldier(scene, 68, 0, 58, 86);
    spawnSoldier(scene, 70, 3.3, 64.5, 73.5);
    spawnTurret(scene, 83, 5.5);
    spawnSoldier(scene, 102, 0, 95, 125);
    spawnSoldier(scene, 118, 0, 100, 130);
    spawnTurret(scene, 120, 5.4);

    // Вода внизу
    const water = new THREE.Mesh(
        new THREE.BoxGeometry(220, 2, 12),
        new THREE.MeshBasicMaterial({ color: 0x0055aa })
    );
    water.position.set(90, -5, 0);
    scene.add(water);
    world.decor.push(water);

    // Финальный Босс
    const { group: bossGroup, core } = createBossMesh();
    bossGroup.position.set(LEVEL_LENGTH, 0, 0);
    scene.add(bossGroup);

    world.boss = {
        mesh: bossGroup,
        core,
        x: LEVEL_LENGTH - 1.1,
        y: 3.2,
        hp: 60,
        maxHp: 60,
        cooldown: 1.2,
        phaseTime: 0
    };
}

function makeCanvasTex(drawFn, repeatX = 1, repeatY = 1) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    drawFn(ctx, 128, 128);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

export function createProceduralTextures() {
    const metal = makeCanvasTex((ctx, w, h) => {
        ctx.fillStyle = '#3a4454';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#1e242e';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, h - 4);

        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ctx.fillStyle = '#7a8a9e';
        for (let rx = 12; rx <= 116; rx += 104) {
            for (let ry = 12; ry <= 96; ry += 28) {
                ctx.beginPath();
                ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.fillStyle = '#d49b00';
        ctx.fillRect(4, h - 18, w - 8, 14);
        ctx.fillStyle = '#111111';
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, h - 18);
            ctx.lineTo(i + 10, h - 18);
            ctx.lineTo(i, h - 4);
            ctx.lineTo(i - 10, h - 4);
            ctx.fill();
        }
    });

    const ground = makeCanvasTex((ctx, w, h) => {
        ctx.fillStyle = '#4e331e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#3a2413' : '#63432a';
            ctx.fillRect(Math.random() * w, 24 + Math.random() * (h - 24), 8, 8);
        }
        ctx.fillStyle = '#268b2b';
        ctx.fillRect(0, 0, w, 24);
        ctx.fillStyle = '#38b83e';
        for (let x = 0; x < w; x += 8) {
            ctx.fillRect(x, 0, 4, 14 + (x % 16 === 0 ? 8 : 2));
        }
    }, 2, 1);

    const camo = makeCanvasTex((ctx, w, h) => {
        ctx.fillStyle = '#2d4c2b';
        ctx.fillRect(0, 0, w, h);
        const colors = ['#1b3019', '#526b35', '#3e2d1e'];
        for (let i = 0; i < 35; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 14, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    const cyberWall = makeCanvasTex((ctx, w, h) => {
        ctx.fillStyle = '#121624';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#1e2842';
        ctx.lineWidth = 2;
        for (let i = 0; i < w; i += 32) {
            ctx.strokeRect(i, 0, 32, h);
            ctx.strokeRect(0, i, w, 32);
        }
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(14, 14, 4, 4);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(78, 78, 4, 4);
    }, 20, 4);

    return { metal, ground, camo, cyberWall };
}

export const textures = createProceduralTextures();

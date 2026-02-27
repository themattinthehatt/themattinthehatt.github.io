(function () {
    'use strict';

    // --- Canvas setup ---
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // --- Anglerfish class ---
    function Anglerfish(randomX) {
        this.reset(randomX);
    }

    Anglerfish.prototype.reset = function (randomX) {
        this.depth     = Math.random();
        this.scale     = 0.38 + this.depth * 0.50;           // 0.38–0.88
        this.alpha     = 0.14 + this.depth * 0.30;           // 0.14–0.44
        this.speed     = (6 + this.depth * 22) * (0.7 + Math.random() * 0.6); // px/s — much slower than lanternfish
        this.dir       = Math.random() < 0.5 ? 1 : -1;

        this.yBase     = 90 + Math.random() * (canvas.height - 180);
        this.y         = this.yBase;
        this.yAmp      = 22 + Math.random() * 30;
        this.yFreq     = 0.0005 + Math.random() * 0.0009;    // slower vertical drift

        this.phase     = Math.random() * Math.PI * 2;        // swim sway
        this.lurePhase = Math.random() * Math.PI * 2;        // lure oscillation
        this.t         = Math.random() * 8000;

        if (randomX) {
            this.x = Math.random() * canvas.width;
        } else {
            this.x     = this.dir === 1 ? -160 : canvas.width + 160;
            this.yBase = 90 + Math.random() * (canvas.height - 180);
            this.y     = this.yBase;
        }
    };

    Anglerfish.prototype.update = function (dt) {
        this.t          += dt;
        this.x          += this.speed * this.dir * dt * 0.001;
        this.phase      += dt * 0.0018;   // languid body sway
        this.lurePhase  += dt * 0.0025;   // lure has its own rhythm

        this.y += Math.sin(this.t * this.yFreq) * this.yAmp * dt * 0.001;
        this.y  = Math.max(90, Math.min(canvas.height - 90, this.y));

        if (this.x > canvas.width + 170 || this.x < -170) {
            this.reset(false);
        }
    };

    Anglerfish.prototype.draw = function () {
        var sway = Math.sin(this.phase) * 0.045;  // very gentle body tilt

        // Lure tip position — sways with its own phase
        var esX = 68 + Math.cos(this.lurePhase * 0.6) * 6;
        var esY = -2 + Math.sin(this.lurePhase) * 14;
        var escaPulse = 0.55 + 0.45 * Math.sin(this.lurePhase * 1.4);

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        if (this.dir === -1) ctx.scale(-1, 1);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(sway);

        // ---- DRAW ORDER: back-to-front ----

        // --- Tail fin (rounded, behind body) ---
        ctx.beginPath();
        ctx.moveTo(-40, 4);
        ctx.bezierCurveTo(-52, -16, -62, -18, -60, 4);
        ctx.bezierCurveTo(-62, 26, -52, 24, -40, 4);
        ctx.fillStyle = 'rgba(11,13,26,0.82)';
        ctx.fill();

        // --- Illicium (fishing rod) — drawn behind body so body overlaps base ---
        ctx.beginPath();
        ctx.moveTo(6, -28);
        ctx.bezierCurveTo(28, -55, 52, -46, esX, esY);
        ctx.strokeStyle = 'rgba(70,82,118,0.72)';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // --- Esca ambient cast (illuminates surroundings) ---
        var castG = ctx.createRadialGradient(esX - 8, esY, 0, esX - 8, esY, 55);
        castG.addColorStop(0,   'rgba(90,255,140,' + (0.14 * escaPulse) + ')');
        castG.addColorStop(0.5, 'rgba(40,190,80,'  + (0.05 * escaPulse) + ')');
        castG.addColorStop(1,   'rgba(0,90,30,0)');
        ctx.beginPath();
        ctx.arc(esX - 8, esY, 55, 0, Math.PI * 2);
        ctx.fillStyle = castG;
        ctx.fill();

        // --- Main body ---
        ctx.beginPath();
        ctx.ellipse(-4, 5, 39, 33, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(11,13,26,0.97)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(38,46,92,0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // --- Inside of mouth (drawn before jaws so jaws overlap edges) ---
        ctx.beginPath();
        ctx.moveTo(22, -6);
        ctx.lineTo(57, -1);
        ctx.lineTo(60,  6);
        ctx.lineTo(57, 22);
        ctx.lineTo(22, 17);
        ctx.closePath();
        ctx.fillStyle = 'rgba(40,7,7,0.97)';
        ctx.fill();

        // --- Upper jaw ---
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.bezierCurveTo(8, -17, 30, -15, 54, -5);
        ctx.bezierCurveTo(60, -1, 59, 5,  56,  6);
        ctx.bezierCurveTo(30,  2, 8,   0, -8,  1);
        ctx.closePath();
        ctx.fillStyle = 'rgba(11,13,26,0.97)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(38,46,92,0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // --- Lower jaw ---
        ctx.beginPath();
        ctx.moveTo(-8, 20);
        ctx.bezierCurveTo(8, 28, 30, 28, 54, 22);
        ctx.bezierCurveTo(60, 19, 59, 12, 56, 10);
        ctx.bezierCurveTo(30, 16, 8,  14, -8, 12);
        ctx.closePath();
        ctx.fillStyle = 'rgba(11,13,26,0.97)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(38,46,92,0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // --- Upper teeth (point downward into mouth) ---
        // Mix of short and a couple of long fangs
        var uTeeth = [
            {x: 24, w: 2.2, h: 9},
            {x: 29, w: 1.8, h: 6},
            {x: 33, w: 3.0, h: 14},  // long fang
            {x: 38, w: 2.0, h: 8},
            {x: 43, w: 1.8, h: 6},
            {x: 47, w: 2.8, h: 12},  // long fang
            {x: 51, w: 2.0, h: 7},
            {x: 55, w: 1.6, h: 5}
        ];
        ctx.fillStyle = 'rgba(195,198,218,0.88)';
        for (var i = 0; i < uTeeth.length; i++) {
            var t = uTeeth[i];
            ctx.beginPath();
            ctx.moveTo(t.x,          4);
            ctx.lineTo(t.x + t.w,    4 + t.h);
            ctx.lineTo(t.x + t.w*2,  4);
            ctx.closePath();
            ctx.fill();
        }

        // --- Lower teeth (point upward into mouth) ---
        var lTeeth = [
            {x: 26, w: 1.8, h: 7},
            {x: 31, w: 2.6, h: 12},  // long fang
            {x: 36, w: 1.8, h: 6},
            {x: 40, w: 2.0, h: 8},
            {x: 45, w: 2.8, h: 13},  // long fang
            {x: 50, w: 1.8, h: 6},
            {x: 54, w: 2.0, h: 7}
        ];
        ctx.fillStyle = 'rgba(195,198,218,0.88)';
        for (var i = 0; i < lTeeth.length; i++) {
            var t = lTeeth[i];
            ctx.beginPath();
            ctx.moveTo(t.x,          12);
            ctx.lineTo(t.x + t.w,    12 - t.h);
            ctx.lineTo(t.x + t.w*2,  12);
            ctx.closePath();
            ctx.fill();
        }

        // --- Small dorsal fin ---
        ctx.beginPath();
        ctx.moveTo(-14, -33);
        ctx.bezierCurveTo(-8, -44, 4, -43, 8, -33);
        ctx.fillStyle = 'rgba(11,13,26,0.72)';
        ctx.fill();

        // --- Pectoral fin ---
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.bezierCurveTo(-6, 32, 6, 36, 14, 30);
        ctx.bezierCurveTo(6,  26, -4, 22, -14, 14);
        ctx.fillStyle = 'rgba(11,13,26,0.68)';
        ctx.fill();

        // --- Small beady eye ---
        ctx.beginPath();
        ctx.arc(-2, -18, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(22,32,58,0.97)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-2, -18, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(3,4,10,1)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-3, -19, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,200,255,0.52)';
        ctx.fill();

        // --- Esca outer glow ---
        var escaG = ctx.createRadialGradient(esX, esY, 0, esX, esY, 20);
        escaG.addColorStop(0,    'rgba(100,255,150,' + (0.92 * escaPulse) + ')');
        escaG.addColorStop(0.38, 'rgba(50,220,100,'  + (0.34 * escaPulse) + ')');
        escaG.addColorStop(1,    'rgba(0,110,50,0)');
        ctx.beginPath();
        ctx.arc(esX, esY, 20, 0, Math.PI * 2);
        ctx.fillStyle = escaG;
        ctx.fill();

        // --- Esca inner bright core ---
        var escaInner = ctx.createRadialGradient(esX, esY, 0, esX, esY, 7);
        escaInner.addColorStop(0, 'rgba(225,255,225,' + escaPulse + ')');
        escaInner.addColorStop(1, 'rgba(70,230,120,'  + (0.55 * escaPulse) + ')');
        ctx.beginPath();
        ctx.arc(esX, esY, 7, 0, Math.PI * 2);
        ctx.fillStyle = escaInner;
        ctx.fill();

        // --- Esca bright dot ---
        ctx.beginPath();
        ctx.arc(esX, esY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,255,245,' + escaPulse + ')';
        ctx.fill();

        ctx.restore();
    };

    // --- Create fish, back-to-front ---
    var NUM_FISH = 5;
    var fish = [];
    for (var i = 0; i < NUM_FISH; i++) {
        fish.push(new Anglerfish(true));
    }
    fish.sort(function (a, b) { return a.depth - b.depth; });

    // --- Animation loop ---
    var lastTs = 0;
    function loop(ts) {
        var dt = Math.min(ts - lastTs, 50);
        lastTs = ts;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < fish.length; i++) {
            fish[i].update(dt);
            fish[i].draw();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

}());

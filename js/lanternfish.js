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

    // --- Lanternfish class ---
    function Lanternfish(randomX) {
        this.reset(randomX);
    }

    Lanternfish.prototype.reset = function (randomX) {
        this.depth  = Math.random();                              // 0 = far/deep, 1 = close
        this.scale  = 0.32 + this.depth * 0.52;                  // 0.32–0.84
        this.alpha  = 0.12 + this.depth * 0.32;                  // 0.12–0.44
        this.speed  = (12 + this.depth * 38) * (0.7 + Math.random() * 0.6); // px/s
        this.dir    = Math.random() < 0.5 ? 1 : -1;

        this.yBase  = 80 + Math.random() * (canvas.height - 160);
        this.y      = this.yBase;
        this.yAmp   = 18 + Math.random() * 28;     // px — vertical drift amplitude
        this.yFreq  = 0.0007 + Math.random() * 0.0013; // rad/ms

        this.phase  = Math.random() * Math.PI * 2; // swim cycle
        this.gPhase = Math.random() * Math.PI * 2; // glow pulse
        this.t      = Math.random() * 8000;

        if (randomX) {
            this.x = Math.random() * canvas.width;
        } else {
            this.x      = this.dir === 1 ? -130 : canvas.width + 130;
            this.yBase  = 80 + Math.random() * (canvas.height - 160);
            this.y      = this.yBase;
        }
    };

    Lanternfish.prototype.update = function (dt) {
        this.t      += dt;
        this.x      += this.speed * this.dir * dt * 0.001;
        this.phase  += dt * 0.0032;
        this.gPhase += dt * 0.0019;

        // Smooth vertical drift: integrating a sine velocity gives cosine position
        this.y += Math.sin(this.t * this.yFreq) * this.yAmp * dt * 0.001;
        this.y  = Math.max(80, Math.min(canvas.height - 80, this.y));

        if (this.x > canvas.width + 140 || this.x < -140) {
            this.reset(false);
        }
    };

    Lanternfish.prototype.draw = function () {
        var tw   = Math.sin(this.phase) * 11;      // tail wag (px)
        var tilt = Math.sin(this.phase) * 0.065;   // body tilt (rad)

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        if (this.dir === -1) ctx.scale(-1, 1);     // flip to face left
        ctx.scale(this.scale, this.scale);
        ctx.rotate(tilt);

        // --- Tail (forked, wagging) ---
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(63, -16 + tw);
        ctx.lineTo(54,   0);
        ctx.lineTo(63,  16 + tw);
        ctx.closePath();
        ctx.fillStyle = 'rgba(13,17,35,0.93)';
        ctx.fill();

        // --- Body ---
        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14,19,42,0.97)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(44,64,115,0.30)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // --- Dorsal fin ---
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.bezierCurveTo(7, -32, 22, -30, 26, -18);
        ctx.fillStyle = 'rgba(13,17,35,0.75)';
        ctx.fill();

        // --- Adipose fin (small, near tail) ---
        ctx.beginPath();
        ctx.moveTo(30, -18);
        ctx.bezierCurveTo(35, -25, 39, -23, 41, -18);
        ctx.fillStyle = 'rgba(13,17,35,0.62)';
        ctx.fill();

        // --- Pectoral fin ---
        ctx.beginPath();
        ctx.moveTo(-8, 7);
        ctx.bezierCurveTo(-2, 22, 12, 24, 18, 16);
        ctx.bezierCurveTo(10, 11, 1, 9, -8, 7);
        ctx.fillStyle = 'rgba(13,17,35,0.62)';
        ctx.fill();

        // --- Eye: ambient halo ---
        var eyeG = ctx.createRadialGradient(-28, -3, 0, -28, -3, 13);
        eyeG.addColorStop(0, 'rgba(55,95,150,0.40)');
        eyeG.addColorStop(1, 'rgba(55,95,150,0)');
        ctx.beginPath();
        ctx.arc(-28, -3, 13, 0, Math.PI * 2);
        ctx.fillStyle = eyeG;
        ctx.fill();

        // --- Eye: iris ---
        ctx.beginPath();
        ctx.arc(-28, -3, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(25,38,68,0.97)';
        ctx.fill();

        // --- Eye: pupil ---
        ctx.beginPath();
        ctx.arc(-28, -3, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(3,4,12,1)';
        ctx.fill();

        // --- Eye: specular shine ---
        ctx.beginPath();
        ctx.arc(-29.5, -4.8, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150,210,255,0.60)';
        ctx.fill();

        // --- Mouth (large, downturned lower jaw) ---
        ctx.beginPath();
        ctx.moveTo(-41, 3);
        ctx.quadraticCurveTo(-46, 11, -39, 14);
        ctx.strokeStyle = 'rgba(25,36,65,0.80)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- Photophores (bioluminescent organs along belly) ---
        var phX = [-25, -15, -5, 5, 15, 24, 33];
        var py  = 16;
        for (var i = 0; i < phX.length; i++) {
            var pulse = 0.50 + 0.50 * Math.sin(this.gPhase + i * 0.85);
            var px    = phX[i];

            var g = ctx.createRadialGradient(px, py, 0, px, py, 11);
            g.addColorStop(0,    'rgba(65,215,255,' + (0.88 * pulse) + ')');
            g.addColorStop(0.40, 'rgba(25,125,255,' + (0.30 * pulse) + ')');
            g.addColorStop(1,    'rgba(8,42,195,0)');

            ctx.beginPath();
            ctx.arc(px, py, 11, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            // bright core dot
            ctx.beginPath();
            ctx.arc(px, py, 2.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,248,255,' + pulse + ')';
            ctx.fill();
        }

        ctx.restore();
    };

    // --- Create fish, sorted back-to-front by depth ---
    var NUM_FISH = 7;
    var fish = [];
    for (var i = 0; i < NUM_FISH; i++) {
        fish.push(new Lanternfish(true));
    }
    fish.sort(function (a, b) { return a.depth - b.depth; });

    // --- Animation loop ---
    var lastTs = 0;
    function loop(ts) {
        var dt = Math.min(ts - lastTs, 50); // cap delta to avoid jump on tab focus
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

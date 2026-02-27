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

    // Bioluminescent color palettes [r, g, b]
    var PALETTES = [
        [70,  130, 255],   // blue
        [110,  65, 255],   // blue-violet
        [50,  210, 255],   // cyan
        [175,  90, 255],   // lavender
    ];

    // --- Jellyfish class ---
    function Jellyfish(randomPos) {
        this.pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
        this.reset(randomPos);
    }

    Jellyfish.prototype.reset = function (randomPos) {
        this.depth      = Math.random();
        this.scale      = 0.30 + this.depth * 0.60;
        this.alpha      = 0.13 + this.depth * 0.32;
        this.speed      = 7 + this.depth * 20;            // upward px/s
        this.baseRx     = 26 + Math.random() * 24;        // bell half-width at rest
        this.baseRy     = 18 + Math.random() * 18;        // bell height at rest
        this.pulseFreq  = 0.0009 + Math.random() * 0.0013; // rad/ms — pulse rate
        this.phase      = Math.random() * Math.PI * 2;    // pulse phase
        this.hPhase     = Math.random() * Math.PI * 2;    // horizontal drift phase
        this.hFreq      = 0.0004 + Math.random() * 0.0007;
        this.hAmp       = 10 + Math.random() * 24;        // px — horizontal oscillation amplitude
        this.t          = Math.random() * 9000;

        // Tentacles: positions stored as fractions of bell half-width
        this.tentFracs  = [-0.88, -0.60, -0.33, -0.08, 0.08, 0.33, 0.60, 0.88];
        this.tentLen    = this.tentFracs.map(function () { return 60 + Math.random() * 80; });
        this.tentOff    = this.tentFracs.map(function () { return Math.random() * Math.PI * 2; });

        if (randomPos) {
            this.x = 130 + Math.random() * (canvas.width - 260);
            this.y = Math.random() * canvas.height;
        } else {
            this.x = 130 + Math.random() * (canvas.width - 260);
            this.y = canvas.height + 200;
        }
    };

    Jellyfish.prototype.update = function (dt) {
        this.t      += dt;
        this.phase  += this.pulseFreq * dt;
        this.hPhase += this.hFreq * dt;

        // Rise slowly upward, gentle sinusoidal horizontal drift
        this.y -= this.speed * dt * 0.001;
        this.x += Math.sin(this.hPhase) * this.hAmp * this.hFreq * dt;

        // Re-enter from below when fully off the top
        if (this.y < -250) {
            this.reset(false);
        }
    };

    Jellyfish.prototype.draw = function () {
        // c: 1 = fully relaxed, 0 = fully contracted
        var c  = 0.5 + 0.5 * Math.cos(this.phase);
        var rx = this.baseRx * (0.78 + 0.22 * c);
        var ry = this.baseRy * (1.20 - 0.20 * c);
        // Glow is brightest at peak contraction (the power stroke)
        var gp = 0.52 + 0.48 * (1 - c);

        var r = this.pal[0], g = this.pal[1], b = this.pal[2];
        var rb = Math.min(r + 90, 255);   // brighter variant for core strokes
        var gb = Math.min(g + 90, 255);

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // --- Oral arms (short frilly arms from bell center, behind everything) ---
        var armX = [-14, -5, 5, 14];
        for (var i = 0; i < armX.length; i++) {
            var ax  = armX[i];
            var al  = this.baseRy * 2.6;
            var aw1 = Math.sin(this.t * 0.0014 + i * 1.4) * 18;
            var aw2 = Math.sin(this.t * 0.0021 + i * 1.4 + 1.3) * 9;

            ctx.beginPath();
            ctx.moveTo(ax, 0);
            ctx.bezierCurveTo(
                ax + aw1,          al * 0.33,
                ax - aw1 + aw2,    al * 0.66,
                ax + aw2 * 0.5,    al
            );
            ctx.lineCap = 'round';

            // glow pass
            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.28 * gp) + ')';
            ctx.lineWidth   = 3.5;
            ctx.stroke();

            // core pass
            ctx.strokeStyle = 'rgba(' + rb + ',' + gb + ',255,' + (0.62 * gp) + ')';
            ctx.lineWidth   = 1.1;
            ctx.stroke();
        }

        // --- Outer tentacles (from bell rim, behind bell) ---
        for (var i = 0; i < this.tentFracs.length; i++) {
            var sx   = this.tentFracs[i] * rx;
            var len  = this.tentLen[i];
            var wAmp = 6 + Math.abs(this.tentFracs[i]) * 15;
            var w1   = Math.sin(this.t * 0.0017 + this.tentOff[i]) * wAmp;
            var w2   = Math.sin(this.t * 0.0026 + this.tentOff[i] + 2.1) * wAmp * 0.42;

            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.bezierCurveTo(
                sx + w1,          len * 0.34,
                sx - w1 + w2,     len * 0.68,
                sx + w2,          len
            );
            ctx.lineCap = 'round';

            // glow pass
            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.22 * gp) + ')';
            ctx.lineWidth   = 3.8;
            ctx.stroke();

            // core pass
            ctx.strokeStyle = 'rgba(' + rb + ',' + gb + ',255,' + (0.72 * gp) + ')';
            ctx.lineWidth   = 0.8;
            ctx.stroke();
        }

        // --- Bell silhouette ---
        this._bell(ctx, rx, ry);
        ctx.fillStyle = 'rgba(7,10,35,0.72)';
        ctx.fill();

        // --- Bell interior radial glow ---
        var ig = ctx.createRadialGradient(0, -ry * 0.28, 0, 0, -ry * 0.08, rx * 1.05);
        ig.addColorStop(0,    'rgba(' + r + ',' + g + ',' + b + ',' + (0.55 * gp) + ')');
        ig.addColorStop(0.50, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.18 * gp) + ')');
        ig.addColorStop(1,    'rgba(' + r + ',' + g + ',' + b + ',0)');
        this._bell(ctx, rx, ry);
        ctx.fillStyle = ig;
        ctx.fill();

        // --- Bell rim: wide bloom ---
        this._bell(ctx, rx, ry);
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.18 * gp) + ')';
        ctx.lineWidth   = 12;
        ctx.lineJoin    = 'round';
        ctx.stroke();

        // --- Bell rim: mid glow ---
        this._bell(ctx, rx, ry);
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.52 * gp) + ')';
        ctx.lineWidth   = 3;
        ctx.stroke();

        // --- Bell rim: bright core ---
        this._bell(ctx, rx, ry);
        ctx.strokeStyle = 'rgba(' + rb + ',' + gb + ',255,' + (0.88 * gp) + ')';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // --- Rim scallop fringe (small lobes along the bell edge) ---
        var numScallops = 7;
        for (var i = 0; i <= numScallops; i++) {
            // Parametric position along the bell rim (t from 0 to 1, left to right)
            var tt   = i / numScallops;
            var sx   = -rx + tt * 2 * rx;
            // Approximate the bell curve y at this x (parabolic approximation)
            var sy   = -(1 - Math.pow(sx / rx, 2)) * ry * 0.18;
            var drop = 5 + 2 * Math.abs(Math.sin(tt * Math.PI));

            ctx.beginPath();
            ctx.arc(sx, sy, drop * 0.9, 0, Math.PI);  // downward semicircle
            ctx.strokeStyle = 'rgba(' + rb + ',' + gb + ',255,' + (0.55 * gp) + ')';
            ctx.lineWidth   = 0.8;
            ctx.stroke();
            ctx.fillStyle   = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.12 * gp) + ')';
            ctx.fill();
        }

        ctx.restore();
    };

    Jellyfish.prototype._bell = function (ctx, rx, ry) {
        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.bezierCurveTo(-rx * 0.96, -ry * 0.52, -rx * 0.44, -ry, 0, -ry);
        ctx.bezierCurveTo(rx * 0.44, -ry, rx * 0.96, -ry * 0.52, rx, 0);
        // Slightly concave subumbrella (curves upward in the center)
        ctx.quadraticCurveTo(0, -ry * 0.12, -rx, 0);
        ctx.closePath();
    };

    // --- Create jellyfish, sorted back-to-front ---
    var NUM = 8;
    var jfish = [];
    for (var i = 0; i < NUM; i++) {
        jfish.push(new Jellyfish(true));
    }
    jfish.sort(function (a, b) { return a.depth - b.depth; });

    // --- Animation loop ---
    var lastTs = 0;
    function loop(ts) {
        var dt = Math.min(ts - lastTs, 50);
        lastTs = ts;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < jfish.length; i++) {
            jfish[i].update(dt);
            jfish[i].draw();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

}());

/* NeuroNoise — a vanilla WebGL port of paper-design's neuro-noise shader.
   Mounts an animated, neuron-like noise canvas behind every .cs-footer.
   Self-contained: safe to load on any case-study page. */
(function () {
  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  var FRAG = [
    'precision highp float;',
    'uniform float u_time;',
    'uniform vec2 u_res;',
    'uniform vec3 u_front;',
    'uniform vec3 u_mid;',
    'uniform vec3 u_back;',
    'uniform float u_brightness;',
    'uniform float u_contrast;',
    'uniform float u_scale;',
    'uniform float u_rot;',
    'mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }',
    // The neuro-noise field: layered, rotated, self-accumulating sine ridges.
    'float neuro(vec2 uv, float t){',
    '  vec2 acc = vec2(0.0);',
    '  vec2 res = vec2(0.0);',
    '  float sc = 8.0;',
    '  for (int j = 0; j < 15; j++){',
    '    uv = rot(1.0) * uv;',
    '    acc = rot(1.0) * acc;',
    '    vec2 layer = uv * sc + float(j) + acc - t;',
    '    acc += sin(layer);',
    '    res += (0.5 + 0.5 * cos(layer)) / sc;',
    '    sc *= 1.2;',
    '  }',
    '  return res.x + res.y;',
    '}',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
    '  uv *= u_scale;',
    '  uv = rot(radians(u_rot)) * uv;',
    '  float n = neuro(uv, u_time);',
    '  n = u_brightness * pow(n, 3.0);',
    '  n = n + pow(n, 12.0);',
    '  n = max(0.0, n - 0.5);',
    '  n = clamp(n * (0.6 + u_contrast), 0.0, 1.0);',
    '  vec3 col = u_back;',
    '  col = mix(col, u_mid, n);',
    '  col = mix(col, u_front, smoothstep(0.35, 1.0, n));',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }

  function init(footer) {
    if (footer.querySelector('.neuro-bg')) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'neuro-bg';
    canvas.setAttribute('aria-hidden', 'true');
    footer.insertBefore(canvas, footer.firstChild);

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.remove(); return; }

    function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['u_time', 'u_res', 'u_front', 'u_mid', 'u_back', 'u_brightness', 'u_contrast', 'u_scale', 'u_rot'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    // Palette tuned to the ink/blue footer: dark base, deep-blue mid, indigo filaments.
    gl.uniform3fv(U.u_front, hex('#aeb6ff'));
    gl.uniform3fv(U.u_mid, hex('#1f2aa8'));
    gl.uniform3fv(U.u_back, hex('#141611'));
    gl.uniform1f(U.u_brightness, 1.0);
    gl.uniform1f(U.u_contrast, 0.35);
    gl.uniform1f(U.u_scale, 1.1);
    gl.uniform1f(U.u_rot, 0.0);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = footer.clientWidth, h = footer.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.u_res, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var start = performance.now(), raf = null, visible = true;
    function draw(now) { gl.uniform1f(U.u_time, (now - start) * 0.00025); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function loop() { if (!visible) { raf = null; return; } draw(performance.now()); raf = requestAnimationFrame(loop); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible = e.isIntersecting; if (visible && !raf && !reduce) loop(); });
      }).observe(footer);
    }
    if (reduce) draw(1500); else loop();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.cs-footer'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

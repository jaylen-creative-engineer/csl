"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport three.js backdrop for the landing page.
 *
 * A slow, mechanical assembly of interlocking chevron blocks — the
 * Foreigner "Agent Provocateur" geometry in the primary triad, framed
 * with bone edge linework and floating over a halftone dot field for the
 * Nike "Obsess The Creative" technical feel. The cluster rotates as you
 * scroll and parallaxes with the cursor.
 *
 * three.js is imported lazily inside the effect so it never touches the
 * server bundle and only loads on the client.
 */
export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        });
      } catch {
        // No WebGL — the CSS grid + halftone behind the canvas carry the page.
        return;
      }

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a0a0b, 0.05);

      const camera = new THREE.PerspectiveCamera(
        52,
        window.innerWidth / window.innerHeight,
        0.1,
        140
      );
      camera.position.set(0, 0, 12);

      const RED = new THREE.Color("#ff3b2f");
      const BLUE = new THREE.Color("#2f6bff");
      const YELLOW = new THREE.Color("#ffd11a");
      const BONE = new THREE.Color("#f4f3ef");

      /* ── Chevron geometry ──────────────────────────── */
      const shape = new THREE.Shape();
      shape.moveTo(-0.62, 0.5);
      shape.lineTo(0.02, 0.5);
      shape.lineTo(0.62, 0);
      shape.lineTo(0.02, -0.5);
      shape.lineTo(-0.62, -0.5);
      shape.lineTo(-0.12, 0);
      shape.closePath();

      const chevronGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.22,
        bevelEnabled: false
      });
      chevronGeometry.center();
      const edgeGeometry = new THREE.EdgesGeometry(chevronGeometry);

      type ChevronSpec = {
        color: InstanceType<typeof THREE.Color>;
        pos: [number, number, number];
        scale: number;
        rotZ: number;
        opacity: number;
        spin: number;
        drift: number;
        outline: boolean;
      };

      const specs: ChevronSpec[] = [
        { color: BONE, pos: [0, 0.1, 0], scale: 3.4, rotZ: 0, opacity: 0.08, spin: 0.04, drift: 0.35, outline: true },
        { color: BLUE, pos: [-3.6, 1.5, -1.5], scale: 2.1, rotZ: 0.05, opacity: 0.85, spin: 0.05, drift: 0.5, outline: false },
        { color: RED, pos: [-0.4, -1.1, 0.6], scale: 2.7, rotZ: -0.03, opacity: 0.9, spin: -0.04, drift: 0.4, outline: false },
        { color: YELLOW, pos: [3.4, 1.0, -0.8], scale: 1.9, rotZ: 0.08, opacity: 0.9, spin: 0.06, drift: 0.55, outline: false },
        { color: BONE, pos: [4.9, -1.8, -3], scale: 1.3, rotZ: -0.1, opacity: 0.16, spin: 0.09, drift: 0.7, outline: true },
        { color: BONE, pos: [-4.8, -1.6, -2.4], scale: 1.1, rotZ: 0.12, opacity: 0.16, spin: -0.08, drift: 0.65, outline: true }
      ];

      const group = new THREE.Group();
      scene.add(group);

      const disposables: Array<{ dispose: () => void }> = [];
      const animated: Array<{
        obj: InstanceType<typeof THREE.Object3D>;
        baseY: number;
        spin: number;
        drift: number;
        phase: number;
      }> = [];

      specs.forEach((spec, i) => {
        const node = new THREE.Group();
        node.position.set(...spec.pos);
        node.scale.setScalar(spec.scale);
        node.rotation.z = spec.rotZ;

        if (spec.outline) {
          const lineMat = new THREE.LineBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: spec.opacity * 4
          });
          const line = new THREE.LineSegments(edgeGeometry, lineMat);
          node.add(line);
          disposables.push(lineMat);
        } else {
          const faceMat = new THREE.MeshBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: spec.opacity,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(chevronGeometry, faceMat);
          node.add(mesh);
          const edgeMat = new THREE.LineBasicMaterial({
            color: BONE,
            transparent: true,
            opacity: 0.25
          });
          node.add(new THREE.LineSegments(edgeGeometry, edgeMat));
          disposables.push(faceMat, edgeMat);
        }

        group.add(node);
        animated.push({
          obj: node,
          baseY: spec.pos[1],
          spin: spec.spin,
          drift: spec.drift,
          phase: i * 1.5
        });
      });

      /* ── Halftone dot field ────────────────────────── */
      const COLS = 46;
      const ROWS = 26;
      const GAP = 0.7;
      const fieldCount = COLS * ROWS;
      const fieldPositions = new Float32Array(fieldCount * 3);
      let p = 0;
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          fieldPositions[p++] = (x - (COLS - 1) / 2) * GAP;
          fieldPositions[p++] = (y - (ROWS - 1) / 2) * GAP;
          fieldPositions[p++] = 0;
        }
      }
      const fieldGeometry = new THREE.BufferGeometry();
      fieldGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(fieldPositions, 3)
      );
      const fieldMaterial = new THREE.PointsMaterial({
        color: BONE,
        size: 0.035,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        sizeAttenuation: true
      });
      const field = new THREE.Points(fieldGeometry, fieldMaterial);
      field.position.z = -7;
      scene.add(field);
      const fieldBaseZ = fieldPositions.slice();

      /* ── State & handlers ──────────────────────────── */
      const mouse = { x: 0, y: 0 };
      const smoothed = { x: 0, y: 0, scroll: 0 };
      let rafId = 0;

      const scrollProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      };

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (prefersReduced) renderer.render(scene, camera);
      };

      const onPointerMove = (e: PointerEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };

      resize();
      window.addEventListener("resize", resize);

      if (prefersReduced) {
        group.rotation.set(-0.15, -0.35, 0);
        renderer.render(scene, camera);
      } else {
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        const clock = new THREE.Clock();
        const fieldAttr = fieldGeometry.getAttribute("position") as InstanceType<
          typeof THREE.BufferAttribute
        >;

        const animate = () => {
          rafId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const prog = scrollProgress();

          smoothed.x += (mouse.x - smoothed.x) * 0.045;
          smoothed.y += (mouse.y - smoothed.y) * 0.045;
          smoothed.scroll += (prog - smoothed.scroll) * 0.06;

          for (const a of animated) {
            a.obj.rotation.z += a.spin * 0.01;
            a.obj.rotation.y = Math.sin(t * 0.3 + a.phase) * 0.5;
            a.obj.position.y =
              a.baseY + Math.sin(t * 0.45 + a.phase) * a.drift;
          }

          group.rotation.x = -0.12 + smoothed.y * 0.18 + smoothed.scroll * 0.5;
          group.rotation.y = smoothed.x * 0.4 - smoothed.scroll * 0.8;
          group.position.y = smoothed.scroll * 1.6;

          // Halftone field: a slow travelling wave on Z.
          for (let i = 0; i < fieldCount; i++) {
            const bx = fieldBaseZ[i * 3];
            const by = fieldBaseZ[i * 3 + 1];
            fieldAttr.array[i * 3 + 2] =
              Math.sin(t * 0.5 + bx * 0.3 + by * 0.25) * 0.5;
          }
          fieldAttr.needsUpdate = true;
          field.rotation.z = t * 0.01;

          camera.position.x = smoothed.x * 0.8;
          camera.position.y = -smoothed.y * 0.5;
          camera.position.z = 12 - smoothed.scroll * 2.2;
          camera.lookAt(0, group.position.y * 0.4, 0);

          renderer.render(scene, camera);
        };
        animate();
      }

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        chevronGeometry.dispose();
        edgeGeometry.dispose();
        fieldGeometry.dispose();
        fieldMaterial.dispose();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true" />;
}

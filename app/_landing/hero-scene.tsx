"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport three.js backdrop for the landing page.
 *
 * A nostalgia-futuristic isometric stage: an orthographic (parallel-
 * projection) camera looks down onto an endlessly scrolling neon grid
 * floor — the classic retro-game vanishing field — with flat-shaded
 * "flat 3D" blocks rising off it: the Foreigner "Agent Provocateur"
 * arrows and cube in the primary triad, edged in bone vector linework.
 *
 * Orthographic projection (no perspective foreshortening) is what makes
 * it read instantly as an isometric video-game scene.
 *
 * three.js is imported lazily so it never touches the server bundle.
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
      scene.fog = new THREE.FogExp2(0x0a0a0b, 0.028);

      /* ── Isometric orthographic camera ─────────────── */
      const FRUSTUM = 9.5;
      let aspect = window.innerWidth / window.innerHeight;
      const camera = new THREE.OrthographicCamera(
        -FRUSTUM * aspect,
        FRUSTUM * aspect,
        FRUSTUM,
        -FRUSTUM,
        -100,
        200
      );
      const isoDir = new THREE.Vector3(1, 0.82, 1).normalize();
      camera.position.copy(isoDir).multiplyScalar(48);
      const lookTarget = new THREE.Vector3(0, 0.4, 0);
      camera.lookAt(lookTarget);

      /* ── Lights — flat-shaded iso block shading ────── */
      scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      const key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(6, 12, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x6f7bff, 0.35);
      fill.position.set(-8, 4, -6);
      scene.add(fill);

      const world = new THREE.Group();
      scene.add(world);

      const RED = new THREE.Color("#ff3b2f");
      const BLUE = new THREE.Color("#2f6bff");
      const YELLOW = new THREE.Color("#ffd11a");
      const BONE = new THREE.Color("#f4f3ef");

      /* ── Scrolling neon grid floor ─────────────────── */
      const CELL = 2.2;
      const HALF = 28; // grid extends ±(HALF*CELL); fog hides the far edge
      const lineCoords: number[] = [];
      for (let i = -HALF; i <= HALF; i++) {
        const d = i * CELL;
        const span = HALF * CELL;
        lineCoords.push(-span, 0, d, span, 0, d); // parallel to X
        lineCoords.push(d, 0, -span, d, 0, span); // parallel to Z
      }
      const gridGeometry = new THREE.BufferGeometry();
      gridGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(lineCoords, 3)
      );
      const gridMaterial = new THREE.LineBasicMaterial({
        color: BONE,
        transparent: true,
        opacity: 0.16
      });
      const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
      grid.position.y = -2.2;
      world.add(grid);

      /* ── Flat-3D blocks (Foreigner) ────────────────── */
      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(-0.62, 0.5);
      arrowShape.lineTo(0.02, 0.5);
      arrowShape.lineTo(0.62, 0);
      arrowShape.lineTo(0.02, -0.5);
      arrowShape.lineTo(-0.62, -0.5);
      arrowShape.lineTo(-0.12, 0);
      arrowShape.closePath();
      const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, {
        depth: 1,
        bevelEnabled: false
      });
      arrowGeometry.center();
      arrowGeometry.rotateX(-Math.PI / 2); // lay flat: footprint on XZ, height on Y
      const arrowEdges = new THREE.EdgesGeometry(arrowGeometry);

      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const boxEdges = new THREE.EdgesGeometry(boxGeometry);

      type Kind = "arrow" | "box";
      type BlockSpec = {
        kind: Kind;
        color: InstanceType<typeof THREE.Color>;
        gx: number;
        gz: number;
        foot: number;
        height: number;
        rotY: number;
        bob: number;
        phase: number;
      };

      const specs: BlockSpec[] = [
        { kind: "box", color: BLUE, gx: -3.1, gz: 1.6, foot: 1.7, height: 1.7, rotY: 0, bob: 0.18, phase: 0 },
        { kind: "arrow", color: RED, gx: -0.6, gz: 0.2, foot: 3.2, height: 1.3, rotY: -Math.PI / 8, bob: 0.26, phase: 1.1 },
        { kind: "arrow", color: YELLOW, gx: 2.7, gz: -1.2, foot: 2.4, height: 1.1, rotY: -Math.PI / 8, bob: 0.3, phase: 2.2 },
        { kind: "arrow", color: BONE, gx: 4.6, gz: 2.4, foot: 1.4, height: 0.7, rotY: Math.PI / 6, bob: 0.34, phase: 3.0 },
        { kind: "arrow", color: BONE, gx: -4.4, gz: -2.2, foot: 1.2, height: 0.6, rotY: Math.PI / 5, bob: 0.4, phase: 4.1 }
      ];

      const disposables: Array<{ dispose: () => void }> = [];
      const blocks: Array<{
        obj: InstanceType<typeof THREE.Object3D>;
        baseY: number;
        bob: number;
        phase: number;
      }> = [];

      specs.forEach((spec) => {
        const isBone = spec.color === BONE;
        const geo = spec.kind === "box" ? boxGeometry : arrowGeometry;
        const edges = spec.kind === "box" ? boxEdges : arrowEdges;

        const node = new THREE.Group();
        node.position.set(spec.gx * CELL, 0, spec.gz * CELL);
        node.rotation.y = spec.rotY;
        node.scale.set(spec.foot, spec.height, spec.foot);

        if (isBone) {
          // Distant wireframe ghosts — pure vector outline.
          const lineMat = new THREE.LineBasicMaterial({
            color: BONE,
            transparent: true,
            opacity: 0.4
          });
          node.add(new THREE.LineSegments(edges, lineMat));
          disposables.push(lineMat);
        } else {
          const faceMat = new THREE.MeshStandardMaterial({
            color: spec.color,
            roughness: 1,
            metalness: 0,
            flatShading: true
          });
          node.add(new THREE.Mesh(geo, faceMat));
          const edgeMat = new THREE.LineBasicMaterial({
            color: BONE,
            transparent: true,
            opacity: 0.55
          });
          node.add(new THREE.LineSegments(edges, edgeMat));
          disposables.push(faceMat, edgeMat);
        }

        const baseY = spec.height * 0.5 + 0.05;
        node.position.y = baseY;
        world.add(node);
        blocks.push({ obj: node, baseY, bob: spec.bob, phase: spec.phase });
      });

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
        aspect = w / h;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        camera.left = -FRUSTUM * aspect;
        camera.right = FRUSTUM * aspect;
        camera.top = FRUSTUM;
        camera.bottom = -FRUSTUM;
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
        renderer.render(scene, camera);
      } else {
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const prog = scrollProgress();

          smoothed.x += (mouse.x - smoothed.x) * 0.05;
          smoothed.y += (mouse.y - smoothed.y) * 0.05;
          smoothed.scroll += (prog - smoothed.scroll) * 0.06;

          // Endless approach: scroll the floor toward the camera, wrapped by
          // one cell so the lattice looks infinite.
          grid.position.z = (t * 1.1) % CELL;

          for (const b of blocks) {
            b.obj.position.y = b.baseY + Math.sin(t * 0.7 + b.phase) * b.bob;
            b.obj.rotation.y += 0.0015;
          }

          // Gentle parallax + a slow scroll-driven turn; kept small so the
          // isometric read never breaks.
          world.rotation.y = smoothed.x * 0.22 + smoothed.scroll * 0.5;
          world.rotation.x = smoothed.y * 0.08;
          world.position.y = -smoothed.scroll * 3.2;

          renderer.render(scene, camera);
        };
        animate();
      }

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        gridGeometry.dispose();
        gridMaterial.dispose();
        arrowGeometry.dispose();
        arrowEdges.dispose();
        boxGeometry.dispose();
        boxEdges.dispose();
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

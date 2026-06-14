"use client";

import { useEffect, useRef } from "react";

/**
 * Full-viewport three.js backdrop for the landing page.
 *
 * A particle "stadium ring" floating in a star field. The camera dollies
 * and the ring untilts as you scroll; the camera drifts with the cursor.
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
        // No WebGL — the CSS gradient behind the canvas carries the page.
        return;
      }

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060608, 0.045);

      const camera = new THREE.PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.1,
        120
      );
      camera.position.set(0, 0, 10);

      const group = new THREE.Group();
      group.rotation.x = 1.05;
      scene.add(group);

      const accent = new THREE.Color("#d8ff3d");
      const bone = new THREE.Color("#f2f1ed");
      const violet = new THREE.Color("#8f7bff");

      /* ── Particle ring ─────────────────────────────── */
      const RING_COUNT = 6500;
      const RADIUS = 4.3;
      const ringPositions = new Float32Array(RING_COUNT * 3);
      const ringColors = new Float32Array(RING_COUNT * 3);
      const tmp = new THREE.Color();

      for (let i = 0; i < RING_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Cluster particles toward the ring's core with a soft falloff.
        const spread =
          (Math.random() + Math.random() + Math.random() - 1.5) * 0.62;
        const r = RADIUS + spread;
        const y = (Math.random() + Math.random() - 1) * 0.34;

        ringPositions[i * 3] = Math.cos(angle) * r;
        ringPositions[i * 3 + 1] = y;
        ringPositions[i * 3 + 2] = Math.sin(angle) * r;

        // Sweep of color around the ring: accent → bone → violet.
        const sweep = (Math.sin(angle * 2) + 1) / 2;
        tmp.copy(accent).lerp(sweep < 0.5 ? bone : violet, sweep);
        const fade = 0.45 + Math.random() * 0.55;
        ringColors[i * 3] = tmp.r * fade;
        ringColors[i * 3 + 1] = tmp.g * fade;
        ringColors[i * 3 + 2] = tmp.b * fade;
      }

      const ringGeometry = new THREE.BufferGeometry();
      ringGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(ringPositions, 3)
      );
      ringGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(ringColors, 3)
      );

      const ringMaterial = new THREE.PointsMaterial({
        size: 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });

      const ring = new THREE.Points(ringGeometry, ringMaterial);
      group.add(ring);

      /* ── Thin solid track line inside the ring ─────── */
      const trackGeometry = new THREE.TorusGeometry(RADIUS, 0.008, 8, 220);
      const trackMaterial = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.35
      });
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.rotation.x = Math.PI / 2;
      group.add(track);

      /* ── Ambient star field ────────────────────────── */
      const STAR_COUNT = 1400;
      const starPositions = new Float32Array(STAR_COUNT * 3);
      for (let i = 0; i < STAR_COUNT; i++) {
        const v = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        )
          .normalize()
          .multiplyScalar(14 + Math.random() * 26);
        starPositions[i * 3] = v.x;
        starPositions[i * 3 + 1] = v.y;
        starPositions[i * 3 + 2] = v.z;
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(starPositions, 3)
      );
      const starMaterial = new THREE.PointsMaterial({
        color: bone,
        size: 0.02,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        sizeAttenuation: true
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      /* ── Geometric chevron shards (Foreigner) ──────── */
      // A flat arrow/chevron profile extruded into a thin solid —
      // the album's interlocking red/blue/yellow blocks, set adrift.
      const chevronShape = new THREE.Shape();
      chevronShape.moveTo(-0.62, 0.5);
      chevronShape.lineTo(0.02, 0.5);
      chevronShape.lineTo(0.62, 0);
      chevronShape.lineTo(0.02, -0.5);
      chevronShape.lineTo(-0.62, -0.5);
      chevronShape.lineTo(-0.12, 0);
      chevronShape.closePath();

      const chevronGeometry = new THREE.ExtrudeGeometry(chevronShape, {
        depth: 0.16,
        bevelEnabled: false
      });
      chevronGeometry.center();

      const shardSpecs: Array<{
        color: string;
        pos: [number, number, number];
        scale: number;
        spin: number;
      }> = [
        { color: "#2f6bff", pos: [-7.4, 2.6, -3], scale: 1.5, spin: 0.18 },
        { color: "#ff3b30", pos: [7.2, -1.4, -1.5], scale: 1.95, spin: -0.14 },
        { color: "#ffc62b", pos: [5.1, 3.4, -6], scale: 1.15, spin: 0.22 }
      ];

      const shards = shardSpecs.map((spec) => {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(spec.color),
          transparent: true,
          opacity: 0.62,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(chevronGeometry, material);
        mesh.position.set(...spec.pos);
        mesh.scale.setScalar(spec.scale);
        mesh.userData.spin = spec.spin;
        mesh.userData.baseY = spec.pos[1];
        scene.add(mesh);
        return mesh;
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
        // Static composition for reduced-motion users.
        group.rotation.x = 0.7;
        camera.position.z = 9;
        renderer.render(scene, camera);
      } else {
        window.addEventListener("pointermove", onPointerMove, {
          passive: true
        });

        const clock = new THREE.Clock();
        const animate = () => {
          rafId = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const p = scrollProgress();

          // Ease everything for a weighty, cinematic feel.
          smoothed.x += (mouse.x - smoothed.x) * 0.04;
          smoothed.y += (mouse.y - smoothed.y) * 0.04;
          smoothed.scroll += (p - smoothed.scroll) * 0.06;

          ring.rotation.y = t * 0.05;
          track.rotation.z = -t * 0.02;
          stars.rotation.y = t * 0.008;

          for (let i = 0; i < shards.length; i++) {
            const shard = shards[i];
            shard.rotation.z = t * shard.userData.spin;
            shard.rotation.x = Math.sin(t * 0.25 + i) * 0.4;
            shard.position.y =
              shard.userData.baseY + Math.sin(t * 0.45 + i * 1.7) * 0.5;
          }

          group.rotation.x = 1.05 - smoothed.scroll * 0.95;
          group.rotation.z = smoothed.scroll * 0.4;
          group.position.y = Math.sin(t * 0.4) * 0.12;

          camera.position.x = smoothed.x * 0.7;
          camera.position.y = -smoothed.y * 0.45 - smoothed.scroll * 0.6;
          camera.position.z = 10 - smoothed.scroll * 3.2;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        };
        animate();
      }

      cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        ringGeometry.dispose();
        ringMaterial.dispose();
        trackGeometry.dispose();
        trackMaterial.dispose();
        starGeometry.dispose();
        starMaterial.dispose();
        chevronGeometry.dispose();
        shards.forEach((shard) => {
          (shard.material as InstanceType<typeof THREE.MeshBasicMaterial>).dispose();
        });
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

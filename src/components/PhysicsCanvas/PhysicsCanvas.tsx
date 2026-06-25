import { useEffect, useRef, useCallback } from 'react';
import type { Particle } from '@/models/types';

interface PhysicsCanvasProps {
  particles:     Particle[];
  onParticleEnd: (id: string) => void;
}

const PARTICLE_LIFETIME = 1100; // ms

export default function PhysicsCanvas({ particles, onParticleEnd }: PhysicsCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const frameRef    = useRef<number>(0);
  const particleMap = useRef<Map<string, Particle>>(new Map());

  // Sync external particles into internal map
  useEffect(() => {
    particles.forEach(p => {
      if (!particleMap.current.has(p.id)) {
        particleMap.current.set(p.id, { ...p });
      }
    });
  }, [particles]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    if (!ctx)  return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now    = Date.now();
    const toKill: string[] = [];

    particleMap.current.forEach((p, id) => {
      const age    = now - p.createdAt;
      const life   = age / PARTICLE_LIFETIME;

      if (life >= 1) {
        toKill.push(id);
        return;
      }

      // Physics tick
      const newX  = p.x + p.vx * (1 / 60);
      const newY  = p.y + p.vy * (1 / 60);
      const newVy = p.vy + 0.3; // subtle gravity
      const newOp = 1 - (life * 1.2);
      const newSc = p.scale * (1 + life * 0.15);

      particleMap.current.set(id, { ...p, x: newX, y: newY, vy: newVy, opacity: Math.max(0, newOp), scale: newSc });

      // Draw
      ctx.save();
      ctx.globalAlpha = Math.max(0, newOp);
      ctx.translate(newX, newY);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(newSc, newSc);

      // Chrome metallic text style
      const grad = ctx.createLinearGradient(-20, -10, 20, 10);
      grad.addColorStop(0,    '#9A9A9A');
      grad.addColorStop(0.35, '#F5F5F5');
      grad.addColorStop(0.65, '#C0C0C0');
      grad.addColorStop(1,    '#7A7A7A');

      ctx.font         = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle    = grad;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = 'rgba(79,195,247,0.5)';
      ctx.shadowBlur   = 8;
      ctx.fillText(`+${p.value}`, 0, 0);
      ctx.restore();
    });

    toKill.forEach(id => {
      particleMap.current.delete(id);
      onParticleEnd(id);
    });

    frameRef.current = requestAnimationFrame(render);
  }, [onParticleEnd]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [render]);

  // Resize canvas to match parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{ touchAction: 'none', pointerEvents: 'none' }}
    />
  );
}

import {
  Component, Input, Output, EventEmitter, OnDestroy, OnChanges,
  SimpleChanges, ViewChild, ElementRef
} from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import * as THREE from 'three';

@Component({
  selector: 'app-daily-celebration-modal',
  standalone: true,
  imports: [],
  templateUrl: './daily-celebration-modal.component.html',
  styleUrl: './daily-celebration-modal.component.scss',
})
export class DailyCelebrationModalComponent implements OnChanges, OnDestroy {
  @Input() show = false;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('threeCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  showFallback = false;

  private renderer?: THREE.WebGLRenderer;
  private frameId?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']) {
      if (this.show) {
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        setTimeout(() => this.startAnimation(), 50);
      } else {
        this.cleanup();
      }
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  close(): void {
    this.closed.emit();
  }

  private startAnimation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const testCanvas = document.createElement('canvas');
    const hasWebGL = !!(
      testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
    );
    if (!hasWebGL) {
      this.showFallback = true;
      return;
    }

    try {
      const W = 300;
      const H = 260;

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(W, H);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141414);

      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
      camera.position.z = 6.5;

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(3, 5, 3);
      scene.add(dirLight);

      // Basketball
      const ballGeo = new THREE.SphereGeometry(0.72, 32, 32);
      const ballMat = new THREE.MeshPhongMaterial({ color: 0xd84315, shininess: 60 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      scene.add(ball);

      // Seam lines as wireframe overlay
      const seamGeo = new THREE.SphereGeometry(0.74, 7, 7);
      const seamMat = new THREE.MeshBasicMaterial({
        color: 0x7a1e00, wireframe: true, transparent: true, opacity: 0.35,
      });
      const seams = new THREE.Mesh(seamGeo, seamMat);
      scene.add(seams);

      // Hoop ring
      const hoopGeo = new THREE.TorusGeometry(0.95, 0.07, 16, 48);
      const hoopMat = new THREE.MeshPhongMaterial({ color: 0xc8862a, shininess: 80 });
      const hoop = new THREE.Mesh(hoopGeo, hoopMat);
      hoop.position.y = -0.8;
      hoop.rotation.x = Math.PI / 2;
      scene.add(hoop);

      // Backboard post
      const postGeo = new THREE.BoxGeometry(0.07, 0.45, 0.07);
      const postMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(1.1, -0.58, 0);
      scene.add(post);

      let t = 0;
      const PERIOD = Math.PI;
      const TOP = 2.8;
      const BOTTOM = -2.8;
      const RANGE = TOP - BOTTOM;

      const animate = (): void => {
        this.frameId = requestAnimationFrame(animate);
        t += 0.025;

        const phase = t % PERIOD;
        ball.position.y = TOP - (phase / PERIOD) * RANGE;
        ball.position.x = Math.sin(phase) * 0.25;

        ball.rotation.z += 0.04;
        ball.rotation.y += 0.02;
        seams.rotation.copy(ball.rotation);
        seams.position.copy(ball.position);

        // Glow hoop when ball passes through
        const nearHoop = Math.abs(ball.position.y - hoop.position.y) < 0.2;
        hoopMat.emissive.set(nearHoop ? 0x442200 : 0x000000);

        this.renderer?.render(scene, camera);
      };
      animate();
    } catch (_e) {
      this.showFallback = true;
    }
  }

  private cleanup(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }
    this.renderer?.dispose();
    this.renderer = undefined;
    this.showFallback = false;
  }
}

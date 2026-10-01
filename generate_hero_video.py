import os
import math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def create_cinematic_hero_video():
    src_image_path = r"C:\Users\tarad\.gemini\antigravity-ide\brain\683e651c-8ffe-4b60-b888-6d8e01ca6a36\vintage_hero_bg_1790835671440.jpg"
    out_dir = r"c:\Users\tarad\Downloads\vintage\assets\video"
    frames_dir = r"c:\Users\tarad\Downloads\vintage\assets\video\frames"
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    print("Loading base architectural render...")
    base_img = Image.open(src_image_path).convert("RGB")
    
    # Target resolution
    W, H = 1920, 1080
    base_img_resized = base_img.resize((W, H), Image.Resampling.LANCZOS)
    base_arr = np.array(base_img_resized, dtype=np.float32)

    # Oversized base for smooth dolly & pan without edge artifacts
    PAD_W = int(W * 0.08) # 153 px
    PAD_H = int(H * 0.08) # 86 px
    BIG_W, BIG_H = W + 2 * PAD_W, H + 2 * PAD_H
    big_base = np.array(base_img.resize((BIG_W, BIG_H), Image.Resampling.LANCZOS), dtype=np.float32)

    # Sphere coordinates in base 1920x1080
    # In base_arr: center ~ (1422, 528), radius ~ 130
    SCX, SCY = 1422, 528
    SRAD = 132

    # Pre-generate 45 harmonious looping particles inside the sphere
    np.random.seed(42)
    NUM_PARTICLES = 45
    particles = []
    for i in range(NUM_PARTICLES):
        # spherical coordinates distribution
        r = np.random.uniform(15, SRAD - 20)
        theta = np.random.uniform(0, 2 * math.pi)
        phi = np.random.uniform(-math.pi/2, math.pi/2)
        x0 = r * math.cos(phi) * math.cos(theta)
        y0 = r * math.cos(phi) * math.sin(theta)
        z0 = r * math.sin(phi)
        
        # Harmonic frequencies (integers to ensure seamless loop)
        # k1, k2, k3 in {1, 2}
        k_x = np.random.choice([1, -1, 2, -2])
        k_y = np.random.choice([1, -1, 2, -2])
        amp_x = np.random.uniform(8, 22)
        amp_y = np.random.uniform(10, 28)
        phase_x = np.random.uniform(0, 2 * math.pi)
        phase_y = np.random.uniform(0, 2 * math.pi)
        size = np.random.uniform(1.8, 3.8)
        glow_rad = np.random.uniform(6.0, 14.0)
        brightness = np.random.uniform(0.7, 1.0)
        shimmer_freq = np.random.choice([1, 2])
        shimmer_phase = np.random.uniform(0, 2 * math.pi)

        particles.append({
            'x0': x0, 'y0': y0, 'z0': z0,
            'k_x': k_x, 'k_y': k_y,
            'amp_x': amp_x, 'amp_y': amp_y,
            'phase_x': phase_x, 'phase_y': phase_y,
            'size': size, 'glow_rad': glow_rad,
            'brightness': brightness,
            'shimmer_freq': shimmer_freq,
            'shimmer_phase': shimmer_phase
        })

    # Golden sculpture region mask for subtle specular highlights
    # Sculpture roughly in x: 1050 to 1850, y: 160 to 920
    sculpture_mask = np.zeros((H, W), dtype=np.float32)
    Y_coords, X_coords = np.ogrid[:H, :W]
    # Circular ribbon region
    dist_sculpture = np.sqrt((X_coords - 1430)**2 + (Y_coords - 530)**2)
    ribbon_mask = (dist_sculpture > 120) & (dist_sculpture < 430) & (X_coords > 1020)
    sculpture_mask[ribbon_mask] = 1.0
    # Blur mask for soft transitions
    sculpture_mask_img = Image.fromarray((sculpture_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(25))
    sculpture_mask = np.array(sculpture_mask_img, dtype=np.float32) / 255.0

    # Total frames: 216 frames @ 24 fps = 9.0 seconds seamless loop
    FPS = 24
    TOTAL_FRAMES = 216
    print(f"Rendering {TOTAL_FRAMES} frames ({TOTAL_FRAMES/FPS:.1f}s @ {FPS}fps) with seamless looping...")

    for f in range(TOTAL_FRAMES):
        t = f / TOTAL_FRAMES # 0.0 to 1.0
        angle = 2.0 * math.pi * t

        # 1. Camera Dolly & Pan (Smooth Cosine Curve: Starts and ends at exact 0.0)
        # Zoom from 1.0 to 1.035 and back to 1.0
        zoom_factor = 1.0 + 0.032 * (1.0 - math.cos(angle)) / 2.0
        # Gentle lateral pan
        pan_x = 10.0 * math.sin(angle)
        pan_y = 3.5 * math.sin(angle)

        # Crop window from big_base
        cur_w = W / zoom_factor
        cur_h = H / zoom_factor
        center_x = (BIG_W / 2.0) + pan_x
        center_y = (BIG_H / 2.0) + pan_y

        x1 = int(round(center_x - cur_w / 2.0))
        y1 = int(round(center_y - cur_h / 2.0))
        x2 = int(round(x1 + cur_w))
        y2 = int(round(y1 + cur_h))

        # Clamp safely
        x1 = max(0, min(x1, BIG_W - int(cur_w)))
        y1 = max(0, min(y1, BIG_H - int(cur_h)))
        x2 = x1 + int(cur_w)
        y2 = y1 + int(cur_h)

        crop_slice = big_base[y1:y2, x1:x2]
        crop_img = Image.fromarray(crop_slice.astype(np.uint8)).resize((W, H), Image.Resampling.BILINEAR)
        frame_arr = np.array(crop_img, dtype=np.float32)

        # 2. Volumetric Sunlight Shift (Gentle warm sweep across room)
        # Sun position drifts slightly
        sun_shift = math.sin(angle)
        sun_gradient = np.clip(1.0 - (X_coords / (W * 1.2)) * 0.7 - (Y_coords / (H * 1.5)) * 0.3, 0.0, 1.0)
        sun_intensity = 0.045 + 0.025 * sun_shift
        # Warm champagne light: (255, 235, 205)
        warm_light = np.zeros_like(frame_arr)
        warm_light[:, :, 0] = 255.0 * sun_intensity * sun_gradient
        warm_light[:, :, 1] = 230.0 * sun_intensity * sun_gradient
        warm_light[:, :, 2] = 195.0 * sun_intensity * sun_gradient
        frame_arr += warm_light

        # 3. Specular Caustic Glimmer on Golden Sculpture
        # Specular sweep angle around sculpture
        caustic_angle = angle
        caustic_wave = 0.5 + 0.5 * np.sin(np.arctan2(Y_coords - 530, X_coords - 1430) * 2.0 - caustic_angle)
        caustic_factor = (caustic_wave ** 4) * sculpture_mask * 0.16
        frame_arr[:, :, 0] += 255.0 * caustic_factor
        frame_arr[:, :, 1] += 220.0 * caustic_factor
        frame_arr[:, :, 2] += 150.0 * caustic_factor

        # 4. Floating Golden Light Particles inside the Crystal Glass Sphere
        # Create a particle overlay layer with alpha blending
        particle_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(particle_layer)

        # Recalculate sphere center in current camera frame
        # Accounting for zoom and pan
        scale = zoom_factor
        sphere_screen_x = (SCX + PAD_W - center_x) * scale + (W / 2.0)
        sphere_screen_y = (SCY + PAD_H - center_y) * scale + (H / 2.0)
        sphere_screen_rad = SRAD * scale

        for p in particles:
            # Current particle position in sphere coordinates
            px = p['x0'] + p['amp_x'] * math.sin(p['k_x'] * angle + p['phase_x'])
            py = p['y0'] + p['amp_y'] * math.sin(p['k_y'] * angle + p['phase_y'])
            
            # Constrain gently inside sphere boundary
            dist = math.sqrt(px**2 + py**2)
            if dist > sphere_screen_rad - 12:
                factor = (sphere_screen_rad - 12) / dist
                px *= factor
                py *= factor

            screen_px = sphere_screen_x + px * scale
            screen_py = sphere_screen_y + py * scale

            # Pulsing brightness
            shimmer = 0.75 + 0.25 * math.sin(p['shimmer_freq'] * angle + p['shimmer_phase'])
            alpha_core = int(min(255, 230 * p['brightness'] * shimmer))
            alpha_glow = int(min(255, 75 * p['brightness'] * shimmer))

            # Outer soft glow
            glow_r = p['glow_rad'] * scale
            draw.ellipse(
                [screen_px - glow_r, screen_py - glow_r, screen_px + glow_r, screen_py + glow_r],
                fill=(255, 215, 120, alpha_glow)
            )
            # Inner luminous core
            core_r = p['size'] * scale
            draw.ellipse(
                [screen_px - core_r, screen_py - core_r, screen_px + core_r, screen_py + core_r],
                fill=(255, 248, 220, alpha_core)
            )

        # Blur particle layer slightly for ethereal photorealism
        particle_layer_blurred = particle_layer.filter(ImageFilter.GaussianBlur(1.2))
        
        # Composite frame with particle layer
        frame_pil = Image.fromarray(np.clip(frame_arr, 0, 255).astype(np.uint8))
        frame_pil.paste(particle_layer_blurred, (0, 0), particle_layer_blurred)

        # Save frame as PNG
        frame_filename = os.path.join(frames_dir, f"frame_{f:04d}.png")
        frame_pil.save(frame_filename, "PNG", optimize=False)

        if f % 24 == 0 or f == TOTAL_FRAMES - 1:
            print(f"Rendered frame {f+1}/{TOTAL_FRAMES} ({(f+1)/TOTAL_FRAMES*100:.1f}%)")

    # Save frame 0 as the high-res poster image
    poster_jpg_path = os.path.join(out_dir, "hero_poster.jpg")
    frame_0 = Image.open(os.path.join(frames_dir, "frame_0000.png"))
    frame_0.save(poster_jpg_path, "JPEG", quality=95)
    print(f"Poster saved to: {poster_jpg_path}")

    print("Encoding seamless MP4 video with ffmpeg...")
    mp4_out = os.path.join(out_dir, "vintage_hero_bg.mp4")
    webm_out = os.path.join(out_dir, "vintage_hero_bg.webm")

    # FFmpeg command for H.264 MP4 with faststart for web autoplay
    cmd_mp4 = f'ffmpeg -y -framerate {FPS} -i "{frames_dir}\\frame_%04d.png" -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -crf 19 -preset slow -movflags +faststart "{mp4_out}"'
    os.system(cmd_mp4)

    # FFmpeg command for WebM VP9
    print("Encoding WebM (VP9) video with ffmpeg...")
    cmd_webm = f'ffmpeg -y -framerate {FPS} -i "{frames_dir}\\frame_%04d.png" -c:v libvpx-vp9 -b:v 0 -crf 26 -pix_fmt yuv420p "{webm_out}"'
    os.system(cmd_webm)

    print("Hero background video generation complete!")

if __name__ == "__main__":
    create_cinematic_hero_video()

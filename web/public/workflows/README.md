# ComfyUI workflow

Put your workflow here as `motion-control.json` (ComfyUI: Settings > enable Dev mode > "Save (API Format)").

Replace the values you want the website to control with these placeholders (as strings):

| Placeholder | Meaning |
|---|---|
| `{{IMAGE}}` | uploaded character image filename (LoadImage node) |
| `{{VIDEO}}` | uploaded motion video filename (video loader node) |
| `{{PROMPT}}` | text prompt |
| `{{SEED}}` | seed (number) |
| `{{STRENGTH}}` | motion strength (number) |
| `{{WIDTH}}` `{{HEIGHT}}` | output size (number) |
| `{{FRAMES}}` | frame count, 4n+1 (number) |
| `{{FPS}}` | frame rate (number) |

A lone `"{{SEED}}"` becomes a JSON number; a placeholder inside a longer string is spliced in as text.
The workflow must end in a video output node (for example VHS Video Combine) so the result can be fetched.

Start ComfyUI on port 8188 (or set `COMFY_URL`), then run the website. The Studio shows "ComfyUI connected" when it can reach it.

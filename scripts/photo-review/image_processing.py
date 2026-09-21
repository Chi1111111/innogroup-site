"""Deterministic local image operations for the private cloud review worker."""
from pathlib import Path
VERSION = "japancars-template-1"

def detect(image):
    import cv2
    import numpy as np
    h, w = image.shape[:2]
    template = cv2.imread(str(Path(__file__).with_name('japancars-template.png')))
    if template is None:
        raise ValueError('Watermark template is missing')
    # Match actual logo pixels, never infer a watermark from the hostname alone.
    x0, y0 = int(w * .55), int(h * .70)
    region = image[y0:, x0:]
    best = {'score': 0.0, 'box': None, 'version': VERSION}
    for scale in np.linspace(.7, 1.4, 29) * w / 640:
        tw, th = max(1, round(template.shape[1] * scale)), max(1, round(template.shape[0] * scale))
        if tw >= region.shape[1] or th >= region.shape[0] or tw < 32:
            continue
        resized = cv2.resize(template, (tw, th), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)
        result = cv2.matchTemplate(region, resized, cv2.TM_CCOEFF_NORMED)
        _, score, _, point = cv2.minMaxLoc(result)
        if score > best['score']:
            x, y = point[0] + x0, point[1] + y0
            pad = max(2, round(w / 320))
            best = {'score': float(score), 'box': [max(0, x-pad), max(0, y-pad), min(w, x+tw+pad), min(h, y+th+pad)], 'version': VERSION}
    best['detected'] = best['score'] >= .88
    return best


def repair(image, detection):
    import cv2
    import numpy as np
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    x1, y1, x2, y2 = detection['box']
    mask[y1:y2, x1:x2] = 255
    result = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
    # Copy back only the masked pixels; non-masked decoded pixels stay exact.
    output = image.copy()
    output[mask != 0] = result[mask != 0]
    if not np.array_equal(output[mask == 0], image[mask == 0]):
        raise ValueError('Outside-mask pixels changed')
    return output, mask


